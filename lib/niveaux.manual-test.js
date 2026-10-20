// /lib/niveaux.manual-test.js
//
// Test manuel (pas de CI) : `node lib/niveaux.manual-test.js`.
// Couvre js/niveaux.js tel que la page parent, la fiche prof, le PDF et l'email
// le chargent : exécuté dans un FAUX NAVIGATEUR (vm, window), puis comparé à
// l'import par require() utilisé côté serveur. Aucune dépendance, aucun réseau.
// La règle « à surveiller » elle-même est dans db/vue-niveaux.sql (tests :
// db/vue-niveaux.test.sql) : ici on ne vérifie que ce que le code en fait.

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const RACINE = path.join(__dirname, '..')
let nbOk = 0, nbKo = 0
function check(libelle, ok, detail) {
  if (ok) { nbOk++; console.log(`  ✅ ${libelle}`) }
  else { nbKo++; console.log(`  ❌ ${libelle}${detail ? ' — ' + detail : ''}`) }
}

function navigateur() {
  const ctx = vm.createContext({ window: {} })
  vm.runInContext(fs.readFileSync(path.join(RACINE, 'js/catalogue.js'), 'utf8'), ctx)
  vm.runInContext(fs.readFileSync(path.join(RACINE, 'js/niveaux.js'), 'utf8'), ctx)
  const catalogue = vm.runInContext('SOUS_THEMES', ctx)
  return { N: ctx.window.Niveaux, catalogue, total: Object.keys(catalogue).reduce((s, t) => s + catalogue[t].length, 0) }
}
const { N, catalogue, total } = navigateur()
// totalCatalogue() lit le global SOUS_THEMES (js/catalogue.js) : le serveur ne
// rend pas la carte, mais le test compare les deux rendus.
global.SOUS_THEMES = catalogue
const Nserveur = require('../js/niveaux.js')

const L = (sous_theme, o = {}) => ({
  theme: 'Nombres et calculs', sous_theme,
  f_reussites: 0, f_essais: 1, m_reussites: 0, m_essais: 0, d_reussites: 0, d_essais: 0,
  f_etat: 'en_cours', m_etat: 'verrouille', d_etat: 'verrouille', niveau_courant: 'facile',
  a_surveiller: false, derniere_session: '2026-10-18 10:00:00', derniers_essais: 1, dernieres_reussites: 0, ...o
})
const SURV_FACILE = L('Statistiques', { f_reussites: 1, f_essais: 5, a_surveiller: true, derniers_essais: 4, dernieres_reussites: 0, derniere_session: '2026-10-18 18:00:00' })
const SURV_MOYEN = L('Fractions', { f_reussites: 5, f_essais: 6, m_reussites: 2, m_essais: 6, f_etat: 'acquis', m_etat: 'en_cours', niveau_courant: 'moyen', a_surveiller: true, derniers_essais: 4, dernieres_reussites: 1, derniere_session: '2026-10-17 18:00:00' })
const NORMAL = L('Équations', { f_reussites: 3, f_essais: 4, derniers_essais: 4, dernieres_reussites: 3, derniere_session: '2026-10-16 18:00:00' })
const DIFFICILE = L('Calcul littéral', { f_reussites: 5, f_essais: 5, m_reussites: 5, m_essais: 5, d_reussites: 0, d_essais: 4, f_etat: 'acquis', m_etat: 'acquis', d_etat: 'en_cours', niveau_courant: 'difficile', a_surveiller: false, derniers_essais: 4, dernieres_reussites: 0, derniere_session: '2026-10-15 18:00:00' })
const LIGNES = [NORMAL, SURV_MOYEN, DIFFICILE, SURV_FACILE]

const texte = h => h.replace(/<[^>]+>/g, '\n').split('\n').map(x => x.trim()).filter(Boolean).join('\n')

console.log('\n── 1. Phrase « à surveiller » ──')
check('0 réussite : « Statistiques : 0 réussite sur ses 4 derniers essais au niveau Facile. »', N.phraseSurveiller(SURV_FACILE) === 'Statistiques : 0 réussite sur ses 4 derniers essais au niveau Facile.', N.phraseSurveiller(SURV_FACILE))
check('1 réussite, niveau Moyen : « Fractions : 1 réussite sur ses 4 derniers essais au niveau Moyen. »', N.phraseSurveiller(SURV_MOYEN) === 'Fractions : 1 réussite sur ses 4 derniers essais au niveau Moyen.')
const cl = N.classerNiveaux(LIGNES)
check('classerNiveaux : seul « surveiller » est renvoyé, par récence décroissante', Object.keys(cl).join() === 'surveiller' && JSON.stringify(cl.surveiller) === JSON.stringify([N.phraseSurveiller(SURV_FACILE), N.phraseSurveiller(SURV_MOYEN)]), JSON.stringify(cl))
check('un sous-thème non signalé n\'a aucune phrase, y compris en Difficile (la vue ne le signale jamais)', !cl.surveiller.some(p => /Équations|Calcul littéral/.test(p)))
check('a_surveiller sans niveau_courant valide : ignoré (pas de « undefined »)', N.classerNiveaux([{ ...SURV_FACILE, niveau_courant: 'x' }]).surveiller.length === 0)

console.log('\n── 2. Lecture de la vue ──')
check('SELECT_NIVEAUX demande derniers_essais et dernieres_reussites (et a_surveiller)', /a_surveiller/.test(N.SELECT_NIVEAUX) && /derniers_essais/.test(N.SELECT_NIVEAUX) && /dernieres_reussites/.test(N.SELECT_NIVEAUX))
check('SELECT_NIVEAUX : aucune colonne en double', new Set(N.SELECT_NIVEAUX.split(',').map(x => x.trim())).size === N.SELECT_NIVEAUX.split(',').length)

console.log('\n── 3. Carte (cta par défaut) ──')
{
  const h = N.rendreCarteNiveaux(LIGNES)
  const t = texte(h)
  check('en-tête inchangé : « 4 commencés sur N »', t.includes(`4 commencés sur ${total}`) && /Niveau atteint par sous-thème/.test(t))
  check('bloc « À surveiller » présent, 2 phrases, bordure orange', (h.match(/niv-bloc-surv/g) || []).length === 1 && (h.match(/<li>/g) || []).length === 2)
  check('phrase d\'aide + lien « Découvrir les cours particuliers » (cours-particuliers.html)', /Une aide ponctuelle peut l'aider à débloquer\./.test(t) && h.includes('href="cours-particuliers.html"'))
  check('plus de blocs Acquis / En progression', !/niv-bloc-acquis|niv-bloc-prog|En progression/.test(h) && !/validé/.test(t))
  check('plus de <details> ni de « Voir le détail par niveau »', !/<details|<summary|Voir le détail par niveau/.test(h))
  check('grille toujours visible : 4 lignes × 3 cases, en-tête Sous-thème / Facile / Moyen / Difficile', (h.match(/<tr><td class="niv-nom">/g) || []).length === 4 && /<th class="niv-col-nom" scope="col">Sous-thème<\/th><th scope="col">Facile<\/th><th scope="col">Moyen<\/th><th scope="col">Difficile<\/th>/.test(h))
  const ordre = ['niv-titre', 'niv-bloc-surv', 'niv-wrap', 'niv-legende-cases', 'class="niv-legende"'].map(m => h.indexOf(m))
  check('ordre : en-tête, À surveiller, grille, légende en carrés, phrase de règle', ordre.every((v, i) => v >= 0 && (i === 0 || v > ordre[i - 1])), JSON.stringify(ordre))
  check('légende : 4 carrés (Acquis, En cours, À surveiller, Pas encore ouvert)', ['acquis', 'encours', 'surv', 'verrou'].every(c => h.includes(`niv-carre niv-carre-${c}`)) && ['Acquis', 'En cours', 'À surveiller', 'Pas encore ouvert'].every(m => t.includes(m)))
  check('phrase de règle exacte', t.includes('Une réussite = au moins 4 bonnes réponses sur 5. Un niveau est acquis après 5 réussites, ce qui ouvre le niveau suivant.'))
  check('Difficile non acquis = case « en cours » (dorée), jamais orange, y compris à 0 réussite sur 4', /niv-cell niv-c-encours">0 réussite sur 5/.test(h) && (h.match(/niv-c-surv/g) || []).length === 2)
  check('aucun texte ne lie le niveau Moyen au Brevet ni ne le présente comme suffisant', !/brevet|suffisant|suffit/i.test(t))
}

console.log('\n── 4. cta: false (fiche prof), rien à surveiller, option abandonnée ──')
{
  const h = N.rendreCarteNiveaux(LIGNES, { cta: false })
  check('cta:false : le bloc reste, sans phrase d\'aide ni lien', /niv-bloc-surv/.test(h) && !/Une aide ponctuelle|cours-particuliers/.test(h))
  const sans = N.rendreCarteNiveaux([NORMAL, DIFFICILE])
  check('rien à surveiller : aucun bloc, aucune aide (même avec cta), la grille et la légende restent', !/niv-bloc|Une aide ponctuelle|cours-particuliers/.test(sans) && /niv-wrap/.test(sans) && /niv-legende-cases/.test(sans))
  const ancien = N.rendreCarteNiveaux(LIGNES, { cta: false, deplie: true })
  check('l\'ancienne option deplie est sans effet (pas de details, pas d\'erreur)', !/<details|open/.test(ancien) && ancien === h)
}

console.log('\n── 5. Échappement HTML ──')
{
  const piege = L('<img src=x onerror=alert(1)>', { a_surveiller: true, derniers_essais: 4, dernieres_reussites: 0 })
  const h = N.rendreCarteNiveaux([piege])
  check('sous-thème échappé dans la phrase ET dans la grille', !/<img/.test(h) && (h.match(/&lt;img/g) || []).length === 2)
}

console.log('\n── 6. Même code côté serveur (require) et navigateur ──')
check('mêmes exports', JSON.stringify(Object.keys(Nserveur)) === JSON.stringify(Object.keys(N)))
check('même HTML de carte', Nserveur.rendreCarteNiveaux(LIGNES) === N.rendreCarteNiveaux(LIGNES))
check('même classement', JSON.stringify(Nserveur.classerNiveaux(LIGNES)) === JSON.stringify(N.classerNiveaux(LIGNES)))

console.log(`\n${nbOk} OK, ${nbKo} KO`)
process.exit(nbKo ? 1 : 0)
