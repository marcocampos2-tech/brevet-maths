// js/niveaux.js — logique et rendu du bloc « Niveau atteint par sous-thème »
// (script classique, même modèle que js/catalogue.js).
//
// Source de la règle : la vue public.niveaux_sous_theme (db/vue-niveaux.sql).
// Ce fichier ne calcule aucun niveau : il classe et met en forme les lignes
// de la vue.
//
// Un SEUL nom global : window.Niveaux (dans un navigateur). Sous Node, le même
// fichier s'importe par require() : lib/bilan-email.js s'en sert pour que le
// bilan envoyé par email classe les sous-thèmes EXACTEMENT comme la page
// parent (une seule source, aucune copie de la règle). Seul l'export final
// change entre les deux contextes. Tout le reste est interne à la
// fermeture, pour éviter toute collision avec les pages hôtes (resultats.html
// définit sa propre celluleNiveau ; esc n'a pas le même sens selon les pages).
// L'échappement HTML ci-dessous est interne : ce fichier n'appelle jamais le
// esc de la page hôte.
//
// Dépendance : js/catalogue.js doit être chargé AVANT (SOUS_THEMES).
// Styles : css/niveaux.css.
// Chargement : <script src="/js/niveaux.js?v=8"></script> — incrémenter v à
// chaque modification pour contourner le cache.
(function () {
  'use strict'

  function echapper(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  const NOM_NIVEAU = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' }
  const CHAMPS_NIVEAU = {
    facile:    { reussites: 'f_reussites', essais: 'f_essais', etat: 'f_etat' },
    moyen:     { reussites: 'm_reussites', essais: 'm_essais', etat: 'm_etat' },
    difficile: { reussites: 'd_reussites', essais: 'd_essais', etat: 'd_etat' }
  }

  const SELECT_NIVEAUX = 'theme, sous_theme, f_reussites, f_essais, m_reussites, m_essais, d_reussites, d_essais, f_etat, m_etat, d_etat, niveau_courant, a_surveiller, derniere_session, derniers_essais, dernieres_reussites'

  function nbReussites(n) {
    n = Math.min(Number(n) || 0, 5)
    return n + ' réussite' + (n > 1 ? 's' : '')
  }

  function parRecence(a, b) {
    return new Date(b.derniere_session || 0) - new Date(a.derniere_session || 0)
  }

  function totalCatalogue() {
    return Object.keys(SOUS_THEMES).reduce((s, t) => s + SOUS_THEMES[t].length, 0)
  }

  // Contenu d'une case niveau, sans mise en forme :
  //   { type, texte, detail, reussites, essais }
  // type : 'acquis' | 'encours' | 'surv' (en cours ET à surveiller) | 'jamais'
  // (niveau ouvert, aucun essai) | 'verrou'. texte = ligne 1 ; detail = ligne 2
  // (« en M essais », M = sessions terminées à CE niveau pour ce sous-thème,
  // colonnes f_/m_/d_essais de la vue ; « aucun essai » à 0 essai), vide pour
  // acquis et verrouillé ; reussites (0-5) pilote la barre (largeur = N/5).
  // « N / 5 réussites » reste au pluriel (5 réussites sont nécessaires) ; « en 1
  // essai » est au singulier ; jamais de « en 0 essai ».
  // Un niveau ouvert jamais joué prend le style « en cours » (beige, barre vide) :
  // le gris est réservé à « Pas encore ouvert ».
  // Source unique du contenu des cases : celluleNiveau() (page, fiche prof),
  // le PDF (suivi-parent.html) et la grille de l'email (lib/bilan-email.js) en dérivent.
  function cellule(l, niveau) {
    const c = CHAMPS_NIVEAU[niveau]
    const etat = l[c.etat]
    const essais = Number(l[c.essais]) || 0
    if (etat === 'acquis') return { type: 'acquis', texte: '✓ Acquis', detail: '', reussites: 5, essais }
    if (etat === 'en_cours') {
      const n = Math.min(Number(l[c.reussites]) || 0, 5)
      const type = (l.a_surveiller && l.niveau_courant === niveau) ? 'surv' : 'encours'
      return { type, texte: `${n} / 5 réussites`, detail: essais >= 1 ? `en ${essais} essai${essais > 1 ? 's' : ''}` : 'aucun essai', reussites: n, essais }
    }
    if (etat === 'jamais_joue') return { type: 'jamais', texte: '0 / 5 réussites', detail: 'aucun essai', reussites: 0, essais: 0 }
    return { type: 'verrou', texte: `Après le ${niveau === 'moyen' ? 'Facile' : 'Moyen'}`, detail: '', reussites: 0, essais }
  }

  function celluleNiveau(l, niveau) {
    const d = cellule(l, niveau)
    if (d.type === 'acquis') return '<div class="niv-cell niv-c-acquis">' + d.texte + '</div>'
    if (d.type === 'encours' || d.type === 'surv' || d.type === 'jamais') {
      const cls = d.type === 'surv' ? 'niv-c-surv' : 'niv-c-encours'
      return `<div class="niv-cell ${cls}"><div class="niv-l1">${d.texte}</div>` +
        `<div class="niv-l2">${d.detail}</div>` +
        `<div class="niv-barre"><span style="width:${d.reussites * 20}%"></span></div></div>`
    }
    return `<div class="niv-cell niv-c-verrou">${d.texte}</div>`
  }

  // Césures de confort pour les noms de sous-thèmes de la grille (première colonne,
  // étroite sur mobile), sur la page, la fiche prof ET l'email (lib/bilan-email.js
  // utilise cette même fonction : une seule source). Un mot long ne doit JAMAIS être coupé au milieu d'une
  // syllabe sans trait d'union (constat Apple Mail iPhone : « Proportionnalit / é »).
  // On insère des traits d'union conditionnels (&shy;) aux frontières de syllabes :
  // ils ne s'affichent que si le mot ne tient pas, et alors avec un tiret. Pris en
  // charge par Apple Mail, Gmail et Outlook et par les navigateurs ; `hyphens:auto`
  // dépend d'un dictionnaire par navigateur et n'existe ni dans Gmail ni dans
  // Outlook, d'où ce choix. Le premier rempart reste la largeur de
  // colonne et la taille de police (le plus long mot du catalogue y tient seul).
  // Règles (heuristique française, sans dictionnaire) : jamais dans un groupe de
  // voyelles ; V|CV (pro-ba) ; entre deux consonnes (trans-for, por-tion) sauf
  // groupes inséparables bl br cl cr dr fl fr gl gr pl pr tr vr et digraphes ch ph th
  // gn sh qu ; jamais devant une syllabe finale muette (consonne(s) + e ou es :
  // « tique », « tiques », « tages ») ; au moins 3 lettres de chaque côté ; seulement les mots d'au moins 11
  // lettres : en dessous, le mot tient seul sur sa ligne dès 320 px et le retour à la
  // ligne se fait aux espaces (« Théorème de / Pythagore », pas « Pytha- / gore »).
  const VOYELLES = 'aeiouyàâäéèêëîïôöùûüœæ'
  const GROUPES_INSEPARABLES = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'vr']
  const DIGRAPHES = ['ch', 'ph', 'th', 'gn', 'sh', 'qu']
  const MOT_LETTRES = /^[A-Za-zÀ-ÖØ-öø-ÿŒœÆæ]+$/
  const MOT_MIN_CESURE = 11
  // Syllabe finale muette : consonne(s) puis e ou es (« que », « ques », « ges »), « qu »
  // comptant pour une consonne. Règle typographique : jamais de coupure devant elle.
  const SYLLABE_FINALE_MUETTE = new RegExp('^(?:qu|[^' + VOYELLES + '])+es?$')

  // Indices (dans `mot`) où une césure est permise.
  function pointsDeCesure(mot) {
    const bas = mot.toLowerCase()
    const unites = [] // { debut, fin, voyelle }
    for (let i = 0; i < bas.length;) {
      const deux = bas.slice(i, i + 2)
      if (DIGRAPHES.includes(deux)) { unites.push({ debut: i, fin: i + 2, voyelle: false }); i += 2; continue }
      unites.push({ debut: i, fin: i + 1, voyelle: VOYELLES.includes(bas[i]) }); i++
    }
    const points = []
    let i = 0
    while (i < unites.length) {
      if (!unites[i].voyelle) { i++; continue }
      while (i < unites.length && unites[i].voyelle) i++        // groupe de voyelles
      let j = i
      while (j < unites.length && !unites[j].voyelle) j++        // grappe de consonnes
      if (j >= unites.length) break                              // consonnes finales : pas de césure
      const n = j - i
      if (n === 1) points.push(unites[i].debut)
      else if (n >= 2) {
        const deuxDernieres = bas.slice(unites[j - 2].debut, unites[j - 1].fin)
        const inseparable = unites[j - 2].fin - unites[j - 2].debut === 1 && unites[j - 1].fin - unites[j - 1].debut === 1 && GROUPES_INSEPARABLES.includes(deuxDernieres)
        points.push(inseparable ? unites[j - 2].debut : unites[j - 1].debut)
      }
      i = j
    }
    return points.filter(p => p >= 3 && mot.length - p >= 3 && !SYLLABE_FINALE_MUETTE.test(bas.slice(p)))
  }

  // Retire tout trait d'union conditionnel (U+00AD). Il n'existe QUE dans le HTML de
  // la grille (page, email) : tout texte hors HTML (PDF jsPDF, phrases, sujet de
  // l'email) passe par ici, car jsPDF imprimerait U+00AD comme un tiret visible
  // (le jeu WinAnsi le contient : le test de jeu de caractères ne le détecte pas).
  function sansCesures(texte) {
    return String(texte == null ? '' : texte).replace(/\u00AD/g, '')
  }

  // Texte → HTML échappé avec traits d'union conditionnels dans les mots longs.
  function avecCesures(texte) {
    return sansCesures(texte).split(' ').map(mot => {
      if (mot.length < MOT_MIN_CESURE || !MOT_LETTRES.test(mot)) return echapper(mot)
      const pts = pointsDeCesure(mot)
      if (!pts.length) return echapper(mot)
      const morceaux = []
      let debut = 0
      for (const p of pts) { morceaux.push(mot.slice(debut, p)); debut = p }
      morceaux.push(mot.slice(debut))
      return morceaux.map(echapper).join('&shy;')
    }).join(' ')
  }

  // Phrase « à surveiller » (texte brut, non échappé), utilisée par la carte de la
  // page parent, la fiche prof, le PDF et l'email du bilan. Les chiffres viennent
  // de la vue (derniers_essais / dernieres_reussites, AU NIVEAU COURANT) : aucun
  // calcul ici. La règle (a_surveiller) est dans db/vue-niveaux.sql : Facile ou
  // Moyen non acquis, au moins 4 essais, au plus 1 réussite sur les 4 derniers,
  // jamais en Difficile.
  function phraseSurveiller(l) {
    return `${sansCesures(l.sous_theme)} : ${nbReussites(l.dernieres_reussites)} sur ses 4 derniers essais au niveau ${NOM_NIVEAU[l.niveau_courant]}.`
  }

  // Classement pur (lignes de la vue → textes bruts, non échappés), partagé par
  // la carte HTML, le PDF et l'email. Ordre : récence décroissante. Seul « à
  // surveiller » est mis en phrases ; le reste de l'état est dans la grille.
  function classerNiveaux(lignes) {
    const surveiller = lignes.slice().sort(parRecence)
      .filter(l => l.a_surveiller && CHAMPS_NIVEAU[l.niveau_courant])
      .map(phraseSurveiller)
    return { surveiller }
  }

  // Légende de la grille : carrés de couleur (mêmes couleurs que les cases).
  const LEGENDE = [['acquis', 'Acquis'], ['encours', 'En cours'], ['surv', 'À surveiller'], ['verrou', 'Pas encore ouvert']]
  const PHRASE_REGLE = '« 4 / 5 réussites » = 4 réussites obtenues sur les 5 nécessaires pour valider le niveau. Une réussite = au moins 4 bonnes réponses sur 5. Un niveau validé ouvre le niveau suivant.'

  // Rendu pur (lignes de la vue → HTML) : aucune lecture réseau. Ordre : en-tête,
  // bloc « À surveiller » (absent s'il est vide), grille sous-thème × niveau
  // (toujours visible), légende en carrés, phrase de règle.
  // options.cta (défaut true) : false retire la phrase d'aide et le lien vers les
  //                             cours particuliers du bloc « À surveiller ».
  // Les défauts reproduisent exactement la page parent.
  function rendreCarteNiveaux(lignes, options) {
    const opt = Object.assign({ cta: true }, options)
    const tries = lignes.slice().sort(parRecence)
    const { surveiller } = classerNiveaux(lignes)

    const liste = items => '<ul>' + items.map(t => `<li>${echapper(t)}</li>`).join('') + '</ul>'
    const n = tries.length
    let html = `<div class="card"><div class="niv-tete"><div class="niv-titre">Niveau atteint par sous-thème</div>` +
      `<div class="niv-resume">${n} commencé${n > 1 ? 's' : ''} sur ${totalCatalogue()}</div></div>`

    if (surveiller.length) {
      html += `<div class="niv-bloc niv-bloc-surv"><div class="niv-bloc-titre"><span class="niv-ico" aria-hidden="true">⚠</span>À surveiller</div>${liste(surveiller)}` +
        (opt.cta ? `<div class="niv-aide">Une aide ponctuelle peut l'aider à débloquer. <a href="cours-particuliers.html">Découvrir les cours particuliers</a></div>` : '') +
        `</div>`
    }

    html += '<div class="niv-wrap"><table class="niv-table"><thead><tr><th class="niv-col-nom" scope="col">Sous-thème</th>' +
      '<th scope="col">Facile</th><th scope="col">Moyen</th><th scope="col">Difficile</th></tr></thead><tbody>'
    tries.forEach(l => {
      html += `<tr><td class="niv-nom">${avecCesures(l.sous_theme)}</td>` +
        `<td>${celluleNiveau(l, 'facile')}</td><td>${celluleNiveau(l, 'moyen')}</td><td>${celluleNiveau(l, 'difficile')}</td></tr>`
    })
    html += '</tbody></table></div>' +
      '<div class="niv-legende-cases">' +
      LEGENDE.map(([type, libelle]) => `<span class="niv-leg"><i class="niv-carre niv-carre-${type}" aria-hidden="true"></i>${libelle}</span>`).join('') +
      '</div>' +
      `<div class="niv-legende">${PHRASE_REGLE}</div></div>`
    return html
  }

  const API = {
    NOM_NIVEAU, CHAMPS_NIVEAU, SELECT_NIVEAUX,
    nbReussites, parRecence, totalCatalogue,
    avecCesures, sansCesures, pointsDeCesure, cellule, celluleNiveau, phraseSurveiller, classerNiveaux, rendreCarteNiveaux,
    LEGENDE, PHRASE_REGLE
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = API
  else window.Niveaux = API
})()
