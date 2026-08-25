// /lib/quiz-graphique.manual-test.js
//
// Test manuel isolé, PAS un test automatisé lancé en CI — script à exécuter
// à la main (`node lib/quiz-graphique.manual-test.js`) après toute
// modification de `nombreTableau` ou de la conversion des valeurs dans
// `renderGraphique` (quiz.html).
//
// Il couvre la lecture des valeurs d'un tableau vers les points du graphique :
// écritures françaises et typographiques (signe moins U+2212, virgule
// décimale, espace insécable) que `parseFloat` seul ne sait pas lire. Aucune
// dépendance, aucun accès réseau, aucune base.
//
// ── Pourquoi une extraction depuis quiz.html ───────────────────────
// Même montage que lib/quiz-enonce.manual-test.js : quiz.html est une page
// statique, son JavaScript vit dans une balise <script> et n'exporte rien.
// Recopier la fonction ici donnerait un test qui passe indéfiniment pendant
// que le vrai code dérive. On extrait donc la déclaration du fichier du dépôt
// à chaque exécution et on l'évalue via `new Function` — le test porte
// toujours sur le code réel.
//
// Fichier séparé de quiz-enonce.manual-test.js plutôt qu'une section de plus :
// les deux mécanismes n'ont rien en commun (le texte de l'énoncé d'un côté,
// les valeurs numériques du graphique de l'autre) et chaque test manuel du
// dépôt reste autonome. Le prix est une vingtaine de lignes d'extraction en
// double, assumé.

const fs = require('fs')
const path = require('path')

const SOURCE = path.join(__dirname, '..', 'quiz.html')

// ── Extraction ─────────────────────────────────────────────────────
function extraireFonction(src, nom) {
  const debut = src.indexOf(`function ${nom}(`)
  if (debut === -1) throw new Error(`fonction ${nom} introuvable dans quiz.html`)
  let i = src.indexOf('{', debut)
  let profondeur = 0
  for (; i < src.length; i++) {
    if (src[i] === '{') profondeur++
    else if (src[i] === '}') {
      profondeur--
      if (profondeur === 0) return src.slice(debut, i + 1)
    }
  }
  throw new Error(`accolades non refermées pour ${nom}`)
}

const src = fs.readFileSync(SOURCE, 'utf8')
const codeNombre = extraireFonction(src, 'nombreTableau')
for (const marqueur of ['parseFloat', 'null', 'isFinite']) {
  if (!codeNombre.includes(marqueur)) throw new Error(`extraction de nombreTableau suspecte : « ${marqueur} » absent`)
}
const { nombreTableau, estCaseATrouver } = new Function(
  `${codeNombre}\n${extraireFonction(src, 'estCaseATrouver')}\nreturn { nombreTableau, estCaseATrouver }`
)()

// ── renderGraphique exercée de bout en bout ────────────────────────
// L'avertissement et le repli vers le tableau ne s'observent pas sur
// `nombreTableau` seule : ils vivent dans renderGraphique. Elle est donc
// extraite elle aussi, avec ce qu'elle appelle, et évaluée contre un
// environnement navigateur minimal.
//
// Chart.js n'est pas chargé : `new Chart(canvas, config)` est remplacé par un
// espion qui retient la configuration. C'est ce qui permet de vérifier le
// TROU dans la courbe — la valeur null réellement transmise au dataset — et
// pas seulement le fait qu'un graphique a été rendu.
const codeRender = ['nombreTableau', 'estCaseATrouver', 'detecterTypeGraphique', 'renderTableau', 'renderGraphique']
  .map((nom) => extraireFonction(src, nom))
  .join('\n')

function rendre(tableau, questionIndex = 0) {
  const avertissements = []
  let rappel = null
  let config = null
  const faux = {
    window: { matchMedia: () => ({ matches: false }) },
    document: { getElementById: () => ({}) },
    charts: {},
    // renderGraphique diffère la construction du graphique de 50 ms ; on retient
    // le rappel pour le déclencher nous-mêmes, sans minuteur.
    setTimeout: (fn) => { rappel = fn },
    console: { warn: (...a) => avertissements.push(a.map(String).join(' ')), log: () => {} },
    Chart: function (canvas, cfg) { config = cfg }
  }
  const { renderGraphique } = new Function(
    'window', 'document', 'charts', 'setTimeout', 'console', 'Chart',
    `${codeRender}\nreturn { renderGraphique }`
  )(faux.window, faux.document, faux.charts, faux.setTimeout, faux.console, faux.Chart)

  const html = renderGraphique(tableau, questionIndex)
  if (rappel) rappel()
  return {
    html,
    avertissements,
    estUnGraphique: html.indexOf('<div class="q-chart"') === 0,
    estUnTableau: html.indexOf('<table class="q-tableau"') === 0,
    donnees: config ? config.data.datasets[0].data : null
  }
}

const memesValeurs = (a, b) => Array.isArray(a) && a.length === b.length && a.every((v, i) => Object.is(v, b[i]))

// ── Harnais ────────────────────────────────────────────────────────
let ko = 0
let nbCas = 0
const check = (nom, cond, info = '') => {
  nbCas++
  console.log(`${cond ? '  ok  ' : ' ÉCHEC'} ${nom}${info ? ' — ' + info : ''}`)
  if (!cond) ko++
}

// Object.is distingue 0 de -0 et rend NaN comparable : `nombreTableau('x') === NaN`
// serait faux même en cas de régression, un NaN qui repasse serait invisible.
const checkValeur = (nom, entree, attendu) => {
  const obtenu = nombreTableau(entree)
  check(nom, Object.is(obtenu, attendu), Object.is(obtenu, attendu) ? '' : `attendu ${attendu}, obtenu ${obtenu}`)
}

// Caractères invisibles à l'œil dans le source : nommés une fois ici.
const MOINS = '−'      // − signe moins typographique
const INSECABLE = ' '  //   espace insécable
const FINE = ' '       //   espace insécable fine (séparateur de milliers français)

function main() {
  console.log('\n── Les quatre cas du signalement ──')
  checkValeur(`« ${MOINS}3 » (signe moins U+2212) donne -3`, `${MOINS}3`, -3)
  checkValeur('« 2,5 » (virgule décimale) donne 2.5', '2,5', 2.5)
  checkValeur(`« 1${INSECABLE}000 » (espace insécable) donne 1000`, `1${INSECABLE}000`, 1000)
  checkValeur('« 0 » donne bien 0, pas null', '0', 0)

  console.log('\n── Signe ──')
  checkValeur('tiret ASCII « -3 » donne -3', '-3', -3)
  checkValeur(`« ${MOINS}2,5 » cumule signe et virgule`, `${MOINS}2,5`, -2.5)
  checkValeur(`« ${MOINS}0,5 » donne -0.5`, `${MOINS}0,5`, -0.5)
  checkValeur('« +3 » donne 3', '+3', 3)

  console.log('\n── Espaces ──')
  checkValeur(`« 1${FINE}000 » (fine insécable) donne 1000`, `1${FINE}000`, 1000)
  checkValeur('« 1 000 » (espace ordinaire) donne 1000', '1 000', 1000)
  checkValeur('« 12 345,6 » donne 12345.6', `12${INSECABLE}345,6`, 12345.6)
  checkValeur('« 3 » entouré d’espaces donne 3', '  3  ', 3)

  console.log('\n── Types d’entrée ──')
  checkValeur('un nombre passe tel quel', 3.5, 3.5)
  checkValeur('un nombre négatif passe tel quel', -2, -2)
  checkValeur('le nombre 0 donne 0', 0, 0)

  console.log('\n── Ce qui n’est pas convertible donne null, jamais 0 ──')
  checkValeur('chaîne vide', '', null)
  checkValeur('chaîne d’espaces', `  ${INSECABLE} `, null)
  checkValeur('texte', 'abc', null)
  checkValeur('point d’interrogation (cellule à trouver)', '?', null)
  checkValeur('tiret seul', '-', null)
  checkValeur('signe moins seul', MOINS, null)
  checkValeur('null', null, null)
  checkValeur('undefined', undefined, null)
  checkValeur('NaN', NaN, null)
  checkValeur('Infinity', Infinity, null)

  console.log('\n── « ? » : la case à trouver de la banque ──')
  check('« ? » est reconnu comme case à trouver', estCaseATrouver('?') === true)
  check('« ? » entouré d’espaces aussi', estCaseATrouver(` ?${INSECABLE}`) === true)
  check('« 3 » n’est pas une case à trouver', estCaseATrouver('3') === false)
  check('« abc » n’est pas une case à trouver', estCaseATrouver('abc') === false)
  check('« ?? » n’est pas une case à trouver', estCaseATrouver('??') === false)
  check('« 3 ? » n’est pas une case à trouver', estCaseATrouver('3 ?') === false)
  check('null n’est pas une case à trouver', estCaseATrouver(null) === false)
  checkValeur('« ? » reste null côté données', '?', null)

  console.log('\n── renderGraphique : avertissement et repli ──')
  const courbe = (...cellules) => ({ headers: ['x', '1', '2', '3'], rows: [['f(x)', ...cellules]] })

  // Le cas du signalement : « ? » est une convention, pas un incident.
  const avecPoint = rendre(courbe('2', '?', '6'))
  check('un « ? » ne déclenche AUCUN avertissement',
    avecPoint.avertissements.length === 0, avecPoint.avertissements.join(' | '))
  check('un « ? » laisse bien un trou dans la courbe',
    memesValeurs(avecPoint.donnees, [2, null, 6]), JSON.stringify(avecPoint.donnees))
  check('un « ? » n’empêche pas le graphique d’être rendu', avecPoint.estUnGraphique)

  // Une valeur réellement illisible, elle, doit se voir.
  const avecTexte = rendre(courbe('2', 'abc', '6'))
  check('une valeur illisible déclenche un avertissement',
    avecTexte.avertissements.length === 1, avecTexte.avertissements.join(' | '))
  check('l’avertissement compte 1 valeur, pas 3',
    /\b1\/3\b/.test(avecTexte.avertissements[0] || ''), avecTexte.avertissements[0])
  check('une valeur illisible laisse elle aussi un trou',
    memesValeurs(avecTexte.donnees, [2, null, 6]), JSON.stringify(avecTexte.donnees))

  // Les deux comptages sont distincts : « ? » ne gonfle pas l'avertissement…
  const melange = rendre(courbe('2', '?', 'abc'))
  check('« ? » et « abc » mêlés : l’avertissement ne compte que « abc »',
    melange.avertissements.length === 1 && /\b1\/3\b/.test(melange.avertissements[0]), melange.avertissements[0])

  // … mais il compte bien pour le repli vers le tableau.
  const toutPoint = rendre(courbe('?', '?', '?'))
  check('un tableau entièrement fait de « ? » retombe sur le tableau', toutPoint.estUnTableau)
  check('… et sans déclencher d’avertissement',
    toutPoint.avertissements.length === 0, toutPoint.avertissements.join(' | '))
  const toutIllisible = rendre(courbe('abc', 'def', 'ghi'))
  check('un tableau entièrement illisible retombe sur le tableau', toutIllisible.estUnTableau)
  check('… en ayant averti', toutIllisible.avertissements.length === 1)

  const toutBon = rendre(courbe('2', `${MOINS}4`, '6'))
  check('aucune valeur absente : pas d’avertissement', toutBon.avertissements.length === 0)
  check('les valeurs normalisées arrivent bien au graphique',
    memesValeurs(toutBon.donnees, [2, -4, 6]), JSON.stringify(toutBon.donnees))

  console.log('\n── Câblage dans renderGraphique ──')
  // Ces cas exercent nombreTableau en isolation : ils resteraient verts si
  // renderGraphique revenait à convertir les valeurs lui-même.
  const compter = (aiguille) => src.split(aiguille).length - 1
  check('le repli silencieux `parseFloat(v)||0` a disparu de quiz.html',
    compter('parseFloat(v)||0') === 0)
  check('renderGraphique convertit ses valeurs via nombreTableau',
    compter('var values=brutes.map(nombreTableau)') === 1)
  check('l’avertissement ignore les cases à trouver',
    compter('!estCaseATrouver(brutes[k])') === 1)
  check('un tableau entièrement illisible retombe sur renderTableau',
    compter('if(illisibles===values.length)return renderTableau(tableau)') === 1)

  console.log(ko === 0 ? `\n✅ ${nbCas}/${nbCas} cas passés.\n` : `\n❌ ${ko} échec(s) sur ${nbCas} cas.\n`)
  process.exitCode = ko === 0 ? 0 : 1
}

main()
