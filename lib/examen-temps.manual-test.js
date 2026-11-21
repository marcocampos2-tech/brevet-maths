// /lib/examen-temps.manual-test.js
//
// Test manuel isolé, PAS un test automatisé lancé en CI — à exécuter à la main
// (`node lib/examen-temps.manual-test.js`) après toute modification de la mesure
// du temps de l'examen blanc en ligne (api/examen.js, examen.html).
//
// Couvre (chantier du 21/11/2026) :
//   1. échéance imposée côté serveur, marge de grâce de 60 s (MARGE_GRACE_S) :
//      réponse dans la marge, après la marge, soumission dans / après la marge ;
//   2. horloge serveur : maintenant_serveur dans demarrer et reprise, décalage
//      de l'appareil de ±5 min (fonctions du client extraites de examen.html) ;
//   3. source unique de la durée : duree_s dans demarrer et reprise, plus aucun
//      40*60*1000 dans examen.html ;
//   4. soumission automatique par reprise : durée = jusqu'à la dernière activité.
//
// Faux Supabase en mémoire, horloge simulée (Date et Date.now) : aucune
// dépendance, aucun accès réseau, aucune écriture réelle. Même modèle que
// lib/questions-vues.manual-test.js (voir ce fichier pour la raison de la copie
// des sources en .mjs dans un répertoire temporaire — ne pas ajouter
// "type": "module" à package.json pour éviter ce détour).

const fs = require('fs')
const os = require('os')
const path = require('path')
const { pathToFileURL } = require('url')

const RACINE = path.join(__dirname, '..')

function preparerCopies() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'examen-temps-'))
  fs.mkdirSync(path.join(tmp, 'api'))
  fs.mkdirSync(path.join(tmp, 'lib'))
  for (const f of ['questions-vues.js', 'tirage-familles.js', 'examen-score.js', 'auth-eleve.js', 'auth-token.js', 'gating.js']) {
    fs.copyFileSync(path.join(RACINE, 'lib', f), path.join(tmp, 'lib', f))
  }
  fs.copyFileSync(path.join(RACINE, 'api/examen.js'), path.join(tmp, 'api/examen.mjs'))
  return tmp
}

let ko = 0
let nbCas = 0
const vraiLog = console.log
const vraiError = console.error
const check = (nom, cond, info = '') => {
  nbCas++
  vraiLog(`${cond ? '  ok  ' : ' ÉCHEC'} ${nom}${info ? ' — ' + info : ''}`)
  if (!cond) ko++
}

// ── Horloge simulée ────────────────────────────────────────────────
// Le handler lit Date.now() et new Date() : les deux suivent `horloge`.
const RealDate = Date
let horloge = RealDate.parse('2026-11-21T12:00:00.000Z')
class FakeDate extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(horloge) }
  static now() { return horloge }
}
global.Date = FakeDate

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')
const SUB = '11111111-2222-3333-4444-555555555555'
const JETON = `x.${b64({ sub: SUB })}.y`

const DUREE_S = 2400
const MARGE_S = 60

function makeDB({ updatedAtSansFuseau = false } = {}) {
  const questions = {}
  for (const p of [1, 2, 3, 4]) {
    questions[p] = []
    for (let i = 0; i < 45; i++) {
      const id = p * 1000 + i
      questions[p].push({ id, question: `P${p} Q${i}`, opts: ['a', 'b', 'c', 'd'], answer: 1, explication: 'x', theme: 'T', chapitre: 'C', partie: p, figure: null })
    }
  }
  return { questions, prog: null, blancs: [], appels: [], selects: [], updatedAtSansFuseau }
}

function installFetch(db) {
  global.fetch = async (url, opts = {}) => {
    const method = opts.method || 'GET'
    if (url.includes('/auth/v1/user')) {
      const h = (opts.headers && opts.headers['Authorization']) || ''
      return h === `Bearer ${JETON}` ? { ok: true, json: async () => ({ id: SUB, email: 'eleve@test.fr' }) } : { ok: false }
    }
    db.appels.push(`${method} ${url.split('/rest/v1/')[1] || url}`)
    if (url.includes('questions_vues')) {
      if (method === 'GET') return { ok: true, json: async () => [] }
      return { ok: true, text: async () => '' }
    }
    if (url.includes('/rest/v1/profils')) return { ok: true, json: async () => [{ email_parent: 'parent@test.fr' }] }
    const mp = url.match(/examen_questions\?partie=eq\.(\d)/)
    if (mp) return { ok: true, json: async () => db.questions[Number(mp[1])] }
    const mi = url.match(/examen_questions\?id=in\.\(([^)]*)\)/)
    if (mi) {
      const ids = mi[1] ? mi[1].split(',').map(Number) : []
      const tout = [].concat(...Object.values(db.questions))
      return { ok: true, json: async () => tout.filter(q => ids.includes(q.id)) }
    }
    if (url.includes('examens_progression')) {
      const tent = (url.match(/tentative_id=eq\.([^&]+)/) || [])[1]
      if (method === 'POST') {
        const corps = JSON.parse(opts.body)
        db.prog = { ...corps }
        if (db.updatedAtSansFuseau) db.prog.updated_at = corps.updated_at.replace('Z', '')
        return { ok: true, text: async () => '' }
      }
      if (method === 'GET') {
        // Comme PostgREST : seules les colonnes de select= sont renvoyées (« * » = toutes).
        // Un select qui omettrait updated_at le ferait donc disparaître de la ligne lue.
        db.selects.push((url.match(/select=([^&]*)/) || [])[1] || '*')
        const sel = (url.match(/select=([^&]*)/) || [])[1]
        const colonnes = sel && sel !== '*' ? decodeURIComponent(sel).split(',') : null
        const projeter = l => (colonnes ? Object.fromEntries(colonnes.filter(c => c in l).map(c => [c, l[c]])) : l)
        return { ok: true, json: async () => (db.prog && (!tent || db.prog.tentative_id === tent) ? [projeter(db.prog)] : []) }
      }
      if (method === 'PATCH') {
        // Reproduit le filtre PostgREST : tentative_id et heure_fin=gte.<ISO>.
        const gte = (url.match(/heure_fin=gte\.([^&]+)/) || [])[1]
        const ok = db.prog && (!tent || db.prog.tentative_id === tent) &&
          (!gte || RealDate.parse(db.prog.heure_fin) >= RealDate.parse(decodeURIComponent(gte)))
        if (ok) db.prog = { ...db.prog, ...JSON.parse(opts.body) }
        const rep = (opts.headers && opts.headers['Prefer']) || ''
        return { ok: true, json: async () => (rep.includes('representation') ? (ok ? [{ tentative_id: db.prog.tentative_id }] : []) : []), text: async () => '' }
      }
      if (method === 'DELETE') { db.prog = null; return { ok: true, text: async () => '' } }
    }
    if (url.includes('examens_blancs')) {
      if (method === 'PATCH') return { ok: true, json: async () => [] }
      db.blancs.push(JSON.parse(opts.body))
      return { ok: true, json: async () => [], text: async () => '' }
    }
    return { ok: true, json: async () => [] }
  }
}

async function appeler(handler, db, corps) {
  installFetch(db)
  console.log = () => {}
  console.error = () => {}
  let out = null
  const res = { setHeader() {}, status(c) { this.code = c; return this }, json(b) { out = { statut: this.code, code: this.code, ...b }; return this }, end() {} }
  try { await handler({ method: 'POST', body: { access_token: JETON, ...corps } }, res) } finally { console.log = vraiLog; console.error = vraiError }
  return out
}

const reponsesDe = (ids, n) => ids.slice(0, n).map(id => ({ id, choix: 1 }))

// ── Fonctions du client extraites de examen.html ───────────────────
function chargerClient() {
  const html = fs.readFileSync(path.join(RACINE, 'examen.html'), 'utf8')
  const debut = html.indexOf('let decalageHorloge=0')
  const finMarque = 'function maintenant(){return Date.now()+decalageHorloge}'
  const fin = html.indexOf(finMarque)
  if (debut < 0 || fin < 0) throw new Error('fonctions d\'horloge introuvables dans examen.html')
  const code = html.slice(debut, fin + finMarque.length)
  const f = new Function('Date', code + '\n;return { calculerDecalage, maintenant, lireDuree, DUREE_REPLI_S, setDecalage(v){decalageHorloge=v} }')
  return { html, creer: appareilDate => f(appareilDate) }
}

async function main() {
  const tmp = preparerCopies()
  process.env.SUPABASE_SERVICE_KEY = 'service-test'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test'
  const { default: handler } = await import(pathToFileURL(path.join(tmp, 'api/examen.mjs')).href)

  // ═════════════════ 3 + 2. demarrer : durée et horloge ═════════════════
  vraiLog('\n── 1. demarrer : heure_fin, duree_s, maintenant_serveur ──')
  const db = makeDB()
  horloge = RealDate.parse('2026-11-21T12:00:00.000Z')
  const debut = horloge
  const d = await appeler(handler, db, { action: 'demarrer' })
  check('demarrer réussit, 20 questions', d.success === true && d.questions.length === 20, JSON.stringify({ c: d.statut, s: d.success }))
  check('duree_s présent et égal à 2400', d.duree_s === DUREE_S, String(d.duree_s))
  check('maintenant_serveur présent, en ms, égal à l\'heure du serveur', d.maintenant_serveur === debut, String(d.maintenant_serveur))
  check('heure_fin = maintenant_serveur + duree_s', RealDate.parse(d.heure_fin) === d.maintenant_serveur + d.duree_s * 1000)
  check('ligne de progression écrite avec la même heure_fin', db.prog && db.prog.heure_fin === d.heure_fin)
  const fin = RealDate.parse(d.heure_fin)
  const tent = d.tentative_id
  const ids = d.questions.map(q => q.id)

  vraiLog('\n── 2. reprise en cours : mêmes champs, heure_fin inchangée ──')
  horloge = debut + 10 * 60 * 1000
  const r1 = await appeler(handler, db, { action: 'reprise' })
  check('reprise en cours', r1.success === true && r1.encours === true && !r1.soumisAuto)
  check('reprise : duree_s = 2400', r1.duree_s === DUREE_S)
  check('reprise : maintenant_serveur = heure du serveur au moment de la réponse', r1.maintenant_serveur === horloge, String(r1.maintenant_serveur))
  check('reprise : heure_fin inchangée (jamais modifiable)', r1.heure_fin === d.heure_fin && r1.tentative_id === tent)

  // ═════════════════ 1. échéance côté serveur ═════════════════
  vraiLog('\n── 3. progression : réponse acceptée avant l\'échéance et dans la marge ──')
  horloge = fin - 5000
  let p = await appeler(handler, db, { action: 'progression', tentative_id: tent, reponses: reponsesDe(ids, 10) })
  check('avant heure_fin : acceptée', p.statut === 200 && p.success === true && db.prog.reponses.length === 10)
  horloge = fin + (MARGE_S - 1) * 1000
  p = await appeler(handler, db, { action: 'progression', tentative_id: tent, reponses: reponsesDe(ids, 12) })
  check(`heure_fin + ${MARGE_S - 1} s (dans la marge) : acceptée`, p.statut === 200 && p.success === true && db.prog.reponses.length === 12)
  horloge = fin + MARGE_S * 1000
  p = await appeler(handler, db, { action: 'progression', tentative_id: tent, reponses: reponsesDe(ids, 13) })
  check(`heure_fin + ${MARGE_S} s pile : encore acceptée (limite incluse)`, p.statut === 200 && db.prog.reponses.length === 13)

  vraiLog('\n── 4. progression : réponse tardive refusée ──')
  horloge = fin + MARGE_S * 1000 + 1
  p = await appeler(handler, db, { action: 'progression', tentative_id: tent, reponses: reponsesDe(ids, 20) })
  check(`heure_fin + ${MARGE_S} s + 1 ms : refusée (HTTP 409)`, p.statut === 409 && p.success === false, String(p.statut))
  check('  code echeance_depassee, message lisible', p.code === 'echeance_depassee' && typeof p.error === 'string' && p.error.length > 0)
  check('  réponses stockées inchangées (13)', db.prog.reponses.length === 13)
  // Ligne absente (tentative remplacée) : comportement d'avant, succès silencieux.
  const avant = db.prog
  db.prog = null
  p = await appeler(handler, db, { action: 'progression', tentative_id: tent, reponses: reponsesDe(ids, 5) })
  check('ligne de progression absente : succès silencieux comme avant', p.statut === 200 && p.success === true)
  db.prog = avant

  vraiLog('\n── 5. enregistrer : soumission dans la marge, après la marge ──')
  // 5a — dans la marge : le corps est pris tel quel (20 bonnes réponses).
  const dbA = makeDB(); horloge = debut
  const dA = await appeler(handler, dbA, { action: 'demarrer' })
  const finA = RealDate.parse(dA.heure_fin); const idsA = dA.questions.map(q => q.id)
  await appeler(handler, dbA, { action: 'progression', tentative_id: dA.tentative_id, reponses: reponsesDe(idsA, 15) })
  horloge = finA + 30 * 1000
  const eA = await appeler(handler, dbA, { action: 'enregistrer', tentative_id: dA.tentative_id, reponses: reponsesDe(idsA, 20) })
  check('dans la marge (+30 s) : toutes les réponses du corps comptent (20/20)', eA.success === true && eA.score === 20 && !eA.hors_delai, `score ${eA.score}`)
  check('  durée enregistrée bornée à 40:00', eA.temps_secondes === DUREE_S && dbA.blancs[0].temps_secondes === DUREE_S, String(eA.temps_secondes))
  check('  ligne de progression supprimée', dbA.prog === null)

  // 5b — après la marge : seules les réponses déjà stockées comptent.
  const dbB = makeDB(); horloge = debut
  const dB = await appeler(handler, dbB, { action: 'demarrer' })
  const finB = RealDate.parse(dB.heure_fin); const idsB = dB.questions.map(q => q.id)
  horloge = finB - 60 * 1000
  await appeler(handler, dbB, { action: 'progression', tentative_id: dB.tentative_id, reponses: reponsesDe(idsB, 10) })
  horloge = finB + MARGE_S * 1000 + 5000
  const eB = await appeler(handler, dbB, { action: 'enregistrer', tentative_id: dB.tentative_id, reponses: reponsesDe(idsB, 20) })
  check('après la marge (+65 s) : seules les 10 réponses stockées comptent', eB.success === true && eB.score === 10 && eB.hors_delai === true, `score ${eB.score}`)
  check('  durée enregistrée bornée à 40:00 (inchangée)', eB.temps_secondes === DUREE_S && dbB.blancs[0].temps_secondes === DUREE_S)
  check('  questions_posees = les 10 stockées', dbB.blancs[0].questions_posees.length === 10)

  // 5c — après la marge sans aucune réponse stockée : 0/20, pas d'erreur.
  const dbC = makeDB(); horloge = debut
  const dC = await appeler(handler, dbC, { action: 'demarrer' })
  horloge = RealDate.parse(dC.heure_fin) + 120 * 1000
  const eC = await appeler(handler, dbC, { action: 'enregistrer', tentative_id: dC.tentative_id, reponses: reponsesDe(dC.questions.map(q => q.id), 20) })
  check('après la marge, rien de stocké : 0/20 sans erreur', eC.success === true && eC.score === 0 && eC.hors_delai === true, `score ${eC.score}`)

  // 5d — sans ligne de progression : fail-open, le corps est pris tel quel.
  const dbD = makeDB(); horloge = debut
  const dD = await appeler(handler, dbD, { action: 'demarrer' })
  dbD.prog = null
  horloge = RealDate.parse(dD.heure_fin) + 500 * 1000
  const eD = await appeler(handler, dbD, { action: 'enregistrer', tentative_id: dD.tentative_id, reponses: reponsesDe(dD.questions.map(q => q.id), 20) })
  check('sans ligne de progression : fail-open (corps pris tel quel)', eD.success === true && eD.score === 20 && !eD.hors_delai)

  // ═════════════════ 4. reprise après échéance ═════════════════
  vraiLog('\n── 6. reprise après échéance : soumission automatique, durée = dernière activité ──')
  const dbE = makeDB(); horloge = debut
  const dE = await appeler(handler, dbE, { action: 'demarrer' })
  const idsE = dE.questions.map(q => q.id)
  horloge = debut + 5 * 60 * 1000 // dernière activité à 5 min
  await appeler(handler, dbE, { action: 'progression', tentative_id: dE.tentative_id, reponses: reponsesDe(idsE, 3) })
  horloge = debut + 90 * 60 * 1000 // l'élève revient 90 min plus tard
  const rE = await appeler(handler, dbE, { action: 'reprise' })
  check('reprise après échéance : soumisAuto, score des 3 réponses stockées', rE.success === true && rE.soumisAuto === true && rE.score === 3, `score ${rE.score}`)
  check('  durée = dernière activité (300 s), pas 2400', rE.temps_secondes === 300 && dbE.blancs[0].temps_secondes === 300, String(rE.temps_secondes))
  // lireProgression doit demander updated_at (« * » ou nommé) : le faux renvoie sinon une ligne sans cette
  // colonne, et la durée retombe sur le repli 2400 — ce contrôle échoue alors (vérifié par mutation).
  check('  lireProgression demande updated_at (select=* ou nommé)', dbE.selects.length > 0 && dbE.selects.every(x => x === '*' || x.split(',').includes('updated_at')), dbE.selects.join(' | '))
  check('  durée ≠ repli 2400 quand updated_at est présent', rE.temps_secondes !== DUREE_S && dbE.blancs[0].temps_secondes !== DUREE_S)
  check('  duree_s et maintenant_serveur aussi présents', rE.duree_s === DUREE_S && rE.maintenant_serveur === horloge)
  check('  tentative close (progression supprimée)', dbE.prog === null)

  // Aucune réponse donnée : dernière activité = démarrage, durée 0.
  const dbF = makeDB(); horloge = debut
  await appeler(handler, dbF, { action: 'demarrer' })
  horloge = debut + 3 * 3600 * 1000
  const rF = await appeler(handler, dbF, { action: 'reprise' })
  check('aucune réponse donnée : durée 0 (dernière activité = démarrage)', rF.soumisAuto === true && rF.temps_secondes === 0, String(rF.temps_secondes))

  // Dernière activité dans la marge ou après heure_fin : bornée à 40:00.
  const dbG = makeDB(); horloge = debut
  const dG = await appeler(handler, dbG, { action: 'demarrer' })
  horloge = RealDate.parse(dG.heure_fin) + 30 * 1000
  await appeler(handler, dbG, { action: 'progression', tentative_id: dG.tentative_id, reponses: reponsesDe(dG.questions.map(q => q.id), 4) })
  horloge = RealDate.parse(dG.heure_fin) + 3600 * 1000
  const rG = await appeler(handler, dbG, { action: 'reprise' })
  check('dernière activité dans la marge : bornée à 40:00', rG.temps_secondes === DUREE_S, String(rG.temps_secondes))

  // updated_at sans fuseau (colonne timestamp) : lu comme UTC, même résultat.
  const dbH = makeDB({ updatedAtSansFuseau: true }); horloge = debut
  const dH = await appeler(handler, dbH, { action: 'demarrer' })
  horloge = debut + 7 * 60 * 1000
  await appeler(handler, dbH, { action: 'progression', tentative_id: dH.tentative_id, reponses: reponsesDe(dH.questions.map(q => q.id), 2) })
  dbH.prog.updated_at = dbH.prog.updated_at.replace('Z', '') // le faux stockage renvoie sans fuseau
  horloge = debut + 100 * 60 * 1000
  const rH = await appeler(handler, dbH, { action: 'reprise' })
  check('updated_at sans fuseau : lu comme UTC (420 s)', rH.temps_secondes === 420, String(rH.temps_secondes))

  // updated_at absent ou illisible : repli sur 40:00 comme avant.
  const dbI = makeDB(); horloge = debut
  await appeler(handler, dbI, { action: 'demarrer' })
  delete dbI.prog.updated_at
  horloge = debut + 100 * 60 * 1000
  const rI = await appeler(handler, dbI, { action: 'reprise' })
  check('updated_at absent : repli sur 40:00 (comportement d\'avant)', rI.temps_secondes === DUREE_S, String(rI.temps_secondes))

  // ═════════════════ 2 + 3. côté client (examen.html) ═════════════════
  vraiLog('\n── 7. client : décalage d\'horloge de ±5 min ──')
  const { html, creer } = chargerClient()
  const SERVEUR = RealDate.parse('2026-11-21T15:00:00.000Z')
  const FIN = SERVEUR + DUREE_S * 1000
  for (const [nom, ecart] of [['appareil en RETARD de 5 min', -5 * 60 * 1000], ['appareil en AVANCE de 5 min', +5 * 60 * 1000], ['appareil à l\'heure', 0]]) {
    let appareil = SERVEUR + ecart // horloge de l'appareil à la réception de la réponse
    const fauxDate = { now: () => appareil }
    const c = creer(fauxDate)
    c.setDecalage(c.calculerDecalage(SERVEUR))
    check(`${nom} : maintenant() = heure du serveur`, c.maintenant() === SERVEUR, `${c.maintenant() - SERVEUR} ms d'écart`)
    appareil += 10 * 60 * 1000 // 10 min plus tard (même rythme des deux horloges)
    const restant = Math.max(0, FIN - c.maintenant())
    check(`${nom} : après 10 min, il reste 30:00`, restant === (DUREE_S - 600) * 1000, `${restant / 1000} s`)
    appareil = SERVEUR + ecart + DUREE_S * 1000
    check(`${nom} : l'échéance tombe à l'heure du serveur (restant = 0)`, Math.max(0, FIN - c.maintenant()) === 0)
    appareil -= 1000
    check(`${nom} : 1 s avant l'échéance serveur, il reste 1 s`, Math.max(0, FIN - c.maintenant()) === 1000)
  }
  // Valeurs invalides : décalage 0.
  {
    const c = creer({ now: () => 1_000_000 })
    const invalides = [undefined, null, NaN, Infinity, '1700000000000', {}, []]
    check('maintenant_serveur invalide (absent, null, NaN, Infinity, chaîne, objet) : décalage 0', invalides.every(v => c.calculerDecalage(v) === 0))
    check('décalage 0 : maintenant() = Date.now() de l\'appareil', (c.setDecalage(0), c.maintenant() === 1_000_000))
    check('valeur valide : décalage = serveur − appareil', c.calculerDecalage(1_300_000) === 300_000)
  }
  vraiLog('\n── 8. client : durée issue du serveur, plus de 40*60*1000 ──')
  {
    const c = creer({ now: () => 0 })
    check('duree_s valide reprise telle quelle', c.lireDuree(3000) === 3000)
    check('duree_s absente ou invalide : constante de repli unique (2400)', [undefined, null, NaN, 0, -5, '2400'].every(v => c.lireDuree(v) === 2400) && c.DUREE_REPLI_S === 2400)
    check('examen.html ne contient plus 40*60*1000', !/40\s*\*\s*60\s*\*\s*1000/.test(html))
    const sansHelper = html.replace('function calculerDecalage(maintenantServeur){\n  return Number.isFinite(maintenantServeur)?maintenantServeur-Date.now():0\n}', '').replace('function maintenant(){return Date.now()+decalageHorloge}', '')
    check('plus aucun Date.now() hors des deux fonctions d\'horloge (hors commentaires)', !/^[^/\n]*Date\.now\(\)/m.test(sansHelper.split('\n').filter(l => !l.trim().startsWith('//')).join('\n')))
    check('pick() refuse après l\'échéance (horloge serveur)', /function pick\(qi,oi\)\{[^]*?if\(heureFin&&maintenant\(\)>=heureFin\)return/.test(html))
    check('demarrer et reprise appliquent decalageHorloge et dureeS', (html.match(/decalageHorloge=calculerDecalage\(data\.maintenant_serveur\);dureeS=lireDuree\(data\.duree_s\)/g) || []).length === 2)
  }

  vraiLog(`\n${nbCas} contrôles, ${ko} échec(s)`)
  process.exitCode = ko ? 1 : 0
}

main().catch(e => { console.log = vraiLog; vraiLog('ERREUR', e); process.exit(1) })
