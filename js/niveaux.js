// js/niveaux.js — logique et rendu du bloc « Niveau atteint par sous-thème »
// (script classique, même modèle que js/catalogue.js).
//
// Source de la règle : la vue public.niveaux_sous_theme (db/vue-niveaux.sql).
// Ce fichier ne calcule aucun niveau : il classe et met en forme les lignes
// de la vue.
//
// Un SEUL nom global : window.Niveaux. Tout le reste est interne à la
// fermeture, pour éviter toute collision avec les pages hôtes (resultats.html
// définit sa propre celluleNiveau ; esc n'a pas le même sens selon les pages).
// L'échappement HTML ci-dessous est interne : ce fichier n'appelle jamais le
// esc de la page hôte.
//
// Dépendance : js/catalogue.js doit être chargé AVANT (SOUS_THEMES).
// Styles : css/niveaux.css.
// Chargement : <script src="/js/niveaux.js?v=1"></script> — incrémenter v à
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

  const SELECT_NIVEAUX = 'theme, sous_theme, f_reussites, f_essais, m_reussites, m_essais, d_reussites, d_essais, f_etat, m_etat, d_etat, niveau_courant, a_surveiller, derniere_session'

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

  function celluleNiveau(l, niveau) {
    const c = CHAMPS_NIVEAU[niveau]
    const etat = l[c.etat]
    if (etat === 'acquis') return '<div class="niv-cell niv-c-acquis">✓ Acquis</div>'
    if (etat === 'en_cours') {
      const n = Math.min(Number(l[c.reussites]) || 0, 5)
      const cls = (l.a_surveiller && l.niveau_courant === niveau) ? 'niv-c-surv' : 'niv-c-encours'
      return `<div class="niv-cell ${cls}">${nbReussites(n)} sur 5<div class="niv-barre"><span style="width:${n * 20}%"></span></div></div>`
    }
    if (etat === 'jamais_joue') return `<div class="niv-cell niv-c-jamais">${nbReussites(0)} sur 5</div>`
    return `<div class="niv-cell niv-c-verrou">Après le ${niveau === 'moyen' ? 'Facile' : 'Moyen'}</div>`
  }

  // Classement pur (lignes de la vue → textes bruts, non échappés), partagé par
  // la carte HTML et le PDF de bilan. Ordre : récence décroissante.
  function classerNiveaux(lignes) {
    const tries = lignes.slice().sort(parRecence)
    const acquis = [], progression = [], surveiller = []

    tries.forEach(l => {
      const nom = l.sous_theme
      if (l.d_etat === 'acquis') {
        acquis.push(`${nom} : les 3 niveaux validés.`)
      } else if (l.m_etat === 'acquis') {
        acquis.push(`${nom} : niveau Moyen validé.`)
      } else if (l.f_etat === 'acquis') {
        acquis.push(`${nom} : niveau Facile validé.`)
      }

      const niv = l.niveau_courant
      const c = CHAMPS_NIVEAU[niv]
      if (!c || l[c.etat] === 'acquis') return
      const essais = Number(l[c.essais]) || 0
      if (l.a_surveiller) {
        surveiller.push(`${nom} : ${essais} essais au niveau ${NOM_NIVEAU[niv]}, ${nbReussites(l[c.reussites])}.`)
      } else if (essais >= 1) {
        progression.push(`${nom} : ${nbReussites(l[c.reussites])} sur 5 au niveau ${NOM_NIVEAU[niv]}.`)
      }
    })
    return { acquis, progression, surveiller }
  }

  // Rendu pur (lignes de la vue → HTML) : aucune lecture réseau.
  // options.cta    (défaut true)  : false retire tout l'encart « aide
  //                                 ponctuelle » (phrase et lien vers les
  //                                 cours particuliers).
  // options.deplie (défaut false) : true affiche le détail par niveau ouvert.
  // Les défauts reproduisent exactement la page parent.
  function rendreCarteNiveaux(lignes, options) {
    const opt = Object.assign({ cta: true, deplie: false }, options)
    const tries = lignes.slice().sort(parRecence)
    const { acquis, progression, surveiller } = classerNiveaux(lignes)

    const liste = items => '<ul>' + items.map(t => `<li>${echapper(t)}</li>`).join('') + '</ul>'
    const n = tries.length
    let html = `<div class="card"><div class="niv-tete"><div class="niv-titre">Niveau atteint par sous-thème</div>` +
      `<div class="niv-resume">${n} commencé${n > 1 ? 's' : ''} sur ${totalCatalogue()}</div></div>`

    if (acquis.length) {
      html += `<div class="niv-bloc niv-bloc-acquis"><div class="niv-bloc-titre"><span class="niv-ico" aria-hidden="true">✓</span>Acquis</div>${liste(acquis)}</div>`
    }
    if (progression.length) {
      html += `<div class="niv-bloc niv-bloc-prog"><div class="niv-bloc-titre">En progression</div>${liste(progression)}</div>`
    }
    if (surveiller.length) {
      html += `<div class="niv-bloc niv-bloc-surv"><div class="niv-bloc-titre"><span class="niv-ico" aria-hidden="true">⚠</span>À surveiller</div>${liste(surveiller)}` +
        (opt.cta ? `<div class="niv-aide">Une aide ponctuelle peut l'aider à débloquer. <a href="cours-particuliers.html">Découvrir les cours particuliers</a></div>` : '') +
        `</div>`
    }

    html += `<details class="niv-detail"${opt.deplie ? ' open' : ''}><summary>Voir le détail par niveau</summary>` +
      '<div class="niv-wrap"><table class="niv-table"><thead><tr><th class="niv-col-nom" scope="col">Sous-thème</th>' +
      '<th scope="col">Facile</th><th scope="col">Moyen</th><th scope="col">Difficile</th></tr></thead><tbody>'
    tries.forEach(l => {
      html += `<tr><td class="niv-nom">${echapper(l.sous_theme)}</td>` +
        `<td>${celluleNiveau(l, 'facile')}</td><td>${celluleNiveau(l, 'moyen')}</td><td>${celluleNiveau(l, 'difficile')}</td></tr>`
    })
    html += '</tbody></table></div>' +
      '<div class="niv-legende">Une réussite = au moins 4 bonnes réponses sur 5. Un niveau est acquis après 5 réussites, ce qui ouvre le niveau suivant.</div>' +
      '</details></div>'
    return html
  }

  window.Niveaux = {
    NOM_NIVEAU, CHAMPS_NIVEAU, SELECT_NIVEAUX,
    nbReussites, parRecence, totalCatalogue,
    celluleNiveau, classerNiveaux, rendreCarteNiveaux
  }
})()
