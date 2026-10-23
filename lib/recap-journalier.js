// /lib/recap-journalier.js
//
// Aides du récap journalier parent (api/email.js, type 'recap-journalier-user')
// et de son appelant (api/cron-rappel.js). Tout le calcul de dates passe ici
// pour que le cron et l'endpoint s'accordent sur ce qu'est « une date valide ».
// Tests : node lib/recap-journalier.manual-test.js

const FUSEAU = 'Europe/Paris'

// created_at (table resultats) est un timestamp NAÏF exprimé en UTC (vérifié
// en base) : PostgREST le renvoie sans suffixe de fuseau. new Date() sur une
// chaîne sans fuseau l'interpréterait en heure locale du serveur ; on force
// donc UTC quand aucun suffixe (Z ou ±hh[:mm]) n'est présent.
function parseUTC(valeur) {
  if (typeof valeur?.getTime === 'function') return valeur
  const texte = String(valeur ?? '').trim()
  if (!texte) return new Date(NaN)
  const sansFuseau = !/(Z|[+-]\d{2}(:?\d{2})?)$/i.test(texte)
  return new Date(sansFuseau ? texte.replace(' ', 'T') + 'Z' : texte)
}

// Jour calendaire Paris d'un instant, au format AAAA-MM-JJ. null si l'instant
// n'est pas une date valide (jamais la chaîne « Invalid Date »).
function dateParis(instant) {
  const d = parseUTC(instant)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-CA', { timeZone: FUSEAU })
}

// Valide le paramètre `date` du récap : AAAA-MM-JJ strict ET date réelle
// (2026-02-30 et 2026-13-45 sont refusées). Renvoie la date ou null.
function dateRecapValide(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const [a, m, j] = date.split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1, j))
  const ok = d.getUTCFullYear() === a && d.getUTCMonth() === m - 1 && d.getUTCDate() === j
  return ok ? date : null
}

// Veille d'un jour AAAA-MM-JJ, par arithmétique de calendrier (indépendante
// des changements d'heure).
function veille(dateStr) {
  const [a, m, j] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, j - 1)).toISOString().slice(0, 10)
}

// « aujourd'hui » / « hier » / « le mardi 7 octobre », selon la date visée par
// rapport au jour Paris de `maintenant`. `dateVisee` DOIT avoir passé
// dateRecapValide(). Le libellé long est formaté par Intl à partir de la date
// validée, jamais en recopiant la chaîne reçue. `jour` sert aux phrases qui
// ne peuvent pas porter une date complète : « aujourd'hui », « hier », sinon
// « ce jour-là ».
function libelleJour(dateVisee, maintenant = new Date()) {
  const aujourdhui = dateParis(maintenant)
  if (dateVisee === aujourdhui) return { libelle: "aujourd'hui", jour: "aujourd'hui", estAujourdhui: true }
  if (dateVisee === veille(aujourdhui)) return { libelle: 'hier', jour: 'hier', estAujourdhui: false }
  const [a, m, j] = dateVisee.split('-').map(Number)
  const parties = new Intl.DateTimeFormat('fr-FR', {
    timeZone: FUSEAU, weekday: 'long', day: 'numeric', month: 'long'
  }).formatToParts(new Date(Date.UTC(a, m - 1, j, 12)))
  const get = t => parties.find(p => p.type === t).value
  const jourNum = get('day') === '1' ? '1er' : get('day')
  return {
    libelle: `le ${get('weekday')} ${jourNum} ${get('month')}`,
    jour: 'ce jour-là',
    estAujourdhui: false
  }
}

function heureParis(instant) {
  const parties = new Intl.DateTimeFormat('fr-FR', {
    timeZone: FUSEAU, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(instant)
  const get = t => parties.find(p => p.type === t).value
  return `${Number(get('hour'))}h${get('minute')}`
}

// Plages de travail d'une journée. Une session occupe [created_at − temps_secondes,
// created_at] ; une nouvelle plage commence quand le début d'une session est
// STRICTEMENT plus de ECART_PLAGE_MIN minutes après la fin de la plage en cours
// (exactement 30 min : même plage). Toutes les sessions comptent pour la
// continuité et les bornes, abandons compris ; une plage ne porte que les
// sessions TERMINÉES (nombre et durée, comme resumeJour) et une plage faite
// uniquement d'abandons n'est pas renvoyée. created_at illisible : session
// ignorée. Entrée dans n'importe quel ordre. Renvoie [{ debut, fin, sessions,
// dureeSecondes }] triées par début ; la somme des sessions et des durées égale
// celle de resumeJour (aucune plage tronquée ici).
const ECART_PLAGE_MIN = 30
function plagesActivite(sessionsDuJour) {
  const intervalles = []
  for (const s of sessionsDuJour) {
    const fin = parseUTC(s.created_at)
    if (Number.isNaN(fin.getTime())) continue
    const t = Number(s.temps_secondes)
    const duree = Number.isFinite(t) && t > 0 ? t : 0
    intervalles.push({ debut: new Date(fin.getTime() - duree * 1000), fin, terminee: s.abandonne !== true, duree })
  }
  intervalles.sort((a, b) => a.debut - b.debut || a.fin - b.fin)

  const plages = []
  for (const it of intervalles) {
    const courante = plages[plages.length - 1]
    if (courante && it.debut.getTime() - courante.fin.getTime() <= ECART_PLAGE_MIN * 60 * 1000) {
      if (it.fin > courante.fin) courante.fin = it.fin
    } else {
      plages.push({ debut: it.debut, fin: it.fin, sessions: 0, dureeSecondes: 0 })
    }
    const p = plages[plages.length - 1]
    if (it.terminee) { p.sessions++; p.dureeSecondes += it.duree }
  }
  return plages.filter(p => p.sessions > 0)
}

// Lignes d'activité du récap (texte brut, sans HTML). Une seule plage : une
// ligne de plage horaire seule, sans décompte (déjà dans la phrase du haut).
// Plusieurs : une ligne par plage avec ses sessions et sa durée ; au-delà de
// MAX_PLAGES_AFFICHEES, les premières puis « + N autres plages ». [] si aucune
// plage exploitable.
// Minutes entières par plage, réparties pour que leur SOMME soit exactement la
// durée totale telle que l'affiche formatDuree (« 28 min » dans l'en-tête) :
// arrondir chaque plage séparément donnait 2 + 16 + 9 = 27 min sous un total de
// 28. Méthode du plus grand reste : chaque plage prend d'abord ses minutes
// entières, puis les minutes qui manquent au total vont aux plages dont la
// partie décimale est la plus grande (à égalité, la plus ancienne). Total de
// moins d'une minute : toutes les plages à 0 (formatDuree dit alors « moins
// d'une minute »). Entrée : secondes par plage ; sortie : minutes, même ordre.
function repartirMinutes(secondesParPlage) {
  const secondes = secondesParPlage.map(v => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0))
  const total = secondes.reduce((a, v) => a + v, 0)
  const cible = total < 60 ? 0 : Math.round(total / 60)
  const minutes = secondes.map(v => Math.floor(v / 60))
  let manque = cible - minutes.reduce((a, v) => a + v, 0)
  const parReste = secondes.map((v, i) => ({ i, reste: v % 60 })) // en secondes : pas de bruit de virgule flottante
    .sort((a, b) => b.reste - a.reste || a.i - b.i)
  for (const { i } of parReste) {
    if (manque <= 0) break
    minutes[i] += 1
    manque -= 1
  }
  return minutes
}

const MAX_PLAGES_AFFICHEES = 4
function lignesActivite(sessionsDuJour) {
  const plages = plagesActivite(sessionsDuJour)
  if (plages.length === 0) return []
  const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`

  if (plages.length === 1) {
    const hDebut = heureParis(plages[0].debut)
    const hFin = heureParis(plages[0].fin)
    return [hDebut === hFin ? `Activité à ${hDebut}` : `Activité de ${hDebut} à ${hFin}`]
  }

  // Répartition sur TOUTES les plages (les non affichées comptent dans le total).
  const minutes = repartirMinutes(plages.map(p => p.dureeSecondes))
  const lignes = plages.slice(0, MAX_PLAGES_AFFICHEES).map((p, i) => {
    const hDebut = heureParis(p.debut)
    const hFin = heureParis(p.fin)
    const quand = hDebut === hFin ? `à ${hDebut}` : `de ${hDebut} à ${hFin}`
    const duree = minutes[i] > 0 ? `${minutes[i]} min` : formatDuree(0)
    return `${quand} : ${pluriel(p.sessions, 'session')}, ${duree}`
  })
  const reste = plages.length - MAX_PLAGES_AFFICHEES
  if (reste > 0) lignes.push(`+ ${pluriel(reste, 'autre')} plage${reste > 1 ? 's' : ''}`)
  return lignes
}

// Résumé factuel d'une journée, sans verdict : sessions terminées (abandonne
// !== true), sessions interrompues (abandonne === true, sans seuil de durée),
// durée cumulée des seules terminées, et sous-thèmes travaillés en sessions
// terminées (un sous-thème joué uniquement en sessions interrompues n'y figure
// pas ; une session terminée sans sous_theme compte dans le total mais pas dans
// la liste). Tri : sessions décroissant, puis nom (ordre alphabétique français).
function resumeJour(sessionsDuJour) {
  const terminees = sessionsDuJour.filter(s => s.abandonne !== true)
  const interrompues = sessionsDuJour.length - terminees.length
  const dureeSecondes = terminees.reduce((a, s) => {
    const t = Number(s.temps_secondes)
    return a + (Number.isFinite(t) ? t : 0)
  }, 0)
  const parSousTheme = new Map()
  for (const s of terminees) {
    const nom = typeof s.sous_theme === 'string' ? s.sous_theme.trim() : ''
    if (!nom) continue
    parSousTheme.set(nom, (parSousTheme.get(nom) || 0) + 1)
  }
  const sousThemes = [...parSousTheme].map(([nom, sessions]) => ({ nom, sessions }))
    .sort((a, b) => b.sessions - a.sessions || a.nom.localeCompare(b.nom, 'fr'))
  return { terminees: terminees.length, interrompues, dureeSecondes, sousThemes }
}

// « moins d'une minute » sous 60 s, sinon arrondi à la minute la plus proche.
function formatDuree(secondes) {
  const n = Number(secondes)
  const sec = Number.isFinite(n) && n > 0 ? n : 0
  if (sec < 60) return "moins d'une minute"
  return `${Math.round(sec / 60)} min`
}

module.exports = { parseUTC, dateParis, dateRecapValide, veille, libelleJour, plagesActivite, lignesActivite, repartirMinutes, resumeJour, formatDuree, ECART_PLAGE_MIN, MAX_PLAGES_AFFICHEES }
