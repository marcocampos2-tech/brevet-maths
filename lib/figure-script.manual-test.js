// /lib/figure-script.manual-test.js
//
// Test manuel (`node lib/figure-script.manual-test.js`) après toute modification
// de js/figure-script.js, de css/figure-script.css ou de leurs points d'appel.
// Aucune dépendance, aucun réseau.
//
// 1. Validation : scripts valides, limites (10 blocs, 3 niveaux), blocs inconnus
//    ou incomplets, opérateurs hors énumération → figure vide + erreur lisible.
// 2. Rendu : structure (boucles, si/sinon imbriqués), symboles > < = dessinés
//    par le code, virgule décimale, moins U+2212, échappement du contenu.
// 3. Câblage : chaque page charge le script et la feuille, et sa fonction de
//    figure traite le type « script » AVANT les autres (un oubli ne se verrait
//    qu'en production, par une figure absente, sans aucune erreur).
const fs = require('fs')
const path = require('path')
const FS = require('../js/figure-script.js')

let echecs = 0
function verifie(nom, ok, detail) {
  if (!ok) { echecs++; console.log('ECHEC  ' + nom + (detail !== undefined ? '  → ' + detail : '')) }
  else console.log('ok     ' + nom)
}
const lire = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')
const script = blocs => ({ type: 'script', blocs })
const compte = (h, motif) => (h.match(motif) || []).length

console.log('\n[1] validation')
const tirelire = script([
  { type: 'mettre', variable: 'a', valeur: 0 },
  { type: 'repeter', fois: 4, blocs: [{ type: 'ajouter', variable: 'a', valeur: 5 }] },
  { type: 'dire', valeur: 'a' }
])
verifie('script simple valide', FS.valider(tirelire).ok, FS.erreurs(tirelire))
verifie('figure donnée en chaîne JSON', FS.valider(JSON.stringify(tirelire)).ok)
verifie('estScript', FS.estScript(tirelire) && FS.estScript(JSON.stringify(tirelire)) && !FS.estScript({ type: 'cercle' }) && !FS.estScript(null))
verifie('chaîne JSON invalide : figure vide', FS.html('{pas du json') === '' && !FS.valider('{pas du json').ok)
verifie('type autre que script refusé', !FS.valider({ type: 'cercle', rayon: 3 }).ok)
verifie('blocs absents', !FS.valider({ type: 'script' }).ok)
verifie('blocs vides', !FS.valider(script([])).ok)
verifie('bloc de type inconnu', /inconnu/.test(FS.erreurs(script([{ type: 'danser' }])).join()))
verifie('bloc sans type', !FS.valider(script([{ variable: 'a', valeur: 1 }])).ok)
verifie('mettre sans variable', !FS.valider(script([{ type: 'mettre', valeur: 1 }])).ok)
verifie('mettre sans valeur', !FS.valider(script([{ type: 'mettre', variable: 'a' }])).ok)
verifie('nom de variable invalide', !FS.valider(script([{ type: 'mettre', variable: '1a', valeur: 1 }])).ok && !FS.valider(script([{ type: 'mettre', variable: 'a b', valeur: 1 }])).ok)
verifie('valeur invalide (balise)', !FS.valider(script([{ type: 'dire', valeur: '<b>' }])).ok)
verifie('expression de 3 éléments valide', FS.valider(script([{ type: 'mettre', variable: 'a', valeur: 'b × 2' }])).ok)
verifie('expression de 5 éléments refusée', !FS.valider(script([{ type: 'mettre', variable: 'a', valeur: 'b × 2 + 1' }])).ok)
verifie('opérateur de calcul inconnu', !FS.valider(script([{ type: 'mettre', variable: 'a', valeur: 'b ^ 2' }])).ok)
const cond = (op) => ({ gauche: 'a', op, droite: 10 })
verifie('condition : trois opérateurs acceptés', ['plus_grand', 'plus_petit', 'egal'].every(op => FS.valider(script([{ type: 'jusqua', condition: cond(op), blocs: [{ type: 'ajouter', variable: 'a', valeur: 1 }] }])).ok))
verifie('condition : symbole écrit en base refusé', !FS.valider(script([{ type: 'jusqua', condition: cond('>'), blocs: [{ type: 'dire', valeur: 'a' }] }])).ok)
verifie('condition : opérateur inconnu refusé', !FS.valider(script([{ type: 'si', condition: cond('superieur'), alors: [{ type: 'dire', valeur: 'a' }] }])).ok)
verifie('si sans alors', !FS.valider(script([{ type: 'si', condition: cond('egal') }])).ok)
verifie('si avec sinon vide refusé', !FS.valider(script([{ type: 'si', condition: cond('egal'), alors: [{ type: 'dire', valeur: 1 }], sinon: [] }])).ok)
verifie('répéter sans blocs', !FS.valider(script([{ type: 'repeter', fois: 3 }])).ok)
verifie('tourner : sens inconnu', !FS.valider(script([{ type: 'tourner', sens: 'haut', angle: 90 }])).ok)
verifie('stylo : état inconnu', !FS.valider(script([{ type: 'stylo', etat: 'rouge' }])).ok)
const dire = { type: 'dire', valeur: 1 }
verifie('10 blocs : accepté', FS.valider(script(Array(10).fill(dire))).ok)
verifie('11 blocs : refusé', /plus de 10 blocs/.test(FS.erreurs(script(Array(11).fill(dire))).join()))
verifie('blocs imbriqués comptés (conteneur + enfants)', FS.valider(script([{ type: 'repeter', fois: 2, blocs: Array(9).fill(dire) }])).ok && !FS.valider(script([{ type: 'repeter', fois: 2, blocs: Array(10).fill(dire) }])).ok)
const niv = (n) => { let b = [dire]; for (let i = 0; i < n - 1; i++) b = [{ type: 'repeter', fois: 2, blocs: b }]; return script(b) }
verifie('3 niveaux : accepté', FS.valider(niv(3)).ok, FS.erreurs(niv(3)))
verifie('4 niveaux : refusé', /imbrication/.test(FS.erreurs(niv(4)).join()))
verifie('si/sinon dans un sinon (3 niveaux) accepté', FS.valider(script([{ type: 'si', condition: cond('plus_grand'), alors: [dire], sinon: [{ type: 'si', condition: cond('egal'), alors: [dire], sinon: [dire] }] }])).ok)

console.log('\n[2] rendu')
const h = FS.html(tirelire)
verifie('une racine .fs-script', compte(h, /class="fs-script"/g) === 1)
verifie('texte « mettre a à 0 »', /mettre <span class="fs-v">a<\/span> à <span class="fs-v">0<\/span>/.test(h))
verifie('texte « répéter 4 fois »', /répéter <span class="fs-v">4<\/span> fois/.test(h))
verifie('bloc imbriqué dans .fs-in', /<div class="fs-in"><div class="fs-b fs-var">ajouter/.test(h))
verifie('un conteneur : une en-tête et un pied', compte(h, /class="fs-foot"/g) === 1)
const sisinon = FS.html(script([{ type: 'si', condition: { gauche: 'a', op: 'plus_grand', droite: 5 }, alors: [{ type: 'dire', valeur: 'oui' }], sinon: [{ type: 'dire', valeur: 'non' }] }]))
verifie('si/sinon : en-tête, « sinon », un seul pied', /si <span class="fs-v">a<\/span> <span class="fs-op">&gt;<\/span> <span class="fs-v">5<\/span> alors/.test(sisinon) && compte(sisinon, /fs-mid">sinon</g) === 1 && compte(sisinon, /class="fs-foot"/g) === 1)
verifie('symbole > échappé en &gt; (jamais > brut dans le HTML)', !/>\s*>\s*</.test(sisinon) && sisinon.indexOf('&gt;') > -1)
verifie('symbole <', /<span class="fs-op">&lt;<\/span>/.test(FS.html(script([{ type: 'si', condition: cond('plus_petit'), alors: [dire] }]))))
verifie('symbole =', /<span class="fs-op">=<\/span>/.test(FS.html(script([{ type: 'jusqua', condition: cond('egal'), blocs: [dire] }]))))
verifie('répéter jusqu\'à', /répéter jusqu'à ce que/.test(FS.html(script([{ type: 'jusqua', condition: cond('plus_grand'), blocs: [{ type: 'ajouter', variable: 'a', valeur: 3 }] }]))))
const mvt = FS.html(script([
  { type: 'stylo', etat: 'baisse' }, { type: 'avancer', valeur: 50 }, { type: 'tourner', sens: 'gauche', angle: 90 },
  { type: 'tourner', sens: 'droite', angle: 120 }, { type: 'stylo', etat: 'leve' }, { type: 'aleatoire', variable: 'a', min: 1, max: 6 }
]))
verifie('mouvement : textes', /baisser le stylo/.test(mvt) && /avancer de/.test(mvt) && /tourner à gauche de <span class="fs-v">90<\/span>°/.test(mvt) && /tourner à droite de/.test(mvt) && /lever le stylo/.test(mvt))
verifie('aléatoire', /un nombre aléatoire entre <span class="fs-v">1<\/span> et <span class="fs-v">6<\/span>/.test(mvt))
const dec = FS.html(script([{ type: 'mettre', variable: 'a', valeur: 2.5 }, { type: 'mettre', variable: 'b', valeur: '3.5' }, { type: 'mettre', variable: 'c', valeur: -4 }, { type: 'mettre', variable: 'd', valeur: 'a - 1' }]))
verifie('virgule décimale', />2,5</.test(dec) && />3,5</.test(dec))
verifie('moins U+2212 (nombre et expression), jamais le tiret ASCII', />−4</.test(dec) && />a − 1</.test(dec) && !/>-/.test(dec) && dec.indexOf(' - ') === -1)
verifie('expression « a × b »', />a × b</.test(FS.html(script([{ type: 'mettre', variable: 'p', valeur: 'a * b' }]))))
verifie('script invalide : chaîne vide', FS.html(script([{ type: 'danser' }])) === '')
verifie('aucune balise ni attribut venant de la base', FS.html(script([{ type: 'mettre', variable: 'a', valeur: '"><img src=x onerror=alert(1)>' }])) === '')
verifie('texte de la base jamais interprété (nom de variable accentué)', />é</.test(FS.html(script([{ type: 'dire', valeur: 'é' }]))))
verifie('aucun caractère interdit hors entités (< > & bruts dans le texte)', (() => {
  const t = h.replace(/<[^>]*>/g, '')
  return !/[<>&]/.test(t)
})())

console.log('\n[3] câblage')
for (const p of ['quiz.html', 'prof.html', 'examen.html']) {
  const s = lire(p)
  verifie(p + ' charge /js/figure-script.js', /<script src="\/js\/figure-script\.js\?v=\d+"><\/script>/.test(s))
  verifie(p + ' charge /css/figure-script.css', /<link rel="stylesheet" href="\/css\/figure-script\.css\?v=\d+">/.test(s))
  const iScript = s.indexOf("f.type==='script'") > -1 ? s.indexOf("f.type==='script'") : s.indexOf("f.type === 'script'")
  const iPremier = Math.min(...['triangle_rect', 'pythagore_compose', 'courbe'].map(t => { const a = s.indexOf("f.type==='" + t + "'"); const b = s.indexOf("f.type === '" + t + "'"); return a > -1 ? a : b }))
  verifie(p + ' : branche « script » avant les autres types', iScript > -1 && iScript < iPremier, iScript + ' / ' + iPremier)
  verifie(p + ' appelle FigureScript.html', /FigureScript\.html\(f\)/.test(s))
}
const prof = lire('prof.html')
verifie('prof.html : script invalide expliqué au prof (erreurs échappées)', /FigureScript\.erreurs\(f\)/.test(prof) && /escHtml\(FigureScript\.erreurs/.test(prof))
// Le script doit être chargé AVANT toute utilisation : ordre dans la page.
for (const p of ['quiz.html', 'prof.html', 'examen.html']) {
  const s = lire(p)
  verifie(p + ' : script chargé avant son premier appel', s.indexOf('/js/figure-script.js') < s.indexOf('FigureScript.html'))
}
const css = lire('css/figure-script.css')
verifie('css : largeur max 340 px, texte à la ligne', /max-width: 340px/.test(css) && /overflow-wrap: break-word/.test(css))
verifie('js : pas de dépendance (aucun require hors export)', !/require\(['"]/.test(lire('js/figure-script.js')))

console.log(echecs ? '\n' + echecs + ' ÉCHEC(S)' : '\nTout est ok')
process.exit(echecs ? 1 : 0)
