// js/figure-script.js — figure de type « script » : un programme en blocs façon
// Scratch, dessiné en HTML (script classique, même modèle que js/exposants.js).
//
// Pourquoi : les questions d'Algorithmique du Brevet portent sur un script en
// blocs. Le dessiner évite de le décrire en texte ; l'énoncé dit seulement
// « Voici un script. » et ne le répète pas.
//
// Descripteur stocké dans questions_banque.figure (jsonb) :
//   { "type": "script", "blocs": [ bloc, … ] }
//
// Blocs (champ « type » de chaque bloc) :
//   mettre    { variable, valeur }          « mettre a à 3 »
//   ajouter   { variable, valeur }          « ajouter 2 à a »
//   aleatoire { variable, min, max }        « mettre a à un nombre aléatoire entre 1 et 6 »
//   dire      { valeur }                    « dire a »
//   repeter   { fois, blocs }               « répéter 4 fois »
//   jusqua    { condition, blocs }          « répéter jusqu'à ce que a > 10 »
//   si        { condition, alors, sinon? }  « si a > 5 alors » / « sinon »
//   avancer   { valeur }                    « avancer de 50 »
//   tourner   { sens: "droite"|"gauche", angle }  « tourner à droite de 90° »
//   stylo     { etat: "baisse"|"leve" }     « baisser le stylo » / « lever le stylo »
//
// condition = { gauche, op, droite } avec op dans { "plus_grand", "plus_petit",
// "egal", "plus_grand_egal", "plus_petit_egal" } : les symboles > < = ≥ ≤ sont
// dessinés par ce code, jamais écrits en base (énoncés et explications restent
// en toutes lettres : pas de <, > ni & en base).
//
// Valeur = nombre, nom de variable (lettre puis lettres/chiffres/_, 12 signes au
// plus) ou expression de 3 éléments au plus « a × b » (+ − × ÷, séparés par des
// espaces). La valeur « ? » (chaîne seule) marque l'inconnue que l'élève doit
// retrouver (questions « compléter le script ») : une pastille « ? » est dessinée
// à sa place ; une seule par script ; jamais dans un nom de variable ni dans une
// expression. Limites : 10 blocs au plus (blocs imbriqués compris), 3 niveaux
// d'imbrication au plus. Tout script mal formé donne une figure VIDE (jamais un
// script tronqué qui contredirait la réponse) ; erreurs() dit pourquoi.
//
// Tout texte venant de la base est échappé. Aucun état : fonctions pures.
// Un SEUL nom global : window.FigureScript (navigateur) ; sous Node le même
// fichier s'importe par require() (test : lib/figure-script.manual-test.js).
// Styles : css/figure-script.css.
// Chargement : <script src="/js/figure-script.js?v=1"></script> — incrémenter v
// à chaque modification pour contourner le cache.
(function () {
  'use strict'

  const MAX_BLOCS = 10
  const MAX_NIVEAUX = 3
  const OPS_CONDITION = { plus_grand: '>', plus_petit: '<', egal: '=', plus_grand_egal: '≥', plus_petit_egal: '≤' }
  const OPS_CALCUL = { '+': '+', '-': '−', '−': '−', '×': '×', '*': '×', '÷': '÷', '/': '÷' }
  const RE_NOMBRE = /^\d+([.,]\d+)?$/
  const RE_VARIABLE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9_]{0,11}$/

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function lireFigure(fig) {
    let f = fig
    if (typeof f === 'string') { try { f = JSON.parse(f) } catch (e) { return null } }
    return f && typeof f === 'object' ? f : null
  }

  function estScript(fig) {
    const f = lireFigure(fig)
    return !!(f && f.type === 'script')
  }

  // ── Valeurs ────────────────────────────────────────────────────────────
  // Renvoie la chaîne d'affichage (virgule décimale, moins U+2212) ou null.
  function valeurAffichee(v) {
    if (typeof v === 'number') {
      if (!isFinite(v)) return null
      return String(v).replace('.', ',').replace('-', '−')
    }
    if (typeof v !== 'string') return null
    if (v === '?') return '?'
    const morceaux = v.trim().split(/\s+/)
    if (morceaux.length !== 1 && morceaux.length !== 3) return null
    const sortie = []
    for (let i = 0; i < morceaux.length; i++) {
      const m = morceaux[i]
      if (i % 2 === 1) {
        if (!Object.prototype.hasOwnProperty.call(OPS_CALCUL, m)) return null
        sortie.push(OPS_CALCUL[m])
      } else if (RE_NOMBRE.test(m)) {
        sortie.push(m.replace('.', ','))
      } else if (m.charAt(0) === '-' && RE_NOMBRE.test(m.slice(1)) && morceaux.length === 1) {
        sortie.push('−' + m.slice(1).replace('.', ','))
      } else if (RE_VARIABLE.test(m)) {
        sortie.push(m)
      } else return null
    }
    return sortie.join(' ')
  }

  function nomVariable(v) {
    return typeof v === 'string' && RE_VARIABLE.test(v) ? v : null
  }

  // ── Validation ─────────────────────────────────────────────────────────
  // Parcourt les blocs et accumule les erreurs ; compte les blocs.
  function valideListe(liste, niveau, etat, chemin) {
    if (!Array.isArray(liste) || liste.length === 0) {
      etat.erreurs.push(chemin + ' : liste de blocs absente ou vide')
      return
    }
    if (niveau > MAX_NIVEAUX) {
      etat.erreurs.push(chemin + ' : plus de ' + MAX_NIVEAUX + ' niveaux d\'imbrication')
      return
    }
    liste.forEach(function (b, i) { valideBloc(b, niveau, etat, chemin + '[' + i + ']') })
  }

  function exigeValeur(b, cle, etat, chemin) {
    if (valeurAffichee(b[cle]) === null) etat.erreurs.push(chemin + ' : « ' + cle + ' » absente ou invalide')
  }

  function exigeVariable(b, etat, chemin) {
    if (nomVariable(b.variable) === null) etat.erreurs.push(chemin + ' : « variable » absente ou invalide')
  }

  function valideCondition(c, etat, chemin) {
    if (!c || typeof c !== 'object') { etat.erreurs.push(chemin + ' : condition absente'); return }
    if (valeurAffichee(c.gauche) === null) etat.erreurs.push(chemin + ' : « gauche » absente ou invalide')
    if (valeurAffichee(c.droite) === null) etat.erreurs.push(chemin + ' : « droite » absente ou invalide')
    if (!Object.prototype.hasOwnProperty.call(OPS_CONDITION, c.op)) etat.erreurs.push(chemin + ' : opérateur « ' + c.op + ' » inconnu')
  }

  function valideBloc(b, niveau, etat, chemin) {
    if (!b || typeof b !== 'object' || typeof b.type !== 'string') {
      etat.erreurs.push(chemin + ' : bloc sans type')
      return
    }
    etat.nb++
    switch (b.type) {
      case 'mettre':
      case 'ajouter':
        exigeVariable(b, etat, chemin); exigeValeur(b, 'valeur', etat, chemin); break
      case 'aleatoire':
        exigeVariable(b, etat, chemin); exigeValeur(b, 'min', etat, chemin); exigeValeur(b, 'max', etat, chemin); break
      case 'dire':
      case 'avancer':
        exigeValeur(b, 'valeur', etat, chemin); break
      case 'tourner':
        if (b.sens !== 'droite' && b.sens !== 'gauche') etat.erreurs.push(chemin + ' : « sens » doit valoir droite ou gauche')
        exigeValeur(b, 'angle', etat, chemin); break
      case 'stylo':
        if (b.etat !== 'baisse' && b.etat !== 'leve') etat.erreurs.push(chemin + ' : « etat » doit valoir baisse ou leve')
        break
      case 'repeter':
        exigeValeur(b, 'fois', etat, chemin)
        valideListe(b.blocs, niveau + 1, etat, chemin + '.blocs'); break
      case 'jusqua':
        valideCondition(b.condition, etat, chemin + '.condition')
        valideListe(b.blocs, niveau + 1, etat, chemin + '.blocs'); break
      case 'si':
        valideCondition(b.condition, etat, chemin + '.condition')
        valideListe(b.alors, niveau + 1, etat, chemin + '.alors')
        if (b.sinon !== undefined && b.sinon !== null) valideListe(b.sinon, niveau + 1, etat, chemin + '.sinon')
        break
      default:
        etat.erreurs.push(chemin + ' : type de bloc inconnu « ' + b.type + ' »')
    }
  }

  // Liste des erreurs (tableau de chaînes) ; vide si le script est dessinable.
  function erreurs(fig) {
    const f = lireFigure(fig)
    if (!f || f.type !== 'script') return ['ce n\'est pas une figure de type script']
    const etat = { erreurs: [], nb: 0 }
    valideListe(f.blocs, 1, etat, 'blocs')
    const nbInconnues = (String(JSON.stringify(f.blocs)).match(/"\?"/g) || []).length
    if (nbInconnues > 1) etat.erreurs.push('plus d\'une inconnue « ? » (' + nbInconnues + ')')
    if (etat.nb > MAX_BLOCS) etat.erreurs.push('plus de ' + MAX_BLOCS + ' blocs (' + etat.nb + ')')
    return etat.erreurs
  }

  function valider(fig) {
    const e = erreurs(fig)
    return { ok: e.length === 0, erreurs: e }
  }

  // ── Rendu ──────────────────────────────────────────────────────────────
  function v(valeur) {
    const t = valeurAffichee(valeur)
    return '<span class="fs-v' + (t === '?' ? ' fs-inconnu' : '') + '">' + esc(t) + '</span>'
  }

  function condition(c) {
    return v(c.gauche) + ' <span class="fs-op">' + esc(OPS_CONDITION[c.op]) + '</span> ' + v(c.droite)
  }

  function ligne(classe, contenu) {
    return '<div class="fs-b ' + classe + '">' + contenu + '</div>'
  }

  function corps(liste) {
    return '<div class="fs-in">' + liste.map(rendreBloc).join('') + '</div>'
  }

  function conteneur(classe, entete, interieur) {
    return '<div class="fs-c ' + classe + '"><div class="fs-head">' + entete + '</div>' + interieur + '<div class="fs-foot"></div></div>'
  }

  function rendreBloc(b) {
    switch (b.type) {
      case 'mettre':
        return ligne('fs-var', 'mettre ' + v(b.variable) + ' à ' + v(b.valeur))
      case 'ajouter':
        return ligne('fs-var', 'ajouter ' + v(b.valeur) + ' à ' + v(b.variable))
      case 'aleatoire':
        return ligne('fs-var', 'mettre ' + v(b.variable) + ' à un nombre aléatoire entre ' + v(b.min) + ' et ' + v(b.max))
      case 'dire':
        return ligne('fs-dire', 'dire ' + v(b.valeur))
      case 'avancer':
        return ligne('fs-mvt', 'avancer de ' + v(b.valeur))
      case 'tourner':
        return ligne('fs-mvt', 'tourner à ' + (b.sens === 'gauche' ? 'gauche' : 'droite') + ' de ' + v(b.angle) + '°')
      case 'stylo':
        return ligne('fs-mvt', b.etat === 'leve' ? 'lever le stylo' : 'baisser le stylo')
      case 'repeter':
        return conteneur('fs-ctrl', 'répéter ' + v(b.fois) + ' fois', corps(b.blocs))
      case 'jusqua':
        return conteneur('fs-ctrl', 'répéter jusqu\'à ce que ' + condition(b.condition), corps(b.blocs))
      case 'si': {
        let inter = corps(b.alors)
        if (Array.isArray(b.sinon) && b.sinon.length) inter += '<div class="fs-head fs-mid">sinon</div>' + corps(b.sinon)
        return conteneur('fs-ctrl', 'si ' + condition(b.condition) + ' alors', inter)
      }
      default:
        return ''
    }
  }

  // HTML du script, ou chaîne vide si le script est mal formé. L'appelant
  // l'enveloppe dans son propre <div class="q-figure">.
  function html(fig) {
    if (erreurs(fig).length) return ''
    const f = lireFigure(fig)
    return '<div class="fs-script" role="img" aria-label="Script en blocs">' + f.blocs.map(rendreBloc).join('') + '</div>'
  }

  const api = { html: html, valider: valider, erreurs: erreurs, estScript: estScript, valeurAffichee: valeurAffichee }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.FigureScript = api
})()
