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
  check('plus de blocs Acquis / En progression', !/niv-bloc-acquis|niv-bloc-prog|En progression/.test(h) && !/niveau (Facile|Moyen|Difficile) validé/.test(t))
  check('plus de <details> ni de « Voir le détail par niveau »', !/<details|<summary|Voir le détail par niveau/.test(h))
  check('grille toujours visible : 4 lignes × 3 cases, en-tête Sous-thème / Facile / Moyen / Difficile', (h.match(/<tr><td class="niv-nom">/g) || []).length === 4 && /<th class="niv-col-nom" scope="col">Sous-thème<\/th><th scope="col">Facile<\/th><th scope="col">Moyen<\/th><th scope="col">Difficile<\/th>/.test(h))
  const ordre = ['niv-titre', 'niv-bloc-surv', 'niv-wrap', 'niv-legende-cases', 'class="niv-legende"'].map(m => h.indexOf(m))
  check('ordre : en-tête, À surveiller, grille, légende en carrés, phrase de règle', ordre.every((v, i) => v >= 0 && (i === 0 || v > ordre[i - 1])), JSON.stringify(ordre))
  check('légende : 4 carrés (Acquis, En cours, À surveiller, Pas encore ouvert)', ['acquis', 'encours', 'surv', 'verrou'].every(c => h.includes(`niv-carre niv-carre-${c}`)) && ['Acquis', 'En cours', 'À surveiller', 'Pas encore ouvert'].every(m => t.includes(m)))
  check('phrase de règle exacte (texte validé)', t.includes('« 4 / 5 réussites » = 4 réussites obtenues sur les 5 nécessaires pour valider le niveau. Une réussite = au moins 4 bonnes réponses sur 5. Un niveau validé ouvre le niveau suivant.') && N.PHRASE_REGLE === '« 4 / 5 réussites » = 4 réussites obtenues sur les 5 nécessaires pour valider le niveau. Une réussite = au moins 4 bonnes réponses sur 5. Un niveau validé ouvre le niveau suivant.')
  check('Difficile non acquis = case « en cours » (dorée), jamais orange, y compris à 0 réussite sur 4', /niv-cell niv-c-encours"><div class="niv-l1">0 \/ 5 réussites<\/div><div class="niv-l2">en 4 essais<\/div>/.test(h) && (h.match(/niv-c-surv/g) || []).length === 2)
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

console.log('\n── 7. Format des cases ouvertes non acquises (option A, validée) ──')
{
  const css = fs.readFileSync(path.join(RACINE, 'css/niveaux.css'), 'utf8')
  const cas = (reussites, essais, o = {}) => L('X', { f_reussites: reussites, f_essais: essais, ...o })
  const c = (l, niv = 'facile') => N.cellule(l, niv)
  const h = l => N.celluleNiveau(l, 'facile')
  const verrouTest = () => L('X', { f_etat: 'acquis', m_etat: 'verrouille', d_etat: 'verrouille' })

  // Contenu : ligne 1 « N / 5 réussites » (toujours au pluriel), ligne 2 « en M essais ».
  check('ligne 1 : « 1 / 5 réussites » reste au pluriel (5 réussites nécessaires)', c(cas(1, 3)).texte === '1 / 5 réussites')
  check('ligne 1 : « 0 / 5 réussites » et « 4 / 5 réussites »', c(cas(0, 2)).texte === '0 / 5 réussites' && c(cas(4, 6)).texte === '4 / 5 réussites')
  check('ligne 2 : « en 1 essai » au singulier', c(cas(1, 1)).detail === 'en 1 essai' && c(cas(0, 1)).detail === 'en 1 essai')
  check('ligne 2 : « en 2 essais », « en 7 essais » au pluriel', c(cas(1, 2)).detail === 'en 2 essais' && c(cas(3, 7)).detail === 'en 7 essais')
  check('M = sessions à CE niveau (m_essais en Moyen, d_essais en Difficile), pas le total du sous-thème',
    N.cellule(L('X', { f_etat: 'acquis', f_essais: 9, m_etat: 'en_cours', m_reussites: 2, m_essais: 4, sessions_total: 13 }), 'moyen').detail === 'en 4 essais' &&
    N.cellule(L('X', { f_etat: 'acquis', m_etat: 'acquis', d_etat: 'en_cours', d_reussites: 1, d_essais: 3, f_essais: 6, m_essais: 6 }), 'difficile').detail === 'en 3 essais')
  check('HTML : ligne 1 (niv-l1), ligne 2 (niv-l2), barre', /^<div class="niv-cell niv-c-encours"><div class="niv-l1">1 \/ 5 réussites<\/div><div class="niv-l2">en 3 essais<\/div><div class="niv-barre"><span style="width:20%"><\/span><\/div><\/div>$/.test(h(cas(1, 3))), h(cas(1, 3)))

  // 0 essai impossible sur une case ouverte non acquise (la vue garantit essais >= 1 quand l'état est en_cours).
  let faux = 0, nbCas = 0
  for (let r = 0; r <= 5; r++) for (let e = 0; e <= 9; e++) {
    const l = cas(r, e, { f_etat: e === 0 ? 'jamais_joue' : (r >= 5 ? 'acquis' : 'en_cours') })
    const d = c(l); nbCas++
    if (/en 0 essai/.test(h(l)) || /en 0 essai/.test(d.detail)) faux++
    if (d.type === 'encours' && !/^en [1-9]\d* essais?$/.test(d.detail)) faux++
  }
  check(`jamais « en 0 essai » (${nbCas} combinaisons réussites × essais), toute case en cours porte « en M essai(s) », M ≥ 1`, faux === 0, String(faux))
  check('défense : une case « en_cours » incohérente à 0 essai affiche « aucun essai » (jamais « en 0 essai »)', c(cas(0, 0, { f_etat: 'en_cours' })).detail === 'aucun essai' && !/en 0 essai/.test(h(cas(0, 0, { f_etat: 'en_cours' }))))

  // Niveau ouvert jamais joué : style « en cours » (beige), PAS le gris de « Pas encore ouvert ».
  const jamais = cas(0, 0, { f_etat: 'jamais_joue' })
  check('niveau ouvert jamais joué : ligne 1 « 0 / 5 réussites », ligne 2 « aucun essai »', c(jamais).type === 'jamais' && c(jamais).texte === '0 / 5 réussites' && c(jamais).detail === 'aucun essai')
  check('… rendu HTML = style « en cours » (niv-c-encours) avec barre vide (width:0%), jamais niv-c-verrou',
    h(jamais) === '<div class="niv-cell niv-c-encours"><div class="niv-l1">0 / 5 réussites</div><div class="niv-l2">aucun essai</div><div class="niv-barre"><span style="width:0%"></span></div></div>', h(jamais))
  check('… beige #FBF4E4 / #8a6416 (css .niv-c-encours), le gris est réservé à .niv-c-verrou (plus de .niv-c-jamais)',
    /\.niv-c-encours \{ background: var\(--niv-dore-light\); color: #8a6416; \}/.test(css) && /--niv-dore-light: #FBF4E4/.test(css) && /\.niv-c-verrou \{ background: var\(--niv-creme\)/.test(css) && !/niv-c-jamais/.test(css) && !/niv-c-jamais/.test(h(jamais)))
  check('… piste visible : fond de .niv-barre gris translucide, remplissage 0 %', /\.niv-barre \{ height: 4px; background: rgba\(0,0,0,\.08\)/.test(css))
  check('« Pas encore ouvert » (verrouillé) reste distinct du niveau ouvert jamais joué', N.celluleNiveau(verrouTest(), 'moyen') !== h(jamais) && /niv-c-verrou/.test(N.celluleNiveau(verrouTest(), 'moyen')) && !/niv-c-verrou/.test(h(jamais)))
  check('matrice : à 0 essai la ligne 2 est toujours « aucun essai », à M ≥ 1 « en M essai(s) »', [0, 1, 2, 9].every(e => c(cas(0, e, { f_etat: e === 0 ? 'jamais_joue' : 'en_cours' })).detail === (e === 0 ? 'aucun essai' : `en ${e} essai${e > 1 ? 's' : ''}`)))

  // Barre : largeur N/5, 4 px, couleurs #D4A23C (en cours) / #E8892B (à surveiller).
  check('barre à 0 % : width:0%', /<span style="width:0%"><\/span>/.test(h(cas(0, 2))))
  check('barre à 80 % : width:80% (4 réussites)', /<span style="width:80%"><\/span>/.test(h(cas(4, 6))))
  check('barre : 20 % par réussite (1 → 20 %, 2 → 40 %, 3 → 60 %)', [1, 2, 3].every(n => h(cas(n, 5)).includes(`width:${n * 20}%`)))
  check('barre : hauteur 4 px', /\.niv-barre \{ height: 4px;/.test(css))
  check('barre : #D4A23C en cours, #E8892B à surveiller', /--niv-dore: #D4A23C/.test(css) && /\.niv-barre > span \{ display: block; height: 100%; background: var\(--niv-dore\)/.test(css) && /--niv-orange: #E8892B/.test(css) && /\.niv-c-surv \.niv-barre > span \{ background: var\(--niv-orange\)/.test(css))
  check('ligne 1 en gras ; ligne 2 plus petite, opacité 0,85', /\.niv-l1 \{ font-weight: 700; \}/.test(css) && /\.niv-l2 \{ font-size: 10px; opacity: \.85;/.test(css))

  // Cas à surveiller : même contenu, fond orange.
  const surv = cas(1, 5, { a_surveiller: true, derniers_essais: 4, dernieres_reussites: 0 })
  check('à surveiller : même contenu (« 1 / 5 réussites », « en 5 essais »), classe orange', c(surv).type === 'surv' && c(surv).texte === '1 / 5 réussites' && c(surv).detail === 'en 5 essais' && /niv-c-surv"><div class="niv-l1">1 \/ 5 réussites<\/div><div class="niv-l2">en 5 essais/.test(h(surv)))
  check('à surveiller : fond #FFF1E3 et bordure #E8892B inchangés', /\.niv-c-surv \{ background: #FFF1E3;[^}]*border: 1px solid var\(--niv-orange\)/.test(css))

  // Cases inchangées.
  const acq = cas(5, 6, { f_etat: 'acquis' })
  check('acquis : « ✓ Acquis », aucun nombre d\'essais ni barre', h(acq) === '<div class="niv-cell niv-c-acquis">✓ Acquis</div>' && c(acq).detail === '')
  const verrou = L('X', { f_etat: 'acquis', m_etat: 'verrouille', d_etat: 'verrouille' })
  check('verrouillé : « Après le Facile » (Moyen) et « Après le Moyen » (Difficile), aucun essai', N.celluleNiveau(verrou, 'moyen') === '<div class="niv-cell niv-c-verrou">Après le Facile</div>' && N.celluleNiveau(verrou, 'difficile') === '<div class="niv-cell niv-c-verrou">Après le Moyen</div>')
  check('aucune formulation liant Moyen au Brevet (cases, carte, légende)', !/brevet/i.test(texte(N.rendreCarteNiveaux(LIGNES)) + N.PHRASE_REGLE))
}

console.log('\n── 8. Noms de sous-thèmes : jamais de coupure sans tiret ──')
{
  const css = fs.readFileSync(path.join(RACINE, 'css/niveaux.css'), 'utf8')
  const g = N.rendreCarteNiveaux([L('Proportionnalité'), L('Théorème de Pythagore'), L('Transformations')])
  check('grille de la page : « Proportionnalité » et « Transformations » portent des césures (traits d\'union conditionnels)', g.includes('<td class="niv-nom">Pro&shy;por&shy;tion&shy;na&shy;lité</td>') && /<td class="niv-nom">Trans&shy;for&shy;ma&shy;tions<\/td>/.test(g), g.slice(g.indexOf('<tbody>'), g.indexOf('<tbody>') + 300))
  {
    // Les &shy; n'existent que dans les cellules de nom de la grille HTML.
    const carte = N.rendreCarteNiveaux([L('Proportionnalité', { a_surveiller: true, derniers_essais: 4, dernieres_reussites: 0 }), L('Transformations')])
    const hors = carte.replace(/<td class="niv-nom">.*?<\/td>/g, '')
    check('page : &shy; uniquement dans les cellules <td class="niv-nom"> (jamais dans l\'encart « À surveiller », la légende ni une autre cellule)', /&shy;/.test(carte) && !/&shy;|\u00AD/.test(hors), hors.slice(0, 200))
    check('phrase « à surveiller » : jamais de césure, même si le nom en contient une', N.phraseSurveiller(L('Proportion\u00ADnalité', { a_surveiller: true, dernieres_reussites: 1 })) === 'Proportionnalité : 1 réussite sur ses 4 derniers essais au niveau Facile.' && !/&shy;|\u00AD/.test(N.phraseSurveiller(L('Proportionnalité', { dernieres_reussites: 0 }))))
    check('sansCesures retire U+00AD ; avecCesures ne double pas une césure déjà présente', N.sansCesures('a\u00ADb\u00ADc') === 'abc' && N.avecCesures('Proportion\u00ADnalité') === N.avecCesures('Proportionnalité'))
  }
  check('« Théorème de Pythagore » : aucune césure (le retour à la ligne se fait à l\'espace)', g.includes('<td class="niv-nom">Théorème de Pythagore</td>'))
  check('même fonction côté serveur (email) et navigateur (page)', Nserveur.avecCesures('Proportionnalité') === N.avecCesures('Proportionnalité') && N.avecCesures('Trigonométrie') === 'Tri&shy;go&shy;no&shy;mé&shy;trie')
  {
    // Coupures exactes des 10 noms coupés (pas de coupure devant une syllabe finale muette)
    const attendu = {
      'Arithmétique': 'Arith-mé-tique', 'Statistiques': 'Sta-tis-tiques', 'Pourcentages': 'Pour-cen-tages',
      'Algorithmique': 'Algo-rith-mique', 'Probabilités': 'Pro-ba-bi-li-tés', 'Proportionnalité': 'Pro-por-tion-na-lité',
      'Conversions': 'Con-ver-sions', 'Agrandissement': 'Agran-dis-se-ment', 'Trigonométrie': 'Tri-go-no-mé-trie',
      'Transformations': 'Trans-for-ma-tions'
    }
    for (const [nom, coupe] of Object.entries(attendu)) {
      const r = N.avecCesures(nom).replace(/&shy;/g, '-')
      check('coupures exactes : ' + nom + ' → ' + coupe, r === coupe, r)
    }
  }
  check('CSS : colonne du nom inchangée (31 %, 12,5 px), césures manuelles (plus de hyphens:auto, dépendant d\'un dictionnaire)', /th\.niv-col-nom \{ width: 31%;/.test(css) && /td\.niv-nom \{[^}]*font-size: 12\.5px;[^}]*hyphens: manual;/.test(css) && !/td\.niv-nom \{[^}]*hyphens: auto/.test(css))
}

console.log('\n── 9. PDF (js/bilan-pdf.js, partagé par suivi-parent.html et prof.html) : libellés, légende à pastilles, jeu de caractères ──')
{
  // Le dessin du PDF est exécuté contre un faux « doc » jsPDF qui enregistre ses appels.
  const src = fs.readFileSync(path.join(RACINE, 'js', 'bilan-pdf.js'), 'utf8')
  const code = src.slice(src.indexOf('// Polices jsPDF standard'), src.indexOf('// Génère et enregistre le PDF.'))
  const appels = []
  const rec = nom => (...a) => { appels.push([nom, ...a]); return doc }
  const doc = {
    setFont: rec('setFont'), setFontSize: rec('setFontSize'), setTextColor: rec('setTextColor'), setFillColor: rec('setFillColor'),
    setDrawColor: rec('setDrawColor'), setLineWidth: rec('setLineWidth'), line: rec('line'), roundedRect: rec('roundedRect'),
    text: rec('text'), addPage: rec('addPage'),
    splitTextToSize: t => [String(t)], getTextWidth: t => String(t).length * 4,
    internal: { pageSize: { getWidth: () => 842, getHeight: () => 595 } }
  }
  const ctx = vm.createContext({ Niveaux: N, doc, console })
  vm.runInContext(code + '\nthis.pdfSectionNiveaux = pdfSectionNiveaux; this.PDF_COUL = PDF_COUL', ctx)
  const lignes = [
    // Nom contenant un trait d'union conditionnel (donnée sale) : ne doit JAMAIS atteindre jsPDF.
    L('Proportion\u00ADnalité', { f_reussites: 2, f_essais: 3, a_surveiller: true, derniers_essais: 4, dernieres_reussites: 1, derniere_session: '2026-10-19 18:00:00' }),
    L('Statistiques', { f_reussites: 1, f_essais: 5, a_surveiller: true, derniers_essais: 4, dernieres_reussites: 0, derniere_session: '2026-10-18 18:00:00' }),
    L('Fractions', { f_reussites: 5, f_essais: 6, f_etat: 'acquis', m_reussites: 0, m_essais: 0, m_etat: 'jamais_joue', niveau_courant: 'moyen', derniere_session: '2026-10-17 18:00:00' }),
    L('Aires et volumes', { f_reussites: 1, f_essais: 1, derniere_session: '2026-10-16 18:00:00' })
  ]
  ctx.pdfSectionNiveaux(doc, 80, lignes)
  const textes = appels.filter(a => a[0] === 'text').flatMap(a => (Array.isArray(a[1]) ? a[1] : [a[1]]))
  const COUL = ctx.PDF_COUL

  check('niveaux fermés : « Après le Facile » et « Après le Moyen » (comme la page et l\'email), plus de « après Facile »', textes.includes('Après le Facile') && textes.includes('Après le Moyen') && !textes.some(t => /^après (Facile|Moyen)$/.test(t)))
  check('aucun texte envoyé à jsPDF (noms, phrase « à surveiller », cases, légende) ne contient U+00AD (soft hyphen : dans WinAnsi, donc invisible au test de jeu de caractères, mais jsPDF l\'imprimerait en tiret visible)', textes.every(t => !/\u00AD/.test(t)) && textes.includes('Proportionnalité') && textes.some(t => /^Proportionnalité : 1 réussite sur ses 4 derniers essais au niveau Facile\.$/.test(t)), JSON.stringify(textes.filter(t => /\u00AD/.test(t))))
  check('« Acquis » sans coche (limite de police : Helvetica standard = WinAnsi, sans U+2713)', textes.includes('Acquis') && !textes.some(t => /✓/.test(t)))
  check('niveau ouvert jamais joué : « 0 / 5 réussites » + « aucun essai » dans le PDF', textes.includes('0 / 5 réussites') && textes.includes('aucun essai'))
  const WINANSI = /^[ -~ -ÿŒœŠšŸŽžƒˆ˜–—‘-‚“-„†-•…‰‹›€™]*$/
  check('aucun texte du PDF ne sort du jeu WinAnsi (un tel caractère s\'imprime en glyphe parasite : apostrophe, point…)', textes.every(t => WINANSI.test(t)), JSON.stringify(textes.filter(t => !WINANSI.test(t))))
  // Légende : une pastille (carré arrondi 8 pt) AVANT chaque libellé, couleurs = celles des cases.
  const LEG = [['Acquis', COUL.acquis], ['En cours', COUL.progression], ['À surveiller', COUL.surveiller], ['Pas encore ouvert', COUL.neutre]]
  const ok = LEG.every(([libelle, coul]) => {
    const i = appels.map(a => a[0] === 'text' && a[1] === libelle).lastIndexOf(true) // la légende est dessinée en dernier
    const avant = appels.slice(0, i)
    const rect = avant.slice().reverse().find(a => a[0] === 'roundedRect')
    const fill = avant.slice().reverse().find(a => a[0] === 'setFillColor')
    const draw = avant.slice().reverse().find(a => a[0] === 'setDrawColor')
    return i > 0 && rect && rect[3] === 8 && rect[4] === 8 && JSON.stringify(fill.slice(1)) === JSON.stringify(coul.fond) && JSON.stringify(draw.slice(1)) === JSON.stringify(coul.bord)
  })
  check('légende : pastille de 8 pt devant Acquis, En cours, À surveiller, Pas encore ouvert, aux couleurs exactes des cases', ok)
  check('légende : phrase de règle exacte sous les pastilles', textes.includes(N.PHRASE_REGLE))
  check('PDF : plus d\'ancienne légende « N/5 = … »', !textes.some(t => /N\/5 =/.test(t)))
}

console.log(`\n${nbOk} OK, ${nbKo} KO`)
process.exit(nbKo ? 1 : 0)
