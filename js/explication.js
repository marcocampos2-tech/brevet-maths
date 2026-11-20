// js/explication.js — mise en page des explications de questions (script
// classique, même modèle que js/exposants.js).
//
// Pourquoi : en base, les idées d'une explication sont séparées par un seul
// « \n » (norme de rédaction). Affichées telles quelles, les lignes se
// suivent sans espace et paraissent serrées. Décision du 20/11/2026 : l'espace
// se règle À L'AFFICHAGE, pour tous les sous-thèmes, sans toucher aux données.
//
// Explication.html(texte) renvoie une chaîne HTML :
//   <div class="expl-corps">
//     <div class="expl-ligne">idée 1</div> …
//     <div class="expl-ligne expl-attention">Attention : …</div>
//   </div>
// - Les lignes vides (« \n\n ») et les retours chariot sont ignorés : une ligne
//   vide en base ne double jamais l'espace.
// - Une ligne qui commence par « Attention » reçoit la classe expl-attention
//   (espace et trait pointillé au-dessus, css/explication.css).
// - Chaque ligne passe par Exposants.formater (js/exposants.js à charger avant).
// - Comme avant ce module, le texte n'est PAS échappé : il est inséré tel quel,
//   comme l'était q.explication.
//
// Un SEUL nom global : window.Explication (dans un navigateur). Sous Node, le
// même fichier s'importe par require() (test : lib/explication.manual-test.js).
// Styles : css/explication.css.
// Chargement : <script src="/js/explication.js?v=1"></script> après exposants.js.
(function () {
  'use strict'

  function formaterLigne(ligne) {
    const Exp = (typeof window !== 'undefined' && window.Exposants) ||
      (typeof require === 'function' ? require('./exposants.js') : null)
    return Exp ? Exp.formater(ligne) : ligne
  }

  function html(texte) {
    if (texte == null) return ''
    const lignes = String(texte).replace(/\r/g, '').split('\n')
      .map(l => l.trim())
      .filter(l => l !== '')
    if (lignes.length === 0) return ''
    return '<div class="expl-corps">' + lignes.map(l =>
      '<div class="expl-ligne' + (/^Attention\b/.test(l) ? ' expl-attention' : '') + '">' +
      formaterLigne(l) + '</div>').join('') + '</div>'
  }

  const API = { html }
  if (typeof module !== 'undefined' && module.exports) module.exports = API
  else window.Explication = API
})()
