<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#1B2A4A">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="ACADEMIKA">
<meta name="description" content="Révise ton Brevet de Maths avec des QCM en ligne — 100% gratuit pour les élèves de 3e">
<title>ACADEMIKA — Brevet Maths</title>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<style>
.banniere-presentiel-accueil {
  display: none;
  max-width: 640px;
  margin: 2.5rem auto 2rem;
  padding: 22px 24px;
  border-radius: 14px;
  text-align: center;
  background: #FBEDEC;
  border: 1px solid #9E2B25;
}
.banniere-presentiel-accueil-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: #9E2B25; color: white;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px;
}
.banniere-presentiel-accueil-icon svg { width: 19px; height: 19px; }
.banniere-presentiel-accueil-titre {
  font-family: 'Newsreader', serif; font-size: 19px; font-weight: 600;
  color: #9E2B25; margin-bottom: 6px;
}
.banniere-presentiel-accueil-sub {
  font-size: 13px; color: #41454C; opacity: 0.85; margin-bottom: 6px;
}
.banniere-presentiel-accueil-places {
  font-size: 12.5px; color: #9E2B25; font-weight: 500; margin-bottom: 18px;
}
.banniere-presentiel-accueil-btn {
  display: inline-block; padding: 13px 28px;
  background: #9E2B25; color: white; border: none; border-radius: 10px;
  font-size: 14px; font-weight: 600; text-decoration: none;
  font-family: 'Inter', sans-serif;
}
</style>
</head>
<body>

<header class="site-header">
  <a href="index.html" class="logo">ACADEMIKA</a>
  <nav class="main-nav">
    <a href="#quiz">Offres</a>
    <a href="cours-particuliers.html">Cours particuliers</a>
    <a href="stages-vacances.html">Stages vacances</a>
    <a href="#methode">Méthode</a>
    <a href="#contact">Contact</a>
  </nav>
  <div style="display:flex;align-items:center;gap:12px">
    <a href="connexion.html" class="btn-connexion">Connexion</a>
    <button class="burger" id="burger" onclick="toggleMenu()">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<div class="mobile-menu" id="mobileMenu">
  <a href="#quiz">Offres</a>
  <a href="cours-particuliers.html">Cours particuliers</a>
  <a href="stages-vacances.html">Stages vacances</a>
  <a href="#methode">Méthode</a>
  <a href="#contact">Contact</a>
</div>

<section class="hero">
  <div class="hero-tag">Brevet de maths · Élèves de 3e</div>
  <div class="hero-title">Réussis ton brevet de maths, seul ou avec un vrai prof</div>
  <div class="hero-sub">Quiz ciblés, explications détaillées, à ton rythme</div>
  <a href="connexion.html" class="btn-gold">Commencer gratuitement</a>
</section>

<div class="banniere-presentiel-accueil" id="banniere-presentiel-accueil">
  <div class="banniere-presentiel-accueil-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  </div>
  <div class="banniere-presentiel-accueil-titre">Examen blanc en présentiel</div>
  <div class="banniere-presentiel-accueil-sub">Sujet type brevet · Correction le jour même</div>
  <div class="banniere-presentiel-accueil-places" id="banniere-presentiel-accueil-places"></div>
  <a href="brevet-blanc.html" class="banniere-presentiel-accueil-btn">Voir les dates et s'inscrire →</a>
</div>

<section id="quiz">
  <div class="section-label">Comment ça marche</div>
  <div class="section-title">Trois étapes vers la réussite</div>
  <div class="steps-grid">
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-title">Crée ton compte</div>
      <div class="step-desc">Crée ton compte en deux minutes et commence tout de suite</div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-title">Choisis ton domaine</div>
      <div class="step-desc">Quatre domaines du brevet, du niveau facile au niveau expert</div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-title">Progresse chaque jour</div>
      <div class="step-desc">Correction immédiate et déblocage des niveaux au fil de tes réussites</div>
    </div>
  </div>
</section>

<section class="alt-bg">
  <div class="section-title">Une offre adaptée à chaque besoin</div>
  <div class="offers-grid">
    <div class="offer-card">
      <div class="offer-label">Gratuit</div>
      <div class="offer-desc">Quiz illimités pour t'entraîner à ton rythme</div>
      <div class="offer-price">0 €</div>
    </div>
    <div class="offer-card highlight">
      <div class="offer-label">Abonnement</div>
      <div class="offer-desc">Suivi personnalisé et examen blanc pour arriver prêt le jour J</div>
      <div class="offer-price">par mois</div>
    </div>
    <div class="offer-card">
      <div class="offer-label">Cours particuliers</div>
      <div class="offer-desc">Accompagnement individuel en visio ou présentiel</div>
      <div class="offer-price">sur devis</div>
    </div>
  </div>
</section>

<section id="methode">
  <div class="method-block">
    <div class="method-avatar">MC</div>
    <div>
      <div class="section-label" style="text-align:left">La méthode</div>
      <h2 style="font-size:24px;margin-bottom:16px">Conçue par un ingénieur passionné, fort de 10 ans de soutien scolaire sur le terrain</h2>
      <p style="font-size:14px;line-height:1.7">Exercices ciblés par sous-thème, corrections étape par étape, progression par niveaux — une méthode simple et efficace.</p>
    </div>
  </div>
</section>

<footer class="site-footer" id="contact">
  <span class="logo">ACADEMIKA</span>
  <div class="footer-links">
    <a href="#quiz">Offres</a>
    <a href="cours-particuliers.html">Cours particuliers</a>
    <a href="stages-vacances.html">Stages vacances</a>
    <a href="connexion.html">Connexion</a>
  </div>
  <div class="contact-block">
    <a href="tel:+33626539013">📞 06 26 53 90 13</a>
    <a href="mailto:contact@academika.fr">✉️ contact@academika.fr</a>
  </div>
</footer>

<script>
function toggleMenu() {
  document.getElementById('burger').classList.toggle('open')
  document.getElementById('mobileMenu').classList.toggle('open')
}

async function afficherBanniereExamenPresentielAccueil() {
  try {
    const res = await fetch('/api/inscription-brevet?action=sessions')
    const data = await res.json()
    const sessions = (data.sessions || []).filter(s => !s.complet)
    if (sessions.length === 0) return
    const banniere = document.getElementById('banniere-presentiel-accueil')
    const places = document.getElementById('banniere-presentiel-accueil-places')
    places.textContent = sessions.length + ' session' + (sessions.length > 1 ? 's' : '') + ' disponible' + (sessions.length > 1 ? 's' : '')
    banniere.style.display = 'block'
  } catch(e) { console.log('Erreur chargement bandeau présentiel:', e.message) }
}

afficherBanniereExamenPresentielAccueil()
</script>

</body>
</html>
