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

// Ligne d'activité du récap (plage horaire seule, sans décompte de sessions),
// calculée sur TOUTES les sessions du jour visé, abandons compris :
// début = min(created_at − temps_secondes), fin = max(created_at), affichés
// en heure de Paris. Renvoie '' si aucune horodatage exploitable.
function ligneActivite(sessionsDuJour) {
  let debut = null
  let fin = null
  for (const s of sessionsDuJour) {
    const finSession = parseUTC(s.created_at)
    if (Number.isNaN(finSession.getTime())) continue
    const duree = Number.isFinite(Number(s.temps_secondes)) ? Number(s.temps_secondes) : 0
    const debutSession = new Date(finSession.getTime() - duree * 1000)
    if (debut === null || debutSession < debut) debut = debutSession
    if (fin === null || finSession > fin) fin = finSession
  }
  if (debut === null) return ''

  const hDebut = heureParis(debut)
  const hFin = heureParis(fin)
  if (hDebut === hFin) return `Activité à ${hDebut}`

  return `Activité entre ${hDebut} et ${hFin}`
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

module.exports = { parseUTC, dateParis, dateRecapValide, veille, libelleJour, ligneActivite, resumeJour, formatDuree }
