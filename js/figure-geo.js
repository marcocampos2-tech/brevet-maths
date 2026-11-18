// js/figure-geo.js — figure de type « geo » : le globe terrestre vu de l'extérieur
// (projection orthographique), avec équateur, méridien de Greenwich, parallèles et
// méridiens gradués, et des points repérés par une croix. Script classique, même
// modèle que js/figure-grille.js.
//
// Pourquoi : les questions de Représentation de l'espace (latitude, longitude,
// hémisphères, parallèles et méridiens) se posent sur un globe. Aucun type de
// figure existant ne dessine une sphère.
//
// Modèle commun à plusieurs vues : la clé « vue » dit QUELLE figure, la clé « fond »
// dit CE QU'IL Y A DERRIÈRE. Aujourd'hui : vue « globe », fond « vierge » seulement.
// « planisphere » et « continents » viendront plus tard SANS toucher aux questions
// déjà en base (toute autre valeur donne aujourd'hui une figure vide).
//
// Deux couches, séparées pour pouvoir être réutilisées :
//   1. GÉOMÉTRIE (fonctions pures) : projeter().
//   2. DESSIN SVG : html().
//
// Descripteur stocké dans questions_banque.figure (jsonb) :
//   { "type": "geo", "vue": "globe", "fond": "vierge",
//     "centre": { "lat": 0, "lon": 15 },
//     "points": [ { "nom": "A", "lat": 30, "lon": 45, "lab": "haut_droite" }, … ],  // facultatif
//     "graduations": true,                                                          // facultatif
//     "paralleles": [-30, 30] }                                                     // facultatif
//
//   centre       : point du globe au milieu de la figure (longitude −180..180, en degrés).
//                  Latitude du centre : de −50 à 50. Au-delà, l'équateur approche du bord
//                  du globe et ses graduations heurtent « Nord » ou « Sud » (constaté à 60°
//                  sur 66 vues sur 73 par pas de 5° de longitude).
//   points       : 8 au plus. nom = 1 ou 2 signes (lettre ou chiffre) + « ' » facultatif,
//                  unique. lat/lon en degrés. Un point doit être à 70° au plus du centre
//                  (au-delà il est caché ou écrasé contre le bord : refusé). La POSITION
//                  À L'ÉCRAN est calculée, jamais saisie. Les coordonnées d'un point ne
//                  sont JAMAIS écrites sur la figure (question de lecture de coordonnées).
//                  lab (facultatif) : haut_droite | haut_gauche | bas_droite | bas_gauche
//                  | haut | bas | gauche | droite. Sans lab, la première position qui ne
//                  chevauche rien est choisie.
//   graduations  : false pour ne pas écrire les latitudes et longitudes (question sans
//                  lecture de coordonnées). Vrai par défaut.
//   paralleles   : latitudes tracées parmi −60, −30, 30, 60 (l'équateur est toujours tracé).
//                  Sans cette clé : ceux qui sont visibles ET à 10 px au moins du bord.
//                  Avec cette clé : chacun doit être visible et à 10 px au moins du bord,
//                  sinon la figure est refusée. (Une vue inclinée écrase les parallèles
//                  du côté opposé : à 20° N, le parallèle 60° S est à 1,5 px du bord.)
//
// Étiquettes : latitudes à droite du globe, longitudes (méridiens à 60° au plus du centre)
// sous l'équateur, Nord / Sud /
// Ouest / Est / Équateur à l'extérieur. Deux étiquettes (ou une étiquette et une croix)
// qui se chevauchent font REFUSER la figure ; le contrôle est une estimation de largeur
// de texte et ne voit pas une étiquette posée sur un trait du quadrillage.
//
// Toute figure mal formée donne un HTML VIDE (jamais une figure tronquée qui
// contredirait la réponse) ; erreurs() dit pourquoi.
//
// Tout texte venant de la base est validé (noms) puis échappé. Aucun état :
// fonctions pures. Un SEUL nom global : window.FigureGeo (navigateur) ; sous Node le
// même fichier s'importe par require() (test : lib/figure-geo.manual-test.js).
// Styles : css/figure-geo.css.
// Chargement : <script src="/js/figure-geo.js?v=1"></script> — incrémenter v à chaque
// modification pour contourner le cache.
(function () {
  'use strict'

  const R = 100                       // rayon du globe, en px
  const D = Math.PI / 180
  const PAD = 6                       // marge autour du dessin
  const FS = 11                       // graduations et orientations
  const FS_PT = 14                    // noms des points
  const MAX_POINTS = 8
  const DIST_BORD_MIN = 10            // un parallèle tracé reste à 10 px au moins du bord
  const ANGLE_POINT_MAX = 70          // un point reste à 70° au plus du centre
  const LAT_CENTRE_MAX = 50
  const ECART_GRAD_MAX = 60           // graduation des longitudes : méridiens à 60° au plus du centre (au-delà elles s'écrasent contre le bord)
  const PARALLELES_POSSIBLES = [-60, -30, 30, 60]
  const RE_NOM = /^[A-Za-z0-9]{1,2}'?$/
  const POSITIONS = ['haut_droite', 'haut_gauche', 'bas_droite', 'bas_gauche', 'droite', 'gauche', 'haut', 'bas']
  const DECALAGES = {
    haut_droite: [8, -9, 'start'], haut_gauche: [-8, -9, 'end'],
    bas_droite: [8, 10, 'start'], bas_gauche: [-8, 10, 'end'],
    droite: [12, 0, 'start'], gauche: [-12, 0, 'end'],
    haut: [0, -16, 'middle'], bas: [0, 16, 'middle']
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }
  function n1(x) { return (Math.round(x * 10) / 10).toString() }
  function estNombre(x) { return typeof x === 'number' && isFinite(x) }

  // ── 1. Géométrie ───────────────────────────────────────────────────────
  // Position d'un point (lat, lon) sur l'écran, origine au centre du globe, y vers le BAS.
  // visible : le point est sur la face tournée vers l'observateur (bord compris).
  function projeter(lat, lon, centre) {
    const f = lat * D, p0 = centre.lat * D, dl = (lon - centre.lon) * D
    const cosc = Math.sin(p0) * Math.sin(f) + Math.cos(p0) * Math.cos(f) * Math.cos(dl)
    return {
      x: R * Math.cos(f) * Math.sin(dl),
      y: -R * (Math.cos(p0) * Math.sin(f) - Math.sin(p0) * Math.cos(f) * Math.cos(dl)),
      visible: cosc >= -1e-12,
      cosc: cosc
    }
  }
  // Distance angulaire (degrés) entre le centre de la vue et un point.
  function angleAuCentre(lat, lon, centre) {
    const c = projeter(lat, lon, centre).cosc
    return Math.acos(Math.max(-1, Math.min(1, c))) / D
  }
  // Distance (px) entre le parallèle de latitude lat et le bord du globe, au point le
  // plus proche du centre ; -1 si le parallèle est entièrement caché.
  function distanceBordParallele(lat, centre) {
    const a = Math.abs(centre.lat - lat)
    return a >= 90 ? -1 : R * (1 - Math.sin(a * D))
  }
  // Écart de longitude ramené entre −180 et 180.
  function ecartLon(lon, lon0) { return ((lon - lon0 + 540) % 360 + 360) % 360 - 180 }

  // Morceaux visibles d'une courbe échantillonnée ({x, y, visible}).
  function morceaux(pts) {
    const seg = []
    let cur = []
    pts.forEach(function (q) {
      if (q.visible) cur.push(q)
      else { if (cur.length > 1) seg.push(cur); cur = [] }
    })
    if (cur.length > 1) seg.push(cur)
    return seg
  }
  function courbeParallele(lat, centre) {
    const a = []
    for (let k = -180; k <= 180; k += 1) a.push(projeter(lat, k, centre))
    return morceaux(a)
  }
  function courbeMeridien(lon, centre) {
    const a = []
    for (let k = -90; k <= 90; k += 1) a.push(projeter(k, lon, centre))
    return morceaux(a)
  }

  // ── Boîtes d'étiquettes (estimation de largeur : 0,6 em par signe, 0,66 en gras) ──
  function boiteTexte(x, y, t, anc, fs, gras) {
    const w = t.length * fs * (gras ? 0.66 : 0.6)
    const x0 = anc === 'end' ? x - w : anc === 'start' ? x : x - w / 2
    return { x0: x0, x1: x0 + w, y0: y - fs * 0.75, y1: y + fs * 0.75 }
  }
  function chevauche(a, b) { return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1 }

  // ── Validation et mise en page ─────────────────────────────────────────
  // Renvoie { ok, erreurs, … } ; en cas d'erreur, rien d'autre n'est utilisable.
  function analyser(fig) {
    const e = []
    if (!fig || typeof fig !== 'object' || fig.type !== 'geo') return { ok: false, erreurs: ['type « geo » attendu'] }
    if (fig.vue !== undefined && fig.vue !== 'globe') e.push('vue « ' + fig.vue + ' » non prise en charge (seule « globe » existe)')
    if (fig.fond !== undefined && fig.fond !== 'vierge') e.push('fond « ' + fig.fond + ' » non pris en charge (seul « vierge » existe)')
    const c = fig.centre
    let centre = null
    if (!c || typeof c !== 'object' || !estNombre(c.lat) || !estNombre(c.lon)) e.push('« centre » doit être { lat, lon } (nombres)')
    else if (c.lat < -LAT_CENTRE_MAX || c.lat > LAT_CENTRE_MAX) e.push('latitude du centre : de −' + LAT_CENTRE_MAX + ' à ' + LAT_CENTRE_MAX)
    else if (c.lon < -180 || c.lon > 180) e.push('longitude du centre : de −180 à 180')
    else centre = { lat: c.lat, lon: c.lon }
    if (fig.graduations !== undefined && typeof fig.graduations !== 'boolean') e.push('« graduations » doit être vrai ou faux')
    const graduations = fig.graduations !== false

    if (!centre) return { ok: false, erreurs: e }

    // Parallèles tracés
    let paralleles = []
    if (fig.paralleles === undefined) {
      paralleles = PARALLELES_POSSIBLES.filter(function (la) { return distanceBordParallele(la, centre) >= DIST_BORD_MIN })
    } else if (!Array.isArray(fig.paralleles)) {
      e.push('« paralleles » doit être une liste')
    } else {
      fig.paralleles.forEach(function (la) {
        if (PARALLELES_POSSIBLES.indexOf(la) < 0) { e.push('parallèle ' + la + ' : latitudes possibles −60, −30, 30, 60'); return }
        const d = distanceBordParallele(la, centre)
        if (d < 0) e.push('parallèle ' + la + '° : invisible depuis ce centre')
        else if (d < DIST_BORD_MIN) e.push('parallèle ' + la + '° : à ' + n1(d) + ' px du bord (10 px au moins)')
        else paralleles.push(la)
      })
    }

    // Points
    const pts = []
    const noms = {}
    if (fig.points !== undefined) {
      if (!Array.isArray(fig.points) || fig.points.length > MAX_POINTS) e.push('« points » doit être une liste de ' + MAX_POINTS + ' au plus')
      else fig.points.forEach(function (p, i) {
        const ch = 'points[' + i + ']'
        if (!p || typeof p.nom !== 'string' || !RE_NOM.test(p.nom)) { e.push(ch + ' : nom de 1 ou 2 signes (lettre ou chiffre) + « \' » facultatif'); return }
        if (Object.prototype.hasOwnProperty.call(noms, p.nom)) { e.push(ch + ' : nom « ' + p.nom + ' » déjà utilisé'); return }
        noms[p.nom] = true
        if (!estNombre(p.lat) || !estNombre(p.lon) || p.lat < -90 || p.lat > 90 || p.lon < -180 || p.lon > 180) { e.push(ch + ' : lat de −90 à 90 et lon de −180 à 180'); return }
        if (p.lab !== undefined && !DECALAGES[p.lab]) { e.push(ch + ' : lab inconnu'); return }
        const a = angleAuCentre(p.lat, p.lon, centre)
        if (a > ANGLE_POINT_MAX) { e.push(ch + ' « ' + p.nom + ' » : à ' + n1(a) + '° du centre (' + ANGLE_POINT_MAX + '° au plus, sinon caché ou écrasé contre le bord)'); return }
        pts.push({ nom: p.nom, lat: p.lat, lon: p.lon, lab: p.lab, pos: projeter(p.lat, p.lon, centre) })
      })
    }
    if (e.length) return { ok: false, erreurs: e }

    // Éléments de texte et croix, avec leur boîte
    const textes = []
    const croix = []
    function texte(cls, x, y, t, anc, fs, gras) {
      const el = { cls: cls, x: x, y: y, t: t, anc: anc, fs: fs, boite: boiteTexte(x, y, t, anc, fs, gras) }
      textes.push(el)
      return el
    }
    const Ouest = projeter(0, centre.lon - 90, centre)
    const Est = projeter(0, centre.lon + 90, centre)
    texte('fgeo-orient', 0, -R - 14, 'Nord', 'middle', FS)
    texte('fgeo-orient', 0, R + 14, 'Sud', 'middle', FS)
    texte('fgeo-orient', Ouest.x - 8, Ouest.y, 'Ouest', 'end', FS)
    texte('fgeo-orient', Est.x + 8, Est.y, 'Est', 'start', FS)
    texte('fgeo-equateur-t', Ouest.x - 8, Ouest.y - 18, 'Équateur', 'end', FS)

    if (graduations) {
      paralleles.forEach(function (la) {
        let droit = null
        for (let k = centre.lon - 180; k <= centre.lon + 180; k += 0.5) {
          const q = projeter(la, k, centre)
          if (q.visible && (!droit || q.x > droit.x)) droit = q
        }
        if (!droit) return
        const t = Math.abs(la) + '°' + (la > 0 ? 'N' : 'S')
        const r = Math.hypot(droit.x, droit.y)
        if (r >= R - 2) texte('fgeo-grad', droit.x + droit.x / r * 16, droit.y + droit.y / r * 16, t, 'middle', FS)
        else texte('fgeo-grad', droit.x + 6, droit.y, t, 'start', FS)
      })
      for (let lo = -150; lo <= 180; lo += 30) {
        if (Math.abs(ecartLon(lo, centre.lon)) > ECART_GRAD_MAX) continue
        const q = projeter(0, lo, centre)
        if (!q.visible) continue
        if (lo === 0) texte('fgeo-greenwich-t', q.x - 4, q.y + 14, '0°', 'end', FS)
        else texte('fgeo-grad', q.x, q.y + 14, Math.abs(lo) + '°' + (lo === 180 ? '' : lo > 0 ? 'E' : 'O'), 'middle', FS)
      }
    }

    pts.forEach(function (p) { croix.push({ x: p.pos.x, y: p.pos.y, boite: { x0: p.pos.x - 6, x1: p.pos.x + 6, y0: p.pos.y - 6, y1: p.pos.y + 6 } }) })

    // Positions des noms de points : la première qui ne chevauche rien (ou lab imposé)
    const fixes = textes.map(function (t) { return t.boite }).concat(croix.map(function (c) { return c.boite }))
    const placees = []
    pts.forEach(function (p) {
      const essais = p.lab ? [p.lab] : POSITIONS
      let ok = false
      for (let i = 0; i < essais.length && !ok; i++) {
        const d = DECALAGES[essais[i]]
        const b = boiteTexte(p.pos.x + d[0], p.pos.y + d[1], p.nom, d[2], FS_PT, true)
        if (!fixes.concat(placees).some(function (x) { return chevauche(x, b) })) {
          placees.push(b)
          textes.push({ cls: 'fgeo-pt', x: p.pos.x + d[0], y: p.pos.y + d[1], t: p.nom, anc: d[2], fs: FS_PT, boite: b })
          ok = true
        }
      }
      if (!ok) e.push('point « ' + p.nom + ' » : aucune position libre pour son nom' + (p.lab ? ' (lab « ' + p.lab + ' » chevauche)' : ''))
    })

    // Chevauchements entre étiquettes et croix
    const toutes = textes.map(function (t) { return { n: t.t, b: t.boite } }).concat(croix.map(function (c, i) { return { n: 'croix ' + pts[i].nom, b: c.boite } }))
    for (let i = 0; i < toutes.length; i++) {
      for (let j = i + 1; j < toutes.length; j++) {
        if (chevauche(toutes[i].b, toutes[j].b)) e.push('étiquettes qui se chevauchent : « ' + toutes[i].n + ' » et « ' + toutes[j].n + ' »')
      }
    }
    if (e.length) return { ok: false, erreurs: e }

    // Cadre : le globe et toutes les boîtes
    let x0 = -R, x1 = R, y0 = -R, y1 = R
    toutes.forEach(function (t) { x0 = Math.min(x0, t.b.x0); x1 = Math.max(x1, t.b.x1); y0 = Math.min(y0, t.b.y0); y1 = Math.max(y1, t.b.y1) })
    const minX = Math.floor(x0 - PAD), minY = Math.floor(y0 - PAD)
    return {
      ok: true, erreurs: [], centre: centre, graduations: graduations, paralleles: paralleles,
      points: pts, textes: textes, croix: croix,
      cadre: { minX: minX, minY: minY, w: Math.ceil(x1 + PAD) - minX, h: Math.ceil(y1 + PAD) - minY }
    }
  }
  function valider(fig) { return analyser(fig) }
  function erreurs(fig) { return analyser(fig).erreurs }
  function estGeo(fig) { return !!fig && typeof fig === 'object' && fig.type === 'geo' }

  // ── 2. Dessin ──────────────────────────────────────────────────────────
  function trace(cls, seg) {
    return seg.map(function (g) {
      return '<polyline class="' + cls + '" points="' + g.map(function (q) { return n1(q.x) + ',' + n1(q.y) }).join(' ') + '"/>'
    }).join('')
  }
  // HTML (un <svg>) de la figure, ou chaîne vide si elle est mal formée.
  // L'appelant l'enveloppe dans son propre <div class="q-figure">.
  function html(fig) {
    const a = analyser(fig)
    if (!a.ok) return ''
    const c = a.centre, k = a.cadre
    let s = '<svg class="fgeo-fig" width="' + k.w + '" height="' + k.h + '" viewBox="' + k.minX + ' ' + k.minY + ' ' + k.w + ' ' + k.h + '" style="max-width:' + k.w + 'px" role="img" aria-label="Globe terrestre" xmlns="http://www.w3.org/2000/svg">'
    s += '<circle class="fgeo-bord" cx="0" cy="0" r="' + R + '"/>'
    a.paralleles.forEach(function (la) { s += trace('fgeo-trait', courbeParallele(la, c)) })
    for (let lo = -150; lo <= 180; lo += 30) { if (lo !== 0) s += trace('fgeo-trait', courbeMeridien(lo, c)) }
    s += trace('fgeo-equateur', courbeParallele(0, c))
    s += trace('fgeo-greenwich', courbeMeridien(0, c))
    a.croix.forEach(function (x) {
      s += '<path class="fgeo-croix" d="M' + n1(x.x - 5) + ' ' + n1(x.y - 5) + 'L' + n1(x.x + 5) + ' ' + n1(x.y + 5) + 'M' + n1(x.x - 5) + ' ' + n1(x.y + 5) + 'L' + n1(x.x + 5) + ' ' + n1(x.y - 5) + '"/>'
    })
    a.textes.forEach(function (t) {
      s += '<text class="' + t.cls + '" x="' + n1(t.x) + '" y="' + n1(t.y) + '" text-anchor="' + t.anc + '" dominant-baseline="central">' + esc(t.t) + '</text>'
    })
    return s + '</svg>'
  }

  const api = {
    html: html, valider: valider, erreurs: erreurs, estGeo: estGeo, analyser: analyser,
    projeter: projeter, angleAuCentre: angleAuCentre, distanceBordParallele: distanceBordParallele,
    constantes: { R: R, PAD: PAD, FS: FS, FS_PT: FS_PT, MAX_POINTS: MAX_POINTS, DIST_BORD_MIN: DIST_BORD_MIN, ANGLE_POINT_MAX: ANGLE_POINT_MAX, LAT_CENTRE_MAX: LAT_CENTRE_MAX }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.FigureGeo = api
})()
