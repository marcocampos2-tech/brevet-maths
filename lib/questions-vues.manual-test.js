// /lib/questions-vues.manual-test.js
//
// Test manuel isolé, PAS un test automatisé lancé en CI — script à exécuter
// à la main (`node lib/questions-vues.manual-test.js`) après toute
// modification du mécanisme de mémoire des questions vues.
//
// Il exerce les DEUX handlers de bout en bout (api/generer.js pour le quiz
// normal, api/examen.js pour l'examen blanc) contre un faux Supabase en
// mémoire : aucune dépendance, aucun accès réseau, aucune écriture réelle.
//
// ── Pourquoi la copie en .mjs ──────────────────────────────────────
// package.json ne déclare pas "type": "module", donc `node` interprète tout
// .js comme du CommonJS — or api/generer.js et api/examen.js utilisent
// `export default`, syntaxe ESM que Vercel détecte par fichier mais que
// `node` refuserait ici. On recopie donc les sources dans un répertoire
// temporaire sous l'extension .mjs, en conservant l'arborescence api/ + lib/
// pour que l'import relatif '../lib/questions-vues' continue de résoudre.
// Le test porte ainsi toujours sur le code réel du dépôt, jamais sur une
// copie figée.
//
// NE PAS ajouter "type": "module" à package.json pour éviter ce détour :
// api/email.js utilise require('../lib/gating'), le dépôt mélange
// délibérément les deux formats et Vercel s'en accommode fichier par fichier.

const fs = require('fs')
const os = require('os')
const path = require('path')
const { pathToFileURL } = require('url')

const RACINE = path.join(__dirname, '..')

const tempsCrees = []

function preparerCopies() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'questions-vues-'))
  tempsCrees.push(tmp)
  fs.mkdirSync(path.join(tmp, 'api'))
  fs.mkdirSync(path.join(tmp, 'lib'))
  fs.copyFileSync(path.join(RACINE, 'lib/questions-vues.js'), path.join(tmp, 'lib/questions-vues.js'))
  for (const nom of ['generer', 'examen']) {
    fs.copyFileSync(path.join(RACINE, `api/${nom}.js`), path.join(tmp, `api/${nom}.mjs`))
  }
  return tmp
}

// ── Corps d'erreur PostgREST réaliste ──────────────────────────────
// C'est exactement ce qui ne doit jamais atteindre le client : noms de
// contrainte, de colonne, de policy.
const CORPS_FUITE = JSON.stringify({
  code: '42501',
  message: 'new row violates row-level security policy for table "questions_vues"',
  details: 'Key (user_id, question_id, source)=(…) conflicts with questions_vues_unique',
  hint: 'check policy "Élève accède à ses propres questions vues"'
})
const MOTS_INTERDITS = ['42501', 'row-level security', 'questions_vues_unique', 'Key (user_id', 'hint', 'policy']

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')
const SUB = '11111111-2222-3333-4444-555555555555'
const JETON = `x.${b64({ sub: SUB })}.y`

let ko = 0
let nbCas = 0
let logs = []
const vraiLog = console.log
const check = (nom, cond, info = '') => {
  nbCas++
  console.log(`${cond ? '  ok  ' : ' ÉCHEC'} ${nom}${info ? ' — ' + info : ''}`)
  if (!cond) ko++
}

async function main() {
  const tmp = preparerCopies()
  const importer = (rel) => import(pathToFileURL(path.join(tmp, rel)).href)

  process.env.SUPABASE_SERVICE_KEY = 'service-test'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test'
  const { default: handlerGenerer } = await importer('api/generer.mjs')
  const { default: handlerExamen } = await importer('api/examen.mjs')

  // ═══════════════════════════════════════════════════════════════
  // QUIZ NORMAL — api/generer.js, source 'banque'
  // ═══════════════════════════════════════════════════════════════
  const handler = handlerGenerer

  function makeDB(nbQuestions, { doublons = 0, vues = [], echec = null } = {}) {
    const banque = []
    for (let i = 1; i <= nbQuestions; i++) {
      banque.push({ id: i, question: `Énoncé ${i}`, opts: ['a','b','c','d'], answer: 1, explication: 'x', tableau: null, figure: null })
    }
    for (let k = 0; k < doublons; k++) {
      banque.push({ id: 1000 + k, question: `Énoncé ${k + 1}`, opts: ['a','b','c','d'], answer: 1, explication: 'x', tableau: null, figure: null })
    }
    return { banque, vues: new Set(vues), appels: [], entetes: [], echec }
  }

  function installFetch(db) {
    global.fetch = async (url, opts = {}) => {
      const method = opts.method || 'GET'
      db.appels.push(`${method} ${url.split('/rest/v1/')[1] || url}`)
      if (url.includes('api.anthropic.com')) return { ok: false }
      if (url.includes('questions_vues')) {
        db.entetes.push(opts.headers || {})
        const op = method === 'GET' ? 'lecture' : method === 'DELETE' ? 'purge' : 'marquage'
        if (db.echec && db.echec(op)) {
          if (db.echec(op) === 'reseau') throw new Error(`ECONNREFUSED ${url}`)
          return { ok: false, status: 403, text: async () => CORPS_FUITE }
        }
        const m = url.match(/question_id=in\.\(([^)]*)\)/)
        const ids = m && m[1] ? m[1].split(',').map(Number) : null
        if (method === 'GET') return { ok: true, json: async () => [...db.vues].filter(id => !ids || ids.includes(id)).map(question_id => ({ question_id })) }
        if (method === 'DELETE') { ids.forEach(id => db.vues.delete(id)); return { ok: true, text: async () => '' } }
        if (method === 'POST') { JSON.parse(opts.body).forEach(r => db.vues.add(r.question_id)); return { ok: true, text: async () => '' } }
      }
      if (url.includes('questions_banque')) return { ok: true, json: async () => db.banque }
      return { ok: true, json: async () => [] }
    }
  }

  async function run(db, access_token, mod = handler) {
    installFetch(db); db.appels = []; logs = []
    console.log = (...a) => logs.push(a.join(' '))
    let out = null
    const res = { setHeader(){}, status(c){ this.code = c; return this }, json(b){ out = { code: this.code, ...b }; return this }, end(){} }
    try {
      await mod({ method: 'POST', body: { theme: 'T', sous_theme: 'S', difficulte: 'facile', access_token } }, res)
    } finally { console.log = vraiLog }
    return out
  }

  const appelsVues = db => db.appels.filter(a => a.includes('questions_vues'))

  // Recharge un handler ET lib/questions-vues.js dans un graphe de modules
  // neuf. Indispensable depuis l'extraction : la clé anon est capturée au
  // chargement du module partagé, donc rejouer le seul handler avec un
  // cache-buster laisserait la clé de la première importation en place.
  // Un répertoire temporaire distinct donne des URL distinctes, donc des
  // instances neuves des deux modules.
  async function importerSansCleAnon(nom) {
    const tmpNeuf = preparerCopies()
    const sauvegarde = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    try {
      const m = await import(pathToFileURL(path.join(tmpNeuf, `api/${nom}.mjs`)).href)
      return m.default
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = sauvegarde
    }
  }

  console.log('\n╔══ QUIZ NORMAL (api/generer.js, source=banque) ══╗')

  console.log('\n── 1. Non-régression : 2 quiz sur pool de 12, aucun recouvrement ──')
  {
    const db = makeDB(12)
    const r1 = await run(db, JETON); const t1 = r1.questions.map(q => q.q)
    const r2 = await run(db, JETON); const t2 = r2.questions.map(q => q.q)
    check('quiz 1 : 5 questions, raison=filtre', r1.questions.length === 5 && r1.vues.raison === 'filtre', JSON.stringify(r1.vues))
    check('aucun recouvrement', t1.every(t => !t2.includes(t)))
    check('10 vues enregistrées', db.vues.size === 10, `${db.vues.size}`)
    check('en-tête apikey = variable d\'env', db.entetes.every(h => h.apikey === 'anon-test'))
  }

  console.log('\n── 2. Non-régression : reboucle au 3e quiz ──')
  {
    const db = makeDB(12)
    await run(db, JETON); await run(db, JETON)
    const r3 = await run(db, JETON)
    check('raison=reboucle', r3.vues.raison === 'reboucle', JSON.stringify(r3.vues))
    check('table purgée puis re-marquée : 5 vues', db.vues.size === 5, `${db.vues.size}`)
    const r4 = await run(db, JETON)
    check('quiz 4 repart en filtre', r4.vues.raison === 'filtre', JSON.stringify(r4.vues))
  }

  console.log('\n── 3. Non-régression : doublons d\'énoncé et isolation ──')
  {
    const db = makeDB(10, { doublons: 3 })
    const r1 = await run(db, JETON)
    const servis = r1.questions.map(q => q.q)
    const jumeaux = [1000, 1001, 1002].filter((id, k) => servis.includes(`Énoncé ${k + 1}`))
    check('jumeaux des énoncés servis marqués', jumeaux.every(id => db.vues.has(id)), `${jumeaux}`)
    const r2 = await run(db, JETON)
    check('aucun énoncé répété', r2.questions.every(q => !servis.includes(q.q)))

    const db2 = makeDB(12); db2.vues.add(999999)
    await run(db2, JETON); await run(db2, JETON); await run(db2, JETON)
    check('vue d\'un autre sous-thème préservée', db2.vues.has(999999))
    const del = db2.appels.filter(a => a.startsWith('DELETE'))
    check('DELETE borné user_id + source + in()',
      del.length === 1 && del[0].includes(`user_id=eq.${SUB}`) && del[0].includes('source=eq.banque') && /question_id=in\.\(/.test(del[0]), del[0])
  }

  console.log('\n── ITEM 1 : aucune chaîne PostgREST ne part au client ──')
  for (const op of ['lecture', 'purge', 'marquage']) {
    const db = makeDB(12, { echec: o => o === op })
    if (op !== 'lecture') { await run(db, JETON); await run(db, JETON) }  // amener la purge/marquage
    const r = await run(db, JETON)
    const brut = JSON.stringify(r.vues)
    check(`échec ${op} : aucun mot du corps PostgREST dans vues`,
      MOTS_INTERDITS.every(m => !brut.includes(m)), brut)
    check(`échec ${op} : corps complet présent dans le log`,
      logs.some(l => l.includes('42501') && l.includes('questions_vues_unique')))
    check(`échec ${op} : quiz servi quand même`, r.questions.length === 5)
    check(`échec ${op} : statut HTTP nu remonté`, r.vues.statut === 403, JSON.stringify(r.vues))
  }

  console.log('\n── ITEM 1 bis : erreur NON-HTTP (réseau) ──')
  {
    const db = makeDB(12, { echec: o => o === 'lecture' ? 'reseau' : null })
    const r = await run(db, JETON)
    const brut = JSON.stringify(r.vues)
    check('aucune URL ni message d\'exception dans vues', !brut.includes('ECONNREFUSED') && !brut.includes('supabase.co'), brut)
    check('pas de champ statut (échec non HTTP)', r.vues.statut === undefined, brut)
    check('echec=lecture tout de même identifié', r.vues.echec === 'lecture', brut)
    check('message complet dans le log', logs.some(l => l.includes('ECONNREFUSED')))
    check('quiz servi', r.questions.length === 5)
  }

  console.log('\n── ITEM 2 : NEXT_PUBLIC_SUPABASE_ANON_KEY absente ──')
  {
    const handlerSansCle = await importerSansCleAnon('generer')
    const db = makeDB(12)
    const r = await run(db, JETON, handlerSansCle)
    check('quiz servi (fail-open)', r.questions.length === 5)
    check('raison=config_absente', r.vues.raison === 'config_absente', JSON.stringify(r.vues))
    check('aucun appel à questions_vues', appelsVues(db).length === 0)
    check('log explicite émis', logs.some(l => l.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY absente')), logs.join(' | '))

    const db2 = makeDB(12)
    const r2 = await run(db2, null, handlerSansCle)
    check('sans jeton : raison=anonyme, pas de log de config', r2.vues.raison === 'anonyme' && !logs.some(l => l.includes('ANON_KEY')), JSON.stringify(r2.vues))
  }

  console.log('\n── ITEM 3 : echec n\'écrase plus raison ──')
  {
    const db = makeDB(12, { echec: o => o === 'marquage' })
    await run(db, JETON)
    const r = await run(db, JETON)
    check('raison conservée (filtre), echec séparé',
      r.vues.raison === 'filtre' && r.vues.echec === 'marquage', JSON.stringify(r.vues))

    const db2 = makeDB(12, { echec: o => o === 'marquage' })
    db2.vues = new Set([1,2,3,4,5,6,7,8,9,10])   // pool quasi épuisé => reboucle
    const r2 = await run(db2, JETON)
    check('reboucle + marquage KO restent lisibles ensemble',
      r2.vues.raison === 'reboucle' && r2.vues.echec === 'marquage', JSON.stringify(r2.vues))
    check('la purge a bien eu lieu', db2.vues.size === 0, `${db2.vues.size}`)
  }

  console.log('\n── ITEM 4a : pool <= 5, court-circuit total ──')
  {
    for (const n of [2, 5]) {
      const db = makeDB(n)
      const r = await run(db, JETON)
      check(`pool de ${n} : zéro appel à questions_vues`, appelsVues(db).length === 0, appelsVues(db).join(', '))
      check(`pool de ${n} : ${n} questions servies`, r.questions.length === n)
      check(`pool de ${n} : raison=pool_insuffisant, uniques=${n}`,
        r.vues.raison === 'pool_insuffisant' && r.vues.uniques === n, JSON.stringify(r.vues))
      check(`pool de ${n} : aucune ligne créée`, db.vues.size === 0)
    }
    const db6 = makeDB(6)
    const r6 = await run(db6, JETON)
    check('pool de 6 : chemin nominal repris (filtre)', r6.vues.raison === 'filtre', JSON.stringify(r6.vues))
    check('pool de 6 : questions_vues bien appelée', appelsVues(db6).length > 0)
    // 5 énoncés distincts derrière 8 lignes => court-circuit aussi
    const dbDoublons = makeDB(5, { doublons: 3 })
    const rD = await run(dbDoublons, JETON)
    check('5 distincts + 3 doublons : court-circuit', rD.vues.raison === 'pool_insuffisant' && appelsVues(dbDoublons).length === 0, JSON.stringify(rD.vues))
  }


  // ═══════════════════════════════════════════════════════════════
  // EXAMEN BLANC — api/examen.js, source 'examen'
  // ═══════════════════════════════════════════════════════════════
  console.log('\n╔══ EXAMEN BLANC (api/examen.js, source=examen) ══╗')
  {
    const handler = handlerExamen

    function makeDB(tailles = { 1: 45, 2: 45, 3: 45, 4: 45 }, { vues = [], echec = null } = {}) {
      const parties = {}
      for (const p of [1, 2, 3, 4]) {
        parties[p] = []
        for (let i = 0; i < (tailles[p] || 0); i++) {
          const id = p * 1000 + i
          parties[p].push({ id, question: `P${p} Q${i}`, opts: ['a','b','c','d'], answer: 1, explication: 'x', theme: 'T', chapitre: 'C', partie: p, figure: null, tableau: null })
        }
      }
      return { parties, vues: new Set(vues), appels: [], echec }
    }

    function installFetch(db) {
      global.fetch = async (url, opts = {}) => {
        const method = opts.method || 'GET'
        db.appels.push(`${method} ${url.split('/rest/v1/')[1] || url}`)
        if (url.includes('questions_vues')) {
          const op = method === 'GET' ? 'lecture' : method === 'DELETE' ? 'purge' : 'marquage'
          if (db.echec && db.echec(op)) {
            if (db.echec(op) === 'reseau') throw new Error(`ECONNREFUSED ${url}`)
            return { ok: false, status: 403, text: async () => CORPS_FUITE }
          }
          const m = url.match(/question_id=in\.\(([^)]*)\)/)
          const ids = m && m[1] ? m[1].split(',').map(Number) : null
          if (method === 'GET') return { ok: true, json: async () => [...db.vues].filter(id => !ids || ids.includes(id)).map(question_id => ({ question_id })) }
          if (method === 'DELETE') { ids.forEach(id => db.vues.delete(id)); return { ok: true, text: async () => '' } }
          if (method === 'POST') { JSON.parse(opts.body).forEach(r => { if (r.source !== 'examen') throw new Error('source incorrecte'); db.vues.add(r.question_id) }); return { ok: true, text: async () => '' } }
        }
        const mp = url.match(/examen_questions\?partie=eq\.(\d)/)
        if (mp) return { ok: true, json: async () => db.parties[Number(mp[1])] }
        return { ok: true, json: async () => [] }
      }
    }

    async function run(db, access_token, mod = handler) {
      installFetch(db); db.appels = []; logs = []
      console.log = (...a) => logs.push(a.join(' '))
      let out = null
      const res = { setHeader(){}, status(c){ this.code = c; return this }, json(b){ out = { code: this.code, ...b }; return this }, end(){} }
      try { await mod({ method: 'POST', body: { action: 'demarrer', access_token } }, res) } finally { console.log = vraiLog }
      return out
    }

    const appelsVues = db => db.appels.filter(a => a.includes('questions_vues'))

    console.log('\n── 1. Toujours 20 questions, 5 par partie ──')
    {
      const db = makeDB()
      const r = await run(db, JETON)
      check('20 questions', r.questions.length === 20, `${r.questions.length}`)
      for (const p of [1,2,3,4]) check(`partie ${p} : 5 questions`, r.questions.filter(q => q.partie === p).length === 5)
      check('20 lignes marquées', db.vues.size === 20, `${db.vues.size}`)
      check('raison=applique, 4 parties en filtre',
        r.vues.raison === 'applique' && Object.values(r.vues.parties).every(v => v === 'filtre'), JSON.stringify(r.vues.parties))
      check('au plus 3 requêtes questions_vues', appelsVues(db).length <= 3, appelsVues(db).map(a => a.split(' ')[0]).join(','))
    }

    // 45 questions par partie, 5 servies par examen. Le seuil de 6 fait rebasculer
    // dès qu'il reste 5 non-vues : 8 examens sans recouvrement, reboucle au 9e —
    // et non 9 examens comme le laisserait croire un simple 45/5.
    console.log('\n── 2. 8 examens sans recouvrement, reboucle au 9e (45/partie) ──')
    {
      const db = makeDB()
      const vus = []
      for (let i = 1; i <= 8; i++) {
        const r = await run(db, JETON)
        check(`examen ${i} : 20 questions, aucune déjà vue`,
          r.questions.length === 20 && r.questions.every(q => !vus.includes(q.id)),
          i === 1 ? '' : `${vus.length} déjà servies`)
        if (Object.values(r.vues.parties).some(v => v !== 'filtre')) check(`examen ${i} : encore en filtre`, false, JSON.stringify(r.vues.parties))
        vus.push(...r.questions.map(q => q.id))
      }
      check('160 questions servies, 0 doublon', new Set(vus).size === 160, `${new Set(vus).size}`)
      check('40 vues par partie, 5 non-vues restantes', db.vues.size === 160, `${db.vues.size}`)
      const r9 = await run(db, JETON)
      check('examen 9 : les 4 parties rebouclent (5 non-vues < seuil 6)',
        Object.values(r9.vues.parties).every(v => v === 'reboucle'), JSON.stringify(r9.vues.parties))
      check('examen 9 : toujours 20 questions', r9.questions.length === 20)
      check('après purge + marquage : 20 lignes', db.vues.size === 20, `${db.vues.size}`)
      const r10 = await run(db, JETON)
      check('examen 10 : nouveau cycle en filtre', Object.values(r10.vues.parties).every(v => v === 'filtre'), JSON.stringify(r10.vues.parties))
    }

    console.log('\n── 3. Reboucle d\'une seule partie : les 3 autres intactes ──')
    {
      const db = makeDB()
      // partie 2 quasi épuisée (41 vues sur 45 => 4 non-vues < 6), autres vierges
      for (let i = 0; i < 41; i++) db.vues.add(2000 + i)
      const avant = new Set(db.vues)
      const r = await run(db, JETON)
      check('partie 2 en reboucle, autres en filtre',
        r.vues.parties[2] === 'reboucle' && [1,3,4].every(p => r.vues.parties[p] === 'filtre'), JSON.stringify(r.vues.parties))
      const del = db.appels.filter(a => a.startsWith('DELETE'))
      check('un seul DELETE', del.length === 1, `${del.length}`)
      check('DELETE ne contient que des ids de la partie 2',
        del[0].match(/in\.\(([^)]*)\)/)[1].split(',').every(id => Number(id) >= 2000 && Number(id) < 3000))
      check('DELETE borné user_id + source=examen',
        del[0].includes(`user_id=eq.${SUB}`) && del[0].includes('source=eq.examen'), del[0])
      const restantesAutres = [...avant].filter(id => id < 2000 || id >= 3000)
      check('aucune vue des autres parties supprimée', restantesAutres.every(id => db.vues.has(id)))
      check('20 questions malgré la reboucle partielle', r.questions.length === 20)
    }

    console.log('\n── 4. Partie sous le seuil : comportement identique à l\'existant ──')
    {
      const tailles = { 1: 45, 2: 45, 3: 4, 4: 45 }   // partie 3 sous le seuil de 6
      const dbRef = makeDB(tailles)
      const ref = await run(dbRef, null)              // sans jeton = comportement actuel
      const db = makeDB(tailles)
      const r = await run(db, JETON)
      check('partie 3 marquée pool_insuffisant', r.vues.parties[3] === 'pool_insuffisant', JSON.stringify(r.vues.parties))
      check('nombre total identique au comportement sans filtrage',
        r.questions.length === ref.questions.length, `avec=${r.questions.length} sans=${ref.questions.length}`)
      check('parties 1/2/4 toujours à 5 questions', [1,2,4].every(p => r.questions.filter(q => q.partie === p).length === 5))
      check('aucun id de la partie 3 marqué (ni lue ni purgée : pas de ligne orpheline)',
        ![...db.vues].some(id => id >= 3000 && id < 4000), [...db.vues].filter(id => id >= 3000 && id < 4000).join(','))
      check('15 lignes marquées, pas 18', db.vues.size === 15 && r.vues.marquees === 15, `${db.vues.size}/${r.vues.marquees}`)
      // Le seuil à 6 garantit qu'on ne descend jamais à 3 questions par filtrage
      const db6 = makeDB({ 1: 45, 2: 45, 3: 45, 4: 45 })
      for (let i = 0; i < 40; i++) db6.vues.add(1000 + i)   // partie 1 : 5 non-vues < 6 => reboucle
      const r6 = await run(db6, JETON)
      check('5 non-vues déclenche la reboucle (pas un tirage à 3)',
        r6.vues.parties[1] === 'reboucle' && r6.questions.filter(q => q.partie === 1).length === 5, JSON.stringify(r6.vues.parties))
    }

    console.log('\n── 5. Étanchéité : aucune chaîne PostgREST au client ──')
    for (const op of ['lecture', 'purge', 'marquage']) {
      const db = makeDB(undefined, { echec: o => o === op })
      if (op === 'purge') for (let i = 0; i < 41; i++) db.vues.add(2000 + i)
      const r = await run(db, JETON)
      const brut = JSON.stringify(r.vues)
      check(`échec ${op} : rien du corps PostgREST dans vues`, MOTS_INTERDITS.every(m => !brut.includes(m)), brut)
      check(`échec ${op} : corps complet dans le log`, logs.some(l => l.includes('42501') && l.includes('questions_vues_unique')))
      check(`échec ${op} : examen servi, 20 questions`, r.questions.length === 20, `${r.questions.length}`)
      check(`échec ${op} : statut nu + echec nommé`, r.vues.statut === 403 && r.vues.echec === op, brut)
    }
    {
      const db = makeDB(undefined, { echec: o => o === 'lecture' ? 'reseau' : null })
      const r = await run(db, JETON)
      const brut = JSON.stringify(r.vues)
      check('erreur réseau : ni URL ni message au client', !brut.includes('ECONNREFUSED') && !brut.includes('supabase.co'), brut)
      check('erreur réseau : pas de statut, echec=lecture', r.vues.statut === undefined && r.vues.echec === 'lecture', brut)
      check('erreur réseau : 20 questions quand même', r.questions.length === 20)
    }
    {
      // marquage KO après reboucle : raison doit rester lisible
      const db = makeDB(undefined, { echec: o => o === 'marquage' })
      for (let i = 0; i < 41; i++) db.vues.add(2000 + i)
      const r = await run(db, JETON)
      check('reboucle + marquage KO coexistent',
        r.vues.parties[2] === 'reboucle' && r.vues.echec === 'marquage' && r.vues.raison === 'applique', JSON.stringify(r.vues))
    }

    console.log('\n── 6. Jeton absent, clé anon absente ──')
    {
      const db = makeDB()
      const r = await run(db, null)
      check('sans jeton : 20 questions, raison=anonyme', r.questions.length === 20 && r.vues.raison === 'anonyme', JSON.stringify(r.vues))
      check('sans jeton : aucun appel questions_vues', appelsVues(db).length === 0)

      const sansCle = await importerSansCleAnon('examen')
      const db2 = makeDB()
      const r2 = await run(db2, JETON, sansCle)
      check('clé absente : 20 questions, raison=config_absente', r2.questions.length === 20 && r2.vues.raison === 'config_absente', JSON.stringify(r2.vues))
      check('clé absente : aucun appel questions_vues', appelsVues(db2).length === 0)
      check('clé absente : log explicite', logs.some(l => l.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY absente')))
    }


  }

  // ═══════════════════════════════════════════════════════════════
  // ÉTANCHÉITÉ ENTRE LES DEUX SOURCES
  // ═══════════════════════════════════════════════════════════════
  // Le mode de défaillance que la fabrique memoireQuestionsVues(source)
  // ferme : une source erronée enverrait un DELETE sur les questions vues
  // de l'autre parcours, sans rien signaler.
  console.log('\n╔══ ÉTANCHÉITÉ ENTRE SOURCES ══╗')
  {
    const urls = []
    const corps = []
    const capter = (reponses) => {
      global.fetch = async (url, opts = {}) => {
        urls.push(`${opts.method || 'GET'} ${url}`)
        if (opts.body) corps.push(opts.body)
        return reponses(url, opts)
      }
    }

    // quiz normal : pool épuisé => lecture + purge + marquage, les trois opérations
    capter((url) => {
      if (url.includes('questions_vues')) return { ok: true, json: async () => [1,2,3,4,5,6,7,8,9,10].map(question_id => ({ question_id })), text: async () => '' }
      if (url.includes('questions_banque')) return { ok: true, json: async () => Array.from({ length: 10 }, (_, i) => ({ id: i + 1, question: `Q${i}`, opts: ['a','b','c','d'], answer: 1, explication: 'x', tableau: null, figure: null })) }
      return { ok: true, json: async () => [] }
    })
    urls.length = 0
    console.log = () => {}
    await handlerGenerer({ method: 'POST', body: { theme: 'T', sous_theme: 'S', difficulte: 'facile', access_token: JETON } },
      { setHeader(){}, status(){ return this }, json(){ return this }, end(){} })
    console.log = vraiLog
    const urlsVues = urls.filter(u => u.includes('questions_vues'))
    check('quiz normal : 3 opérations émises (lecture, purge, marquage)',
      urlsVues.length === 3, urlsVues.map(u => u.split(' ')[0]).join(','))

    // La lecture et la purge portent la source dans l'URL ; le marquage est un
    // POST sur l'URL nue, sa source est dans le corps. Les deux sont vérifiés.
    const avecFiltre = urlsVues.filter(u => !u.startsWith('POST'))
    check('quiz normal : lecture et purge portent source=eq.banque',
      avecFiltre.length === 2 && avecFiltre.every(u => u.includes('source=eq.banque')), avecFiltre.join(' | '))
    check('quiz normal : aucune URL ne porte source=eq.examen',
      urlsVues.every(u => !u.includes('source=eq.examen')))
    check('quiz normal : le corps du marquage porte source=banque',
      corps.length === 1 && JSON.parse(corps[0]).every(l => l.source === 'banque'), corps[0])
    check('quiz normal : le DELETE est borné au user_id du jeton',
      urlsVues.some(u => u.startsWith('DELETE') && u.includes(`user_id=eq.${SUB}`)))
  }

  for (const d of tempsCrees) {
    try { fs.rmSync(d, { recursive: true, force: true }) } catch (e) {}
  }

  console.log(ko === 0 ? `\n✅ ${nbCas}/${nbCas} cas passés.\n` : `\n❌ ${ko} échec(s) sur ${nbCas} cas.\n`)
  process.exitCode = ko === 0 ? 0 : 1
}

main().catch(e => { console.error(e); process.exitCode = 1 })
