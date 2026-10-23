// js/prenom.js — affichage d'un prénom avec une majuscule (script classique,
// même modèle que js/niveaux.js).
//
// SEULE fonction de mise en forme des prénoms : emails (objets et corps), PDF du
// bilan, page parent, fiche prof. Elle ne sert qu'à l'AFFICHAGE : les données en
// base (prenom, prenom_affiche) ne sont jamais modifiées, ni recherchées avec
// cette forme.
//
// Règle : première lettre de chaque mot en majuscule, mots séparés par une
// espace, un tiret ou une apostrophe (« jean-pierre » → « Jean-Pierre »,
// « marie claire » → « Marie Claire », « d'artagnan » → « D'Artagnan »). Le
// reste du mot est laissé tel que saisi (« DIVINE » reste « DIVINE », « McKenzie »
// reste « McKenzie ») ; espaces au début, à la fin et en double nettoyés. Valeur
// vide ou absente : chaîne vide. Idempotente.
//
// Un SEUL nom global : window.Prenom (dans un navigateur). Sous Node, le même
// fichier s'importe par require() (api/*.js, lib/bilan-email.js).
(function () {
  'use strict'

  function formater(prenom) {
    if (prenom == null) return ''
    return String(prenom)
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\s\-'’]+/g, mot => {
        const lettres = Array.from(mot)
        return lettres[0].toLocaleUpperCase('fr') + lettres.slice(1).join('')
      })
  }

  // Export littéral (et non une variable) : api/cron-rappel.js l'importe en ESM
  // avec un import nommé, que Node ne détecte que pour ce motif exact.
  if (typeof module !== 'undefined' && module.exports) module.exports = { formater }
  else window.Prenom = { formater }
})()
