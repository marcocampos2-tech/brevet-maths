// /lib/bilan-email.js
//
// Bilan parent par email (cron de 21 jours, api/cron-rappel.js, ET bouton
// « Envoyer bilan parents » de prof.html, api/email.js type 'bilan'). Un seul
// module : le cron et le bouton produisent le même email.
//
// Source des niveaux : la vue public.niveaux_sous_theme, classée par
// js/niveaux.js (Niveaux.classerNiveaux, importé tel quel : une seule source,
// les phrases sont celles de la page parent). Ce module ne recalcule aucune
// règle de niveau, n'affiche ni moyenne, ni score, ni pourcentage.
//
// Deux versions :
//   - complet : activité de la période, nouveaux niveaux validés, bloc À surveiller
//     (phrases de la page parent), puis grille sous-thème × niveau et légende ;
//   - tronque : activité seule + « disponible avec l'offre Accompagné » + bouton.
// Quelle version : choisirVersion() (règle d'offre = lib/gating.js, aucune
// règle nouvelle). Rendu : tableaux et styles en ligne (Gmail / Outlook mobile),
// pas de <details>, pas de CSS externe, tout texte venant de la base échappé.
//
// Tests : node lib/bilan-email.manual-test.js

const Niveaux = require('../js/niveaux.js')
const { formater: formaterPrenom } = require('../js/prenom.js') // affichage seulement
const { parseUTC, dateParis } = require('./recap-journalier')
const { estAccompagne, apresBascule } = require('./gating')

const FUSEAU = 'Europe/Paris'
const NIVEAUX = ['facile', 'moyen', 'difficile']
const ETAT = { facile: 'f_etat', moyen: 'm_etat', difficile: 'd_etat' }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Césures des noms de sous-thèmes : fonction partagée avec la page (js/niveaux.js).
// Constantes locales (et non `avecCesures: Niveaux.avecCesures` dans module.exports) :
// api/cron-rappel.js importe ce module en ESM, dont les exports nommés doivent
// rester détectables (clés raccourcies, valeurs identifiants).
const { avecCesures, pointsDeCesure } = Niveaux
const URL_ESPACE_PARENT = 'https://www.academika.fr/espace-parent.html'
const URL_PASSER_SUIVI = 'https://www.academika.fr/suivi-parent.html'
const URL_COURS = 'https://www.academika.fr/cours-particuliers.html'

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Texte d'un sujet d'email : sans retour à la ligne ni caractère de contrôle.
function ligneUnique(s, max = 80) {
  return String(s == null ? '' : s).replace(/\u00AD/g, '').replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

// ─────────────────────────────────────────────────────────────────────────
// Règles pures
// ─────────────────────────────────────────────────────────────────────────

// Date d'« accès offert » en cours (AAAA-MM-JJ) quand c'est LE motif d'accès,
// c'est-à-dire ni abonnement ni cours particuliers (ordre d'affichage du motif :
// abonnement > cours particuliers > accès offert). null sinon.
function accesOffertEnCours(profil, maintenant = new Date()) {
  const p = profil || {}
  if (p.plan_actif === true || p.cours_particuliers_actif === true) return null
  if (typeof p.acces_offert_jusqu !== 'string') return null
  const jour = p.acces_offert_jusqu.slice(0, 10)
  return jour >= dateParis(maintenant) ? jour : null
}

// Complet ou tronqué.
//   - avant la bascule (ou simulation en aperçu) : complet pour tout le monde ;
//   - après : complet si Accompagné (estAccompagne) ;
//   - sinon complet pour le premier bilan « utile » (au moins une session
//     terminée) seulement, tronqué ensuite. aBilanUtile : un bilan envoyé avec
//     total_sessions > 0 existe déjà pour cet élève.
function choisirVersion({ profil, aBilanUtile, maintenant = new Date(), simulerBascule = false }) {
  if (!apresBascule(maintenant, simulerBascule)) return { version: 'complet', motif: 'lancement' }
  if (estAccompagne(profil, maintenant)) {
    const p = profil || {}
    const motif = p.plan_actif === true ? 'abonnement' : p.cours_particuliers_actif === true ? 'cours' : 'acces_offert'
    return { version: 'complet', motif }
  }
  if (aBilanUtile !== true) return { version: 'complet', motif: 'premier_bilan' }
  return { version: 'tronque', motif: 'libre' }
}

// Activité d'une période. Une session interrompue (abandonne === true, sans
// seuil de durée) n'entre ni dans le décompte, ni dans la durée, ni dans les
// jours actifs : même règle que le récap journalier. Jours = jours calendaires
// Paris (et non UTC) des sessions terminées.
function resumeActivite(sessions) {
  const liste = Array.isArray(sessions) ? sessions : []
  const terminees = liste.filter(s => s && s.abandonne !== true)
  const dureeSecondes = terminees.reduce((a, s) => {
    const t = Number(s.temps_secondes)
    return a + (Number.isFinite(t) && t > 0 ? t : 0)
  }, 0)
  const jours = new Set(terminees.map(s => dateParis(s.created_at)).filter(Boolean))
  return {
    terminees: terminees.length,
    interrompues: liste.length - terminees.length,
    dureeSecondes,
    joursActifs: jours.size
  }
}

// « moins d'une minute », « 42 min », « 1 h 05 », « 2 h ».
function formatDureeLongue(secondes) {
  const n = Number(secondes)
  const sec = Number.isFinite(n) && n > 0 ? n : 0
  if (sec < 60) return "moins d'une minute"
  const minutes = Math.round(sec / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}

// État à enregistrer à chaque bilan : { sous_thème: [niveaux acquis] }. Ne lit
// que f_etat / m_etat / d_etat de la vue.
function snapshotNiveaux(lignes) {
  const snap = {}
  for (const l of (Array.isArray(lignes) ? lignes : [])) {
    if (!l || !l.sous_theme) continue
    const acquis = NIVEAUX.filter(n => l[ETAT[n]] === 'acquis')
    if (acquis.length) snap[l.sous_theme] = acquis
  }
  return snap
}

// Niveaux acquis maintenant et absents du snapshot `avant`, dans l'ordre de
// récence de la page parent. Renvoie null quand il n'y a rien à comparer
// (avant absent : ancienne ligne sans niveaux_snapshot) — jamais de
// comparaison fausse. Un premier bilan passe `{}` : tout l'acquis est nouveau.
function nouveauxNiveaux(avant, lignes) {
  if (avant === null || avant === undefined || typeof avant !== 'object' || Array.isArray(avant)) return null
  const tries = (Array.isArray(lignes) ? lignes : []).slice().sort(Niveaux.parRecence)
  const res = []
  for (const l of tries) {
    if (!l || !l.sous_theme) continue
    const deja = Array.isArray(avant[l.sous_theme]) ? avant[l.sous_theme] : []
    const nv = NIVEAUX.filter(n => l[ETAT[n]] === 'acquis' && !deja.includes(n))
    if (nv.length) res.push({ sous_theme: l.sous_theme, niveaux: nv })
  }
  return res
}

function phraseNouveau({ sous_theme, niveaux }) {
  const noms = niveaux.map(n => Niveaux.NOM_NIVEAU[n])
  const liste = noms.length > 1 ? `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}` : noms[0]
  return `${sous_theme} : ${niveaux.length > 1 ? 'niveaux' : 'niveau'} ${liste} ${niveaux.length > 1 ? 'validés' : 'validé'}.`
}

function dateLongue(instant, avecAnnee) {
  const d = parseUTC(instant)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { timeZone: FUSEAU, day: 'numeric', month: 'long', ...(avecAnnee ? { year: 'numeric' } : {}) })
}

// AAAA-MM-JJ → JJ/MM/AAAA
function jourFr(iso) {
  const [a, m, j] = String(iso).slice(0, 10).split('-')
  return `${j}/${m}/${a}`
}

// ─────────────────────────────────────────────────────────────────────────
// Rendu HTML
// ─────────────────────────────────────────────────────────────────────────

const POLICE = 'font-family:Arial,Helvetica,sans-serif;'
const PALETTE = {
  acquis:     { fond: '#EAF6EF', bord: '#1f7a45', texte: '#1f7a45' },
  surveiller: { fond: '#FFF1E3', bord: '#E8892B', texte: '#8A3F05' },
  neutre:     { fond: '#f5f5f0', bord: '#d8d8d2', texte: '#1a1a1a' },
  offert:     { fond: '#fff8e6', bord: '#d97706', texte: '#7a5a00' }
}

// Couleurs des cases de la grille : celles de css/niveaux.css (.niv-c-*).
// piste = couleur opaque de la barre de fond (rgba(0,0,0,.08) de la page).
const CASE = {
  acquis:  { fond: '#EAF6EF', texte: '#1f7a45', bord: '#EAF6EF', gras: true,  barre: null,      piste: null },
  encours: { fond: '#FBF4E4', texte: '#8a6416', bord: '#FBF4E4', gras: false, barre: '#D4A23C', piste: '#E6E0D3' },
  surv:    { fond: '#FFF1E3', texte: '#8A3F05', bord: '#E8892B', gras: true,  barre: '#E8892B', piste: '#EAD9C8' },
  jamais:  { fond: '#FBF4E4', texte: '#8a6416', bord: '#FBF4E4', gras: false, barre: '#D4A23C', piste: '#E6E0D3' },
  verrou:  { fond: '#FAF9F6', texte: '#6B6E73', bord: '#FAF9F6', gras: false, barre: null,      piste: null }
}
const LEGENDE_CASES = [
  ['acquis', 'Acquis'], ['encours', 'En cours'], ['surv', 'À surveiller'], ['verrou', 'Pas encore ouvert']
]

function ligne(contenu, style = '') {
  return `<tr><td style="${POLICE}${style}">${contenu}</td></tr>`
}

// tour: true → fine bordure tout autour (bloc « À surveiller ») ; sinon barre à gauche.
function boite(couleur, titre, corps, { tour = false } = {}) {
  const bordure = tour ? `border:1px solid ${couleur.bord};border-radius:10px` : `border-left:4px solid ${couleur.bord}`
  return ligne(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${couleur.fond};${bordure}">` +
    `<tr><td style="${POLICE}padding:12px 14px">` +
    (titre ? `<div style="font-size:13px;font-weight:700;color:${couleur.texte};margin:0 0 6px">${titre}</div>` : '') +
    corps +
    `</td></tr></table>`,
    'padding:0 0 12px'
  )
}

// items : textes bruts (échappés ici). Aucun plafond : le bilan doit être
// identique à la page parent, et les sous-thèmes sont bornés par le catalogue
// (au plus 20), donc la longueur de l'email l'est aussi.
function listeItems(items) {
  return items.map(t => `<div style="font-size:13px;color:#333333;line-height:1.5;margin:0 0 3px">· ${esc(t)}</div>`).join('')
}

// Une case de la grille : texte de Niveaux.cellule() (source unique, identique à
// celluleNiveau() de la page), mise en forme en ligne. La barre est une cellule
// de tableau (width en %), pas un élément CSS.
function celluleHtml(d) {
  const c = CASE[d.type]
  let barre = ''
  if (c.barre) {
    const plein = d.reussites > 0
      ? `<td width="${d.reussites * 20}%" style="background:${c.barre};height:4px;font-size:0;line-height:0">&nbsp;</td>` : ''
    const vide = d.reussites < 5 ? `<td style="background:${c.piste};height:4px;font-size:0;line-height:0">&nbsp;</td>` : ''
    barre = `<tr><td style="padding:0 6px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:2px"><tr>${plein}${vide}</tr></table></td></tr>`
  }
  // Ligne 1 en gras (« N / 5 réussites », « ✓ Acquis »), ligne 2 plus petite
  // (« en M essais », opacité 0.85), barre en cellules de tableau.
  const gras = c.gras || d.type === 'encours' || d.type === 'jamais'
  const ligne2 = d.detail
    ? `<tr><td style="${POLICE}font-size:10px;line-height:1.3;color:${c.texte};opacity:0.85;text-align:center;padding:1px 3px 5px">${esc(d.detail)}</td></tr>` : ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.fond};border:1px solid ${c.bord};border-radius:8px">` +
    `<tr><td style="${POLICE}font-size:11px;line-height:1.3;color:${c.texte};${gras ? 'font-weight:700;' : ''}text-align:center;padding:${d.detail ? '6px 3px 0' : '6px 3px'}">${esc(d.texte)}</td></tr>${ligne2}${barre}</table>`
}

// Grille sous-thème × niveau : même contenu et même ordre que le « détail par
// niveau » de suivi-parent.html (lignes triées par récence, Niveaux.parRecence).
// Largeur de table fixe en % : lisible à 360 px.
function grilleNiveaux(lignes) {
  const tries = lignes.slice().sort(Niveaux.parRecence)
  const th = (t, extra = '', attr = '') => `<td${attr} style="${POLICE}font-size:10px;font-weight:600;color:#6B6E73;text-transform:uppercase;letter-spacing:.03em;text-align:center;padding:8px 2px;border-bottom:1px solid #E4E1D8;${extra}">${t}</td>`
  let html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;border:1px solid #E4E1D8;border-radius:10px">` +
    `<tr>${th('Sous-thème', 'width:36%;text-align:left;padding-left:8px', ' width="36%"')}${th('Facile')}${th('Moyen')}${th('Difficile')}</tr>`
  tries.forEach((l, i) => {
    const bas = i === tries.length - 1 ? '' : 'border-bottom:1px solid #E4E1D8;'
    // Colonne du nom : 36 % et 11,5 px (le plus long mot, « Proportionnalité », y tient
    // seul dès 320 px de large) ; jamais de coupure arbitraire (word-break et
    // overflow-wrap normaux), seulement aux césures conditionnelles de avecCesures().
    html += `<tr><td width="36%" style="${POLICE}width:36%;font-size:11.5px;font-weight:700;color:#41454C;line-height:1.3;padding:7px 2px 7px 8px;word-break:normal;overflow-wrap:normal;${bas}">${Niveaux.avecCesures(l.sous_theme)}</td>` +
      NIVEAUX.map(n => `<td style="padding:6px 2px;${bas}vertical-align:middle">${celluleHtml(Niveaux.cellule(l, n))}</td>`).join('') + `</tr>`
  })
  return html + `</table>`
}

function legendeNiveaux() {
  const puces = LEGENDE_CASES.map(([type, libelle]) => {
    const c = CASE[type]
    return `<span style="display:inline-block;background:${c.fond};color:${c.texte};border:1px solid ${type === 'surv' ? c.bord : type === 'verrou' ? '#E4E1D8' : c.fond};border-radius:6px;padding:2px 8px;font-size:11px;margin:0 4px 4px 0">${esc(libelle)}</span>`
  }).join('')
  return `<div style="line-height:1.9">${puces}</div>` +
    `<div style="font-size:11.5px;color:#6B6E73;line-height:1.5;margin-top:6px">${esc(Niveaux.PHRASE_REGLE)}</div>`
}

function bouton(url, libelle) {
  return ligne(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>` +
    `<td align="center" bgcolor="#3730a3" style="border-radius:8px">` +
    `<a href="${esc(url)}" style="display:inline-block;padding:12px 28px;${POLICE}font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">${esc(libelle)}</a>` +
    `</td></tr></table>`,
    'padding:12px 0'
  )
}

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`

// bilan : { version, prenom, premier, debut (Date), fin (Date), activite,
//           lignes, nouveaux (tableau | null), accesOffertJusqu (AAAA-MM-JJ | null) }
// options : { test (bool), emailPourLien } — emailPourLien est l'adresse qui
// reçoit réellement l'email (en test, jamais celle du parent : un clic sur
// « Se désabonner » ne doit pas toucher un vrai foyer).
function rendreBilan(bilan, { test = false, emailPourLien = '' } = {}) {
  const prenom = bilan.prenom || ''
  const { activite, lignes } = bilan
  const lignesRows = []

  lignesRows.push(ligne(
    `<div style="font-size:28px;font-weight:800;color:#1a1a1a">∑ ACADEMIKA</div>` +
    `<div style="font-size:12px;color:#666666;margin-top:4px">Brevet Maths — Bilan de progression</div>`,
    'text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4'
  ))

  if (test) {
    lignesRows.push(ligne(
      `<div style="font-size:12px;font-weight:700;color:#7a1f1f;background:#fdecec;padding:8px 10px;margin-top:12px">MESSAGE DE TEST — envoyé à l'adresse de test, jamais au parent.</div>`
    ))
  }

  lignesRows.push(ligne('Bonjour Madame, Monsieur,', 'font-size:15px;padding:20px 0 6px'))
  lignesRows.push(ligne(
    (bilan.premier && !bilan.periodeFixe)
      ? `Voici le premier bilan de progression de <strong>${esc(prenom)}</strong> sur ACADEMIKA.`
      : `Voici le bilan de progression de <strong>${esc(prenom)}</strong>, du <strong>${esc(dateLongue(bilan.debut, false))}</strong> au <strong>${esc(dateLongue(bilan.fin, true))}</strong>.`,
    'font-size:14px;color:#444444;line-height:1.5;padding:0 0 16px'
  ))

  if (bilan.accesOffertJusqu) {
    lignesRows.push(boite(PALETTE.offert, `Accès complet offert jusqu'au ${esc(jourFr(bilan.accesOffertJusqu))}`,
      `<div style="font-size:13px;color:#3a2e00;line-height:1.5"><a href="${esc(URL_ESPACE_PARENT)}" style="color:#3730a3;font-weight:600;text-decoration:none">Voir l'espace parent →</a></div>`))
  }

  // Activité de la période (abandons exclus des trois chiffres).
  if (activite.terminees > 0) {
    lignesRows.push(boite(PALETTE.neutre, '',
      `<div style="font-size:15px;font-weight:600;color:#1a1a1a">${esc(pluriel(activite.terminees, 'session'))} terminée${activite.terminees > 1 ? 's' : ''} · ${esc(pluriel(activite.joursActifs, 'jour'))} de révision · ${esc(formatDureeLongue(activite.dureeSecondes))}</div>` +
      (activite.interrompues > 0 ? `<div style="font-size:12px;color:#888888;margin-top:4px">(+ ${esc(pluriel(activite.interrompues, 'session'))} interrompue${activite.interrompues > 1 ? 's' : ''})</div>` : '')))
  } else {
    lignesRows.push(boite(PALETTE.neutre, '',
      `<div style="font-size:14px;color:#444444;line-height:1.5">${esc(prenom)} n'a pas terminé de session sur cette période — un petit coup de pouce cette semaine pourrait relancer la dynamique.</div>` +
      (activite.interrompues > 0 ? `<div style="font-size:12px;color:#888888;margin-top:4px">(${esc(pluriel(activite.interrompues, 'session'))} interrompue${activite.interrompues > 1 ? 's' : ''})</div>` : '')))
  }

  if (bilan.version === 'complet') {
    if (Array.isArray(bilan.nouveaux)) {
      if (bilan.nouveaux.length > 0) {
        lignesRows.push(boite(PALETTE.acquis,
          bilan.premier ? 'Niveaux validés depuis le début' : 'Nouveaux niveaux validés depuis le dernier bilan',
          listeItems(bilan.nouveaux.map(phraseNouveau))))
      } else if (!bilan.premier) {
        lignesRows.push(ligne('Aucun nouveau niveau validé depuis le dernier bilan.', 'font-size:13px;color:#666666;padding:0 0 12px'))
      }
    }

    // Seul « À surveiller » est détaillé en phrases (celles de la page parent) ;
    // le reste de l'état des niveaux est dans la grille.
    const { surveiller } = Niveaux.classerNiveaux(lignes)
    if (surveiller.length) {
      lignesRows.push(boite(PALETTE.surveiller, '⚠ À surveiller',
        listeItems(surveiller) +
        `<div style="font-size:12.5px;color:#41454C;line-height:1.5;margin-top:8px;padding-top:8px;border-top:1px solid #F3C9A0">Une aide ponctuelle peut l'aider à débloquer. <a href="${esc(URL_COURS)}" style="color:#1B2A4A;font-weight:500">Découvrir les cours particuliers</a></div>`,
        { tour: true }))
    }
    if (lignes.length) {
      lignesRows.push(ligne(grilleNiveaux(lignes), 'padding:2px 0 10px'))
      lignesRows.push(ligne(legendeNiveaux(), 'padding:0 0 12px'))
    } else {
      lignesRows.push(ligne("Aucun sous-thème commencé pour l'instant.", 'font-size:13px;color:#666666;padding:0 0 12px'))
    }
    lignesRows.push(bouton(URL_ESPACE_PARENT, "Voir le suivi complet dans l'espace parent →"))
  } else {
    lignesRows.push(ligne("Le détail par sous-thème est disponible avec l'offre Accompagné.", 'font-size:14px;color:#444444;line-height:1.6;padding:8px 0 0'))
    lignesRows.push(bouton(URL_PASSER_SUIVI, 'Passer à Accompagné · 7,90 €/mois'))
  }

  lignesRows.push(ligne(
    `<p style="font-size:13px;color:#444444;margin:0 0 12px">Pour toute question, contactez-nous : <a href="mailto:contact@academika.fr" style="color:#3730a3;text-decoration:none;font-weight:500">contact@academika.fr</a></p>` +
    `<p style="font-size:13px;color:#444444;margin:0">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>`,
    'padding:16px 0 0;border-top:1px solid #e8e8e4'
  ))
  lignesRows.push(ligne(
    `<a href="https://academika.fr/desabonner.html?email=${encodeURIComponent(emailPourLien)}" style="color:#bbbbbb">Se désabonner des emails automatiques</a>`,
    'font-size:11px;color:#bbbbbb;text-align:center;padding:16px 0 0'
  ))

  const html =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff"><tr><td align="center" style="padding:20px 12px">` +
    `<table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:520px;color:#1a1a1a;-webkit-text-size-adjust:100%;text-size-adjust:100%">` +
    lignesRows.join('') +
    `</table></td></tr></table>`

  return {
    sujet: `${test ? '[TEST] ' : ''}📊 Bilan de progression de ${ligneUnique(prenom)} — ACADEMIKA`,
    html
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Lectures / écriture Supabase (clé service). ctx = { supaUrl, headers }.
// Toute lecture qui échoue LÈVE : l'appelant décide (le cron saute l'élève ce
// soir, aucune version n'est jamais devinée). Rien de la réponse n'est loggé.
// ─────────────────────────────────────────────────────────────────────────

function verifierUuid(userId) {
  if (typeof userId !== 'string' || !UUID.test(userId)) throw new Error('user_id invalide')
}

async function lire(ctx, chemin) {
  const table = chemin.split('?')[0]
  const r = await fetch(`${ctx.supaUrl}/rest/v1/${chemin}`, { headers: ctx.headers })
  if (!r.ok) {
    const e = new Error(`lecture ${table} statut=${r.status}`)
    e.status = r.status
    try { e.corps = typeof r.text === 'function' ? await r.text() : '' } catch (_) { e.corps = '' }
    throw e
  }
  const data = await r.json()
  if (!Array.isArray(data)) throw new Error(`lecture ${table} : réponse inattendue`)
  return data
}

const CHAMPS_PROFIL = 'user_id,prenom_affiche,email_parent,email_actif,plan_actif,cours_particuliers_actif,acces_offert_jusqu'

// Profil d'un élève (clé service), ou null s'il n'existe pas.
async function lireProfil(ctx, userId) {
  verifierUuid(userId)
  const l = await lire(ctx, `profils?user_id=eq.${userId}&select=${CHAMPS_PROFIL}&limit=1`)
  return l[0] || null
}

// Deux derniers bilans périodiques (cadence, pause, snapshot) et existence d'un
// bilan « utile » (total_sessions > 0). Repli si niveaux_snapshot n'existe pas
// encore en base (SQL db/bilan-niveaux-snapshot.sql pas encore exécuté) :
// lecture sans la colonne, journalisée.
async function lireHistorique(ctx, userId) {
  verifierUuid(userId)
  const base = `historique_bilans?user_id=eq.${userId}&type_bilan=eq.periodique`
  let derniers
  try {
    derniers = await lire(ctx, `${base}&select=date_envoi,niveaux_snapshot,total_sessions&order=date_envoi.desc&limit=2`)
  } catch (e) {
    if (e.status === 400 && /niveaux_snapshot/.test(e.corps || '')) {
      console.error('[bilan] colonne niveaux_snapshot absente : exécuter db/bilan-niveaux-snapshot.sql')
      derniers = await lire(ctx, `${base}&select=date_envoi,total_sessions&order=date_envoi.desc&limit=2`)
    } else throw e
  }
  const utiles = await lire(ctx, `${base}&total_sessions=gt.0&select=date_envoi&limit=1`)
  return { derniers, aBilanUtile: utiles.length > 0 }
}

// Début de la période : date d'envoi du dernier bilan, sinon première session
// de l'élève. null si l'élève n'a aucune session.
async function debutPeriode(ctx, userId, dernierBilan) {
  verifierUuid(userId)
  if (dernierBilan) {
    const d = parseUTC(dernierBilan.date_envoi)
    if (Number.isNaN(d.getTime())) throw new Error('date_envoi illisible')
    return d
  }
  const premiere = await lire(ctx, `resultats?user_id=eq.${userId}&select=created_at&order=created_at.asc&limit=1`)
  if (premiere.length === 0) return null
  const d = parseUTC(premiere[0].created_at)
  if (Number.isNaN(d.getTime())) throw new Error('created_at illisible')
  return d
}

// Calcule le bilan complet d'un élève (lectures + choix de version + rendu).
//   profil      : prenom_affiche, plan_actif, cours_particuliers_actif, acces_offert_jusqu
//   historique  : résultat de lireHistorique()
//   dateDebut   : résultat de debutPeriode() (non null)
//   versionForcee : 'complet' | 'tronque' (bouton prof, aperçu) ; sinon choisirVersion()
//   periodeFixe : true quand dateDebut est une fenêtre imposée (bouton prof : 21 jours
//                 glissants) et non « depuis le dernier bilan » : l'intro n'annonce
//                 alors jamais « le premier bilan »
//   test, emailPourLien : cf. rendreBilan
async function calculerBilan(ctx, { userId, profil, historique, dateDebut, maintenant = new Date(), simulerBascule = false, versionForcee = null, periodeFixe = false, test = false, emailPourLien = '' }) {
  verifierUuid(userId)
  const sessions = await lire(ctx,
    `resultats?user_id=eq.${userId}&created_at=gte.${dateDebut.toISOString()}&created_at=lte.${maintenant.toISOString()}` +
    `&select=created_at,temps_secondes,abandonne`)
  const lignes = await lire(ctx, `niveaux_sous_theme?user_id=eq.${userId}&select=${Niveaux.SELECT_NIVEAUX.replace(/\s+/g, '')}`)

  const precedent = historique.derniers[0] || null
  const premier = !precedent
  const snapshot = snapshotNiveaux(lignes)
  const avant = premier ? {} : (precedent.niveaux_snapshot && typeof precedent.niveaux_snapshot === 'object' ? precedent.niveaux_snapshot : null)
  const choix = versionForcee
    ? { version: versionForcee, motif: 'force' }
    : choisirVersion({ profil, aBilanUtile: historique.aBilanUtile, maintenant, simulerBascule })

  const bilan = {
    version: choix.version,
    motif: choix.motif,
    prenom: formaterPrenom(profil.prenom_affiche),
    premier,
    periodeFixe,
    debut: dateDebut,
    fin: maintenant,
    activite: resumeActivite(sessions),
    lignes,
    snapshot,
    nouveaux: nouveauxNiveaux(avant, lignes),
    accesOffertJusqu: accesOffertEnCours(profil, maintenant)
  }
  const { sujet, html } = rendreBilan(bilan, { test, emailPourLien })
  return { ...bilan, sujet, html }
}

// Enregistre le bilan envoyé (cron de production seulement). N'écrit ni
// moy_globale ni sous_themes_snapshot (colonnes devenues inutiles, nullables).
// Renvoie true si la ligne est écrite ; sinon journalise (statut seulement) et
// renvoie false — l'appelant le compte comme erreur (risque : bilan renvoyé
// demain, la cadence ne bougeant pas).
async function ecrireHistorique(ctx, userId, bilan, maintenant, dateDebut) {
  verifierUuid(userId)
  const corps = {
    user_id: userId,
    type_bilan: 'periodique',
    date_envoi: maintenant.toISOString(),
    date_debut_periode: dateDebut.toISOString(),
    date_fin_periode: maintenant.toISOString(),
    total_sessions: bilan.activite.terminees,
    jours_actifs: bilan.activite.joursActifs,
    niveaux_snapshot: bilan.snapshot
  }
  const poster = b => fetch(`${ctx.supaUrl}/rest/v1/historique_bilans`, {
    method: 'POST',
    headers: { ...ctx.headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(b)
  })
  let r = await poster(corps)
  if (!r.ok && r.status === 400) {
    let texte = ''
    try { texte = typeof r.text === 'function' ? await r.text() : '' } catch (_) {}
    if (/niveaux_snapshot/.test(texte)) {
      console.error('[bilan] colonne niveaux_snapshot absente : exécuter db/bilan-niveaux-snapshot.sql')
      const { niveaux_snapshot, ...sans } = corps
      r = await poster(sans)
    }
  }
  if (!r.ok) console.error(`[bilan] écriture historique_bilans en échec statut=${r.status}`)
  return r.ok
}

module.exports = {
  accesOffertEnCours, choisirVersion, resumeActivite, formatDureeLongue,
  snapshotNiveaux, nouveauxNiveaux, phraseNouveau, rendreBilan,
  avecCesures, pointsDeCesure, CHAMPS_PROFIL, lireProfil, lireHistorique, debutPeriode, calculerBilan, ecrireHistorique, UUID
}
