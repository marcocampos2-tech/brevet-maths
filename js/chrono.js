// js/chrono.js — mesure d'une durée par HORODATAGE (temps réel écoulé).
//
// Pourquoi : l'ancien chrono de quiz.html comptait des ticks de setInterval.
// Sur mobile, un écran verrouillé ou une appli en arrière-plan suspend la page :
// les ticks s'arrêtent et la durée enregistrée sous-estime le temps réel (test
// du 21/11/2026 : 6 min réelles enregistrées 1 min 6). Ici on mémorise l'heure
// de départ et on calcule `maintenant − départ` à chaque lecture : une pause de
// la page n'efface rien, la valeur se recale seule au retour.
//
// Aucun plafond (décision du 21/11/2026) : tout le temps écoulé compte, pause
// comprise. À réévaluer avec les données réelles.
//
// `maintenant` est injectable (défaut Date.now, en millisecondes) pour tester.
// La valeur rendue est un entier de secondes, jamais négative (Math.max(0, …)),
// même si l'horloge recule ou si `maintenant` renvoie n'importe quoi.
//
// Script classique : `window.Chrono` dans un navigateur, `module.exports` sous
// Node (même modèle que js/prenom.js). Test : node lib/chrono.manual-test.js
;(function () {
  function creer(maintenant) {
    const now = typeof maintenant === 'function' ? maintenant : Date.now
    let depart = null // ms ; null = jamais démarré
    let fige = null   // secondes ; null = en cours (ou jamais démarré)

    const lire = () => {
      const t = Number(now())
      return Number.isFinite(t) ? t : null
    }

    return {
      // (Re)démarre : nouvelle heure de départ, valeur figée effacée.
      demarrer() {
        depart = lire()
        fige = null
      },
      // Secondes entières écoulées depuis demarrer() ; valeur figée après figer() ;
      // 0 si jamais démarré (ou horloge illisible).
      ecoule() {
        if (fige !== null) return fige
        const t = lire()
        if (depart === null || t === null) return 0
        return Math.max(0, Math.floor((t - depart) / 1000))
      },
      // Fige la valeur courante et la renvoie. Idempotent : un second appel
      // garde la première valeur. Sans demarrer() préalable : 0.
      figer() {
        if (fige === null) fige = this.ecoule()
        return fige
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { creer }
  else window.Chrono = { creer }
})()
