// js/simulation-bascule.js — simulation de l'« après bascule » du 01/12/2026,
// pour tester les verrous Accompagné AVANT cette date. Script classique, un
// seul global : window.SimulationBascule. Chargé par suivi-parent.html et
// examen.html. Chargement : <script src="/js/simulation-bascule.js?v=1"></script>
//
// Activation : ouvrir la page avec ?simuler=apres-bascule (mémorisé dans
// sessionStorage, donc propre à l'onglet) ; ?simuler=non la désactive.
// Honorée UNIQUEMENT sur un hôte en « .vercel.app » (aperçus) : jamais sur
// academika.fr ni www.academika.fr.
//
// Limite acceptée : les déploiements de production restent joignables sur une
// adresse « .vercel.app ». Y activer la simulation ne fait que verrouiller
// l'affichage de CET onglet (jamais plus d'accès). Le contrôle strict est côté
// serveur (api/examen.js) : il ne prend en compte le drapeau envoyé par la page
// que si VERCEL_ENV vaut 'preview' (lib/gating.js, apresBascule()).
(function () {
  const CLE = 'academika_simuler_bascule'

  function hoteApercu() {
    return /\.vercel\.app$/.test(window.location.hostname)
  }

  function active() {
    if (!hoteApercu()) return false
    try {
      const demande = new URLSearchParams(window.location.search).get('simuler')
      if (demande === 'apres-bascule') window.sessionStorage.setItem(CLE, '1')
      else if (demande === 'non') window.sessionStorage.removeItem(CLE)
      return window.sessionStorage.getItem(CLE) === '1'
    } catch (e) {
      return false
    }
  }

  // Bandeau fixe en haut de page, uniquement quand la simulation est active.
  function afficherBandeau() {
    if (!active() || document.getElementById('simulation-bascule-bandeau')) return
    const b = document.createElement('div')
    b.id = 'simulation-bascule-bandeau'
    b.setAttribute('role', 'status')
    b.style.cssText = 'position:sticky;top:0;z-index:9999;background:#8A3F05;color:#fff;font:600 12px/1.4 Inter,sans-serif;text-align:center;padding:6px 10px'
    b.textContent = 'Simulation « après bascule » (aperçu) — ajoutez ?simuler=non à l\'adresse pour la désactiver'
    document.body.insertBefore(b, document.body.firstChild)
  }

  window.SimulationBascule = { active, afficherBandeau }
})()
