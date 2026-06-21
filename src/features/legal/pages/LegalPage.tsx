import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Shield, FileText, Cookie, Scale, Mail, Trash2 } from 'lucide-react'

const sections = [
  {
    id: 'privacy',
    icon: Shield,
    title: 'Informativa Privacy (ex art. 13 GDPR)',
    content: `NetFlow tratta i dati personali e finanziari dell'utente esclusivamente per fornire il servizio di tracciamento contabile e generazione documenti fiscali.
Titolare del trattamento è l'utente stesso per i propri dati inseriti. La piattaforma agisce come responsabile del trattamento ai sensi dell'art. 28 GDPR.
I dati vengono memorizzati su server crittografati con standard AES-256 e trasmessi esclusivamente tramite protocollo HTTPS.
Base giuridica del trattamento: esecuzione del contratto di servizio (art. 6.1.b GDPR) e adempimento obblighi fiscali (art. 6.1.c GDPR).
I dati non vengono trasferiti al di fuori dello Spazio Economico Europeo.`,
  },
  {
    id: 'data-processing',
    icon: FileText,
    title: 'Tipologia di Dati Trattati',
    content: `- Dati anagrafici: nome, cognome, partita IVA, codice fiscale, indirizzo, email
- Dati finanziari: importi lavori, parcelle, fatture, transazioni, metodo di pagamento
- Dati professionali: ragione sociale, regime fiscale, obiettivi finanziari
- Dati tecnici: preferenze tema, layout dashboard, impostazioni notifiche`,
  },
  {
    id: 'cookie',
    icon: Cookie,
    title: 'Cookie Policy',
    content: `Questo sito utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio:
- Cookie di sessione: per mantenere l'autenticazione (durata sessione)
- Cookie di preferenza: per salvare il tema scelto (durata 365 giorni)
- Local Storage: per memorizzare le preferenze offline (non condivisi)

Non vengono utilizzati cookie di profilazione, marketing o tracciamento di terze parti.
L'utente può disabilitare i cookie dalle impostazioni del browser, ma alcune funzionalità potrebbero risultare compromesse.`,
  },
  {
    id: 'rights',
    icon: Scale,
    title: 'Diritti dell\'Interessato (GDPR)',
    content: `L'utente ha diritto di:
- Accesso: ottenere conferma dell'esistenza dei propri dati e richiederne copia
- Rettifica: correggere dati inesatti o incompleti
- Cancellazione (diritto all'oblio): richiedere la rimozione dei propri dati
- Limitazione: richiedere la sospensione del trattamento
- Portabilità: ricevere i propri dati in formato strutturato (JSON/CSV)
- Opposizione: opporsi al trattamento per finalità di marketing

Per esercitare i tuoi diritti, utilizza la sezione Account > Esporta dati o contattaci via email.`,
  },
  {
    id: 'retention',
    icon: Trash2,
    title: 'Periodo di Conservazione',
    content: `I dati finanziari vengono conservati per l'intera durata del rapporto contrattuale e per i successivi 10 anni ai fini fiscali (ex art. 22 DPR 600/73, art. 2220 CC).
I dati di navigazione e preferenze vengono conservati fino alla cancellazione dell'account.
Alla richiesta di cancellazione dell'account, tutti i dati vengono rimossi entro 30 giorni, fatti salvi gli obblighi di legge che richiedono conservazione per finalità fiscali.`,
  },
  {
    id: 'contact',
    icon: Mail,
    title: 'Contatti',
    content: `Per qualsiasi richiesta relativa al trattamento dei dati personali, puoi contattarci:
- Email: privacy@fintrack.app
- Tempo di risposta: entro 30 giorni (ai sensi dell'art. 12 GDPR)
- Autorità di controllo: Garante per la Protezione dei Dati Personali
  Piazza Venezia 11, 00187 Roma - www.garanteprivacy.it`,
  },
]

export function LegalPage() {
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
        <h2 className="text-2xl md:text-3xl font-bold">Privacy & Legal</h2>
        <p className="text-xs md:text-sm text-text-secondary">
          Informazioni sul trattamento dei dati e termini di servizio
        </p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <motion.div key={section.id} variants={itemAnim}>
              <GlassCard className="p-4 md:p-6 space-y-2 md:space-y-3">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 md:h-5 w-4 md:w-5 text-brand" />
                  <h3 className="text-base md:text-lg font-semibold">{section.title}</h3>
                </div>
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </GlassCard>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
