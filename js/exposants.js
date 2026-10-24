// js/exposants.js — affichage des exposants Unicode (script classique, même
// modèle que js/niveaux.js et js/prenom.js).
//
// Pourquoi : ¹ ² ³ (U+00B9, U+00B2, U+00B3) et ⁰ ⁴-⁹ ⁻ ⁺ (U+2070-U+207B) viennent
// de deux blocs Unicode que beaucoup de polices dessinent différemment : sur PC,
// « 10¹⁰ » s'affiche avec deux hauteurs. Chaque suite continue d'exposants est
// donc remplacée, À L'AFFICHAGE, par <sup class="exp"> contenant les caractères
// normaux équivalents (¹⁰ → <sup class="exp">10</sup>, ⁻³ → <sup class="exp">−3</sup>,
// avec le moins U+2212).
//
// Les données en base ne sont JAMAIS modifiées, et cette fonction ne s'applique
// qu'à la chaîne qu'on est sur le point d'insérer avec innerHTML : jamais à
// q.q, q.opts ni q.explication en mémoire (ils alimentent questions_ratees et
// le score), jamais à un attribut HTML, un textContent, un champ de formulaire,
// un canvas (Chart.js), un PDF ou un email.
//
// Caractères couverts : ⁰¹²³⁴⁵⁶⁷⁸⁹ ⁻ ⁺ ⁽ ⁾ ⁿ ᵐ ᵃ ˣ. Les indices (₀-₉) ne sont pas
// touchés. Seuls ces caractères sont remplacés : balises, entités (&lt;, &amp;…)
// et tout autre texte passent tels quels, la fonction n'échappe rien. Sur un
// texte venant de la base et destiné à être échappé (prof.html, resultats.html),
// l'appeler APRÈS l'échappement. Idempotente : la sortie ne contient plus aucun
// caractère à convertir.
//
// Un SEUL nom global : window.Exposants (dans un navigateur). Sous Node, le même
// fichier s'importe par require() (test : lib/exposants.manual-test.js).
// Styles : css/exposants.css.
// Chargement : <script src="/js/exposants.js?v=1"></script> — incrémenter v à
// chaque modification pour contourner le cache.
(function () {
  'use strict'

  const CORRESPONDANCE = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁻': '−', '⁺': '+', '⁽': '(', '⁾': ')', 'ⁿ': 'n', 'ᵐ': 'm', 'ᵃ': 'a', 'ˣ': 'x'
  }
  const SUITE = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺⁽⁾ⁿᵐᵃˣ]+/g

  function formater(texte) {
    if (texte == null) return ''
    return String(texte).replace(SUITE, suite =>
      '<sup class="exp">' + Array.from(suite).map(c => CORRESPONDANCE[c]).join('') + '</sup>')
  }

  const API = { formater }
  if (typeof module !== 'undefined' && module.exports) module.exports = API
  else window.Exposants = API
})()
