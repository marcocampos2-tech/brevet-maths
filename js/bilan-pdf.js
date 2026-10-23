// js/bilan-pdf.js — PDF « ACADEMIKA — Bilan de progression » (script classique,
// même modèle que js/niveaux.js).
//
// SOURCE UNIQUE du PDF : suivi-parent.html (espace parent) et prof.html (fiche
// élève, bouton « PDF du bilan ») l'appellent tous les deux, donc le prof remet
// au parent exactement le document que le parent télécharge. Aucune copie du
// dessin ni des requêtes ailleurs.
//
// Ce module ne connaît ni l'offre, ni l'abonnement, ni l'accès offert, ni le
// verrou du lot 2 : il reçoit un client Supabase, un identifiant d'élève, un
// prénom (jamais le nom de famille), une période et un canvas. Le gating
// reste dans la page appelante (suivi-parent.html : eleveVerrouille).
// Lectures = celles de la page parent, filtrées sur l'élève : resultats (la
// période, puis la première session pour « Depuis le début ») et la vue
// niveaux_sous_theme. Côté prof elles passent par la policy « Prof voit tout
// resultats » (is_prof(), db/policies.sql) : aucun droit ajouté.
//
// Un SEUL nom global : window.BilanPDF (dans un navigateur) ; sous Node, le
// même fichier s'importe par require() pour les tests (lib/niveaux.manual-test.js).
// Dépendances globales : Niveaux (js/niveaux.js, à charger avant), Chart
// (Chart.js 4.4.1), window.jspdf (jsPDF 2.5.1) et un canvas fourni par la page.
// Chargement : <script src="/js/bilan-pdf.js?v=1"></script> — incrémenter v à
// chaque modification pour contourner le cache.
(function () {
  'use strict'

  // ── Période, granularité et regroupement (repris tels quels de suivi-parent.html) ──
  async function getRangeEtGranularite(sb, userId, mode) {
    const maintenant = new Date()
    if (mode === 'mois') {
      const debut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
      return { debut, fin: maintenant, granularite: 'jour', libelle: 'Ce mois-ci' }
    }
    if (mode === 'trimestre') {
      const debut = new Date(maintenant)
      debut.setMonth(debut.getMonth() - 3)
      return { debut, fin: maintenant, granularite: 'semaine', libelle: 'Les 3 derniers mois' }
    }
    const { data } = await sb.from('resultats')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
    const debut = (data && data.length > 0) ? parseUTC(data[0].created_at) : maintenant
    return { debut, fin: maintenant, granularite: 'mois', libelle: 'Depuis le début' }
  }

  // Ne vaut que pour les colonnes timestamp SANS fuseau (ex. resultats.created_at) :
  // examens_blancs.created_at est en timestamptz, déjà formaté avec fuseau — ne pas y appliquer parseUTC().
  function parseUTC(chaine) {
    return new Date(chaine.replace(' ', 'T') + 'Z')
  }

  function dateLocaleISO(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function cleBucket(date, granularite) {
    if (granularite === 'jour') return dateLocaleISO(date)
    if (granularite === 'mois') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const d = new Date(date)
    const jour = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - jour)
    return dateLocaleISO(d)
  }

  function libelleBucket(cle, granularite) {
    if (granularite === 'mois') {
      const [a, m] = cle.split('-')
      const d = new Date(a, m - 1, 1)
      return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    }
    const d = new Date(cle + 'T00:00:00')
    const prefixe = granularite === 'semaine' ? 'sem. ' : ''
    return prefixe + d.getDate() + ' ' + d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
  }

  function genererClesPeriode(debut, fin, granularite) {
    const cles = new Set()
    if (granularite === 'jour') {
      const d = new Date(debut); d.setHours(0, 0, 0, 0)
      const finJ = new Date(fin); finJ.setHours(0, 0, 0, 0)
      while (d <= finJ) { cles.add(dateLocaleISO(d)); d.setDate(d.getDate() + 1) }
    } else if (granularite === 'semaine') {
      const d = new Date(debut)
      const finJ = new Date(fin)
      let cle = cleBucket(d, 'semaine')
      cles.add(cle)
      let curseur = new Date(cle + 'T00:00:00')
      while (true) {
        const suivant = new Date(curseur)
        suivant.setDate(suivant.getDate() + 7)
        if (suivant > finJ) break
        cles.add(dateLocaleISO(suivant))
        curseur = suivant
      }
    } else {
      const d = new Date(debut.getFullYear(), debut.getMonth(), 1)
      const finJ = new Date(fin.getFullYear(), fin.getMonth(), 1)
      while (d <= finJ) {
        cles.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
        d.setMonth(d.getMonth() + 1)
      }
    }
    return Array.from(cles).sort()
  }

  // ── PDF de bilan : section « Niveau atteint » ──────────────────────────
  // Polices jsPDF standard (Helvetica, WinAnsi) : aucun caractère hors WinAnsi
  // (pas de coche, d'alerte, de ≥ ni de flèche). Accents, « — » et « · » : OK.
  const PDF_COUL = {
    acquis:      { fond: [234, 246, 239], bord: [191, 227, 205], texte: [31, 122, 69] },
    progression: { fond: [251, 244, 228], bord: [235, 217, 168], texte: [138, 100, 22] },
    surveiller:  { fond: [255, 241, 227], bord: [232, 137, 43],  texte: [138, 63, 5] },
    neutre:      { fond: [250, 249, 246], bord: [228, 225, 216], texte: [107, 110, 115] }
  }
  const PDF_MARGE_G = 48, PDF_MARGE_H = 48, PDF_MARGE_B = 40

  function pdfTitreSection(doc, y, gauche, droite) {
    const pageW = doc.internal.pageSize.getWidth()
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(107, 110, 115)
    doc.text(gauche, PDF_MARGE_G, y)
    if (droite) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
      doc.text(droite, pageW - PDF_MARGE_G, y, { align: 'right' })
    }
    return y + 16
  }

  // Contenu et couleurs d'une case du tableau. Le contenu vient de Niveaux.cellule
  // (source unique, le même que la grille HTML : « N / 5 réussites » + « en M
  // essais » + barre) ; seule la coche de « ✓ Acquis » est retirée (polices
  // WinAnsi). barre = couleur de la barre de progression, ou null.
  function pdfCelluleNiveau(l, niveau) {
    const d = Niveaux.cellule(l, niveau)
    const base = { l1: d.texte, l2: d.detail, reussites: d.reussites, barre: null, gras: false }
    if (d.type === 'acquis') return { ...base, l1: 'Acquis', coul: PDF_COUL.acquis, gras: true }
    if (d.type === 'surv') return { ...base, coul: PDF_COUL.surveiller, gras: true, barre: [232, 137, 43] }
    if (d.type === 'encours') return { ...base, coul: PDF_COUL.progression, gras: true, barre: [212, 162, 60] }
    if (d.type === 'jamais') return { ...base, coul: PDF_COUL.progression, gras: true, barre: [212, 162, 60] }
    return { ...base, coul: PDF_COUL.neutre } // « Après le Facile » / « Après le Moyen » : comme la page et l'email
  }

  // Dessine la section à partir de y (page courante) et renvoie le y de fin,
  // éventuellement sur une page suivante. lignes === null : lecture en erreur.
  // Ordre : « À surveiller » (s'il n'est pas vide, jamais coupé), puis la grille
  // pleine largeur (en-tête répété à chaque page, une ligne n'est jamais coupée),
  // puis la légende en texte simple (jamais seule en haut d'une page sans titre).
  function pdfSectionNiveaux(doc, y, lignes) {
    const pageW = doc.internal.pageSize.getWidth()
    const bas = doc.internal.pageSize.getHeight() - PDF_MARGE_B
    const titre = 'NIVEAU ATTEINT PAR SOUS-THÈME'

    if (lignes === null || lignes.length === 0) {
      y = pdfTitreSection(doc, y, titre, null)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(107, 110, 115)
      doc.text(lignes === null ? 'Niveau atteint indisponible pour le moment.' : 'Aucun sous-thème commencé pour le moment.', PDF_MARGE_G, y + 4)
      return y + 20
    }

    const tries = lignes.slice().sort(Niveaux.parRecence)
    const n = tries.length
    const dateJ = new Date().toLocaleDateString('fr-FR')
    y = pdfTitreSection(doc, y, titre, `au ${dateJ} · ${n} commencé${n > 1 ? 's' : ''} sur ${Niveaux.totalCatalogue()}`)

    const largeur = pageW - 2 * PDF_MARGE_G
    const nouvellePage = () => {
      doc.addPage()
      return pdfTitreSection(doc, PDF_MARGE_H, titre + ' (suite)', null)
    }

    // « À surveiller » : pleine largeur.
    const { surveiller } = Niveaux.classerNiveaux(lignes)
    if (surveiller.length) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      const textes = surveiller.map(t => doc.splitTextToSize(t, largeur - 24))
      const nbL = textes.reduce((a, t) => a + t.length, 0)
      const h = 10 + 14 + nbL * 11 + (surveiller.length - 1) * 3 + 10
      if (y + h > bas) y = nouvellePage()
      const c = PDF_COUL.surveiller
      doc.setFillColor(...c.fond); doc.setDrawColor(...c.bord); doc.setLineWidth(1)
      doc.roundedRect(PDF_MARGE_G, y, largeur, h, 5, 5, 'FD')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...c.texte)
      doc.text('À surveiller', PDF_MARGE_G + 12, y + 18)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(65, 69, 76)
      let ty = y + 32
      textes.forEach(lg => { doc.text(lg, PDF_MARGE_G + 12, ty); ty += lg.length * 11 + 3 })
      y += h + 12
    }

    // Grille pleine largeur.
    const wNom = Math.round(largeur * 0.30), wNiv = (largeur - wNom) / 3
    const hEntete = 18
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    const rows = tries.map(l => {
      const nomL = doc.splitTextToSize(Niveaux.sansCesures(l.sous_theme), wNom - 10) // jamais de U+00AD dans jsPDF
      return { l, nomL, h: Math.max(32, nomL.length * 10.5 + 10) }
    })
    const entete = yy => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(107, 110, 115)
      doc.text('SOUS-THÈME', PDF_MARGE_G + 6, yy + 12)
      ;['FACILE', 'MOYEN', 'DIFFICILE'].forEach((t, i) => doc.text(t, PDF_MARGE_G + wNom + i * wNiv + wNiv / 2, yy + 12, { align: 'center' }))
      doc.setDrawColor(228, 225, 216); doc.setLineWidth(0.6); doc.line(PDF_MARGE_G, yy + hEntete, PDF_MARGE_G + largeur, yy + hEntete)
      return yy + hEntete
    }
    // Légende : pastilles de couleur (mêmes couleurs que les cases) puis la phrase de
    // règle. Sa hauteur est réservée avec la dernière ligne pour qu'elle ne reste
    // jamais seule en haut d'une page.
    const itemsLegende = [['Acquis', PDF_COUL.acquis], ['En cours', PDF_COUL.progression], ['À surveiller', PDF_COUL.surveiller], ['Pas encore ouvert', PDF_COUL.neutre]]
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    const regle = doc.splitTextToSize(Niveaux.PHRASE_REGLE, largeur)
    const hLegende = 14 + regle.length * 10 + 8

    if (y + hEntete + rows[0].h > bas) y = nouvellePage()
    y = entete(y)
    rows.forEach((r, i) => {
      const reserve = i === rows.length - 1 ? 8 + hLegende : 0
      if (y + r.h + reserve > bas) y = entete(nouvellePage())
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(65, 69, 76)
      doc.text(r.nomL, PDF_MARGE_G + 6, y + r.h / 2 - (r.nomL.length - 1) * 5.25 + 3)
      ;['facile', 'moyen', 'difficile'].forEach((niv, j) => {
        const cel = pdfCelluleNiveau(r.l, niv)
        const cx = PDF_MARGE_G + wNom + j * wNiv
        doc.setFillColor(...cel.coul.fond); doc.setDrawColor(...cel.coul.bord)
        doc.setLineWidth(cel.coul === PDF_COUL.surveiller ? 1 : 0.4)
        doc.roundedRect(cx + 3, y + 3, wNiv - 6, r.h - 6, 4, 4, 'FD')
        const centre = cx + wNiv / 2
        const aDetail = !!cel.l2
        // Ligne 1 (gras si « N / 5 réussites » ou « Acquis »), ligne 2 plus petite et
        // atténuée (mélange 85 % texte / 15 % fond, équivalent de l'opacité 0.85).
        doc.setFont('helvetica', cel.gras ? 'bold' : 'normal'); doc.setFontSize(8.5); doc.setTextColor(...cel.coul.texte)
        doc.text(cel.l1, centre, aDetail ? y + 13 : y + r.h / 2 + 3, { align: 'center' })
        if (aDetail) {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
          doc.setTextColor(...cel.coul.texte.map((v, k) => Math.round(v * 0.85 + cel.coul.fond[k] * 0.15)))
          doc.text(cel.l2, centre, y + 21.5, { align: 'center' })
        }
        if (cel.barre) {
          // Barre de 3 pt : piste puis partie pleine (largeur = N/5).
          const bx = cx + 10, bw = wNiv - 20, by = y + r.h - 9
          doc.setFillColor(...cel.coul.fond.map(v => Math.round(v * 0.92)))
          doc.roundedRect(bx, by, bw, 3, 1.5, 1.5, 'F')
          if (cel.reussites > 0) { doc.setFillColor(...cel.barre); doc.roundedRect(bx, by, bw * cel.reussites / 5, 3, 1.5, 1.5, 'F') }
        }
      })
      y += r.h
      doc.setDrawColor(228, 225, 216); doc.setLineWidth(0.4); doc.line(PDF_MARGE_G, y, PDF_MARGE_G + largeur, y)
    })

    const yLeg = y + 16
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    let xLeg = PDF_MARGE_G
    itemsLegende.forEach(([libelle, coul]) => {
      doc.setFillColor(...coul.fond); doc.setDrawColor(...coul.bord)
      doc.setLineWidth(coul === PDF_COUL.surveiller ? 0.9 : 0.5)
      doc.roundedRect(xLeg, yLeg - 7, 8, 8, 2, 2, 'FD')
      doc.setTextColor(107, 110, 115)
      doc.text(libelle, xLeg + 12, yLeg)
      xLeg += 12 + doc.getTextWidth(libelle) + 18
    })
    doc.setTextColor(107, 110, 115)
    doc.text(regle, PDF_MARGE_G, yLeg + 14)
    return y + 8 + hLegende
  }

  // Génère et enregistre le PDF. Renvoie { vide: null } une fois le fichier
  // enregistré, { vide: 'aucune' } (aucune session sur la période) ou
  // { vide: 'abandons' } (que des abandons) sans rien enregistrer ; lève une
  // erreur si une lecture ou le dessin échoue. mode : 'mois' | 'trimestre' | 'debut'.
  // canvas : <canvas> hors écran fourni par la page (le graphique y est dessiné
  // en 900 × 228 puis intégré au PDF).
  async function generer({ sb, userId, prenom, mode, canvas, nomFichier }) {
    const { debut, fin, granularite, libelle } = await getRangeEtGranularite(sb, userId, mode)

    const { data: sessionsBrutes, error } = await sb.from('resultats')
      .select('created_at, score, total, temps_secondes, sous_theme, abandonne')
      .eq('user_id', userId)
      .gte('created_at', debut.toISOString())
      .lte('created_at', fin.toISOString())
      .order('created_at', { ascending: true })

    if (error || !sessionsBrutes) throw new Error('Chargement impossible')

    if (sessionsBrutes.length === 0) {
      return { vide: 'aucune' }
    }

    const nbAbandons = sessionsBrutes.filter(s => s.abandonne).length
    const sessions = sessionsBrutes.filter(s => !s.abandonne)

    if (sessions.length === 0) {
      return { vide: 'abandons' }
    }

    // Niveau atteint : tout l'historique (pas la période). Un échec ne bloque
    // pas le PDF : la section affiche « indisponible » (lignesNiveaux = null).
    let lignesNiveaux = null
    try {
      const rn = await sb.from('niveaux_sous_theme').select(Niveaux.SELECT_NIVEAUX).eq('user_id', userId)
      if (rn.error) console.error('[niveaux] lecture de niveaux_sous_theme impossible (PDF) :', rn.error.message)
      else lignesNiveaux = rn.data || []
    } catch (e) {
      console.error('[niveaux] lecture de niveaux_sous_theme impossible (PDF) :', e && e.message)
    }

    const buckets = {}
    genererClesPeriode(debut, fin, granularite).forEach(cle => {
      buckets[cle] = { ok: 0, total: 0, nbSessions: 0 }
    })
    const joursActifsSet = new Set()
    sessions.forEach(s => {
      const d = parseUTC(s.created_at)
      const cle = cleBucket(d, granularite)
      if (!buckets[cle]) buckets[cle] = { ok: 0, total: 0, nbSessions: 0 }
      buckets[cle].ok += s.score
      buckets[cle].total += s.total
      buckets[cle].nbSessions += 1
      joursActifsSet.add(dateLocaleISO(d))
    })
    const clesTriees = Object.keys(buckets).sort()
    const labels = clesTriees.map(c => libelleBucket(c, granularite))
    const nbSessionsParBucket = clesTriees.map(c => buckets[c].nbSessions)
    const couleurs = clesTriees.map(c => {
      const b = buckets[c]
      const pct = b.total > 0 ? (b.ok / b.total) * 100 : 0
      return b.nbSessions === 0 ? '#E4E1D8' : (pct >= 70 ? '#1B2A4A' : '#D4A23C')
    })

    const totalSessions = sessions.length
    const totalOk = sessions.reduce((a, s) => a + s.score, 0)
    const totalExercices = sessions.reduce((a, s) => a + s.total, 0)
    const scoreMoyen = totalExercices > 0 ? Math.round((totalOk / totalExercices) * 100) : 0
    const tempsTot = sessions.reduce((a, s) => a + (s.temps_secondes || 0), 0)
    const dureeMin = Math.round(tempsTot / 60)
    const dureeAffiche = dureeMin >= 60 ? `${Math.floor(dureeMin / 60)} h ${dureeMin % 60} min` : `${dureeMin} min`

    const jourMs = 24 * 60 * 60 * 1000
    const nbJoursPeriode = Math.max(1, Math.round((fin - debut) / jourMs) + 1)

    const plaqueValeurs = {
      id: 'plaqueValeurs',
      afterDatasetsDraw(c) {
        const ctx = c.ctx
        ctx.save()
        ctx.font = '600 11px Inter, sans-serif'
        ctx.fillStyle = '#41454C'
        ctx.textAlign = 'center'
        c.data.datasets[0].data.forEach((val, i) => {
          const meta = c.getDatasetMeta(0)
          const bar = meta.data[i]
          if (bar) ctx.fillText(String(val), bar.x, bar.y - 6)
        })
        ctx.restore()
      }
    }

    canvas.width = 900; canvas.height = 228
    if (window._chartPdf) { window._chartPdf.destroy() }
    window._chartPdf = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: [{ data: nbSessionsParBucket, backgroundColor: couleurs, borderRadius: 4 }] },
      plugins: [plaqueValeurs],
      options: {
        responsive: false, animation: false,
        layout: { padding: { top: 20 } },
        plugins: { legend: { display: false } },
        scales: {
          x: {
            title: { display: true, text: 'Date', font: { size: 13, weight: '500' }, color: '#41454C' },
            ticks: { font: { size: 11 }, color: '#41454C' }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Nb de sessions', font: { size: 13, weight: '500' }, color: '#41454C' },
            ticks: { stepSize: 1, precision: 0, font: { size: 11 }, color: '#41454C' }
          }
        }
      }
    })

    await new Promise(r => setTimeout(r, 200))
    const imgData = canvas.toDataURL('image/png')

    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margeG = PDF_MARGE_G
    const bas = pageH - PDF_MARGE_B
    let y = 56

    // a) En-tête
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(27, 42, 74)
    doc.text('ACADEMIKA — Bilan de progression', margeG, y)
    y += 20
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(107, 110, 115)
    doc.text(`${Prenom.formater(prenom) || 'Élève'} · ${libelle} · du ${debut.toLocaleDateString('fr-FR')} au ${fin.toLocaleDateString('fr-FR')}`, margeG, y)
    y += 28

    // b) Niveau atteint (tout l'historique, pas la période)
    y = pdfSectionNiveaux(doc, y, lignesNiveaux)
    y += 10

    // c) Activité sur la période — section entière (titre, stats, graphique,
    // légende) sur une même page : en bloc sur la page suivante si elle ne
    // tient pas sous la section niveaux.
    const imgW = pageW - 2 * margeG
    const imgH = imgW * (canvas.height / canvas.width)
    const hActivite = 18 + 22 + 46 + 22 + 14 + imgH + 18 + 4
    if (y + hActivite > bas) { doc.addPage(); y = PDF_MARGE_H }
    else {
      doc.setDrawColor(228, 225, 216); doc.setLineWidth(0.6)
      doc.line(margeG, y, pageW - margeG, y)
      y += 18
    }
    y = pdfTitreSection(doc, y, 'ACTIVITÉ SUR LA PÉRIODE', null) + 6

    const stats = [
      ['Sessions faites', String(totalSessions), `${totalExercices} exercices`],
      ['Durée totale', dureeAffiche, null],
      ['Jours actifs', `${joursActifsSet.size}/${nbJoursPeriode}`, null],
      ['Quiz abandonnés', String(nbAbandons), null],
      ['Taux de bonnes réponses', scoreMoyen + '%', null]
    ]
    const colW = (pageW - 2 * margeG) / stats.length
    stats.forEach((s, i) => {
      const x = margeG + i * colW
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(107, 110, 115)
      doc.text(s[0], x, y)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(27, 42, 74)
      doc.text(s[1], x, y + 17)
      if (s[2]) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(154, 154, 149)
        doc.text(s[2], x, y + 28)
      }
    })
    y += 46

    // d) Graphique et sa légende (inchangés), dans le même bloc que les stats
    doc.setDrawColor(228, 225, 216); doc.setLineWidth(0.6)
    doc.line(margeG, y, pageW - margeG, y)
    y += 22

    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(65, 69, 76)
    doc.text(`Nombre de sessions par ${granularite === 'jour' ? 'jour' : granularite === 'semaine' ? 'semaine' : 'mois'} (une session = 5 exercices)`, pageW / 2, y, { align: 'center' })
    y += 14

    doc.addImage(imgData, 'PNG', margeG, y, imgW, imgH)
    y += imgH + 18
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(107, 110, 115)
    doc.text(`Couleur des barres : bleu = score ${granularite === 'jour' ? 'du jour' : granularite === 'semaine' ? 'de la semaine' : 'du mois'} 70% ou plus, doré = moins de 70%`, pageW / 2, y, { align: 'center' })

    doc.save(nomFichier || `academika-bilan-${mode}-${new Date().toISOString().split('T')[0]}.pdf`)

    return { vide: null }
  }

  const API = {
    generer, getRangeEtGranularite, parseUTC, dateLocaleISO, cleBucket, libelleBucket, genererClesPeriode,
    pdfSectionNiveaux, pdfCelluleNiveau, PDF_COUL
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = API
  else window.BilanPDF = API
})()
