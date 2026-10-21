// /lib/bilan-email.manual-test.js
//
// Test manuel (pas de CI) : `node lib/bilan-email.manual-test.js`.
// Couvre lib/bilan-email.js, lib/garde-envoi.js, le type 'bilan' de api/email.js
// et le bilan périodique de api/cron-rappel.js contre un faux Supabase / Resend
// en mémoire : aucun réseau, aucun vrai email. Horloge figée (cf. MAINTENANT).
//
// Cas central (critère d'acceptation du lot 3) : les 17 lignes RÉELLES de la
// vue niveaux_sous_theme de l'élève 711bc196 (relevé du 20/10/2026). Le bilan
// doit reprendre, mot pour mot et dans le même ordre, ce qu'affiche la page
// parent (js/niveaux.js exécuté DANS UN FAUX NAVIGATEUR, pas importé).
//
// PREVIEW_DIR=<répertoire> : écrit en plus bilan-complet.html et
// bilan-tronque.html (fixture de l'élève 711bc196).
//
// Les handlers sont recopiés en .mjs dans un répertoire temporaire pour la
// même raison que lib/recap-journalier.manual-test.js (package.json sans
// "type": "module", les handlers utilisent `export default`).

const fs = require('fs')
const os = require('os')
const path = require('path')
const vm = require('vm')
const { pathToFileURL } = require('url')

const RACINE = path.join(__dirname, '..')
let MAINTENANT = '2026-10-20T09:00:00.000Z' // mardi 20 octobre 2026, 11h00 à Paris

let nbOk = 0
let nbKo = 0
function check(libelle, ok, detail) {
  if (ok) { nbOk++; console.log(`  ✅ ${libelle}`) }
  else { nbKo++; console.log(`  ❌ ${libelle}${detail ? ' — ' + detail : ''}`) }
}

const DateReelle = Date
class DateFigee extends DateReelle {
  constructor(...a) { if (a.length === 0) super(MAINTENANT); else super(...a) }
  static now() { return new DateReelle(MAINTENANT).getTime() }
}
global.Date = DateFigee

const bilan = require('./bilan-email')
const garde = require('./garde-envoi')
const gating = require('./gating')

// ── Fixture RÉELLE : vue niveaux_sous_theme de l'élève 711bc196, relevée le
// 21/10/2026 avec la règle « à surveiller » en production (db/vue-niveaux.sql) :
// seul Statistiques est à surveiller (Facile, 4 derniers essais, 0 réussite) ;
// Fonctions ne l'est plus (4 derniers essais, 4 réussites).
const UID = '711bc196-928d-4b54-8e4b-e19763e83eb8'
const COLS = ['theme', 'sous_theme', 'f_reussites', 'f_essais', 'm_reussites', 'm_essais', 'd_reussites', 'd_essais', 'f_etat', 'm_etat', 'd_etat', 'niveau_courant', 'a_surveiller', 'derniere_session', 'derniers_essais', 'dernieres_reussites']
const ORG = 'Organisation et gestion de données, fonctions'
const NC = 'Nombres et calculs'
const EG = 'Espace et géométrie'
const GM = 'Grandeurs et mesures'
const VUE_711 = [
  [ORG, 'Statistiques', 1, 5, 0, 2, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', true, '2026-10-18 18:40:11.083732', 4, 0],
  [NC, 'Nombres relatifs', 6, 7, 4, 5, 0, 0, 'acquis', 'en_cours', 'verrouille', 'moyen', false, '2026-10-18 01:44:50.299829', 4, 3],
  [ORG, 'Fonctions', 4, 6, 0, 0, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', false, '2026-10-15 21:30:34.96573', 4, 4],
  [ORG, 'Probabilités', 4, 4, 0, 0, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', false, '2026-10-15 20:47:17.617189', 4, 4],
  [NC, 'Fractions', 7, 8, 4, 5, 0, 0, 'acquis', 'en_cours', 'verrouille', 'moyen', false, '2026-10-15 20:39:32.118469', 4, 3],
  [EG, 'Théorème de Pythagore', 4, 4, 0, 0, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', false, '2026-10-15 16:29:18.182917', 4, 4],
  [NC, 'Équations', 5, 6, 1, 1, 0, 0, 'acquis', 'en_cours', 'verrouille', 'moyen', false, '2026-10-14 22:42:33.759886', 1, 1],
  [NC, 'Calcul littéral', 6, 6, 3, 4, 2, 2, 'acquis', 'en_cours', 'verrouille', 'moyen', false, '2026-10-14 15:24:33.570442', 4, 3],
  [EG, 'Trigonométrie', 8, 10, 1, 1, 0, 0, 'acquis', 'en_cours', 'verrouille', 'moyen', false, '2026-10-13 20:29:37.831302', 1, 1],
  [EG, 'Théorème de Thalès', 2, 4, 0, 0, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', false, '2026-10-12 20:24:45.635622', 4, 2],
  [GM, 'Aires et volumes', 1, 1, 0, 0, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', false, '2026-09-24 21:08:11.411593', 1, 1],
  [EG, 'Transformations', 0, 1, 0, 0, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', false, '2026-09-23 21:21:25.365625', 1, 0],
  [NC, 'Arithmétique', 0, 1, 0, 0, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', false, '2026-09-23 21:08:33.181015', 1, 0],
  [GM, 'Conversions', 1, 2, 0, 0, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', false, '2026-08-23 12:55:47.055382', 2, 1],
  [EG, 'Triangles semblables', 0, 1, 0, 0, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', false, '2026-08-20 11:53:44.103007', 1, 0],
  [ORG, 'Pourcentages', 1, 1, 0, 0, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', false, '2026-08-18 07:00:46.403994', 1, 1],
  [ORG, 'Proportionnalité', 0, 2, 0, 0, 0, 0, 'en_cours', 'verrouille', 'verrouille', 'facile', false, '2026-08-16 04:37:07.325291', 2, 0]
].map(r => Object.fromEntries(COLS.map((c, i) => [c, r[i]])))

// ── Faux navigateur : js/niveaux.js tel que la page parent le charge ──
function chargerNiveauxNavigateur() {
  const ctx = vm.createContext({ window: {} })
  vm.runInContext(fs.readFileSync(path.join(RACINE, 'js/catalogue.js'), 'utf8'), ctx)
  vm.runInContext(fs.readFileSync(path.join(RACINE, 'js/niveaux.js'), 'utf8'), ctx)
  return ctx.window.Niveaux
}

const decoder = t => t.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
const lignesPuces = html => [...html.matchAll(/>· (.*?)<\/div>/g)].map(m => decoder(m[1]))
const texteVisible = html => decoder(html.replace(/<[^>]+>/g, '\n').split('\n').map(l => l.trim()).filter(Boolean).join('\n'))

function res() {
  const r = { code: 200, body: null, headers: {} }
  r.setHeader = (k, v) => { r.headers[k] = v }
  r.status = c => { r.code = c; return r }
  r.json = b => { r.body = b; return r }
  r.end = () => r
  return r
}

async function main() {
  // ═══ 1. Critère d'acceptation : l'élève 711bc196 ═══
  console.log('\n── 1. Élève 711bc196 : le bilan = la page parent ──')
  {
    const NavNiveaux = chargerNiveauxNavigateur()
    const attendu = NavNiveaux.classerNiveaux(VUE_711)
    const donnees = {
      version: 'complet', prenom: 'Théo', premier: false, debut: new Date('2026-09-29T08:00:00Z'), fin: new Date(MAINTENANT),
      activite: bilan.resumeActivite([]), lignes: VUE_711, nouveaux: null, accesOffertJusqu: null
    }
    const { html, sujet } = bilan.rendreBilan(donnees)
    const puces = lignesPuces(html)

    // Bloc « À surveiller » : mêmes phrases que la page parent (classerNiveaux exécuté
    // dans un faux navigateur) ; Acquis et En progression ne sont plus des blocs.
    check('bloc « À surveiller » = celui de la page parent (faux navigateur), mêmes phrases',
      JSON.stringify(puces) === JSON.stringify(attendu.surveiller), JSON.stringify(puces))
    check('711bc196 : « Statistiques : 0 réussite sur ses 4 derniers essais au niveau Facile. » est la SEULE phrase du bilan',
      puces.length === 1 && puces[0] === 'Statistiques : 0 réussite sur ses 4 derniers essais au niveau Facile.', JSON.stringify(puces))
    const carte = NavNiveaux.rendreCarteNiveaux(VUE_711)
    const lisSurv = carte.split('niv-bloc-surv')[1].split('niv-aide')[0].match(/<li>(.*?)<\/li>/g).map(x => decoder(x.replace(/<\/?li>/g, '')))
    check('… = les <li> du bloc « À surveiller » de rendreCarteNiveaux() (la carte de la page parent)', JSON.stringify(puces) === JSON.stringify(lisSurv))
    check('le classement serveur (require) = le classement navigateur', JSON.stringify(Object.keys(require('../js/niveaux.js'))) === JSON.stringify(Object.keys(NavNiveaux)))
    const txt = texteVisible(html)
    check('plus de blocs Acquis ni En progression (aucune phrase « niveau Facile validé » / « réussites sur 5 au niveau »)',
      !/niveau (Facile|Moyen|Difficile) validé|sur 5 au niveau|En progression/.test(txt), txt.slice(0, 300))

    // Grille : identique ligne à ligne à « Voir le détail par niveau » de la page.
    const grillePage = carte.split('<tbody>')[1].split('</tbody>')[0].split('<tr>').slice(1).map(tr => {
      const nom = decoder(tr.match(/<td class="niv-nom">(.*?)<\/td>/)[1])
      // Cases de la page : <div class="niv-cell niv-c-X"> (ligne 1 / ligne 2 / barre, ou texte seul).
      const cases = tr.split('<td>').slice(1).map(td => {
        const classe = td.match(/niv-c-(\w+)/)[1]
        const l1 = (td.match(/<div class="niv-l1">(.*?)<\/div>/) || [])[1]
        const l2 = (td.match(/<div class="niv-l2">(.*?)<\/div>/) || [])[1]
        const brut = l1 !== undefined ? l1 : td.replace(/<[^>]+>/g, '')
        const barre = td.match(/<span style="width:(\d+)%">/)
        return { classe, texte: decoder(brut + (l2 ? ' ' + l2 : '')), barre: barre ? Number(barre[1]) : null }
      })
      return { nom, cases }
    })
    const FOND_VERS_CLASSE = { '#EAF6EF': 'acquis', '#FBF4E4': 'encours', '#FFF1E3': 'surv', '#FAF9F6': 'creme' }
    const grilleMail = html.split('width:31%;font-size:12.5px').slice(1).map(seg => {
      const nom = decoder(seg.match(/">(.*?)<\/td>/)[1])
      const cases = seg.split('<td style="padding:6px 2px').slice(1, 4).map(c => {
        const fond = c.match(/background:(#\w+);border:1px solid (#\w+)/)[1]
        const l1 = c.match(/line-height:1\.3;color:#\w+;(?:font-weight:700;)?text-align:center;padding:[^"]*">(.*?)<\/td>/)[1]
        const l2 = (c.match(/opacity:0\.85;text-align:center;padding:1px 3px 5px">(.*?)<\/td>/) || [])[1]
        const texte = decoder(l1 + (l2 ? ' ' + l2 : ''))
        const largeur = c.match(/<td width="(\d+)%"/)
        return { fond, texte, barre: largeur ? Number(largeur[1]) : null }
      })
      return { nom, cases }
    })
    check('grille : 17 lignes, mêmes sous-thèmes dans le même ordre que la page parent',
      grilleMail.length === 17 && JSON.stringify(grilleMail.map(r => r.nom)) === JSON.stringify(grillePage.map(r => r.nom)), JSON.stringify(grilleMail.map(r => r.nom)))
    const ecarts = []
    grillePage.forEach((rp, i) => rp.cases.forEach((cp, j) => {
      const cm = (grilleMail[i] || { cases: [] }).cases[j] || {}
      const classeMail = FOND_VERS_CLASSE[cm.fond]
      const classeOk = cp.classe === 'jamais' || cp.classe === 'verrou' ? classeMail === 'creme' : classeMail === cp.classe
      // La page dessine une barre pour « en cours » et « à surveiller » (largeur = réussites × 20 %),
      // jamais pour acquis ; l'email la dessine en cellule de tableau, largeur absente quand 0 %.
      const barreOk = (cp.classe === 'encours' || cp.classe === 'surv') ? (cm.barre || 0) === cp.barre : cm.barre === null
      if (cm.texte !== cp.texte || !classeOk || !barreOk) ecarts.push(`${rp.nom}/${['Facile', 'Moyen', 'Difficile'][j]} : page=${JSON.stringify(cp)} mail=${JSON.stringify(cm)}`)
    }))
    check('grille : chaque case (texte, couleur, barre) = celle de la page parent, ligne à ligne', ecarts.length === 0, ecarts.slice(0, 3).join(' | '))
    const ligneDe = nom => grilleMail.find(r => r.nom === nom).cases.map(c => c.texte)
    check('Calcul littéral : ✓ Acquis | 3 / 5 réussites en 4 essais | Après le Moyen (Difficile verrouillé malgré 2 réussites héritées)', JSON.stringify(ligneDe('Calcul littéral')) === JSON.stringify(['✓ Acquis', '3 / 5 réussites en 4 essais', 'Après le Moyen']), JSON.stringify(ligneDe('Calcul littéral')))
    check('Fonctions n\'est plus signalé : 4 / 5 réussites en 6 essais (case dorée « en cours », pas orange) | Après le Facile | Après le Moyen',
      JSON.stringify(ligneDe('Fonctions')) === JSON.stringify(['4 / 5 réussites en 6 essais', 'Après le Facile', 'Après le Moyen']) && grilleMail.find(r => r.nom === 'Fonctions').cases[0].fond === '#FBF4E4')
    check('Statistiques (à surveiller) : 1 / 5 réussites en 5 essais en orange | verrouillé | verrouillé (2 essais Moyen hérités non montrés)',
      JSON.stringify(ligneDe('Statistiques')) === JSON.stringify(['1 / 5 réussites en 5 essais', 'Après le Facile', 'Après le Moyen']) && grilleMail.find(r => r.nom === 'Statistiques').cases[0].fond === '#FFF1E3')
    check('Transformations : « 0 / 5 réussites en 1 essai »', ligneDe('Transformations')[0] === '0 / 5 réussites en 1 essai')

    // Mise en forme demandée
    check('bloc « À surveiller » orange : fond #FFF1E3, fine bordure #E8892B tout autour, pas de barre à gauche',
      /<table[^>]*background:#FFF1E3;border:1px solid #E8892B;border-radius:10px"/.test(html) && !/border-left:4px solid #E8892B/.test(html) && /color:#8A3F05[^>]*>⚠ À surveiller/.test(html))
    check('phrase d\'aide + lien « Découvrir les cours particuliers » (cours-particuliers.html)', /Une aide ponctuelle peut l'aider à débloquer\./.test(txt) && html.includes('https://www.academika.fr/cours-particuliers.html') && /Découvrir les cours particuliers/.test(txt))
    check('légende : Acquis / En cours / À surveiller / Pas encore ouvert + phrase de règle',
      ['Acquis', 'En cours', 'À surveiller', 'Pas encore ouvert'].every(m => new RegExp(`>${m}</span>`).test(html)) &&
      txt.includes('« 4 / 5 réussites » = 4 réussites obtenues sur les 5 nécessaires pour valider le niveau. Une réussite = au moins 4 bonnes réponses sur 5. Un niveau validé ouvre le niveau suivant.'))
    check('ordre : activité, [nouveaux niveaux], À surveiller, grille, légende',
      html.indexOf('⚠ À surveiller') < html.indexOf('table-layout:fixed') && html.indexOf('table-layout:fixed') < html.indexOf('Pas encore ouvert'))
    check('aucune moyenne, note /20, mention ni pourcentage de verdict', !/\/20|Excellent|À revoir|Acquis ≥/.test(txt), txt.slice(0, 200))
    check('sujet sans moyenne', sujet === '📊 Bilan de progression de Théo — ACADEMIKA')

    // Rien à surveiller : bloc et phrase d'aide absents
    const sansSurv = bilan.rendreBilan({ ...donnees, lignes: VUE_711.map(l => ({ ...l, a_surveiller: false })) })
    check('rien à surveiller : ni bloc « À surveiller » ni aide ni lien cours particuliers', !/À surveiller<|⚠|Une aide ponctuelle|cours-particuliers/.test(sansSurv.html.replace(/>À surveiller<\/span>/, '')))
    check('… la grille reste affichée', /table-layout:fixed/.test(sansSurv.html) && sansSurv.html.includes('✓ Acquis'))

    if (process.env.PREVIEW_DIR) {
      fs.mkdirSync(process.env.PREVIEW_DIR, { recursive: true })
      const doc = h => `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">${h}`
      const nouveaux = bilan.nouveauxNiveaux({ Fractions: ['facile'] }, VUE_711)
      const c = bilan.rendreBilan({ ...donnees, activite: bilan.resumeActivite([{ created_at: '2026-10-15T20:39:32', temps_secondes: 420, abandonne: false }, { created_at: '2026-10-18T18:40:11', temps_secondes: 3300, abandonne: false }, { created_at: '2026-10-18T19:00:00', temps_secondes: 20, abandonne: true }]), nouveaux, accesOffertJusqu: '2026-12-31' })
      fs.writeFileSync(path.join(process.env.PREVIEW_DIR, 'bilan-complet.html'), doc(c.html))
      const t = bilan.rendreBilan({ ...donnees, version: 'tronque', activite: bilan.resumeActivite([{ created_at: '2026-10-15T20:39:32', temps_secondes: 420, abandonne: false }]) })
      fs.writeFileSync(path.join(process.env.PREVIEW_DIR, 'bilan-tronque.html'), doc(t.html))
    }
  }

  // ═══ 2. Règles pures ═══
  console.log('\n── 2. choisirVersion ──')
  {
    const LIBRE = { plan_actif: false, cours_particuliers_actif: false, acces_offert_jusqu: null }
    const AV = new DateReelle('2026-11-30T12:00:00+01:00')
    const AP = new DateReelle('2026-12-02T12:00:00+01:00')
    const v = (p, util, m, sim) => bilan.choisirVersion({ profil: p, aBilanUtile: util, maintenant: m, simulerBascule: sim })
    check('avant la bascule : complet pour un Libre qui a déjà un bilan utile', v(LIBRE, true, AV).version === 'complet' && v(LIBRE, true, AV).motif === 'lancement')
    check('après : Libre, 1er bilan utile → complet', v(LIBRE, false, AP).version === 'complet' && v(LIBRE, false, AP).motif === 'premier_bilan')
    check('après : Libre, bilan utile déjà reçu → tronqué', v(LIBRE, true, AP).version === 'tronque')
    check('après : abonné → complet (abonnement)', v({ ...LIBRE, plan_actif: true }, true, AP).motif === 'abonnement')
    check('après : cours particuliers → complet', v({ ...LIBRE, cours_particuliers_actif: true }, true, AP).motif === 'cours')
    check('après : accès offert en cours → complet', v({ ...LIBRE, acces_offert_jusqu: '2026-12-02' }, true, AP).motif === 'acces_offert')
    check('après : accès offert expiré hier → tronqué', v({ ...LIBRE, acces_offert_jusqu: '2026-12-01' }, true, AP).version === 'tronque')
    check('aBilanUtile non booléen (undefined) → jamais tronqué par accident', v(LIBRE, undefined, AP).version === 'complet')
    process.env.VERCEL_ENV = 'preview'
    check('preview + simulation → tronqué avant la date réelle', v(LIBRE, true, AV, true).version === 'tronque')
    process.env.VERCEL_ENV = 'production'
    check('production + simulation → ignorée (complet)', v(LIBRE, true, AV, true).version === 'complet')
    delete process.env.VERCEL_ENV
    check('accesOffertEnCours : abonné → null (le motif est l\'abonnement)', bilan.accesOffertEnCours({ plan_actif: true, acces_offert_jusqu: '2026-12-31' }, AP) === null)
    check('accesOffertEnCours : date du jour incluse', bilan.accesOffertEnCours({ acces_offert_jusqu: '2026-12-02' }, AP) === '2026-12-02')
    check('accesOffertEnCours : expiré → null', bilan.accesOffertEnCours({ acces_offert_jusqu: '2026-12-01' }, AP) === null)
  }

  console.log('\n── 3. Activité, durée ──')
  {
    const a = bilan.resumeActivite([
      { created_at: '2026-10-08T21:59:59', temps_secondes: 600, abandonne: false },
      { created_at: '2026-10-08T22:00:00', temps_secondes: 90, abandonne: false }, // 00h00 le 9 à Paris : autre jour
      { created_at: '2026-10-09T07:00:00', temps_secondes: 30, abandonne: false },  // même jour Paris que la précédente
      { created_at: '2026-10-12T07:00:00', temps_secondes: 9999, abandonne: true } // interrompue : exclue partout
    ])
    check('3 sessions terminées, 1 interrompue exclue', a.terminees === 3 && a.interrompues === 1)
    check('durée = somme des terminées seulement', a.dureeSecondes === 720)
    check('jours actifs = jours Paris (22:00 UTC bascule au lendemain), abandons exclus', a.joursActifs === 2, String(a.joursActifs))
    check('liste vide / non tableau', bilan.resumeActivite([]).terminees === 0 && bilan.resumeActivite(null).joursActifs === 0)
    const f = bilan.formatDureeLongue
    check('formatDureeLongue', f(0) === "moins d'une minute" && f(59) === "moins d'une minute" && f(60) === '1 min' && f(3540) === '59 min' && f(3600) === '1 h' && f(3900) === '1 h 05' && f(7200) === '2 h' && f(undefined) === "moins d'une minute" && f(-5) === "moins d'une minute")
  }

  console.log('\n── 4. Snapshot et nouveaux niveaux ──')
  {
    const snap = bilan.snapshotNiveaux(VUE_711)
    check('snapshot : seuls les niveaux acquis (Facile pour 5 sous-thèmes)', Object.keys(snap).length === 5 && Object.values(snap).every(v => JSON.stringify(v) === '["facile"]'), JSON.stringify(snap))
    check('snapshot : aucun sous-thème sans niveau acquis', !('Fonctions' in snap) && !('Statistiques' in snap))
    check('snapshot vide / non tableau', JSON.stringify(bilan.snapshotNiveaux([])) === '{}' && JSON.stringify(bilan.snapshotNiveaux(null)) === '{}')
    check('avant NULL (ancienne ligne) → null : aucune comparaison', bilan.nouveauxNiveaux(null, VUE_711) === null && bilan.nouveauxNiveaux(undefined, VUE_711) === null && bilan.nouveauxNiveaux([], VUE_711) === null)
    const depuisDebut = bilan.nouveauxNiveaux({}, VUE_711)
    check('référence vide (premier bilan) : tout l\'acquis est nouveau', depuisDebut.length === 5)
    const apres = bilan.nouveauxNiveaux({ Fractions: ['facile'], 'Nombres relatifs': ['facile'], Équations: ['facile'] }, VUE_711)
    check('seuls les niveaux absents du snapshot précédent', apres.map(x => x.sous_theme).sort().join('|') === ['Calcul littéral', 'Trigonométrie'].sort().join('|'), JSON.stringify(apres))
    const deux = bilan.nouveauxNiveaux({ A: ['facile'] }, [{ sous_theme: 'A', f_etat: 'acquis', m_etat: 'acquis', d_etat: 'verrouille', derniere_session: '2026-10-01' }])
    check('un seul nouveau niveau parmi deux acquis', JSON.stringify(deux) === '[{"sous_theme":"A","niveaux":["moyen"]}]', JSON.stringify(deux))
    check('aucune régression fantôme : un niveau acquis avant et plus après n\'est pas « nouveau »', bilan.nouveauxNiveaux({ Fonctions: ['facile'] }, VUE_711).every(x => x.sous_theme !== 'Fonctions'))
    check('phrase : un niveau / plusieurs niveaux', bilan.phraseNouveau({ sous_theme: 'X', niveaux: ['facile'] }) === 'X : niveau Facile validé.' && bilan.phraseNouveau({ sous_theme: 'X', niveaux: ['facile', 'moyen', 'difficile'] }) === 'X : niveaux Facile, Moyen et Difficile validés.')
  }

  console.log('\n── 5. Rendu ──')
  {
    const base = { version: 'complet', prenom: 'Théo', premier: false, debut: new Date('2026-09-29T08:00:00Z'), fin: new Date(MAINTENANT), activite: bilan.resumeActivite([{ created_at: '2026-10-15T20:00:00', temps_secondes: 600, abandonne: false }, { created_at: '2026-10-16T20:00:00', temps_secondes: 5, abandonne: true }]), lignes: VUE_711, nouveaux: [{ sous_theme: 'Fractions', niveaux: ['facile'] }], accesOffertJusqu: null }
    const c = bilan.rendreBilan(base)
    const t = texteVisible(c.html)
    check('complet : résumé d\'activité sans moyenne, abandons entre parenthèses', /1 session terminée · 1 jour de révision · 10 min/.test(t) && /\(\+ 1 session interrompue\)/.test(t), t.slice(0, 400))
    check('complet : ligne « Nouveaux niveaux validés depuis le dernier bilan »', /Nouveaux niveaux validés depuis le dernier bilan/.test(t) && t.includes('Fractions : niveau Facile validé.'))
    check('complet : lien espace parent', c.html.includes('https://www.academika.fr/espace-parent.html'))
    check('complet : aide « cours particuliers » sous À surveiller', c.html.includes('https://www.academika.fr/cours-particuliers.html'))
    check('complet : pas de bouton Accompagné', !/Passer à Accompagné/.test(t))
    check('compatible clients mail : tableaux, pas de <details>/<style>/<link>/<script>/classe CSS', c.html.includes('<table') && !/<details|<style|<link|<script|class=/.test(c.html))
    check('lien de désabonnement = adresse fournie, encodée', c.html.includes('desabonner.html?email='))
    const sans = bilan.rendreBilan({ ...base, nouveaux: [] })
    check('aucun nouveau niveau (comparaison faite) → phrase explicite', /Aucun nouveau niveau validé depuis le dernier bilan\./.test(texteVisible(sans.html)))
    const nul = bilan.rendreBilan({ ...base, nouveaux: null })
    check('pas de comparaison possible (snapshot NULL) → aucune ligne « nouveaux niveaux »', !/nouveau/.test(texteVisible(nul.html)))
    const prem = bilan.rendreBilan({ ...base, premier: true, nouveaux: [{ sous_theme: 'Fractions', niveaux: ['facile'] }] })
    check('premier bilan : intro dédiée et titre « depuis le début »', /premier bilan de progression/.test(texteVisible(prem.html)) && /Niveaux validés depuis le début/.test(texteVisible(prem.html)))
    const offert = bilan.rendreBilan({ ...base, accesOffertJusqu: '2026-12-31' })
    check('accès offert : « Accès complet offert jusqu\'au 31/12/2026 » + lien espace parent', /Accès complet offert jusqu'au 31\/12\/2026/.test(texteVisible(offert.html)) && /Voir l'espace parent/.test(texteVisible(offert.html)))
    check('pas d\'accès offert → aucune mention', !/offert/.test(t))
    const tr = bilan.rendreBilan({ ...base, version: 'tronque' })
    const tt = texteVisible(tr.html)
    check('tronqué : activité + phrase Accompagné + bouton 7,90 €/mois → suivi-parent.html', /session terminée/.test(tt) && tt.includes("Le détail par sous-thème est disponible avec l'offre Accompagné.") && tt.includes('Passer à Accompagné · 7,90 €/mois') && tr.html.includes('https://www.academika.fr/suivi-parent.html'))
    check('tronqué : aucun niveau, aucun sous-thème, aucun lien « cours particuliers »', !/Fractions|Fonctions|validé|Acquis|En progression|surveiller/.test(tt) && !tr.html.includes('cours-particuliers'))
    const vide = bilan.rendreBilan({ ...base, activite: bilan.resumeActivite([]) })
    check('aucune session terminée : message de relance, niveaux conservés', /n'a pas terminé de session/.test(texteVisible(vide.html)) && /Acquis/.test(texteVisible(vide.html)))
    // Échappement
    const piege = bilan.rendreBilan({ ...base, prenom: '<img src=x onerror=alert(1)>\nBcc: x@y.fr', lignes: [{ ...VUE_711[1], sous_theme: '<script>alert(1)</script>' }], nouveaux: [{ sous_theme: '"><b>', niveaux: ['facile'] }] }, { emailPourLien: 'a"b@x.fr' })
    check('HTML des champs de la base échappé (prénom, sous-thème, nouveaux niveaux, lien)', !/<img|<script|<b>/.test(piege.html) && piege.html.includes('&lt;script&gt;') && piege.html.includes('desabonner.html?email=a%22b%40x.fr'))
    check('sujet sans retour à la ligne', !/[\r\n]/.test(piege.sujet), JSON.stringify(piege.sujet))
    // Pas de plafond : 20 sous-thèmes (maximum du catalogue) → 20 lignes de grille.
    const beaucoup = Array.from({ length: 20 }, (_, i) => ({ sous_theme: 'ST' + i, f_etat: 'acquis', m_etat: 'en_cours', d_etat: 'verrouille', niveau_courant: 'moyen', a_surveiller: false, m_essais: 0, m_reussites: 0, derniere_session: `2026-10-${10 + i}` }))
    const cap = bilan.rendreBilan({ ...base, lignes: beaucoup, nouveaux: null })
    check('20 sous-thèmes : 20 lignes dans la grille, aucun « et N autres »', cap.html.split('width:31%;font-size:12.5px').length - 1 === 20 && !/autres? —/.test(texteVisible(cap.html)))
    // Test
    const test = bilan.rendreBilan(base, { test: true, emailPourLien: 'test@example.fr' })
    check('mode test : [TEST] dans le sujet et bandeau, lien de désabonnement = adresse de test', test.sujet.startsWith('[TEST] ') && /MESSAGE DE TEST/.test(test.html) && test.html.includes('email=test%40example.fr'))
  }

  // ═══ 6. Garde d'envoi ═══
  console.log('\n── 6. lib/garde-envoi.js ──')
  {
    const env = (vercel, test) => {
      if (vercel === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = vercel
      if (test === undefined) delete process.env.EMAIL_TEST_DESTINATAIRE; else process.env.EMAIL_TEST_DESTINATAIRE = test
    }
    env('production', 'test@example.fr')
    check('production : destinataire = adresse réelle, jamais l\'adresse de test', garde.resoudreDestinataire('parent@x.fr').to === 'parent@x.fr' && !garde.resoudreDestinataire('parent@x.fr').test)
    check('production sans adresse réelle → aucun destinataire', garde.resoudreDestinataire('').to === null)
    for (const e of ['preview', 'development', undefined, 'staging', 'Production', 'production ']) {
      env(e, 'test@example.fr')
      const d = garde.resoudreDestinataire('parent@x.fr')
      check(`VERCEL_ENV=${JSON.stringify(e)} : seul le destinataire de test`, d.to === 'test@example.fr' && d.test === true)
    }
    env('preview', undefined)
    check('preview sans EMAIL_TEST_DESTINATAIRE → aucun destinataire (fail-closed)', garde.resoudreDestinataire('parent@x.fr').to === null)
    for (const mauvais of ['a@x.fr,b@y.fr', 'a@x.fr; b@y.fr', 'pas une adresse', '<a@x.fr>', ' ', 'a@x']) {
      env('preview', mauvais)
      check(`adresse de test invalide refusée : ${JSON.stringify(mauvais)}`, garde.resoudreDestinataire('parent@x.fr').to === null)
    }
    env('preview', 'test@example.fr')
    let leve = null
    global.fetch = async () => { throw new Error('ne doit pas être appelé') }
    try { await garde.envoyerA({ to: 'parent@x.fr', test: false }, 's', 'h') } catch (e) { leve = e }
    check('envoyerA refuse un destinataire réel hors production (même si l\'appelant s\'est trompé)', leve && /hors production/.test(leve.message))
    leve = null
    try { await garde.envoyerA({ to: null, test: true }, 's', 'h') } catch (e) { leve = e }
    check('envoyerA refuse un destinataire nul', !!leve)
    env(undefined, undefined)
  }

  // ═══ 7. Handlers contre un faux Supabase / Resend ═══
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bilan-email-'))
  for (const d of ['api', 'lib', 'js']) fs.mkdirSync(path.join(tmp, d))
  for (const f of ['gating', 'auth-token', 'recap-journalier', 'bilan-email', 'garde-envoi']) fs.copyFileSync(path.join(RACINE, `lib/${f}.js`), path.join(tmp, `lib/${f}.js`))
  fs.copyFileSync(path.join(RACINE, 'js/niveaux.js'), path.join(tmp, 'js/niveaux.js'))
  for (const f of ['email', 'cron-rappel']) fs.copyFileSync(path.join(RACINE, `api/${f}.js`), path.join(tmp, `api/${f}.mjs`))
  const srcEmail = fs.readFileSync(path.join(tmp, 'api/email.mjs'), 'utf8')
  fs.writeFileSync(path.join(tmp, 'api/email.mjs'), "import { createRequire } from 'module'\nconst require = createRequire(import.meta.url)\n" + srcEmail)
  const { default: handlerEmail } = await import(pathToFileURL(path.join(tmp, 'api/email.mjs')).href)
  const { default: handlerCron } = await import(pathToFileURL(path.join(tmp, 'api/cron-rappel.mjs')).href)

  process.env.CRON_SECRET = 'secret-test'
  process.env.SUPABASE_SERVICE_KEY = 'service-test'
  process.env.RESEND_API_KEY = 'resend-test'
  delete process.env.HEALTHCHECK_URL_CRON_RAPPEL

  const UID_A = 'aaaaaaaa-0000-4000-8000-000000000001' // abonné
  const UID_B = 'bbbbbbbb-0000-4000-8000-000000000002' // Libre, aucun bilan
  const UID_C = 'cccccccc-0000-4000-8000-000000000003' // Libre, bilan utile déjà reçu
  const UID_D = 'dddddddd-0000-4000-8000-000000000004' // parent désabonné
  const UID_E = 'eeeeeeee-0000-4000-8000-000000000005' // lecture de l'historique en échec
  const P = (user_id, prenom, email, extra = {}) => ({ user_id, prenom_affiche: prenom, email_parent: email, email_actif: true, plan_actif: false, cours_particuliers_actif: false, acces_offert_jusqu: null, ...extra })
  const PROFILS = [
    P(UID_A, 'Ana', 'parent-a@example.fr', { plan_actif: true }),
    P(UID_B, 'Basile', 'parent-b@example.fr'),
    P(UID_C, 'Cléo', 'parent-c@example.fr'),
    P(UID_D, 'Dan', 'parent-d@example.fr', { email_actif: false }),
    P(UID_E, 'Eli', 'parent-e@example.fr'),
    P(UID, 'Théo', 'parent-reel@example.fr')
  ]
  const HIST = {
    [UID_A]: [{ date_envoi: '2026-11-01T21:00:00+00:00', total_sessions: 3, niveaux_snapshot: { Fractions: ['facile'] } }],
    [UID_C]: [{ date_envoi: '2026-11-01T21:00:00+00:00', total_sessions: 4, niveaux_snapshot: null }],
    [UID]: [{ date_envoi: '2026-09-29T21:00:00+00:00', total_sessions: 5, niveaux_snapshot: null }]
  }
  const PREMIERE = { [UID_B]: '2026-10-01T10:00:00', [UID_E]: '2026-10-01T10:00:00', [UID_A]: '2026-09-01T10:00:00' }

  function faux({ echecs = [], desabonnes = [], profils = PROFILS, historique = HIST } = {}) {
    const a = { resend: [], histPost: [], tous: [], rateLimitPost: 0, urlsProfilsTous: 0 }
    global.fetch = async (url, opts = {}) => {
      url = String(url)
      a.tous.push({ url, method: opts.method || 'GET' })
      const rep = (corps, ok = true, status = 200) => ({ ok, status, json: async () => corps, text: async () => JSON.stringify(corps) })
      const uid = (url.match(/user_id=eq\.([0-9a-f-]{36})/) || [])[1]
      if (echecs.some(e => url.includes(e))) return rep({ message: 'boom' }, false, 500)
      if (url.includes('api.resend.com')) { a.resend.push(JSON.parse(opts.body)); return rep({ id: 'x' }) }
      if (url.includes('/auth/v1/user')) {
        const jeton = (opts.headers?.Authorization || '').replace('Bearer ', '')
        if (jeton === 'jeton-prof') return rep({ id: 'prof-id', app_metadata: { role: 'prof' } })
        if (jeton === 'jeton-parent') return rep({ id: 'autre', app_metadata: {} })
        return rep({}, false, 401)
      }
      if (url.includes('/rest/v1/email_rate_limit')) { if (opts.method === 'POST') a.rateLimitPost++; return rep([]) }
      if (url.includes('/api/email')) return rep({ success: true, skip: 'test' })
      if (url.includes('profils?email_parent=ilike.')) {
        const mail = decodeURIComponent(url.match(/ilike\.([^&]+)/)[1]).replace(/\\/g, '').toLowerCase()
        return rep(desabonnes.includes(mail) ? [{ user_id: 'x' }] : [])
      }
      if (url.includes('/rest/v1/profils?user_id=eq.')) return rep(profils.filter(p => p.user_id === uid))
      if (url.includes('/rest/v1/profils?select=')) { a.urlsProfilsTous++; return rep(profils) }
      if (url.includes('/rest/v1/historique_bilans') && opts.method === 'POST') { a.histPost.push(JSON.parse(opts.body)); return rep({}) }
      if (url.includes('/rest/v1/historique_bilans')) {
        const lignes = (historique[uid] || [])
        if (url.includes('total_sessions=gt.0')) return rep(lignes.filter(l => l.total_sessions > 0).slice(0, 1))
        return rep(lignes.slice(0, 2))
      }
      if (url.includes('/rest/v1/niveaux_sous_theme')) return rep(VUE_711)
      if (url.includes('select=id,user_id,created_at,alerte_envoyee')) return rep([])
      if (url.includes('/rest/v1/resultats') && url.includes('order=created_at.asc')) return rep(PREMIERE[uid] ? [{ created_at: PREMIERE[uid] }] : [{ created_at: '2026-09-01T10:00:00' }])
      if (url.includes('/rest/v1/resultats') && url.includes('created_at=gte.')) return rep([
        { created_at: '2026-10-15T20:00:00', temps_secondes: 600, abandonne: false },
        { created_at: '2026-10-16T20:00:00', temps_secondes: 300, abandonne: false },
        { created_at: '2026-10-17T20:00:00', temps_secondes: 12, abandonne: true }
      ])
      return rep([])
    }
    return a
  }
  const silence = async f => {
    const l = console.log, e = console.error; const logs = []
    console.log = (...x) => logs.push(x.join(' ')); console.error = (...x) => logs.push(x.join(' '))
    try { return { v: await f(), logs } } finally { console.log = l; console.error = e }
  }
  const env = (vercel, test) => {
    if (vercel === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = vercel
    if (test === undefined) delete process.env.EMAIL_TEST_DESTINATAIRE; else process.env.EMAIL_TEST_DESTINATAIRE = test
  }
  const cron = async (query = {}) => { const r = res(); const { logs } = await silence(() => handlerCron({ headers: { authorization: 'Bearer secret-test' }, query }, r)); return { r, logs } }
  const email = async (body, jeton = 'jeton-prof') => { const r = res(); await silence(() => handlerEmail({ method: 'POST', headers: { authorization: `Bearer ${jeton}` }, body }, r)); return r }
  const TEST = 'test-cm@example.fr'
  const REEL = 'parent-reel@example.fr'

  console.log('\n── 7. Cron hors production : un seul élève, un seul destinataire, aucune écriture ──')
  for (const e of ['preview', 'development', undefined]) {
    env(e, TEST)
    let a = faux(); let { r } = await cron({})
    check(`VERCEL_ENV=${JSON.stringify(e)} sans test_user_id : 400, AUCUN appel réseau (ni Supabase, ni Resend)`, r.code === 400 && a.tous.length === 0, `${r.code} ${a.tous.length}`)
    a = faux(); ;({ r } = await cron({ test_user_id: "x' or 1=1" }))
    check(`VERCEL_ENV=${JSON.stringify(e)} test_user_id invalide : 400, aucun appel`, r.code === 400 && a.tous.length === 0)
  }
  env('preview', undefined)
  {
    const a = faux(); const { r } = await cron({ test_user_id: UID })
    check('preview sans EMAIL_TEST_DESTINATAIRE : 400, aucun envoi, aucun appel', r.code === 400 && a.resend.length === 0 && a.tous.length === 0)
  }
  env('preview', TEST)
  {
    const a = faux(); const { r } = await cron({ test_user_id: UID })
    check('preview + test_user_id : exactement 1 email', r.code === 200 && a.resend.length === 1, `${r.code} ${a.resend.length}`)
    check('… envoyé à EMAIL_TEST_DESTINATAIRE uniquement', a.resend[0].to === TEST)
    check('… jamais l\'adresse du parent (ni dans le destinataire, ni dans le contenu)', !JSON.stringify(a.resend).includes(REEL) && !JSON.stringify(r.body).includes(REEL))
    check('… sujet [TEST]', a.resend[0].subject.startsWith('[TEST] '))
    check('… la liste de tous les profils n\'est jamais lue', a.urlsProfilsTous === 0 && !a.tous.some(x => x.url.includes('/rest/v1/profils?select=')))
    check('… aucune écriture : ni historique_bilans, ni alerte_envoyee, ni quota', a.histPost.length === 0 && a.tous.every(x => x.method === 'GET' || x.url.includes('api.resend.com')) && a.rateLimitPost === 0)
    check('… ni rattrapage du récap, ni appel à la production (/api/email)', !a.tous.some(x => x.url.includes('/api/email') || x.url.includes('alerte_envoyee')))
    check('… réponse sans adresse email', !/@/.test(JSON.stringify(r.body)), JSON.stringify(r.body))
    check('… avant la bascule : version complète', r.body.version === 'complet' && r.body.motif === 'lancement')
  }
  {
    const a = faux(); const { r } = await cron({ test_user_id: UID, simuler_bascule: '1' })
    check('preview + simuler_bascule=1 : bilan tronqué (Libre, bilan utile déjà reçu)', r.code === 200 && r.body.version === 'tronque' && a.resend.length === 1 && a.resend[0].html.includes('Passer à Accompagné'))
    const b = faux(); const x = await cron({ test_user_id: UID, simuler_bascule: 'true' })
    check('simuler_bascule autre que « 1 » → ignoré', x.r.body.version === 'complet' && b.resend.length === 1)
  }
  {
    const a = faux({ echecs: ['niveaux_sous_theme'] }); const { r } = await cron({ test_user_id: UID })
    check('lecture en échec : 500, aucun envoi', r.code === 500 && a.resend.length === 0)
    const n = faux({ profils: [] }); const y = await cron({ test_user_id: UID })
    check('élève inconnu : 404, aucun envoi', y.r.code === 404 && n.resend.length === 0)
  }
  env('preview', TEST)
  {
    // Production seulement : un test_user_id ne restreint rien et n'ouvre rien.
    env('production', TEST)
    MAINTENANT = '2026-12-10T09:00:00.000Z' // après la bascule, mois de décembre : branche bilan
    const a = faux({ desabonnes: [], echecs: [`historique_bilans?user_id=eq.${UID_E}`] })
    const { r } = await cron({ test_user_id: UID })
    const dest = a.resend.map(m => m.to).sort()
    check('production : test_user_id ignoré, la boucle complète tourne', a.urlsProfilsTous === 1 && r.code === 200, `${r.code}`)
    check('production : envoie aux VRAIS parents (A, B, C, Théo) — jamais à l\'adresse de test', JSON.stringify(dest) === JSON.stringify(['parent-a@example.fr', 'parent-b@example.fr', 'parent-c@example.fr', REEL].sort()), JSON.stringify(dest))
    check('production : email_actif=false ignoré (D), lecture en échec sautée (E)', !dest.includes('parent-d@example.fr') && !dest.includes('parent-e@example.fr'))
    const parA = a.resend.find(m => m.to === 'parent-a@example.fr'), parB = a.resend.find(m => m.to === 'parent-b@example.fr'), parC = a.resend.find(m => m.to === 'parent-c@example.fr')
    check('A (abonné) → complet', parA && !parA.html.includes('Passer à Accompagné') && parA.html.includes('Acquis'))
    check('B (Libre, aucun bilan) → complet (premier bilan utile)', parB && !parB.html.includes('Passer à Accompagné') && parB.html.includes('Acquis'))
    check('C (Libre, bilan utile déjà reçu) → tronqué avec bouton', parC && parC.html.includes('Passer à Accompagné') && !parC.html.includes('Acquis'))
    check('production : jamais de [TEST]', a.resend.every(m => !m.subject.includes('[TEST]') && !m.html.includes('MESSAGE DE TEST')))
    check('production : 4 lignes historique_bilans écrites (une par email envoyé)', a.histPost.length === 4, String(a.histPost.length))
    const hA = a.histPost.find(h => h.user_id === UID_A)
    check('historique : total_sessions / jours_actifs / niveaux_snapshot écrits', hA && hA.total_sessions === 2 && hA.jours_actifs === 2 && hA.type_bilan === 'periodique' && JSON.stringify(hA.niveaux_snapshot) === JSON.stringify(bilan.snapshotNiveaux(VUE_711)), JSON.stringify(hA))
    check('historique : moy_globale et sous_themes_snapshot NON écrits', a.histPost.every(h => !('moy_globale' in h) && !('sous_themes_snapshot' in h)))
    check('bilan tronqué enregistré lui aussi avec son snapshot (pour une comparaison future)', a.histPost.find(h => h.user_id === UID_C).niveaux_snapshot && true)
    check('réponse du cron : compteurs', r.body.bilans_envoyes === 4 && r.body.bilans_tronques === 2 && r.body.bilans_ignores === 2, JSON.stringify(r.body))
    const textes = a.resend.map(m => texteVisible(m.html)).join('\n')
    check('aucun email : ni moyenne /20, ni pourcentage, ni « Excellent »', !/\/20|%|Excellent/.test(textes))
    MAINTENANT = '2026-10-20T09:00:00.000Z'
  }
  {
    // Cadence : dernier bilan il y a 10 jours → rien.
    env('production', TEST)
    MAINTENANT = '2026-12-10T09:00:00.000Z'
    const a = faux({ historique: { [UID_A]: [{ date_envoi: '2026-12-01T21:00:00+00:00', total_sessions: 3, niveaux_snapshot: null }] }, profils: [PROFILS[0]] })
    const { r } = await cron({})
    check('production : cadence de 21 jours respectée (10 jours → aucun envoi)', a.resend.length === 0 && r.body.bilans_ignores === 1)
    const b = faux({ historique: { [UID_A]: [{ date_envoi: '2026-11-01T21:00:00+00:00', total_sessions: 0, niveaux_snapshot: null }, { date_envoi: '2026-10-01T21:00:00+00:00', total_sessions: 0, niveaux_snapshot: null }] }, profils: [PROFILS[0]] })
    const x = await cron({})
    check('production : pause après deux bilans vides conservée', b.resend.length === 0 && x.r.body.bilans_en_pause === 1)
    MAINTENANT = '2026-10-20T09:00:00.000Z'
  }
  env(undefined, undefined)

  console.log('\n── 8. Bouton prof / aperçu : api/email.js type bilan ──')
  env('production', undefined)
  {
    let a = faux(); let r = await email({ type: 'bilan', user_id: UID })
    check('envoi : 200, un email à l\'adresse réelle du parent, version complète', r.code === 200 && r.body.success === true && a.resend.length === 1 && a.resend[0].to === REEL && a.resend[0].html.includes('Acquis'), JSON.stringify(r.body))
    check('envoi : n\'écrit JAMAIS historique_bilans', a.histPost.length === 0)
    check('envoi : période = 21 derniers jours glissants (29/09 11h00 → 20/10), jamais « depuis le dernier bilan »',
      a.tous.some(x => x.url.includes('created_at=gte.2026-09-29T09:00:00.000Z') && x.url.includes('created_at=lte.2026-10-20T09:00:00.000Z')) && !a.tous.some(x => x.url.includes('order=created_at.asc')))
    check('envoi : intro « du 29 septembre au 20 octobre 2026 »', /du 29 septembre au 20 octobre 2026/.test(texteVisible(a.resend[0].html).replace(/\s+/g, ' ')))
    {
      const sans = faux({ historique: {} }); const x = await email({ type: 'bilan', user_id: UID })
      check('élève sans aucun bilan : l\'intro n\'annonce jamais « le premier bilan » (période imposée)', x.code === 200 && /du 29 septembre au 20 octobre 2026/.test(texteVisible(sans.resend[0].html).replace(/\s+/g, ' ')) && !/premier bilan/.test(texteVisible(sans.resend[0].html)))
    }
    check('envoi : quota de 10 par heure consulté et incrémenté (adresse du parent)', a.rateLimitPost === 1)
    check('envoi : pas de [TEST], lien de désabonnement du parent', !a.resend[0].subject.includes('[TEST]') && a.resend[0].html.includes(encodeURIComponent(REEL)))
    check('envoi : comparaison avec le dernier bilan du cron, snapshot NULL → pas de ligne « nouveaux niveaux »', !/nouveau/.test(texteVisible(a.resend[0].html)))

    a = faux({ historique: { [UID]: [{ date_envoi: '2026-09-29T21:00:00+00:00', total_sessions: 5, niveaux_snapshot: { Fractions: ['facile'] } }] } }); r = await email({ type: 'bilan', user_id: UID })
    check('envoi : snapshot précédent → ligne « Nouveaux niveaux validés depuis le dernier bilan »', /Nouveaux niveaux validés depuis le dernier bilan/.test(texteVisible(a.resend[0].html)))

    PROFILS[5].acces_offert_jusqu = '2026-12-31'
    a = faux(); r = await email({ type: 'bilan', user_id: UID })
    check('accès offert en cours : « Accès complet offert jusqu\'au 31/12/2026 »', /Accès complet offert jusqu'au 31\/12\/2026/.test(texteVisible(a.resend[0].html)))
    PROFILS[5].acces_offert_jusqu = null

    a = faux({ desabonnes: [REEL] }); r = await email({ type: 'bilan', user_id: UID })
    check('parent désabonné : raison « desabonne », aucun envoi, avant le quota', r.code === 200 && r.body.raison === 'desabonne' && a.resend.length === 0 && a.rateLimitPost === 0)

    a = faux(); r = await email({ type: 'bilan', emailParent: 'victime@example.fr', prenom: 'X', sousThemes: {}, moyGlobale: 99 })
    check('ancien format (emailParent…) : 400, aucun envoi — aucun champ du navigateur n\'est lu', r.code === 400 && a.resend.length === 0)
    a = faux(); r = await email({ type: 'bilan', user_id: UID, emailParent: 'victime@example.fr' })
    check('user_id + emailParent injecté : le destinataire reste celui du profil', a.resend.length === 1 && a.resend[0].to === REEL)
    for (const mauvais of ['pas-un-uuid', "711bc196-928d-4b54-8e4b-e19763e83eb8&select=*", 123, null, ['a']]) {
      a = faux(); r = await email({ type: 'bilan', user_id: mauvais })
      check(`user_id invalide refusé : ${JSON.stringify(mauvais)}`, r.code === 400 && a.tous.filter(x => !x.url.includes('/auth/v1/user')).length === 0)
    }
    a = faux(); r = await email({ type: 'bilan', user_id: UID }, 'jeton-parent')
    check('compte non prof : 403, rien lu ni envoyé', r.code === 403 && a.resend.length === 0)
    a = faux(); r = await email({ type: 'bilan', user_id: UID }, 'jeton-inconnu')
    check('jeton invalide : 401', r.code === 401 && a.resend.length === 0)
    a = faux({ profils: [] }); r = await email({ type: 'bilan', user_id: UID })
    check('élève inconnu : 404', r.code === 404 && a.resend.length === 0)
    a = faux({ echecs: ['niveaux_sous_theme'] }); r = await email({ type: 'bilan', user_id: UID })
    check('lecture en échec : 500 générique, aucun envoi, aucun détail technique', r.code === 500 && a.resend.length === 0 && !/niveaux_sous_theme|boom/.test(JSON.stringify(r.body)))

    // Aperçu
    a = faux(); r = await email({ type: 'bilan', user_id: UID, apercu: true })
    check('aperçu complet : html + sujet, aucun envoi, aucun quota, aucune écriture', r.code === 200 && r.body.apercu === true && r.body.version === 'complet' && /Acquis/.test(r.body.html) && a.resend.length === 0 && a.rateLimitPost === 0 && a.histPost.length === 0)
    check('aperçu : aucune adresse réelle ni lien de désabonnement exploitable', !r.body.html.includes(encodeURIComponent(REEL)) && !r.body.html.includes(REEL))
    a = faux(); r = await email({ type: 'bilan', user_id: UID, apercu: true, version: 'tronque' })
    check('aperçu tronqué : bouton Accompagné, aucun niveau', r.body.version === 'tronque' && r.body.html.includes('Passer à Accompagné') && !r.body.html.includes('Acquis'))
    a = faux({ desabonnes: [REEL] }); r = await email({ type: 'bilan', user_id: UID, apercu: true })
    check('aperçu possible pour un parent désabonné (rien n\'est envoyé)', r.code === 200 && r.body.apercu === true && a.resend.length === 0)
    a = faux(); r = await email({ type: 'bilan', user_id: UID, version: 'tronque' })
    check('version:tronque sans apercu → l\'envoi reste COMPLET', a.resend.length === 1 && !a.resend[0].html.includes('Passer à Accompagné'))
    for (const [k, v] of [['apercu', 'oui'], ['version', 'xl']]) {
      a = faux(); r = await email({ type: 'bilan', user_id: UID, [k]: v })
      check(`paramètre invalide refusé : ${k}=${v}`, r.code === 400 && a.resend.length === 0)
    }
    a = faux({ profils: [P(UID, 'Théo', '')] }); r = await email({ type: 'bilan', user_id: UID })
    check('profil sans email parent : 400', r.code === 400 && a.resend.length === 0)
  }
  env('preview', TEST)
  {
    let a = faux(); let r = await email({ type: 'bilan', user_id: UID })
    check('preview : le bouton envoie à l\'adresse de test, jamais au parent', r.code === 200 && r.body.test === true && a.resend.length === 1 && a.resend[0].to === TEST && !JSON.stringify(a.resend).includes(REEL))
    check('preview : sujet [TEST], lien de désabonnement = adresse de test', a.resend[0].subject.startsWith('[TEST] ') && a.resend[0].html.includes(encodeURIComponent(TEST)))
    env('preview', undefined)
    a = faux(); r = await email({ type: 'bilan', user_id: UID })
    check('preview sans EMAIL_TEST_DESTINATAIRE : 403, aucun envoi', r.code === 403 && a.resend.length === 0)
    a = faux(); r = await email({ type: 'bilan', user_id: UID, apercu: true })
    check('preview sans adresse de test : l\'aperçu reste possible (aucun envoi)', r.code === 200 && r.body.apercu === true && a.resend.length === 0)
  }
  env(undefined, undefined)

  if (process.env.PREVIEW_DIR) console.log(`\nAperçus écrits dans ${process.env.PREVIEW_DIR}`)
  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(`\n${nbOk} OK, ${nbKo} KO`)
  process.exit(nbKo ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
