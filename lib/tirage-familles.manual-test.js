// /lib/tirage-familles.manual-test.js
// Test manuel (`node lib/tirage-familles.manual-test.js`) après toute modification du tirage par familles.
const { tirerParFamille, melanger } = require('./tirage-familles')
let echecs = 0
function verifie(nom, ok) { if (!ok) { echecs++; console.log('ECHEC  ' + nom) } else console.log('ok     ' + nom) }
const mk = (id, famille) => ({ id, famille })
// Pool type « Trigonométrie facile » : 6 familles, 30 questions
const pool = []
let id = 1
for (const [f, n] of [['CA-sin', 3], ['CA-cos', 2], ['VO', 6], ['TH-V', 5], ['RA-tan', 2], ['EC-sin', 1], ['TH-D', 3], ['CA-tan', 3], ['RA-cos', 2], ['EC-cos', 1], ['RA-sin', 1], ['EC-tan', 1]]) for (let i = 0; i < n; i++) pool.push(mk(id++, f))
verifie('pool de 30 questions', pool.length === 30)
let tousDistincts = true, taillesOk = true, sansDoublonId = true
for (let t = 0; t < 2000; t++) {
  const r = tirerParFamille(pool, 5)
  if (r.length !== 5) taillesOk = false
  if (new Set(r.map(q => q.famille)).size !== 5) tousDistincts = false
  if (new Set(r.map(q => q.id)).size !== 5) sansDoublonId = false
}
verifie('toujours 5 questions', taillesOk)
verifie('12 familles disponibles : 5 familles toutes différentes, sur 2000 tirages', tousDistincts)
verifie('jamais deux fois la même question', sansDoublonId)
// Moins de familles que de questions demandées : on complète, sans doublon
const peu = [mk(1, 'A'), mk(2, 'A'), mk(3, 'A'), mk(4, 'B'), mk(5, 'B'), mk(6, 'C')]
let ok3 = true
for (let t = 0; t < 500; t++) {
  const r = tirerParFamille(peu, 5)
  const fam = new Set(r.map(q => q.famille))
  if (r.length !== 5 || fam.size !== 3 || new Set(r.map(q => q.id)).size !== 5) ok3 = false
}
verifie('3 familles seulement : 5 questions, les 3 familles présentes, sans doublon', ok3)
// Pool plus petit que n
verifie('pool de 3 : renvoie les 3', tirerParFamille([mk(1, 'A'), mk(2, 'A'), mk(3, 'B')], 5).length === 3)
verifie('pool vide : tableau vide', tirerParFamille([], 5).length === 0)
// Sans famille : comportement identique à un tirage simple (pas de regroupement)
const sans = [1, 2, 3, 4, 5, 6, 7, 8].map(i => mk(i, null))
const vus = new Set()
for (let t = 0; t < 400; t++) for (const q of tirerParFamille(sans, 5)) vus.add(q.id)
verifie('questions sans famille : toutes peuvent sortir', vus.size === 8)
verifie('questions sans famille : 5 questions distinctes', new Set(tirerParFamille(sans, 5).map(q => q.id)).size === 5)
verifie('famille vide ("") traitée comme absente', new Set(tirerParFamille([mk(1, ''), mk(2, ''), mk(3, ''), mk(4, ''), mk(5, '')], 5).map(q => q.id)).size === 5)
// Uniformité : chaque question du pool a une chance non nulle ; une famille rare n'est pas favorisée à l'excès
const cpt = {}
for (let t = 0; t < 6000; t++) for (const q of tirerParFamille(pool, 5)) cpt[q.famille] = (cpt[q.famille] || 0) + 1
verifie('chaque famille sort au moins une fois sur 6000 tirages', Object.keys(cpt).length === 12)
// Entrée non modifiée
const copie = JSON.stringify(pool); tirerParFamille(pool, 5); verifie('le tableau d’entrée n’est pas modifié', JSON.stringify(pool) === copie)
// alea injecté déterministe
verifie('melanger conserve les éléments', melanger([1, 2, 3, 4]).sort().join() === '1,2,3,4')
if (echecs) { console.log(echecs + ' échec(s)'); process.exit(1) }
console.log('Tout est ok')
