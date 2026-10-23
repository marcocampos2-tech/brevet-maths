// /lib/quiz-progression.manual-test.js
//
// Test manuel (`node lib/quiz-progression.manual-test.js`) après toute
// modification de construireProgression() (quiz.html, bloc « Progression » de
// l'écran de fin). La fonction est extraite de quiz.html puis évaluée avec les
// globales de la page (diff, SEUIL_SESSIONS, SEUIL_PCT), comme
// lib/quiz-vvf.manual-test.js. Aucune dépendance, aucun accès réseau.
const fs = require('fs')
const path = require('path')

const src = fs.readFileSync(path.join(__dirname, '..', 'quiz.html'), 'utf8')
function extraire(nom) {
  const d = src.indexOf('function ' + nom + '(')
  if (d === -1) throw new Error(nom + ' introuvable dans quiz.html')
  let i = src.indexOf('{', d), n = 0, f = i
  for (; f < src.length; f++) { if (src[f] === '{') n++; else if (src[f] === '}') { n--; if (n === 0) break } }
  return src.slice(d, f + 1)
}
const seuil = nom => Number((src.match(new RegExp('const ' + nom + ' *= *(\\d+)')) || [])[1])
const SEUIL_SESSIONS = seuil('SEUIL_SESSIONS'), SEUIL_PCT = seuil('SEUIL_PCT')
const moteur = new Function('SEUIL_SESSIONS', 'SEUIL_PCT',
  'let diff; ' + extraire('construireProgression') + '; return (niveau, d, pct) => { diff = niveau; return construireProgression(d, pct) }'
)(SEUIL_SESSIONS, SEUIL_PCT)

let echecs = 0
function verifie(nom, ok, detail) {
  if (!ok) { echecs++; console.log('ECHEC  ' + nom + (detail !== undefined ? '  → ' + detail : '')) }
  else console.log('ok     ' + nom)
}
// Texte du seul message (le premier bloc .prog-msg), sans balises.
function message(niveau, d, pct) {
  const html = moteur(niveau, d, pct)
  const m = html.match(/<div class="prog-msg ([a-z]+)">([^<]*)<\/div>/)
  return { classe: m && m[1], texte: m && m[2], html }
}
const base = { moyen: true, difficile: true, sessionsFacile: 0, sessionsMoyen: 0, sessionsDifficile: 0 }
const avec = (o) => Object.assign({}, base, o)
// Aucun message ne doit afficher « encore -N », « N/5 » avec N > 5 ni un nombre négatif.
function propre(m) {
  const t = m.texte
  const ratios = [...t.matchAll(/(\d+)\/(\d+)/g)]
  return !/-\d/.test(t) && !/encore 0/.test(t) && ratios.every(r => Number(r[1]) <= Number(r[2]))
}

console.log('\n[1] Niveau pas encore validé : comportement inchangé')
{
  let m = message('facile', avec({ sessionsFacile: 3 }), 100)
  verifie('Facile 3/5, réussi', m.classe === 'reussi' && m.texte === '✅ Session réussie ! 3/5 sessions Facile avec au moins 4 bonnes réponses sur 5 — encore 2 pour débloquer le Moyen', m.texte)
  m = message('facile', avec({ sessionsFacile: 3 }), 40)
  verifie('Facile 3/5, raté', m.classe === 'info' && m.texte === '💪 Score insuffisant cette fois. 3/5 sessions avec au moins 4 bonnes réponses sur 5 — encore 2 pour débloquer le Moyen', m.texte)
  m = message('moyen', avec({ sessionsMoyen: 1 }), 80)
  verifie('Moyen 1/5, réussi : cible Difficile', m.texte.endsWith('encore 4 pour débloquer le Difficile'), m.texte)
  m = message('difficile', avec({ sessionsDifficile: 2 }), 80)
  verifie('Difficile 2/5, réussi : maîtriser', m.classe === 'reussi' && m.texte === '✅ Session réussie ! 2/5 sessions Difficile avec au moins 4 bonnes réponses sur 5 — encore 3 pour maîtriser ce niveau', m.texte)
  m = message('difficile', avec({ sessionsDifficile: 2 }), 40)
  verifie('Difficile 2/5, raté : maîtriser', m.classe === 'info' && m.texte.endsWith('encore 3 pour maîtriser ce niveau'), m.texte)
}

console.log('\n[2] 5ᵉ réussite : le niveau vient d\'être validé')
{
  let m = message('facile', avec({ sessionsFacile: 5 }), 100)
  verifie('Facile 5/5 réussi : Moyen débloqué', m.classe === 'debloque' && m.texte === '🔓 Niveau Moyen débloqué ! Tu peux maintenant le choisir.', m.texte)
  m = message('moyen', avec({ sessionsMoyen: 5 }), 80)
  verifie('Moyen 5/5 réussi : Difficile débloqué', m.classe === 'debloque' && m.texte === '🔓 Niveau Difficile débloqué ! Tu es au top.', m.texte)
  m = message('difficile', avec({ sessionsDifficile: 5 }), 80)
  verifie('Difficile 5/5 réussi : maîtrisé', m.classe === 'debloque' && m.texte.startsWith('🏆 Niveau Difficile maîtrisé'), m.texte)
}

console.log('\n[3] Niveau déjà validé : plus de compteur au-delà de 5 ni de nombre négatif')
{
  // Cas rapporté : Facile validé, 15 réussites, session ratée.
  let m = message('facile', avec({ sessionsFacile: 15 }), 40)
  verifie('Facile 15 réussites, raté : message de niveau validé', m.classe === 'info' && m.texte === '💪 Score insuffisant cette fois. Niveau Facile déjà validé — le niveau Moyen est ouvert.', m.texte)
  verifie('… sans « encore », sans négatif, sans compteur > 5', !/encore/.test(m.texte) && propre(m), m.texte)
  m = message('facile', avec({ sessionsFacile: 15 }), 100)
  verifie('Facile 15 réussites, réussi', m.classe === 'reussi' && m.texte === '✅ Session réussie ! Niveau Facile déjà validé — le niveau Moyen est ouvert.', m.texte)
  m = message('facile', avec({ sessionsFacile: 6 }), 80)
  verifie('Facile 6 réussites, réussi (juste au-delà du seuil)', m.texte.includes('déjà validé') && propre(m), m.texte)
  m = message('facile', avec({ sessionsFacile: 5 }), 40)
  verifie('Facile 5/5 déjà validé, session ratée : pas de « débloqué » ni de « encore 0 »', m.classe === 'info' && m.texte.includes('déjà validé') && propre(m), m.texte)
  m = message('moyen', avec({ sessionsMoyen: 9 }), 40)
  verifie('Moyen 9 réussites, raté : Difficile ouvert', m.texte === '💪 Score insuffisant cette fois. Niveau Moyen déjà validé — le niveau Difficile est ouvert.', m.texte)
  m = message('moyen', avec({ sessionsMoyen: 9 }), 100)
  verifie('Moyen 9 réussites, réussi', m.texte === '✅ Session réussie ! Niveau Moyen déjà validé — le niveau Difficile est ouvert.', m.texte)
}

console.log('\n[4] Difficile déjà maîtrisé (pas de niveau suivant)')
{
  let m = message('difficile', avec({ sessionsDifficile: 12 }), 40)
  verifie('Difficile 12 réussites, raté', m.classe === 'info' && m.texte === '💪 Score insuffisant cette fois. Niveau Difficile déjà maîtrisé.', m.texte)
  verifie('… sans compteur > 5 ni « encore »', !/encore/.test(m.texte) && propre(m), m.texte)
  m = message('difficile', avec({ sessionsDifficile: 12 }), 100)
  verifie('Difficile 12 réussites, réussi', m.classe === 'reussi' && m.texte === '✅ Session réussie ! Niveau Difficile déjà maîtrisé.', m.texte)
  m = message('difficile', avec({ sessionsDifficile: 5 }), 40)
  verifie('Difficile 5/5 déjà maîtrisé, session ratée', m.texte.includes('déjà maîtrisé') && propre(m), m.texte)
  verifie('aucune mention d\'un niveau suivant en Difficile', !/le niveau/.test(m.texte), m.texte)
}

console.log('\n[5] Balayage : jamais de nombre négatif ni de compteur > 5 dans aucun message ni aucune ligne de barre')
{
  let ko = 0
  for (const niveau of ['facile', 'moyen', 'difficile'])
    for (let n = 0; n <= 25; n++) for (const pct of [0, 40, 60, 80, 100]) {
      const d = avec({ sessionsFacile: n, sessionsMoyen: n, sessionsDifficile: n })
      const html = moteur(niveau, d, pct)
      const texte = html.replace(/<[^>]*>/g, ' ')
      const ratios = [...texte.matchAll(/(\d+)\/(\d+)/g)]
      if (/-\d/.test(texte) || /encore 0/.test(texte) || ratios.some(r => Number(r[1]) > Number(r[2]))) { ko++; if (ko < 4) console.log('   ' + niveau + ' n=' + n + ' pct=' + pct + ' → ' + texte.replace(/\s+/g, ' ').trim()) }
    }
  verifie('375 combinaisons (3 niveaux × 26 compteurs × 5 scores)', ko === 0, ko + ' message(s) fautif(s)')
}

if (echecs) { console.log('\n' + echecs + ' échec(s)'); process.exit(1) }
console.log('\nTous les contrôles passent.')
