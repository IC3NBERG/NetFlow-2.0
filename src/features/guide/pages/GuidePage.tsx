import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { useAuth } from '../../../app/providers/AuthProvider'
import { BookOpen, Calculator, Calendar, AlertTriangle, FileText, Scale, Percent } from 'lucide-react'
import type { TaxRegime } from '../../../types/database'

interface FiscalContent {
  title: string
  description: string
  aliquote: { label: string; value: string }[]
  scadenze: string[]
  adempimenti: { icon: typeof FileText; text: string }[]
  note: string[]
}

const fiscalGuides: Record<TaxRegime, FiscalContent> = {
  occasional: {
    title: 'Prestazione Occasionale',
    description: 'Per lavoratori autonomi occasionali con reddito sotto i 5.000€ annui per committente. Ritenuta d\'acconto del 20% applicata in fattura.',
    aliquote: [
      { label: 'Ritenuta d\'acconto', value: '20%' },
      { label: 'Contributi INPS (gestione separata)', value: '25,72%' },
      { label: 'Imposta di bollo', value: '2€ (se importo > 77,47€)' },
    ],
    scadenze: [
      'Fattura entro 12 mesi dalla prestazione',
      'Dichiarazione dei redditi annuale (Modello Redditi PF)',
      'Conservazione fatture per 10 anni',
    ],
    adempimenti: [
      { icon: FileText, text: 'Emettere fattura/parcella per ogni prestazione con ritenuta d\'acconto' },
      { icon: Calculator, text: 'Comunicare annualmente i compensi percepiti nel Modello Redditi' },
      { icon: Calendar, text: 'Rispettare i termini di conservazione documentale (10 anni)' },
    ],
    note: [
      'La ritenuta d\'acconto del 20% è trattenuta dal committente e versata all\'Erario.',
      'Se si superano i 5.000€ annui dallo stesso committente, scatta l\'obbligo di partita IVA.',
      'Non è possibile detrarre costi/spese sostenute per la prestazione.',
    ],
  },
  vat_flat: {
    title: 'Partita IVA Forfettario (Regime di Vantaggio)',
    description: 'Regime agevolato per liberi professionisti con ricavi annui fino a 85.000€. Coefficiente di redditività applicato al fatturato per determinare il reddito imponibile.',
    aliquote: [
      { label: 'Imposta sostitutiva IVS', value: '15% (5% per i primi 5 anni)' },
      { label: 'Coefficiente redditività (professionisti)', value: '78%' },
      { label: 'Contributi INPS (gestione separata)', value: '26,07%' },
      { label: 'Esente IVA', value: 'Nessuna IVA in fattura' },
    ],
    scadenze: [
      'Fattura immediata per ogni prestazione (esente IVA)',
      'Versamento contributi INPS annuale (saldo + acconto)',
      'Dichiarazione dei redditi annuale',
      'Comunicazione fatture trimestrale (solo per controllo)',
    ],
    adempimenti: [
      { icon: FileText, text: 'Emettere fattura con imposta di bollo se > 77,47€ (marca da bollo assolta virtualmente)' },
      { icon: Calculator, text: 'Calcolare il reddito imponibile applicando il coefficiente al fatturato' },
      { icon: Percent, text: 'Versare l\'imposta sostitutiva del 15% (o 5% startup) sul reddito imponibile' },
      { icon: Calendar, text: 'Gestire i contributi INPS con F24 annuale' },
    ],
    note: [
      'Non si detrae l\'IVA sugli acquisti (nessuna rivalsa IVA).',
      'Si può optare per il regime ordinario IVA dopo 5 anni.',
      'Il volume d\'affari massimo è 85.000€ annui.',
      'Obbligo di fattura elettronica per le prestazioni verso privati (dal 2024).',
    ],
  },
  vat_standard: {
    title: 'Partita IVA Ordinario',
    description: 'Regime ordinario per professionisti con ricavi superiori a 85.000€ o per scelta. Contabilità ordinaria con IVA mensile/trimestrale e detrazione integrale delle spese.',
    aliquote: [
      { label: 'IVA ordinaria', value: '22%' },
      { label: 'IRPEF (scaglioni progressivi)', value: '23-43%' },
      { label: 'Contributi INPS (gestione separata)', value: '26,07%' },
      { label: 'Addizionali regionali/comunali', value: 'Variabile' },
    ],
    scadenze: [
      'Liquidazione IVA mensile (entro il 25 del mese successivo)',
      'Liquidazione IVA trimestrale (con maggiorazione 1%)',
      'Dichiarazione IVA annuale',
      'Modello Redditi (ex UNICO) entro novembre',
      'Versamento saldo e primo acconto IRPEF (30 giugno / 30 luglio)',
      'Secondo acconto IRPEF (30 novembre)',
    ],
    adempimenti: [
      { icon: FileText, text: 'Emettere fattura con IVA per ogni prestazione' },
      { icon: Calculator, text: 'Liquidare l\'IVA mensilmente/trimestralmente (differenza IVA a debito e a credito)' },
      { icon: Scale, text: 'Calcolare e versare IRPEF su base progressiva per scaglioni' },
      { icon: Calendar, text: 'Gestire contributi INPS, addizionali e F24 alle scadenze previste' },
    ],
    note: [
      'Possibilità di detrarre l\'IVA sugli acquisti (strumenti, servizi, beni).',
      'Obbligo di fattura elettronica per tutte le prestazioni.',
      'Scritture contabili obbligatorie: registro IVA acquisti, corrispettivi, cespiti.',
      'Consigliata assistenza commercialista per la gestione contabile ordinaria.',
    ],
  },
}

export function GuidePage() {
  const { user } = useAuth()
  const regime = user?.tax_regime ?? 'occasional'
  const guide = fiscalGuides[regime]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  }

  const itemAnim = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold">Guida Fiscale</h2>
        <p className="text-xs md:text-sm text-text-secondary">
          Informazioni personalizzate per il tuo regime fiscale
        </p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemAnim}>
          <GlassCard className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <BookOpen className="h-5 md:h-6 w-5 md:w-6 text-brand" />
              <h3 className="text-base md:text-xl font-semibold">{guide.title}</h3>
            </div>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed">{guide.description}</p>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemAnim}>
          <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-center gap-3">
              <Percent className="h-4 md:h-5 w-4 md:w-5 text-[#00D2FF]" />
              <h3 className="text-base md:text-lg font-semibold">Aliquote</h3>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              {guide.aliquote.map((a) => (
                <div key={a.label} className="flex items-center justify-between rounded-card bg-surface border border-border px-3 md:px-4 py-2 md:py-3 gap-2">
                  <span className="text-[11px] md:text-sm">{a.label}</span>
                  <span className="text-[11px] md:text-sm font-mono font-semibold text-brand shrink-0">{a.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemAnim}>
          <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 md:h-5 w-4 md:w-5 text-success" />
              <h3 className="text-base md:text-lg font-semibold">Scadenze</h3>
            </div>
            <ul className="space-y-1.5 md:space-y-2">
              {guide.scadenze.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-text-secondary">
                  <span className="mt-1.5 md:mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  {s}
                </li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemAnim}>
          <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 md:h-5 w-4 md:w-5 text-[#F59E0B]" />
              <h3 className="text-base md:text-lg font-semibold">Adempimenti</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 md:gap-3 md:grid-cols-2">
              {guide.adempimenti.map((a) => {
                const Icon = a.icon
                return (
                  <div key={a.text} className="flex items-start gap-2 md:gap-3 rounded-card bg-surface border border-border p-3 md:p-4">
                    <Icon className="mt-0.5 h-3.5 md:h-4 w-3.5 md:w-4 shrink-0 text-brand" />
                    <p className="text-xs md:text-sm text-text-secondary">{a.text}</p>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemAnim}>
          <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-4 md:h-5 w-4 md:w-5 text-brand" />
              <h3 className="text-base md:text-lg font-semibold">Note</h3>
            </div>
            <ul className="space-y-1.5 md:space-y-2">
              {guide.note.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-text-secondary">
                  <span className="mt-1.5 md:mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {n}
                </li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  )
}
