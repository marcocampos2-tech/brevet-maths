// /lib/quiz-fin.manual-test.js
//
// Test manuel, PAS un test automatisé lancé en CI — à exécuter à la main
// (`node lib/quiz-fin.manual-test.js`) après toute modification de la fin de
// quiz (quiz.html : valider(), voirResultat(), sauvegarde, pagehide) ou de
// api/quiz-resultat.js (jeton dans le corps).
//
// Partie 1 — navigateur : Chromium piloté par Playwright contre le vrai
// quiz.html, sans réseau réel. Supabase (supabase-js), Chart.js et les appels
// /api/* sont interceptés et simulés ; aucune base, aucune écriture.
// Partie 2 — serveur : api/quiz-resultat.js exercé avec un faux fetch (jeton en
// en-tête, jeton dans le corps, corps en chaîne). Même technique de copie en
// .mjs que lib/questions-vues.manual-test.js (cf. ses commentaires).
//
// Prérequis : le module `playwright` et un Chromium (variable
// PLAYWRIGHT_BROWSERS_PATH ou chemin ci-dessous). Dans l'environnement de
// session distant : NODE_PATH=/opt/node-tools/node_modules.

const fs = require('fs')
const os = require('os')
const path = require('path')
const { pathToFileURL } = require('url')

const RACINE = path.join(__dirname, '..')
const ORIGINE = 'http://localhost:4173' // contexte sécurisé : crypto.randomUUID() l'exige
let echecs = 0
function verifie(nom, ok, detail) {
  if (!ok) { echecs++; console.log('ECHEC  ' + nom + (detail !== undefined ? '  → ' + JSON.stringify(detail) : '')) }
  else console.log('ok     ' + nom)
}
const attendre = ms => new Promise(r => setTimeout(r, ms))

// ── Simulations ────────────────────────────────────────────────────────────
const SUPABASE_STUB = `
window.supabase = { createClient: function () {
  function chaine(table) {
    const c = {}
    ;['select', 'eq', 'limit', 'order'].forEach(function (m) { c[m] = function () { return c } })
    c.maybeSingle = function () { return Promise.resolve(res()) }
    c.then = function (ok, ko) { return Promise.resolve(res()).then(ok, ko) }
    function res() {
      if (table === 'profils') return { data: [{ prenom_affiche: 'Lea', email_parent: 'p@x.fr' }], error: null }
      if (table === 'niveaux_sous_theme') return { data: { f_reussites: 1, m_reussites: 0, d_reussites: 0, m_etat: 'verrouille', d_etat: 'verrouille' }, error: null }
      return { data: [], error: null }
    }
    return c
  }
  return {
    auth: {
      getSession: async function () { return { data: { session: { access_token: 'TOK', user: { id: 'u1', email: 'e@x.fr', user_metadata: { prenom: 'Lea' }, app_metadata: {} } } } } },
      onAuthStateChange: function () { return {} },
      refreshSession: async function () { return { data: { session: { access_token: 'TOK2' } }, error: null } },
      signOut: async function () { return { error: null } }
    },
    from: chaine
  }
} }`

const QUESTIONS = [0, 1, 2, 3, 4].map(i => ({
  q: 'Question ' + (i + 1) + ' ?', opts: ['bonne', 'fausse 1', 'fausse 2', 'fausse 3'], answer: 0,
  explication: 'EXPLICATION-Q' + (i + 1), chapitre: 'Équations', tableau: null, figure: null
}))

// reponses : tableau de comportements successifs pour /api/quiz-resultat
//   { statut: 200|500|401, delai: ms }  — le dernier est répété.
async function ouvrirQuiz(browser, reponses) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } })
  const page = await ctx.newPage()
  const posts = []   // { corps, entetes, beacon }
  let n = 0
  await page.route('**/*', async route => {
    const req = route.request()
    const url = req.url()
    if (url === ORIGINE + '/quiz.html') return route.fulfill({ status: 200, contentType: 'text/html', body: fs.readFileSync(path.join(RACINE, 'quiz.html'), 'utf8') })
    if (url.includes('supabase-js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: SUPABASE_STUB })
    if (url.includes('Chart.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.Chart=function(){}' })
    if (url.endsWith('/api/generer')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ questions: QUESTIONS, source: 'banque' }) })
    if (url.includes('/api/inscription-brevet')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{"sessions":[]}' })
    if (url.endsWith('/api/quiz-resultat')) {
      const rep = reponses[Math.min(n, reponses.length - 1)]; n++
      let corps = null
      try { corps = JSON.parse(req.postData() || 'null') } catch (e) { /* corps illisible */ }
      posts.push({ corps, entetes: req.headers() })
      if (rep.delai) await attendre(rep.delai)
      if (rep.reseau) return route.abort('failed')
      return route.fulfill({ status: rep.statut, contentType: 'application/json', body: JSON.stringify(rep.statut === 200 ? { success: true } : { error: 'x' }) })
    }
    if (url.startsWith(ORIGINE)) return route.fulfill({ status: 404, body: '' })
    return route.fulfill({ status: 200, contentType: 'text/plain', body: '' }) // polices, insights…
  })
  await page.goto(ORIGINE + '/quiz.html')
  await page.waitForSelector('#gen-btn:not([disabled])')
  await page.evaluate(() => generer())
  await page.waitForSelector('#quiz-area .card')
  return { page, ctx, posts }
}

async function repondre(page, nb) { // nb réponses (la 1ʳᵉ option, bonne), via les vrais boutons
  for (let i = 0; i < nb; i++) {
    await page.evaluate(i => { pick(i, i < 4 ? 0 : 0) }, i)
    await page.locator('button:has-text("Valider")').first().click()
  }
}
const texteZone = page => page.locator('#statut-enregistrement').innerText()

;(async () => {
  let chromium
  try { ({ chromium } = require('playwright')) } catch (e) {
    console.log('playwright introuvable (NODE_PATH=/opt/node-tools/node_modules ?)'); process.exit(2)
  }
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

  // ── 1. La Q5 se comporte comme Q1-Q4 ────────────────────────────────────
  console.log('\n[1] Q5 : explication affichée, bouton « Voir mon résultat »')
  {
    const { page, ctx, posts } = await ouvrirQuiz(browser, [{ statut: 200 }])
    await repondre(page, 5)
    const html = await page.locator('#quiz-area').innerText()
    verifie('l\'explication de la Q5 est affichée', html.includes('EXPLICATION-Q5'))
    verifie('les explications Q1 à Q4 le sont aussi', [1, 2, 3, 4].every(i => html.includes('EXPLICATION-Q' + i)))
    verifie('bouton « Voir mon résultat » présent', await page.locator('#btn-voir-resultat').count() === 1)
    verifie('résultats pas encore affichés', await page.locator('#score-num').count() === 0)
    verifie('aucun envoi avant le clic', posts.length === 0)
    verifie('plus de bandeau « Quiz en cours » à la fin', !html.includes('Quiz en cours'))
    // triple clic sur le Valider de la Q5 : sans effet (déjà validée)
    await page.evaluate(() => { valider(4); valider(4); valider(4) })
    verifie('triple valider(4) : toujours aucun envoi', posts.length === 0)
    await ctx.close()
  }

  // ── 2. Résultat immédiat, triple clic, enregistrement en arrière-plan ───
  console.log('\n[2] Résultat immédiat + triple clic (serveur lent : 3 s)')
  {
    const { page, ctx, posts } = await ouvrirQuiz(browser, [{ statut: 200, delai: 3000 }])
    await repondre(page, 5)
    const t0 = Date.now()
    await page.evaluate(() => { const b = document.getElementById('btn-voir-resultat'); b.click(); b.click(); b.click() })
    await page.waitForSelector('#score-num')
    const delaiAffichage = Date.now() - t0
    verifie('score affiché en < 1 s alors que le serveur met 3 s', delaiAffichage < 1000, delaiAffichage)
    await attendre(900) // fin du compteur animé
    verifie('compteur animé arrivé à 5/5', (await page.locator('#score-num').innerText()) === '5/5')
    verifie('statut « Enregistrement… » pendant l\'attente', (await texteZone(page)).includes('Enregistrement'))
    verifie('progression en attente tant que non enregistré', (await page.locator('#prog-contenu').innerText()).includes('Calcul de ta progression'))
    await page.waitForFunction(() => document.getElementById('statut-enregistrement').innerText.includes('✓ Résultat enregistré'), null, { timeout: 8000 })
    verifie('« ✓ Résultat enregistré » après confirmation', true)
    await page.waitForFunction(() => !document.getElementById('prog-contenu').innerText.includes('Calcul'), null, { timeout: 3000 })
    verifie('progression affichée après enregistrement', (await page.locator('#prog-contenu').innerText()).includes('Session réussie'))
    verifie('triple clic : UN seul POST', posts.length === 1, posts.length)
    verifie('POST sans abandon, avec client_key', posts[0].corps && !posts[0].corps.abandonne && !!posts[0].corps.client_key)
    verifie('jeton en en-tête Authorization', posts[0].entetes['authorization'] === 'Bearer TOK')
    await ctx.close()
  }

  // ── 3. Relance automatique silencieuse ──────────────────────────────────
  console.log('\n[3] Échec transitoire : relance silencieuse puis « Réessayer »')
  {
    // 3a. 1ʳᵉ tentative en échec réseau, relance OK : « Réessayer » jamais vu
    const a = await ouvrirQuiz(browser, [{ reseau: true }, { statut: 200 }])
    await repondre(a.page, 5)
    await a.page.evaluate(() => voirResultat())
    await a.page.waitForSelector('#score-num')
    await attendre(300)
    let txt = await texteZone(a.page)
    verifie('entre l\'échec et la relance : aucun « Réessayer » ni alerte', !txt.includes('Réessayer') && !txt.includes('⚠️'), txt)
    await a.page.waitForFunction(() => document.getElementById('statut-enregistrement').innerText.includes('✓ Résultat enregistré'), null, { timeout: 6000 })
    verifie('relance réussie : « ✓ Résultat enregistré »', true)
    verifie('2 POST, même client_key', a.posts.length === 2 && a.posts[0].corps.client_key === a.posts[1].corps.client_key, a.posts.length)
    await a.ctx.close()

    // 3b. deux échecs : « Réessayer » visible, puis réessai manuel réussi
    const b = await ouvrirQuiz(browser, [{ statut: 500 }, { statut: 500 }, { statut: 200 }])
    await repondre(b.page, 5)
    await b.page.evaluate(() => voirResultat())
    await b.page.waitForSelector('#score-num')
    await b.page.waitForFunction(() => document.getElementById('statut-enregistrement').innerText.includes('Réessayer'), null, { timeout: 6000 })
    txt = await texteZone(b.page)
    verifie('après relance en échec : message clair + bouton « Réessayer »', txt.includes('pas encore enregistré') && txt.includes('Réessayer'), txt)
    verifie('le score reste affiché', (await b.page.locator('#score-num').innerText()) === '5/5')
    verifie('progression pas affichée (données périmées)', (await b.page.locator('#prog-contenu').innerText()).includes('sera mise à jour'))
    verifie('2 POST à ce stade (envoi + relance), même client_key', b.posts.length === 2 && b.posts[0].corps.client_key === b.posts[1].corps.client_key)
    await b.page.evaluate(() => { const bt = document.querySelector('#statut-enregistrement button'); bt.click(); bt.click(); bt.click() })
    await b.page.waitForFunction(() => document.getElementById('statut-enregistrement').innerText.includes('✓ Résultat enregistré'), null, { timeout: 6000 })
    verifie('Réessayer (triple clic) : un seul POST de plus', b.posts.length === 3, b.posts.length)
    verifie('même client_key aux 3 tentatives (aucun doublon possible en base)', new Set(b.posts.map(p => p.corps.client_key)).size === 1)
    await b.page.waitForFunction(() => document.getElementById('prog-contenu').innerText.includes('Session réussie'), null, { timeout: 3000 })
    verifie('progression affichée après le réessai réussi', true)
    await b.ctx.close()

    // 3c. 401 définitif : pas de relance, bouton « Me reconnecter »
    const c = await ouvrirQuiz(browser, [{ statut: 403 }])
    await repondre(c.page, 5)
    await c.page.evaluate(() => voirResultat())
    await c.page.waitForFunction(() => document.getElementById('statut-enregistrement').innerText.includes('Me reconnecter'), null, { timeout: 4000 })
    await attendre(1800)
    verifie('403 (définitif) : aucune relance automatique', c.posts.length === 1, c.posts.length)
    await c.ctx.close()
  }

  // ── 4. pagehide : abandon seulement si quiz inachevé ; sinon vrai résultat
  console.log('\n[4] pagehide : abandon, sendBeacon du vrai résultat')
  const pagehide = page => page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })))
  {
    // 4a. quiz en cours (3/5) : abandon comme avant
    const a = await ouvrirQuiz(browser, [{ statut: 200 }])
    await repondre(a.page, 3)
    await pagehide(a.page); await attendre(500)
    verifie('quiz inachevé : un POST d\'abandon (comportement inchangé)', a.posts.length === 1 && a.posts[0].corps.abandonne === true, a.posts.map(p => p.corps))
    await a.ctx.close()

    // 4b. quiz fini, « Voir mon résultat » jamais cliqué : le vrai résultat part
    const b = await ouvrirQuiz(browser, [{ statut: 200 }])
    await repondre(b.page, 5)
    await pagehide(b.page); await attendre(500)
    verifie('quiz fini sans clic : UN POST, pas un abandon', b.posts.length === 1 && !b.posts[0].corps.abandonne, b.posts.map(p => p.corps && p.corps.abandonne))
    verifie('… avec le vrai score (5 réponses, questions jointes)', b.posts[0].corps.questions.length === 5 && Object.keys(b.posts[0].corps.reponses).length === 5)
    verifie('… jeton dans le corps (sendBeacon : pas d\'en-tête Authorization)', b.posts[0].corps.access_token === 'TOK' && !b.posts[0].entetes['authorization'])
    await b.ctx.close()

    // 4c. quiz fini, sauvegarde en échec : sendBeacon avec le MÊME client_key
    const c = await ouvrirQuiz(browser, [{ statut: 500 }, { statut: 500 }, { statut: 200 }])
    await repondre(c.page, 5)
    await c.page.evaluate(() => voirResultat())
    await c.page.waitForFunction(() => document.getElementById('statut-enregistrement').innerText.includes('Réessayer'), null, { timeout: 6000 })
    const avant = c.posts.length
    await pagehide(c.page); await attendre(500)
    const beacon = c.posts[c.posts.length - 1]
    verifie('échec puis fermeture : un POST de plus', c.posts.length === avant + 1, c.posts.length)
    verifie('… vrai résultat, pas un abandon', !beacon.corps.abandonne && beacon.corps.questions.length === 5)
    verifie('… même client_key que les tentatives précédentes', beacon.corps.client_key === c.posts[0].corps.client_key)
    verifie('… jeton dans le corps', beacon.corps.access_token === 'TOK')
    await c.ctx.close()

    // 4d. quiz fini ET confirmé : rien ne part
    const d = await ouvrirQuiz(browser, [{ statut: 200 }])
    await repondre(d.page, 5)
    await d.page.evaluate(() => voirResultat())
    await d.page.waitForFunction(() => document.getElementById('statut-enregistrement').innerText.includes('✓ Résultat enregistré'), null, { timeout: 6000 })
    await pagehide(d.page); await attendre(500)
    verifie('résultat confirmé : aucun POST à la fermeture', d.posts.length === 1, d.posts.length)
    await d.ctx.close()

    // 4e. beforeunload (un Event synthétique ne conserve pas la chaîne
    // returnValue : on observe defaultPrevented, posé en même temps que le message)
    const avertit = pg => pg.evaluate(() => { const ev = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(ev); return ev.defaultPrevented })
    const e = await ouvrirQuiz(browser, [{ statut: 500 }, { statut: 500 }])
    await repondre(e.page, 3)
    verifie('quiz inachevé : avertissement (abandon à 0)', await avertit(e.page) === true)
    await repondre(e.page, 0)
    await e.page.evaluate(() => { for (let i = 3; i < 5; i++) { pick(i, 0); valider(i) } })
    verifie('quiz fini, envoi non lancé : plus d\'avertissement « score de 0 »', await avertit(e.page) === false)
    await e.page.evaluate(() => voirResultat())
    await e.page.waitForFunction(() => document.getElementById('statut-enregistrement').innerText.includes('Réessayer'), null, { timeout: 6000 })
    verifie('sauvegarde en échec : avertissement « pas encore enregistré »', await avertit(e.page) === true)
    await e.ctx.close()
  }
  await browser.close()

  // ── Partie 2 : serveur ───────────────────────────────────────────────────
  console.log('\n[5] api/quiz-resultat.js : jeton en en-tête, dans le corps, corps en chaîne')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quiz-fin-'))
  fs.mkdirSync(path.join(tmp, 'api')); fs.mkdirSync(path.join(tmp, 'lib'))
  fs.copyFileSync(path.join(RACINE, 'api/quiz-resultat.js'), path.join(tmp, 'api/quiz-resultat.mjs'))
  fs.copyFileSync(path.join(RACINE, 'lib/auth-eleve.js'), path.join(tmp, 'lib/auth-eleve.js'))
  fs.copyFileSync(path.join(RACINE, 'lib/auth-token.js'), path.join(tmp, 'lib/auth-token.js'))
  process.env.SUPABASE_SERVICE_KEY = 'service'
  const insertions = []
  global.fetch = async (url, opts = {}) => {
    const rep = (corps, ok = true) => ({ ok, status: ok ? 200 : 401, json: async () => corps, text: async () => JSON.stringify(corps) })
    if (url.includes('/auth/v1/user')) {
      return (opts.headers.Authorization === 'Bearer TOK') ? rep({ id: 'u1' }) : rep({}, false)
    }
    if (url.includes('/rest/v1/profils')) return rep([{ email_parent: 'p@x.fr' }])
    if (url.includes('/rest/v1/resultats') && opts.method === 'POST') { insertions.push(JSON.parse(opts.body)); return rep([]) }
    if (url.includes('/rest/v1/resultats')) return rep([])
    return rep({})
  }
  const { default: handler } = await import(pathToFileURL(path.join(tmp, 'api/quiz-resultat.mjs')).href)
  const corpsValide = { user_id: 'u1', email: 'e@x.fr', prenom: 'Lea', theme: 'T', sous_theme: 'S', difficulte: 'facile', questions: [{ q: 'q', opts: ['a', 'b'], answer: 0 }], reponses: { 0: 0 }, temps_secondes: 5, source_questions: 'banque', client_key: 'ck-1' }
  async function appeler(corps, entetes = {}) {
    const res = { code: 0, body: null, setHeader() {}, status(c) { this.code = c; return this }, json(b) { this.body = b; return this }, end() { return this } }
    await handler({ method: 'POST', headers: entetes, body: corps }, res)
    return res
  }
  let r = await appeler(corpsValide, { authorization: 'Bearer TOK' })
  verifie('jeton en en-tête : 200 (inchangé)', r.code === 200, r.code)
  r = await appeler({ ...corpsValide, access_token: 'TOK' })
  verifie('jeton dans le corps (sendBeacon) : 200', r.code === 200, r.code)
  r = await appeler(JSON.stringify({ ...corpsValide, access_token: 'TOK' }))
  verifie('corps reçu en chaîne JSON : 200', r.code === 200, r.code)
  r = await appeler({ ...corpsValide, access_token: 'FAUX' })
  verifie('jeton du corps invalide : 401', r.code === 401, r.code)
  r = await appeler(corpsValide)
  verifie('aucun jeton : 401', r.code === 401, r.code)
  r = await appeler({ ...corpsValide, user_id: 'autre', access_token: 'TOK' })
  verifie('jeton valide mais user_id d\'un autre : 403', r.code === 403, r.code)
  r = await appeler('{pas du json')
  verifie('corps illisible : 400', r.code === 400, r.code)
  r = await appeler(corpsValide, { authorization: 'Bearer TOK' })
  verifie('l\'en-tête reste prioritaire sur le corps', r.code === 200)
  verifie('client_key transmis à l\'insertion (idempotence)', insertions.length > 0 && insertions.every(i => i.client_key === 'ck-1'))
  fs.rmSync(tmp, { recursive: true, force: true })

  console.log(echecs === 0 ? '\nTous les contrôles passent.' : '\n' + echecs + ' ÉCHEC(S).')
  process.exit(echecs === 0 ? 0 : 1)
})().catch(e => { console.error(e); process.exit(1) })
