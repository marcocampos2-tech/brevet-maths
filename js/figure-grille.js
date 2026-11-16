// js/figure-grille.js — figure de type « grille » : formes sur un quadrillage et
// leurs images par une transformation (symétrie axiale ou centrale, translation,
// rotation, homothétie). Script classique, même modèle que js/figure-script.js.
//
// Pourquoi : les questions de Transformations du Brevet sont presque toutes
// visuelles (« quelle transformation passe de la figure 1 à la figure 2 ? »,
// « quel est le rapport de l'homothétie ? », « quelle est l'image de… ? »).
// Aucun type de figure existant ne dessine un quadrillage.
//
// Deux couches, séparées pour pouvoir être réutilisées :
//   1. GÉOMÉTRIE (fonctions pures sur des points [x, y], y vers le HAUT) :
//      appliquer(), analyser(), typesCompatibles().
//   2. DESSIN SVG : html().
//
// Descripteur stocké dans questions_banque.figure (jsonb) :
//   { "type": "grille", "cols": 12, "lignes": 8,
//     "formes":  [ forme, … ],
//     "points":  [ { "nom": "O", "pos": [5, 3], "lab": "haut_droite" }, … ],  // facultatif
//     "droites": [ { "nom": "d", "a": [6, 0], "b": [6, 8], "style": "pointille" }, … ] } // facultatif
//
// forme = { "nom": "1", "couleur": "bleu", "pts": [[2,4],[4,4],[2,6]] }
//      ou { "nom": "2", "couleur": "vert", "image": { "de": "1", "transformation": …, … } }
//   nom        : 1 ou 2 signes (lettre ou chiffre) + « ' » facultatif ; unique parmi les formes.
//   couleur    : bleu | vert | neutre | gris (neutre par défaut). Les candidates d'une
//                question « laquelle est l'image ? » prennent TOUTES la même couleur :
//                une couleur différente désignerait la bonne réponse.
//   pts        : 3 à 6 sommets entiers, dans le quadrillage, aire non nulle.
//   sommets    : noms des sommets, dans l'ordre de pts (facultatif), affichés à l'extérieur.
//   etiquette  : false pour ne pas écrire le nom de la forme en son centre.
//   image      : calculée, jamais saisie à la main. « de » nomme une forme DÉJÀ déclarée.
//                Chaque sommet image doit tomber sur un nœud du quadrillage, dans le
//                quadrillage ; sinon la figure est refusée.
//
// Transformations (angles en degrés, coordonnées : multiples de 0,5 pour les centres) :
//   translation        { vecteur: [dx, dy] }
//   symetrie_centrale  { centre: [x, y] }
//   rotation           { centre: [x, y], angle: 90 | 180 | 270, sens: "horaire" | "antihoraire" }
//   homothetie         { centre: [x, y], rapport: k }   k multiple de 0,5, 0 < |k| <= 4, |k| différent de 1
//   symetrie_axiale    { axe: { a: [x, y], b: [x, y] } } axe horizontal, vertical ou diagonal (45°)
//
// Limites : 12 colonnes, 10 lignes, 12 formes, 8 points, 2 droites. À 300 px de large
// une case fait environ 24 px : au-delà de 12 formes les numéros se chevauchent.
// Toute figure mal formée donne un HTML VIDE (jamais une figure tronquée qui
// contredirait la réponse) ; erreurs() dit pourquoi.
//
// Tout texte venant de la base est validé (noms) puis échappé. Aucun état :
// fonctions pures. Un SEUL nom global : window.FigureGrille (navigateur) ; sous
// Node le même fichier s'importe par require() (test : lib/figure-grille.manual-test.js).
// Styles : css/figure-grille.css.
// Chargement : <script src="/js/figure-grille.js?v=1"></script> — incrémenter v
// à chaque modification pour contourner le cache.
(function () {
  'use strict'

  const MAX_COLS = 12
  const MAX_LIGNES = 10
  const MAX_FORMES = 12
  const MAX_POINTS = 8
  const MAX_DROITES = 2
  const CELLULE = 24
  const MARGE = { g: 8, d: 8, h: 16, b: 8 }
  const EPS = 1e-9
  const RE_NOM = /^[A-Za-z0-9]{1,2}'?$/
  const COULEURS = { bleu: true, vert: true, neutre: true, gris: true }
  const STYLES_DROITE = { pointille: true, plein: true }
  const DECALAGES_POINT = {
    haut_droite: [7, -8], haut_gauche: [-7, -8], bas_droite: [7, 9], bas_gauche: [-7, 9],
    haut: [0, -10], bas: [0, 11], gauche: [-10, 0], droite: [10, 0]
  }

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function lireFigure(fig) {
    let f = fig
    if (typeof f === 'string') { try { f = JSON.parse(f) } catch (e) { return null } }
    return f && typeof f === 'object' ? f : null
  }

  function estGrille(fig) {
    const f = lireFigure(fig)
    return !!(f && f.type === 'grille')
  }

  // ── Couche 1 : géométrie ───────────────────────────────────────────────
  function estNombre(n) { return typeof n === 'number' && isFinite(n) }
  function estPoint(p) { return Array.isArray(p) && p.length === 2 && estNombre(p[0]) && estNombre(p[1]) }
  function estDemi(n) { return Math.abs(n * 2 - Math.round(n * 2)) < EPS }
  function estPointDemi(p) { return estPoint(p) && estDemi(p[0]) && estDemi(p[1]) }
  function estEntier(n) { return Math.abs(n - Math.round(n)) < EPS }
  function estPointEntier(p) { return estPoint(p) && estEntier(p[0]) && estEntier(p[1]) }

  // Direction d'un axe valide : horizontale, verticale ou diagonale.
  function directionAxeValide(a, b) {
    const ux = b[0] - a[0], uy = b[1] - a[1]
    if (Math.abs(ux) < EPS && Math.abs(uy) < EPS) return false
    return Math.abs(ux) < EPS || Math.abs(uy) < EPS || Math.abs(Math.abs(ux) - Math.abs(uy)) < EPS
  }

  // Erreurs de paramètres d'une transformation (tableau de chaînes, vide si valide).
  function erreursTransformation(t, chemin) {
    const e = []
    if (!t || typeof t !== 'object') return [chemin + ' : transformation absente']
    switch (t.transformation) {
      case 'translation':
        if (!estPointDemi(t.vecteur)) e.push(chemin + ' : « vecteur » doit être [dx, dy] (multiples de 0,5)')
        break
      case 'symetrie_centrale':
        if (!estPointDemi(t.centre)) e.push(chemin + ' : « centre » doit être [x, y] (multiples de 0,5)')
        break
      case 'rotation':
        if (!estPointDemi(t.centre)) e.push(chemin + ' : « centre » doit être [x, y] (multiples de 0,5)')
        if (t.angle !== 90 && t.angle !== 180 && t.angle !== 270) e.push(chemin + ' : « angle » doit valoir 90, 180 ou 270')
        if (t.sens !== 'horaire' && t.sens !== 'antihoraire') e.push(chemin + ' : « sens » doit valoir horaire ou antihoraire')
        break
      case 'homothetie':
        if (!estPointDemi(t.centre)) e.push(chemin + ' : « centre » doit être [x, y] (multiples de 0,5)')
        if (!estNombre(t.rapport) || !estDemi(t.rapport) || Math.abs(t.rapport) < 0.5 - EPS || Math.abs(t.rapport) > 4 + EPS) {
          e.push(chemin + ' : « rapport » doit être un multiple de 0,5 compris (en valeur absolue) entre 0,5 et 4')
        } else if (Math.abs(Math.abs(t.rapport) - 1) < EPS) {
          e.push(chemin + ' : rapport 1 ou −1 refusé (utiliser une symétrie centrale)')
        }
        break
      case 'symetrie_axiale':
        if (!t.axe || !estPointDemi(t.axe.a) || !estPointDemi(t.axe.b)) e.push(chemin + ' : « axe » doit être { a: [x, y], b: [x, y] }')
        else if (!directionAxeValide(t.axe.a, t.axe.b)) e.push(chemin + ' : l\'axe doit être horizontal, vertical ou diagonal')
        break
      default:
        e.push(chemin + ' : transformation « ' + (t && t.transformation) + ' » inconnue')
    }
    return e
  }

  // Image d'un point par une transformation DÉJÀ validée. Renvoie [x, y] (non arrondi).
  function appliquer(t, p) {
    const x = p[0], y = p[1]
    switch (t.transformation) {
      case 'translation':
        return [x + t.vecteur[0], y + t.vecteur[1]]
      case 'symetrie_centrale':
        return [2 * t.centre[0] - x, 2 * t.centre[1] - y]
      case 'homothetie':
        return [t.centre[0] + t.rapport * (x - t.centre[0]), t.centre[1] + t.rapport * (y - t.centre[1])]
      case 'rotation': {
        const dx = x - t.centre[0], dy = y - t.centre[1]
        const quarts = t.angle / 90
        const q = t.sens === 'horaire' ? (4 - quarts) % 4 : quarts % 4
        let rx = dx, ry = dy
        if (q === 1) { rx = -dy; ry = dx } else if (q === 2) { rx = -dx; ry = -dy } else if (q === 3) { rx = dy; ry = -dx }
        return [t.centre[0] + rx, t.centre[1] + ry]
      }
      case 'symetrie_axiale': {
        const a = t.axe.a, ux = t.axe.b[0] - a[0], uy = t.axe.b[1] - a[1]
        const wx = x - a[0], wy = y - a[1]
        const k = (wx * ux + wy * uy) / (ux * ux + uy * uy)
        return [a[0] + 2 * k * ux - wx, a[1] + 2 * k * uy - wy]
      }
      default:
        return null
    }
  }

  function aire(pts) {
    let s = 0
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length]
      s += p[0] * q[1] - q[0] * p[1]
    }
    return Math.abs(s) / 2
  }

  function arrondi(p) { return [Math.round(p[0]), Math.round(p[1])] }

  // Analyse complète : valide le descripteur ET calcule les formes images.
  // Renvoie { ok, erreurs, cols, lignes, formes, points, droites }.
  function analyser(fig) {
    const f = lireFigure(fig)
    if (!f || f.type !== 'grille') return { ok: false, erreurs: ['ce n\'est pas une figure de type grille'] }
    const e = []
    const cols = f.cols, lignes = f.lignes
    if (!Number.isInteger(cols) || cols < 2 || cols > MAX_COLS) e.push('« cols » doit être un entier de 2 à ' + MAX_COLS)
    if (!Number.isInteger(lignes) || lignes < 2 || lignes > MAX_LIGNES) e.push('« lignes » doit être un entier de 2 à ' + MAX_LIGNES)
    if (e.length) return { ok: false, erreurs: e }
    const dansGrille = function (p) { return p[0] >= -EPS && p[0] <= cols + EPS && p[1] >= -EPS && p[1] <= lignes + EPS }

    const etiquettes = {}
    function neuf(nom, chemin) {
      if (Object.prototype.hasOwnProperty.call(etiquettes, nom)) { e.push(chemin + ' : nom « ' + nom + ' » déjà utilisé'); return false }
      etiquettes[nom] = true
      return true
    }

    const formes = []
    const parNom = {}
    if (!Array.isArray(f.formes) || f.formes.length === 0) e.push('« formes » absente ou vide')
    else if (f.formes.length > MAX_FORMES) e.push('plus de ' + MAX_FORMES + ' formes (' + f.formes.length + ')')
    else {
      f.formes.forEach(function (s, i) {
        const chemin = 'formes[' + i + ']'
        if (!s || typeof s !== 'object') { e.push(chemin + ' : forme absente'); return }
        if (typeof s.nom !== 'string' || !RE_NOM.test(s.nom)) { e.push(chemin + ' : « nom » invalide (1 ou 2 lettres ou chiffres, « \' » facultatif)'); return }
        if (Object.prototype.hasOwnProperty.call(parNom, s.nom)) { e.push(chemin + ' : forme « ' + s.nom + ' » déjà déclarée'); return }
        if (s.couleur !== undefined && !Object.prototype.hasOwnProperty.call(COULEURS, s.couleur)) e.push(chemin + ' : couleur « ' + s.couleur + ' » inconnue')
        const aPts = s.pts !== undefined, aImage = s.image !== undefined
        if (aPts === aImage) { e.push(chemin + ' : donner « pts » OU « image », pas les deux ni aucun'); return }
        let pts = null
        if (aPts) {
          if (!Array.isArray(s.pts) || s.pts.length < 3 || s.pts.length > 6 || !s.pts.every(estPointEntier)) {
            e.push(chemin + ' : « pts » doit contenir de 3 à 6 sommets entiers'); return
          }
          if (!s.pts.every(dansGrille)) { e.push(chemin + ' : sommet hors du quadrillage'); return }
          pts = s.pts.map(arrondi)
        } else {
          const im = s.image
          if (!im || typeof im !== 'object' || typeof im.de !== 'string' || !Object.prototype.hasOwnProperty.call(parNom, im.de)) {
            e.push(chemin + '.image : « de » doit nommer une forme déjà déclarée'); return
          }
          const eT = erreursTransformation(im, chemin + '.image')
          if (eT.length) { eT.forEach(function (m) { e.push(m) }); return }
          const calc = parNom[im.de].pts.map(function (p) { return appliquer(im, p) })
          if (!calc.every(function (p) { return estPointEntier(p) && dansGrille(p) })) {
            e.push(chemin + '.image : un sommet image ne tombe pas sur un nœud du quadrillage'); return
          }
          pts = calc.map(arrondi)
        }
        if (new Set(pts.map(function (p) { return p[0] + ',' + p[1] })).size !== pts.length) { e.push(chemin + ' : sommets confondus'); return }
        if (aire(pts) < EPS) { e.push(chemin + ' : aire nulle'); return }
        let sommets = null
        if (s.sommets !== undefined) {
          if (!Array.isArray(s.sommets) || s.sommets.length !== pts.length || !s.sommets.every(function (n) { return typeof n === 'string' && RE_NOM.test(n) })) {
            e.push(chemin + ' : « sommets » doit nommer chaque sommet (même nombre que pts)'); return
          }
          let bon = true
          s.sommets.forEach(function (n) { if (!neuf(n, chemin + '.sommets')) bon = false })
          if (!bon) return
          sommets = s.sommets
        }
        const forme = { nom: s.nom, couleur: s.couleur || 'neutre', pts: pts, sommets: sommets, etiquette: s.etiquette !== false }
        parNom[s.nom] = forme
        formes.push(forme)
      })
    }

    const points = []
    if (f.points !== undefined) {
      if (!Array.isArray(f.points) || f.points.length > MAX_POINTS) e.push('« points » doit être une liste de ' + MAX_POINTS + ' au plus')
      else f.points.forEach(function (p, i) {
        const chemin = 'points[' + i + ']'
        if (!p || typeof p.nom !== 'string' || !RE_NOM.test(p.nom)) { e.push(chemin + ' : « nom » invalide'); return }
        if (!estPointEntier(p.pos) || !dansGrille(p.pos)) { e.push(chemin + ' : « pos » doit être un nœud du quadrillage'); return }
        if (p.lab !== undefined && !Object.prototype.hasOwnProperty.call(DECALAGES_POINT, p.lab)) { e.push(chemin + ' : « lab » inconnu'); return }
        if (!neuf(p.nom, chemin)) return
        points.push({ nom: p.nom, pos: arrondi(p.pos), lab: p.lab || 'haut_droite' })
      })
    }

    const droites = []
    if (f.droites !== undefined) {
      if (!Array.isArray(f.droites) || f.droites.length > MAX_DROITES) e.push('« droites » doit être une liste de ' + MAX_DROITES + ' au plus')
      else f.droites.forEach(function (d, i) {
        const chemin = 'droites[' + i + ']'
        if (!d || !estPointDemi(d.a) || !estPointDemi(d.b) || !directionAxeValide(d.a, d.b)) {
          e.push(chemin + ' : « a » et « b » doivent définir une droite horizontale, verticale ou diagonale'); return
        }
        if (d.style !== undefined && !Object.prototype.hasOwnProperty.call(STYLES_DROITE, d.style)) { e.push(chemin + ' : « style » inconnu'); return }
        if (d.nom !== undefined) {
          if (typeof d.nom !== 'string' || !RE_NOM.test(d.nom)) { e.push(chemin + ' : « nom » invalide'); return }
          if (!neuf(d.nom, chemin)) return
        }
        droites.push({ nom: d.nom || null, a: d.a, b: d.b, style: d.style || 'pointille' })
      })
    }

    return { ok: e.length === 0, erreurs: e, cols: cols, lignes: lignes, formes: formes, points: points, droites: droites }
  }

  function erreurs(fig) { return analyser(fig).erreurs }
  function valider(fig) { const a = analyser(fig); return { ok: a.ok, erreurs: a.erreurs } }

  // Types de transformation qui envoient le polygone A sur le polygone B (mêmes
  // sommets, dans n'importe quel ordre). Sert au contrôle d'unicité d'une question
  // « quelle transformation ? » : la liste doit contenir UN SEUL type que la question
  // propose parmi ses options. Une rotation de 180° compte à la fois comme
  // « rotation » et « symetrie_centrale ». Limite : on n'énumère que les
  // transformations dont les paramètres sont des multiples de 0,5 (centres, axes,
  // vecteurs) et les rapports multiples de 0,5 entre 0,5 et 4 en valeur absolue.
  // Un polygone qui a lui-même des symétries peut être compatible avec plusieurs types.
  function typesCompatibles(A, B, cols, lignes) {
    const cle = function (p) { return Math.round(p[0] * 1000) + ',' + Math.round(p[1] * 1000) }
    const cibleSet = new Set(B.map(cle))
    if (cibleSet.size !== new Set(A.map(cle)).size) return []
    const envoie = function (t) {
      for (let i = 0; i < A.length; i++) if (!cibleSet.has(cle(appliquer(t, A[i])))) return false
      return true
    }
    const types = {}
    for (let dx = -cols; dx <= cols; dx += 0.5) {
      for (let dy = -lignes; dy <= lignes; dy += 0.5) {
        if (dx === 0 && dy === 0) continue
        if (envoie({ transformation: 'translation', vecteur: [dx, dy] })) types.translation = true
      }
    }
    const x0 = -cols, x1 = 2 * cols, y0 = -lignes, y1 = 2 * lignes
    for (let cx = x0; cx <= x1; cx += 0.5) {
      for (let cy = y0; cy <= y1; cy += 0.5) {
        const centre = [cx, cy]
        ;[90, 180, 270].forEach(function (angle) {
          if (envoie({ transformation: 'rotation', centre: centre, angle: angle, sens: 'antihoraire' })) {
            types.rotation = true
            if (angle === 180) types.symetrie_centrale = true
          }
        })
        ;[-4, -3.5, -3, -2.5, -2, -1.5, -0.5, 0.5, 1.5, 2, 2.5, 3, 3.5, 4].forEach(function (k) {
          if (envoie({ transformation: 'homothetie', centre: centre, rapport: k })) types.homothetie = true
        })
      }
    }
    const axes = []
    for (let c = -2 * (cols + lignes); c <= 2 * (cols + lignes); c += 0.5) {
      axes.push({ a: [c, 0], b: [c, 1] })
      axes.push({ a: [0, c], b: [1, c] })
      axes.push({ a: [0, c], b: [1, c + 1] })
      axes.push({ a: [0, c], b: [1, c - 1] })
    }
    axes.forEach(function (axe) {
      if (envoie({ transformation: 'symetrie_axiale', axe: axe })) types.symetrie_axiale = true
    })
    return Object.keys(types).sort()
  }

  // ── Couche 2 : dessin SVG ──────────────────────────────────────────────
  function n1(x) { return String(Math.round(x * 10) / 10) }

  // Segment de la droite (a, b) coupé aux bords du quadrillage : [p, q] ou null.
  function couper(a, b, cols, lignes) {
    const dx = b[0] - a[0], dy = b[1] - a[1], cand = []
    const dedans = function (v, max) { return v >= -EPS && v <= max + EPS }
    if (Math.abs(dx) > EPS) {
      ;[0, cols].forEach(function (X) {
        const y = a[1] + (X - a[0]) / dx * dy
        if (dedans(y, lignes)) cand.push([X, y])
      })
    }
    if (Math.abs(dy) > EPS) {
      ;[0, lignes].forEach(function (Y) {
        const x = a[0] + (Y - a[1]) / dy * dx
        if (dedans(x, cols)) cand.push([x, Y])
      })
    }
    let meilleur = null, dmax = -1
    for (let i = 0; i < cand.length; i++) {
      for (let j = i + 1; j < cand.length; j++) {
        const d = Math.hypot(cand[i][0] - cand[j][0], cand[i][1] - cand[j][1])
        if (d > dmax + EPS) { dmax = d; meilleur = [cand[i], cand[j]] }
      }
    }
    return dmax > EPS ? meilleur : null
  }

  // HTML (un <svg>) de la figure, ou chaîne vide si elle est mal formée.
  // L'appelant l'enveloppe dans son propre <div class="q-figure">.
  function html(fig) {
    const a = analyser(fig)
    if (!a.ok) return ''
    const cols = a.cols, lignes = a.lignes
    const W = MARGE.g + MARGE.d + CELLULE * cols
    const H = MARGE.h + MARGE.b + CELLULE * lignes
    const X = function (x) { return n1(MARGE.g + CELLULE * x) }
    const Y = function (y) { return n1(MARGE.h + CELLULE * (lignes - y)) }

    let s = '<svg class="fg-fig" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px" role="img" aria-label="Figure sur quadrillage" xmlns="http://www.w3.org/2000/svg">'
    let d = ''
    for (let i = 0; i <= cols; i++) d += 'M' + X(i) + ' ' + Y(lignes) + 'V' + Y(0)
    for (let j = 0; j <= lignes; j++) d += 'M' + X(0) + ' ' + Y(j) + 'H' + X(cols)
    s += '<path class="fg-grille" d="' + d + '"/>'

    a.droites.forEach(function (dr) {
      const seg = couper(dr.a, dr.b, cols, lignes)
      if (!seg) return
      s += '<line class="fg-droite' + (dr.style === 'pointille' ? ' fg-pointille' : '') + '" x1="' + X(seg[0][0]) + '" y1="' + Y(seg[0][1]) + '" x2="' + X(seg[1][0]) + '" y2="' + Y(seg[1][1]) + '"/>'
      if (dr.nom) {
        // Étiquette près de l'extrémité la plus haute (à droite en cas d'égalité).
        const haut = seg[0][1] > seg[1][1] + EPS || (Math.abs(seg[0][1] - seg[1][1]) < EPS && seg[0][0] > seg[1][0]) ? seg[0] : seg[1]
        const horizontale = Math.abs(seg[0][1] - seg[1][1]) < EPS
        const px = parseFloat(X(haut[0])), py = parseFloat(Y(haut[1]))
        s += '<text class="fg-nom-droite" x="' + n1(horizontale ? px - 6 : px + 8) + '" y="' + n1(py - 8) + '" text-anchor="' + (horizontale ? 'end' : 'start') + '" dominant-baseline="central">' + esc(dr.nom) + '</text>'
      }
    })

    a.formes.forEach(function (fo) {
      s += '<polygon class="fg-forme fg-' + fo.couleur + '" points="' + fo.pts.map(function (p) { return X(p[0]) + ',' + Y(p[1]) }).join(' ') + '"/>'
    })

    a.formes.forEach(function (fo) {
      const cx = fo.pts.reduce(function (t, p) { return t + p[0] }, 0) / fo.pts.length
      const cy = fo.pts.reduce(function (t, p) { return t + p[1] }, 0) / fo.pts.length
      if (fo.sommets) {
        fo.pts.forEach(function (p, i) {
          let vx = p[0] - cx, vy = -(p[1] - cy)
          const n = Math.hypot(vx, vy) || 1
          vx /= n; vy /= n
          s += '<text class="fg-sommet" x="' + n1(parseFloat(X(p[0])) + vx * 10) + '" y="' + n1(parseFloat(Y(p[1])) + vy * 10) + '" text-anchor="middle" dominant-baseline="central">' + esc(fo.sommets[i]) + '</text>'
        })
      }
      if (fo.etiquette) {
        s += '<text class="fg-nom" x="' + X(cx) + '" y="' + Y(cy) + '" text-anchor="middle" dominant-baseline="central">' + esc(fo.nom) + '</text>'
      }
    })

    a.points.forEach(function (p) {
      const dec = DECALAGES_POINT[p.lab]
      s += '<circle class="fg-point" cx="' + X(p.pos[0]) + '" cy="' + Y(p.pos[1]) + '" r="3.2"/>'
      s += '<text class="fg-sommet" x="' + n1(parseFloat(X(p.pos[0])) + dec[0]) + '" y="' + n1(parseFloat(Y(p.pos[1])) + dec[1]) + '" text-anchor="middle" dominant-baseline="central">' + esc(p.nom) + '</text>'
    })

    return s + '</svg>'
  }

  const api = {
    html: html, valider: valider, erreurs: erreurs, estGrille: estGrille,
    analyser: analyser, appliquer: appliquer, typesCompatibles: typesCompatibles,
    constantes: { MAX_COLS: MAX_COLS, MAX_LIGNES: MAX_LIGNES, MAX_FORMES: MAX_FORMES, CELLULE: CELLULE, MARGE: MARGE }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.FigureGrille = api
})()
