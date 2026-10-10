// js/catalogue.js — catalogue des sous-thèmes par thème (script classique).
//
// Source destinée à devenir UNIQUE pour la liste des sous-thèmes. Pour
// l'instant, seul resultats.html la charge ; quiz.html, prof.html et
// suivi-parent.html gardent leur propre copie (migration progressive, page
// par page) et api/generer.js garde sa propre liste côté serveur. Toute
// modification de la liste est donc à répercuter à la main dans ces copies
// tant que la migration n'est pas terminée.
//
// Les clés sont les valeurs exactes de `theme` stockées dans resultats /
// questions_banque (pas les libellés courts d'affichage, cf. THEMES).
// Le nom `SOUS_THEMES` est celui des copies locales : une page migrée
// supprime sa copie et utilise celle-ci (un doublon `const` ferait échouer
// le chargement bruyamment plutôt que de diverger en silence).
//
// Chargement : <script src="/js/catalogue.js?v=1"></script> — incrémenter v
// à chaque modification pour contourner le cache.
const SOUS_THEMES = {
  'Nombres et calculs': [
    'Nombres relatifs', 'Équations', 'Calcul littéral', 'Fractions', 'Puissances', 'Arithmétique'
  ],
  'Organisation et gestion de données, fonctions': [
    'Fonctions', 'Statistiques', 'Probabilités', 'Proportionnalité', 'Pourcentages'
  ],
  'Grandeurs et mesures': [
    'Aires et volumes', 'Conversions', 'Agrandissement'
  ],
  'Espace et géométrie': [
    'Théorème de Pythagore', 'Théorème de Thalès', 'Trigonométrie', 'Transformations', 'Triangles semblables'
  ],
  'Algorithmique et programmation': [
    'Algorithmique'
  ]
}
