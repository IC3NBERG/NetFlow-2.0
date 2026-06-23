import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Toast } from '../../../shared/ui/Toast'
import {
  LifeBuoy,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  HelpCircle,
  ShieldCheck,
  Zap,
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
    answer: 'Assolutamente sì. La sicurezza dei tuoi dati è la nostra priorità. Tutte le informazioni vengono trasmesse tramite crittografia HTTPS sicura e memorizzate su database Supabase crittografati a riposo (AES-256). L\'accesso ai dati è protetto da policy di sicurezza rigorose (Row Level Security) per cui solo tu puoi accedere ai tuoi dati.',
  },
  {
    question: 'Come gestisco le spese e le uscite professionali?',
    answer: 'Accedi alla sezione "Uscite" dal menu laterale. Lì puoi inserire le uscite specificando data, importo, categoria e caricare un allegato (es. scontrino o ricevuta in PDF/JPG). Le spese vengono tracciate separatamente dalle entrate per offrirti un resoconto pulito dell\'andamento economico.',
  },
]

export function HelpPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [requestType, setRequestType] = useState('bug')
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
    const typeLabel = requestType === 'bug' ? 'Segnalazione Bug' : 'Suggerimento Feature'
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <LifeBuoy className="h-7 w-7 text-brand animate-pulse" />
          Centro Aiuto & FAQ
        </h2>
        <p className="text-xs md:text-sm text-text-secondary">
          Ottieni risposte alle domande più frequenti o contatta direttamente il creatore dell'applicazione per supporto e consigli
        </p>
      </div>

      <motion.div variants={containerAnim} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN: FAQ Accordions */}
        <motion.div variants={itemAnim} className="space-y-4">
          <GlassCard className="p-4 md:p-6 space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="p-4 flex flex-col items-center text-center gap-2">
              <ShieldCheck className="h-7 w-7 text-success" />
              <h4 className="text-xs md:text-sm font-bold text-text-primary">GDPR compliant</h4>
              <p className="text-[10px] md:text-xs text-text-secondary">Dati personali crittografati al sicuro</p>
            </GlassCard>
            <GlassCard className="p-4 flex flex-col items-center text-center gap-2">
              <Zap className="h-7 w-7 text-brand" />
              <h4 className="text-xs md:text-sm font-bold text-text-primary">Sempre Online/Offline</h4>
              <p className="text-[10px] md:text-xs text-text-secondary">Funziona anche senza connessione internet</p>
            </GlassCard>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Contact & Suggestion Form */}
        <motion.div variants={itemAnim}>
          <GlassCard className="p-4 md:p-6 space-y-4">
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
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                >
                  <option value="bug">🐛 Segnala un Bug / Problema</option>
                  <option value="feature">💡 Consiglia una Nuova Feature</option>
                  <option value="other">💬 Altro / Domanda generica</option>
                </select>
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
