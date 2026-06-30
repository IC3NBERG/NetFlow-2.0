import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Toast } from '../../../shared/ui/Toast'
import { cn } from '../../../lib/utils'
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  HelpCircle,
  Bug,
  Lightbulb,
  MessageSquare,
  Check,
} from 'lucide-react'

const faqs = [
  {
    question: 'Come vengono calcolate le tasse nel regime forfettario?',
    answer: 'Nel regime forfettario l\'imponibile previdenziale e fiscale viene calcolato applicando il coefficiente di redditività (es. 78% per professionisti, 67% per commercio) ai tuoi ricavi lordi incassati. Su questa base imponibile viene calcolata l\'imposta sostitutiva (5% per le nuove attività nei primi 5 anni, poi 15%) e i contributi previdenziali INPS (Gestione Separata o Cassa Professionale).',
  },
  {
    question: 'Come posso condividere i dati con il mio commercialista?',
    answer: 'Puoi andare su Impostazioni → Condivisione e creare un link sicuro e temporaneo di sola lettura. Il tuo commercialista potrà visualizzare il registro dei tuoi lavori, scadenze, fatture e uscite, oppure esportare i dati direttamente in CSV o JSON senza poter modificare nulla nel tuo account.',
  },
  {
    question: 'Qual è la differenza tra Parcella e Fattura?',
    answer: 'La parcella (o avviso di parcella) è un documento proforma non fiscale che invii al cliente prima di ricevere il pagamento, utile specialmente nei regimi fiscali ordinari per non anticipare l\'IVA. Quando il cliente effettua il pagamento, devi emettere la fattura elettronica o cartacea definitiva avente valore fiscale.',
  },
  {
    question: 'Come funziona la sincronizzazione offline?',
    answer: 'NetFlow è una Progressive Web App (PWA) progettata per funzionare anche offline. Se perdi la connessione internet, puoi continuare a creare, modificare ed eliminare lavori o spese. Le modifiche vengono salvate in un database locale sicuro (IndexedDB) e sincronizzate automaticamente con il cloud di Supabase appena torni online.',
  },
  {
    question: 'I miei dati finanziari e personali sono al sicuro?',
    answer: 'Assolutamente sì. La sicurezza dei tuoi dati è la nostra priorità. Tutte le informazioni vengono trasmesse tramite crittografia HTTPS sicura e memorizzate su database Supabase crittografati a riposo (AES-256). L\'accesso dei dati è protetto da policy di sicurezza rigorose (Row Level Security) per cui solo tu puoi accedere ai tuoi dati.',
  },
  {
    question: 'Come gestisco le spese e le uscite professionali?',
    answer: 'Accedi alla sezione "Uscite" dal menu laterale. Lì puoi inserire le uscite specificando data, importo, categoria e caricare un allegato (es. scontrino o ricevuta in PDF/JPG). Le spese vengono tracciate separatamente dalle entrate per offrirti un resoconto pulito dell\'andamento economico.',
  },
]

const requestOptions = [
  { value: 'bug', label: 'Segnala un Bug / Problema', icon: Bug, colorClass: 'text-expense bg-expense/10' },
  { value: 'feature', label: 'Consiglia una Nuova Feature', icon: Lightbulb, colorClass: 'text-brand bg-brand/10' },
  { value: 'other', label: 'Altro / Domanda generica', icon: MessageSquare, colorClass: 'text-text-secondary bg-text-secondary/10' },
]

export function HelpPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [requestType, setRequestType] = useState('bug')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      setToast({ message: 'Compila tutti i campi obbligatori', type: 'error' })
      return
    }

    const email = 'giorgiocalleriall@gmail.com'
    const typeLabel =
      requestType === 'bug'
        ? 'Segnalazione Bug'
        : requestType === 'feature'
        ? 'Suggerimento Feature'
        : 'Altro / Domanda generica'
    const mailtoSubject = `[NetFlow Supporto] ${typeLabel}: ${subject.trim()}`
    const mailtoBody = `Tipo Richiesta: ${typeLabel}\n\nDescrizione Dettagliata:\n${description.trim()}\n\n---\nInviato da NetFlow contabilità`

    // Open default mail client
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`

    setSubject('')
    setDescription('')
    setToast({ message: 'Apertura del tuo client email in corso...', type: 'success' })
  }

  const containerAnim = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }

  const itemAnim = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  }

  const selectedOption = requestOptions.find((opt) => opt.value === requestType) || requestOptions[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold">
          Aiuto / Contatti
        </h2>
        <p className="text-xs md:text-sm text-text-secondary">
          Ottieni risposte alle domande più frequenti o contatta direttamente il creatore dell'applicazione per supporto e consigli
        </p>
      </div>

      <motion.div variants={containerAnim} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
        {/* LEFT COLUMN: FAQ Accordions */}
        <motion.div variants={itemAnim} className="flex flex-col h-full">
          <GlassCard className="p-4 md:p-6 space-y-4 flex-1 h-full">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-brand" />
              <h3 className="text-base md:text-lg font-semibold">Domande Frequenti (FAQ)</h3>
            </div>
            <p className="text-xs md:text-sm text-text-secondary pb-2 border-b border-border/30">
              Clicca sulle domande per espandere le risposte e comprendere meglio il funzionamento della contabilità e del sito.
            </p>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index
                return (
                  <div
                    key={index}
                    className="border border-border/40 rounded-xl overflow-hidden bg-surface/30 transition-all duration-200 hover:border-brand/45"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full flex items-center justify-between text-left p-4 focus:outline-none focus:bg-surface/50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-text-primary pr-4">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-brand shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-secondary shrink-0" />
                      )}
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 text-xs md:text-sm text-text-secondary border-t border-border/20 bg-surface/10 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* RIGHT COLUMN: Contact & Suggestion Form */}
        <motion.div variants={itemAnim} className="flex flex-col h-full">
          <GlassCard className="p-4 md:p-6 space-y-4 flex-1 h-full">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-brand" />
              <h3 className="text-base md:text-lg font-semibold">Contatta il Creatore</h3>
            </div>
            <p className="text-xs md:text-sm text-text-secondary">
              Hai riscontrato un bug o desideri proporre una nuova funzionalità? Compila il modulo sotto per generare una mail precompilata a <strong>giorgiocalleriall@gmail.com</strong>.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Tipo di richiesta</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={cn(
                      'w-full rounded-input border border-border px-4 py-2.5 min-h-[48px] bg-surface text-left flex items-center justify-between transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
                      isDropdownOpen && 'border-brand/50 ring-2 ring-brand/30'
                    )}
                  >
                    <span className="text-text-primary flex items-center gap-2.5 text-sm">
                      {selectedOption && (
                        <>
                          <span className={cn("p-1.5 rounded-lg shrink-0", selectedOption.colorClass)}>
                            <selectedOption.icon className="h-4 w-4" />
                          </span>
                          {selectedOption.label}
                        </>
                      )}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-text-secondary transition-transform duration-200", isDropdownOpen && "rotate-180")} />
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 p-1">
                        {requestOptions.map((opt) => {
                          const Icon = opt.icon
                          const isSelected = opt.value === requestType
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setRequestType(opt.value)
                                setIsDropdownOpen(false)
                              }}
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                isSelected
                                  ? "bg-brand/10 text-brand font-medium"
                                  : "text-text-primary hover:bg-text-secondary/10"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={cn("p-1.5 rounded-lg shrink-0", opt.colorClass)}>
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span>{opt.label}</span>
                              </div>
                              {isSelected && <Check className="h-4 w-4 text-brand shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Input
                label="Oggetto"
                placeholder="Es. Problema nel caricamento scontrini o Idea per la barra di ricerca"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-text-primary">Descrizione dettagliata</label>
                <textarea
                  placeholder="Descrivi dettagliatamente il problema riscontrato o spiega la funzionalità che vorresti vedere implementata..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all text-sm resize-none"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full md:w-auto">
                  <Send className="h-4 w-4 mr-2" />
                  Invia richiesta (via Email)
                </Button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </motion.div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
