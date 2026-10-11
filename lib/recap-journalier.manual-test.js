// /lib/recap-journalier.manual-test.js
//
// Test manuel (pas de CI) : `node lib/recap-journalier.manual-test.js`.
// Couvre lib/recap-journalier.js, le récap journalier de api/email.js
// (libellé de jour, ligne d'activité, validation de `date`) et le cron
// (api/cron-rappel.js) contre un faux Supabase / Resend en mémoire : aucun
// réseau. L'horloge est figée au 09/10/2026 10:00 (Paris).
//
// PREVIEW_DIR=<répertoire> : écrit en plus un aperçu HTML par cas d'email.
//
// Les handlers sont recopiés en .mjs dans un répertoire temporaire pour la
// même raison que lib/questions-vues.manual-test.js (package.json sans
// "type": "module", les handlers utilisent `export default`).

const fs = require('fs')
const os = require('os')
const path = require('path')
const { pathToFileURL } = require('url')

const RACINE = path.join(__dirname, '..')
const MAINTENANT = '2026-10-09T08:00:00.000Z' // vendredi 9 octobre 2026, 10h00 à Paris

let nbOk = 0
let nbKo = 0
function check(libelle, ok, detail) {
  if (ok) { nbOk++; console.log(`  ✅ ${libelle}`) }
  else { nbKo++; console.log(`  ❌ ${libelle}${detail ? ' — ' + detail : ''}`) }
}

// ── Horloge figée : `new Date()` sans argument renvoie MAINTENANT ──
const DateReelle = Date
class DateFigee extends DateReelle {
  constructor(...a) { if (a.length === 0) super(MAINTENANT); else super(...a) }
  static now() { return new DateReelle(MAINTENANT).getTime() }
}
global.Date = DateFigee

const lib = require('./recap-journalier')

function texteVisible(html) {
  return html.replace(/<[^>]+>/g, '\n').replace(/&#39;/g, "'").split('\n').map(l => l.trim()).filter(Boolean).join('\n')
}

function res() {
  const r = { code: 200, body: null, headers: {} }
  r.setHeader = (k, v) => { r.headers[k] = v }
  r.status = c => { r.code = c; return r }
  r.json = b => { r.body = b; return r }
  r.end = () => r
  return r
}

async function main() {
  // ═══ 1. lib/recap-journalier.js ═══
  console.log('\n── 1. dateRecapValide ──')
  for (const ok of ['2026-10-07', '2026-02-28', '2028-02-29']) check(`valide : ${ok}`, lib.dateRecapValide(ok) === ok)
  for (const ko of ['2026-13-45', '2026-02-30', '2027-02-29', '<script>', '2026-1-5', '2026-10-07T00:00:00Z', ' 2026-10-07', '', null, undefined, 20261007, {}, ['2026-10-07']]) {
    check(`refusée : ${JSON.stringify(ko)}`, lib.dateRecapValide(ko) === null)
  }

  console.log('\n── 2. parseUTC / dateParis ──')
  check('naïf lu comme UTC (17:39:53 → Paris 19h39)', lib.dateParis('2026-10-08T22:30:00') === '2026-10-09', lib.dateParis('2026-10-08T22:30:00'))
  check('naïf avec espace', lib.dateParis('2026-10-08 21:59:59') === '2026-10-08')
  check('avec Z', lib.dateParis('2026-10-08T22:00:00Z') === '2026-10-09')
  check('avec décalage +00:00', lib.dateParis('2026-10-08T22:00:00+00:00') === '2026-10-09')
  check('hiver (UTC+1) : 23:30 UTC → lendemain Paris', lib.dateParis('2026-12-10T23:30:00') === '2026-12-11')
  check('illisible → null (jamais "Invalid Date")', lib.dateParis('n’importe quoi') === null && lib.dateParis(null) === null)

  console.log('\n── 3. libelleJour (maintenant = vendredi 9 octobre 2026) ──')
  const L = d => lib.libelleJour(d, new Date())
  check('aujourd’hui', L('2026-10-09').libelle === "aujourd'hui" && L('2026-10-09').jour === "aujourd'hui")
  check('hier', L('2026-10-08').libelle === 'hier' && L('2026-10-08').jour === 'hier')
  check('mardi 7 octobre', L('2026-10-07').libelle === 'le mercredi 7 octobre', L('2026-10-07').libelle)
  check('jour 1 → 1er', L('2026-09-01').libelle === 'le mardi 1er septembre', L('2026-09-01').libelle)
  check('veille à cheval sur un mois', lib.veille('2026-11-01') === '2026-10-31' && lib.veille('2026-03-01') === '2026-02-28')
  {
    // Minuit passé à Paris, mais encore la veille en UTC : « aujourd'hui » suit Paris.
    const tard = new DateReelle('2026-10-09T22:30:00Z') // 00h30 le 10 à Paris
    check('00h30 Paris : le 10 est aujourd’hui, le 9 est hier',
      lib.libelleJour('2026-10-10', tard).libelle === "aujourd'hui" && lib.libelleJour('2026-10-09', tard).libelle === 'hier')
  }

  console.log('\n── 4. ligneActivite ──')
  const s = (created_at, temps, abandonne = false) => ({ created_at, temps_secondes: temps, abandonne })
  check('sans abandon, 3 sessions',
    lib.ligneActivite([s('2026-10-09T18:12:00', 0), s('2026-10-09T18:40:00', 300), s('2026-10-09T19:05:00', 120)]) === 'Activité entre 20h12 et 21h05 · 3 sessions',
    lib.ligneActivite([s('2026-10-09T18:12:00', 0), s('2026-10-09T18:40:00', 300), s('2026-10-09T19:05:00', 120)]))
  {
    const l = lib.ligneActivite([s('2026-10-08T17:39:53', 16, true), s('2026-10-08T17:57:28', 141, true), s('2026-10-08T18:26:59', 92), s('2026-10-08T19:08:08', 225, true)])
    check('cas du 08/10 : abandons, 4 commencées dont 1 terminée', l === 'Activité entre 19h39 et 21h08 · 4 sessions commencées, dont 1 terminée', l)
  }
  check('même minute → « Activité à »', lib.ligneActivite([s('2026-10-09T18:26:40', 20)]) === 'Activité à 20h26', lib.ligneActivite([s('2026-10-09T18:26:40', 20)]))
  check('minutes à 2 chiffres, heure sans zéro', lib.ligneActivite([s('2026-10-09T07:00:00', 0), s('2026-10-09T07:05:00', 0)]) === 'Activité entre 9h00 et 9h05 · 2 sessions')
  check('1 seule session', lib.ligneActivite([s('2026-10-09T18:10:00', 600)]) === 'Activité entre 20h00 et 20h10 · 1 session')
  check('2 terminées sur 3 → pluriel', lib.ligneActivite([s('2026-10-09T18:10:00', 600), s('2026-10-09T18:30:00', 60), s('2026-10-09T18:50:00', 30, true)]).endsWith('3 sessions commencées, dont 2 terminées'))
  check('temps_secondes null → traité comme 0', lib.ligneActivite([s('2026-10-09T18:10:00', null), s('2026-10-09T18:30:00', null)]) === 'Activité entre 20h10 et 20h30 · 2 sessions')
  check('hiver : UTC+1', lib.ligneActivite([s('2026-12-09T18:10:00', 0), s('2026-12-09T18:30:00', 0)]) === 'Activité entre 19h10 et 19h30 · 2 sessions')
  check('aucune date exploitable → vide', lib.ligneActivite([s('???', 5)]) === '')

  // ═══ 2. Handler email (récap journalier) ═══
  console.log('\n── 5. api/email.js — récap journalier ──')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'recap-journalier-'))
  fs.mkdirSync(path.join(tmp, 'api')); fs.mkdirSync(path.join(tmp, 'lib'))
  for (const f of ['gating', 'auth-token', 'recap-journalier']) fs.copyFileSync(path.join(RACINE, `lib/${f}.js`), path.join(tmp, `lib/${f}.js`))
  for (const f of ['email', 'cron-rappel']) fs.copyFileSync(path.join(RACINE, `api/${f}.js`), path.join(tmp, `api/${f}.mjs`))
  // api/email.js utilise require() : disponible en .mjs via createRequire.
  const srcEmail = fs.readFileSync(path.join(tmp, 'api/email.mjs'), 'utf8')
  fs.writeFileSync(path.join(tmp, 'api/email.mjs'), "import { createRequire } from 'module'\nconst require = createRequire(import.meta.url)\n" + srcEmail)
  const { default: handlerEmail } = await import(pathToFileURL(path.join(tmp, 'api/email.mjs')).href)
  const { default: handlerCron } = await import(pathToFileURL(path.join(tmp, 'api/cron-rappel.mjs')).href)

  process.env.CRON_SECRET = 'secret-test'
  process.env.SUPABASE_SERVICE_KEY = 'service-test'
  process.env.RESEND_API_KEY = 'resend-test'
  delete process.env.HEALTHCHECK_URL_CRON_RAPPEL

  const UID = '11111111-2222-3333-4444-555555555555'
  const S = (created_at, temps, score, total, st, abandonne = false) => ({
    id: Math.random().toString(36).slice(2), theme: 'Géométrie', sous_theme: st, difficulte: 'facile',
    score, total, temps_secondes: temps, questions_ratees: [], created_at, alerte_envoyee: false, abandonne
  })

  function faux(sessions) {
    const appels = { resend: [], patch: 0, tous: [] }
    global.fetch = async (url, opts = {}) => {
      appels.tous.push({ url: String(url), body: opts.body })
      const rep = (corps, ok = true, status = 200) => ({ ok, status, json: async () => corps })
      if (url.includes('api.resend.com')) { appels.resend.push(JSON.parse(opts.body)); return rep({ id: 'x' }) }
      if (url.includes('/rest/v1/profils')) return rep([{ prenom_affiche: 'juliette', email_parent: 'parent@example.fr', email_actif: true, plan_actif: false }])
      if (url.includes('/rest/v1/resultats') && opts.method === 'PATCH') { appels.patch++; return rep({}) }
      if (url.includes('/rest/v1/resultats')) return rep(sessions)
      return rep([])
    }
    return appels
  }
  const appeler = async (body, sessions) => {
    const a = faux(sessions); const r = res()
    await handlerEmail({ method: 'POST', headers: { authorization: 'Bearer secret-test' }, body: { type: 'recap-journalier-user', user_id: UID, ...body } }, r)
    return { r, a }
  }
  const apercus = process.env.PREVIEW_DIR
  const noter = (nom, a) => {
    const m = a.resend[0]
    if (apercus) { fs.mkdirSync(apercus, { recursive: true }); fs.writeFileSync(path.join(apercus, `${nom}.html`), `<!doctype html><meta charset=utf-8><title>${m.subject}</title><p style="font:12px sans-serif;color:#888">Sujet : ${m.subject}</p>${m.html}`) }
    return m
  }
  global.__apercus = {}

  // a. aujourd'hui, ≥ 40, sans abandon
  {
    const { r, a } = await appeler({}, [S('2026-10-09T07:00:00', 0, 4, 5, 'Théorème de Pythagore'), S('2026-10-09T07:20:00', 300, 3, 5, 'Théorème de Thalès'), S('2026-10-09T07:40:00', 240, 5, 5, 'Théorème de Pythagore')])
    const m = noter('a-aujourdhui-ge40-sans-abandon', a)
    const t = texteVisible(m.html)
    check('a. 200 + 1 email', r.code === 200 && a.resend.length === 1)
    check('a. sujet « aujourd\'hui »', m.subject === "juliette a travaillé aujourd'hui — ACADEMIKA", m.subject)
    check('a. ligne d\'activité', t.includes('Activité entre 9h00 et 9h40 · 3 sessions'), t)
    check('a. « tout est acquis » ou synthèse sans date erronée', !/ce jour-là/.test(t))
    check('a. sessions marquées couvertes', a.patch === 3)
    global.__apercus.a = { sujet: m.subject, texte: t }
  }
  // b. hier, < 40, avec abandons — cas du 08/10
  const cas08 = [
    S('2026-10-08T17:39:53', 16, 0, 5, 'Théorème de Pythagore', true),
    S('2026-10-08T17:57:28', 141, 0, 5, 'Théorème de Pythagore', true),
    S('2026-10-08T18:26:59', 92, 1, 5, 'Théorème de Pythagore'),
    S('2026-10-08T19:08:08', 225, 0, 5, 'Théorème de Pythagore', true)
  ]
  {
    const { r, a } = await appeler({ date: '2026-10-08' }, cas08)
    const m = noter('b-hier-lt40-avec-abandons', a)
    const t = texteVisible(m.html)
    check('b. 200 + 1 email', r.code === 200 && a.resend.length === 1, JSON.stringify(r.body))
    check('b. sujet « hier »', m.subject === 'juliette a révisé hier — ACADEMIKA', m.subject)
    check('b. activité 19h39 → 21h08, 4 commencées dont 1 terminée', t.includes('Activité entre 19h39 et 21h08 · 4 sessions commencées, dont 1 terminée'), t)
    check('b. moyenne sur terminées seulement : 1/5 — 20%', t.includes('1/5 — 20%'))
    check('b. « 1 session de révision hier »', t.includes('a passé 1 session de révision hier'))
    check('b. plus de « ce soir » ni « score du jour »', !/ce soir|score du jour|aujourd'hui/.test(t))
    check('b. 4 lignes marquées couvertes (abandons compris)', a.patch === 4)
    global.__apercus.b = { sujet: m.subject, texte: t }
  }
  // c. date plus ancienne
  {
    const { r, a } = await appeler({ date: '2026-10-07' }, [S('2026-10-07T15:00:00', 600, 5, 5, 'Théorème de Pythagore'), S('2026-10-07T15:30:00', 300, 5, 5, 'Théorème de Pythagore')])
    const m = noter('c-ancienne-2026-10-07', a)
    const t = texteVisible(m.html)
    check('c. sujet « le mercredi 7 octobre »', m.subject === 'juliette a travaillé le mercredi 7 octobre — ACADEMIKA', m.subject)
    check('c. « Bravo, tout est acquis ! »', t.includes('Bravo, tout est acquis !'), t)
    check('c. légende Acquis « ce jour-là »', t.includes('bonnes réponses ce jour-là sur ce sous-thème'))
    check('c. activité 17h50 → 17h30', t.includes('Activité entre 16h50 et 17h30 · 2 sessions'), t)
    check('c. phrase « a bien travaillé le mercredi 7 octobre »', t.includes('a bien travaillé le mercredi 7 octobre'))
    global.__apercus.c = { sujet: m.subject, texte: t }
  }
  // c ter. hier, ≥ 40 : légende « hier », phrase sans complément de temps
  {
    const { a } = await appeler({ date: '2026-10-08' }, [S('2026-10-08T07:05:00', 0, 5, 5, 'Théorème de Pythagore'), S('2026-10-08T07:30:00', 60, 5, 5, 'Théorème de Pythagore')])
    const t = texteVisible(noter('c3-hier-ge40', a).html)
    check('c3. légende « bonnes réponses hier sur ce sous-thème »', t.includes('bonnes réponses hier sur ce sous-thème'), t)
    check('c3. « Bravo, tout est acquis ! » et heure sans zéro initial', t.includes('Bravo, tout est acquis !') && t.includes('Activité entre 9h05 et 9h30 · 2 sessions'), t)
  }
  // c bis. < 40 à une date ancienne : phrases sans « aujourd'hui »
  {
    const { a } = await appeler({ date: '2026-10-07' }, [S('2026-10-07T15:00:00', 600, 0, 5, 'Théorème de Pythagore')])
    const t = texteVisible(noter('c2-ancienne-lt40-sans-meilleur', a).html)
    check('c2. « score de la journée » et date', t.includes('score de la journée') && t.includes("s'entraîner le mercredi 7 octobre"), t)
  }
  // d. dates invalides
  for (const d of ['2026-13-45', '<script>', '2026-02-30', '', 12345, '2026-10-08T00:00:00Z']) {
    const { r, a } = await appeler({ date: d }, cas08)
    check(`d. ${JSON.stringify(d)} → 400, aucun email, aucune lecture`, r.code === 400 && a.resend.length === 0 && a.tous.length === 0, `${r.code}`)
    check(`d. ${JSON.stringify(d)} : valeur reçue non renvoyée`, !JSON.stringify(r.body).includes('script') && !JSON.stringify(r.body).includes('13-45'))
    global.__apercus.d = r.body
  }
  {
    const a = faux(cas08); const r = res()
    await handlerEmail({ method: 'POST', headers: {}, body: { type: 'recap-journalier-user', user_id: UID, date: '<script>' } }, r)
    check('d. non authentifié + date invalide → 401 (pas d\'oracle)', r.code === 401)
  }
  {
    const { r } = await appeler({ date: null }, [])
    check('date null = absent (jour courant)', r.code === 200)
  }
  {
    const { r, a } = await appeler({ date: '2026-10-08' }, cas08.filter(x => x.abandonne))
    check('journée 100 % abandons : pas d\'email, comportement inchangé', r.code === 200 && r.body.skip && a.resend.length === 0 && a.patch === 3, JSON.stringify(r.body))
  }

  // ═══ 3. Cron simulé ═══
  console.log('\n── 6. api/cron-rappel.js — la date postée est toujours valide ──')
  {
    const candidates = [
      { id: 1, user_id: UID, created_at: '2026-10-08T17:39:53', alerte_envoyee: false },
      { id: 2, user_id: UID, created_at: '2026-10-08T21:59:59', alerte_envoyee: false },
      { id: 3, user_id: UID, created_at: '2026-10-08T22:00:00', alerte_envoyee: false }, // 00h00 le 09 à Paris
      { id: 4, user_id: UID, created_at: '2026-10-09T07:00:00.123456', alerte_envoyee: false },
      { id: 5, user_id: 'autre', created_at: '2026-12-31T23:30:00', alerte_envoyee: false }, // hiver, minuit passé
      { id: 6, user_id: 'autre', created_at: '2026-03-28T23:30:00+00:00', alerte_envoyee: false }, // veille du passage à l'heure d'été
      { id: 7, user_id: UID, created_at: 'pas une date', alerte_envoyee: false },
      { id: 8, user_id: UID, created_at: null, alerte_envoyee: false }
    ]
    const postes = []
    global.fetch = async (url, opts = {}) => {
      const rep = (corps) => ({ ok: true, status: 200, json: async () => corps })
      if (String(url).includes('/api/email')) { postes.push(JSON.parse(opts.body)); return rep({ success: true, skip: 'test' }) }
      if (String(url).includes('select=id,user_id,created_at,alerte_envoyee')) return rep(candidates)
      return rep([])
    }
    const logs = []; const logReel = console.log; console.log = (...x) => logs.push(x.join(' '))
    const r = res()
    try { await handlerCron({ headers: { authorization: 'Bearer secret-test' } }, r) } finally { console.log = logReel }
    check('cron : 4 couples (user, date) postés, 2 lignes illisibles ignorées', postes.length === 4, `${postes.length} : ${JSON.stringify(postes.map(p => p.date))}`)
    check('cron : chaque date postée passe dateRecapValide', postes.length > 0 && postes.every(p => lib.dateRecapValide(p.date) === p.date), JSON.stringify(postes.map(p => p.date)))
    check('cron : minuit Paris = jour suivant (22:00 UTC le 08 → 2026-10-09)', postes.some(p => p.date === '2026-10-09'))
    check('cron : 31/12 23:30 UTC → 2027-01-01', postes.some(p => p.date === '2027-01-01'))
    check('cron : aucune date « Invalid Date »', postes.every(p => !String(p.date).includes('Invalid')))
    check('cron : lignes illisibles journalisées, sans compter d\'erreur', logs.some(l => l.includes('created_at illisible')) && /erreurs=0/.test(logs.join('\n')), logs.join(' | '))
    check('cron : type du POST inchangé', postes.every(p => p.type === 'recap-journalier-user'))
  }
  {
    // Boucle fermée : ce que le cron poste est accepté par l'endpoint (jamais de 400).
    const sess = [S('2026-10-08T22:00:00', 30, 4, 5, 'Théorème de Pythagore'), S('2026-10-09T07:00:00.123456', 30, 4, 5, 'Théorème de Pythagore')]
    const a = faux(sess)
    const datesPostees = [...new Set(sess.map(x => lib.dateParis(x.created_at)))]
    const codes = []
    for (const date of datesPostees) {
      const r = res(); await handlerEmail({ method: 'POST', headers: { authorization: 'Bearer secret-test' }, body: { type: 'recap-journalier-user', user_id: UID, date } }, r); codes.push(r.code)
    }
    check('boucle cron → endpoint : aucun 400', codes.every(c => c !== 400), JSON.stringify(codes))
  }

  if (apercus) fs.writeFileSync(path.join(apercus, 'resume.json'), JSON.stringify(global.__apercus, null, 2))
  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(`\n${nbOk} OK, ${nbKo} KO`)
  process.exit(nbKo ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
