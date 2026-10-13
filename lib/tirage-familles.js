// /lib/tirage-familles.js
//
// Tirage de n questions en diversifiant les « familles » (colonne
// questions_banque.famille : le type de question, ex. « CA-sin », « F3 »).
//
// Règle : on prend d'abord au plus une question par famille, dans un ordre
// aléatoire, jusqu'à n ; s'il manque des questions (moins de n familles
// disponibles), on complète au hasard avec le reste. Une question sans
// famille (null, vide) compte comme sa propre famille : le comportement est
// alors celui d'un tirage aléatoire simple, donc rien ne change tant que la
// colonne n'est pas remplie.
//
// Le résultat est mélangé : l'ordre des questions ne révèle pas la
// construction « une par famille puis complément ».

// Fisher-Yates : le tri par `sort(() => Math.random() - 0.5)` n'est pas uniforme.
function melanger(liste, alea = Math.random) {
  const a = [...liste]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function tirerParFamille(candidats, n = 5, alea = Math.random) {
  const m = melanger(candidats, alea)
  const familles = new Set()
  const choisis = []
  const reste = []
  for (const q of m) {
    const f = q.famille ? String(q.famille) : 'sans-famille:' + q.id
    if (choisis.length < n && !familles.has(f)) {
      familles.add(f)
      choisis.push(q)
    } else {
      reste.push(q)
    }
  }
  while (choisis.length < n && reste.length) choisis.push(reste.shift())
  return melanger(choisis, alea)
}

module.exports = { melanger, tirerParFamille }
