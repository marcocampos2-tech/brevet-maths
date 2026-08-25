// /lib/quiz-enonce.manual-test.js
//
// Test manuel isolé, PAS un test automatisé lancé en CI — script à exécuter
// à la main (`node lib/quiz-enonce.manual-test.js`) après toute modification
// de `adapterEnonce` ou de `detecterTypeGraphique` dans quiz.html.
//
// Il vérifie l'adaptation de l'énoncé au support réellement affiché : en mode
// graphique, « le/du tableau ci-dessous/suivant » devient « diagramme » (type
// barres) ou « graphique » (type fonction). Aucune dépendance, aucun accès
// réseau, aucune base.
//
// ── Pourquoi une extraction depuis quiz.html ───────────────────────
// quiz.html est une page statique : son JavaScript vit dans une balise
// <script>, il n'y a ni module ni export à importer. Recopier les deux
// fonctions ici donnerait un test qui passe indéfiniment pendant que le vrai
// code dérive — exactement ce qu'on veut éviter. On extrait donc les
// déclarations depuis le fichier du dépôt, à chaque exécution, et on les
// évalue via `new Function`. Le test porte ainsi toujours sur le code réel.
//
// `modeAffichage` est une variable de module dans quiz.html (`let
// modeAffichage={}`). Ici elle est injectée en paramètre de `new Function` :
// les deux fonctions extraites s'y lient par fermeture, et comme l'objet est
// passé par référence, muter ses clés depuis le test change bien le mode vu
// par `adapterEnonce`.
//
// L'extraction par comptage d'accolades est naïve — elle suffit pour ces deux
// fonctions, qui ne contiennent ni accolade en chaîne de caractères ni
// accolade en littéral d'expression régulière. `verifierExtraction()` échoue
// bruyamment si ce n'était plus vrai, plutôt que de laisser le test évaluer
// un fragment tronqué.

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

function verifierExtraction(code, nom, marqueurs) {
  for (const m of marqueurs) {
    if (!code.includes(m)) throw new Error(`extraction de ${nom} suspecte : « ${m} » absent`)
  }
}

const src = fs.readFileSync(SOURCE, 'utf8')
const codeDetecter = extraireFonction(src, 'detecterTypeGraphique')
const codeAdapter = extraireFonction(src, 'adapterEnonce')
verifierExtraction(codeDetecter, 'detecterTypeGraphique', ["'fonction'", "'barres'", 'rows.length>1'])
verifierExtraction(codeAdapter, 'adapterEnonce', ['modeAffichage', 'diagramme', 'replace'])

const modeAffichage = {}
const { detecterTypeGraphique, adapterEnonce } = new Function(
  'modeAffichage',
  `${codeDetecter}\n${codeAdapter}\nreturn { detecterTypeGraphique, adapterEnonce }`
)(modeAffichage)

// ── Harnais ────────────────────────────────────────────────────────
let ko = 0
let nbCas = 0
const check = (nom, cond, info = '') => {
  nbCas++
  console.log(`${cond ? '  ok  ' : ' ÉCHEC'} ${nom}${info ? ' — ' + info : ''}`)
  if (!cond) ko++
}

// `i` fixé à 0 partout sauf dans le cas dédié à l'index : le mode est posé
// avant chaque groupe de cas, sur cette seule clé.
const rendu = (texte, tableau, i = 0) => adapterEnonce({ q: texte, tableau }, i)
const checkRendu = (nom, texte, attendu, tableau, i = 0) => {
  const obtenu = rendu(texte, tableau, i)
  check(nom, obtenu === attendu, obtenu === attendu ? '' : `attendu « ${attendu} », obtenu « ${obtenu} »`)
}

// ── Jeux de données ────────────────────────────────────────────────
// Une seule ligne : c'est tout ce que renderGraphique sait tracer, et donc
// tout ce que detecterTypeGraphique déclare éligible.
const BARRES = { headers: ['Note', '8', '12', '15'], rows: [['Effectif', '3', '7', '5']] }
const FONCTION = { headers: ['x', '1', '2', '3'], rows: [['f(x)', '2', '4', '6']] }
const MULTI = { headers: ['Note', '8', '12'], rows: [['Effectif', '3', '7'], ['Fréquence', '0,3', '0,7']] }
const NI_UN_NI_L_AUTRE = { headers: ['Article', 'Prix'], rows: [['Cahier', '2']] }

function main() {
  console.log('\n── Extraction ──')
  check('les deux fonctions sont extraites de quiz.html',
    typeof detecterTypeGraphique === 'function' && typeof adapterEnonce === 'function')
  check('detecterTypeGraphique : barres', detecterTypeGraphique(BARRES) === 'barres')
  check('detecterTypeGraphique : fonction', detecterTypeGraphique(FONCTION) === 'fonction')

  console.log('\n── Mode graphique : les quatre formules remplacées ──')
  modeAffichage[0] = 'graphique'
  checkRendu('barres — le … ci-dessous',
    'Le tableau ci-dessous donne les notes de la classe.',
    'Le diagramme ci-dessous donne les notes de la classe.', BARRES)
  checkRendu('barres — du … ci-dessous',
    'À partir du tableau ci-dessous, calcule la moyenne.',
    'À partir du diagramme ci-dessous, calcule la moyenne.', BARRES)
  checkRendu('barres — le … suivant',
    'On donne le tableau suivant.',
    'On donne le diagramme suivant.', BARRES)
  checkRendu('barres — du … suivant',
    'Déduis du tableau suivant l’effectif total.',
    'Déduis du diagramme suivant l’effectif total.', BARRES)
  checkRendu('fonction — le … ci-dessous',
    'Le tableau ci-dessous représente la fonction f.',
    'Le graphique ci-dessous représente la fonction f.', FONCTION)
  checkRendu('fonction — du … suivant',
    'Lis du tableau suivant l’image de 2.',
    'Lis du graphique suivant l’image de 2.', FONCTION)

  console.log('\n── Casse et forme du texte ──')
  checkRendu('majuscule initiale conservée',
    'Le tableau ci-dessous.', 'Le diagramme ci-dessous.', BARRES)
  checkRendu('minuscule conservée',
    'on lit le tableau ci-dessous.', 'on lit le diagramme ci-dessous.', BARRES)
  checkRendu('déterminant en capitales',
    'DU TABLEAU CI-DESSOUS, déduis.', 'DU diagramme CI-DESSOUS, déduis.', BARRES)
  checkRendu('deux occurrences dans le même énoncé',
    'Le tableau ci-dessous et le tableau suivant.',
    'Le diagramme ci-dessous et le diagramme suivant.', BARRES)
  checkRendu('espaces multiples préservés',
    'Le  tableau   ci-dessous.', 'Le  diagramme   ci-dessous.', BARRES)
  checkRendu('tableau fourni en chaîne JSON',
    'Le tableau ci-dessous.', 'Le diagramme ci-dessous.', JSON.stringify(BARRES))
  checkRendu('énoncé vide', '', '', BARRES)

  console.log('\n── Ce qui ne doit JAMAIS être remplacé ──')
  // Proportionnalité et Conversions emploient « tableau » comme objet
  // mathématique, pas comme support d'affichage.
  checkRendu('« tableau » isolé',
    'Complète le tableau de proportionnalité.',
    'Complète le tableau de proportionnalité.', BARRES)
  checkRendu('« tableau de conversion »',
    'Utilise le tableau de conversion pour convertir 3 m en cm.',
    'Utilise le tableau de conversion pour convertir 3 m en cm.', BARRES)
  checkRendu('pluriel « les tableaux ci-dessous »',
    'Les tableaux ci-dessous sont proportionnels.',
    'Les tableaux ci-dessous sont proportionnels.', BARRES)
  checkRendu('déterminant hors liste (« ce tableau suivant »)',
    'Observe ce tableau suivant.', 'Observe ce tableau suivant.', BARRES)
  checkRendu('suffixe hors liste (« le tableau ci-contre »)',
    'Le tableau ci-contre donne les notes.',
    'Le tableau ci-contre donne les notes.', BARRES)
  checkRendu('« tableau » collé à un autre mot',
    'Le tableau-navette ci-dessous.', 'Le tableau-navette ci-dessous.', BARRES)

  console.log('\n── Cas où la question n’est pas éligible au graphique ──')
  checkRendu('tableau multi-lignes (non éligible)',
    'Le tableau ci-dessous donne les notes.',
    'Le tableau ci-dessous donne les notes.', MULTI)
  checkRendu('tableau ni barres ni fonction',
    'Le tableau ci-dessous donne les prix.',
    'Le tableau ci-dessous donne les prix.', NI_UN_NI_L_AUTRE)
  checkRendu('aucun tableau',
    'Le tableau ci-dessous.', 'Le tableau ci-dessous.', null)

  console.log('\n── Mode d’affichage ──')
  modeAffichage[0] = 'tableau'
  checkRendu('mode tableau : énoncé intact',
    'Le tableau ci-dessous donne les notes.',
    'Le tableau ci-dessous donne les notes.', BARRES)
  delete modeAffichage[0]
  checkRendu('mode absent : énoncé intact',
    'Le tableau ci-dessous donne les notes.',
    'Le tableau ci-dessous donne les notes.', BARRES)

  // Le mode est posé par question : une question en graphique ne doit pas
  // entraîner la substitution sur ses voisines restées en tableau.
  modeAffichage[1] = 'graphique'
  checkRendu('index 1 en graphique : substitution',
    'Le tableau ci-dessous.', 'Le diagramme ci-dessous.', BARRES, 1)
  checkRendu('index 0 resté en tableau : intact',
    'Le tableau ci-dessous.', 'Le tableau ci-dessous.', BARRES, 0)

  console.log(ko === 0 ? `\n✅ ${nbCas}/${nbCas} cas passés.\n` : `\n❌ ${ko} échec(s) sur ${nbCas} cas.\n`)
  process.exitCode = ko === 0 ? 0 : 1
}

main()
