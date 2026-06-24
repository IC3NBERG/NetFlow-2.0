import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import {
  Shield, FileText, Cookie, Scale, Mail, Database,
} from 'lucide-react'

const sections = [
  {
    id: 'privacy',
    icon: Shield,
    title: 'Informativa Privacy (ex art. 13 GDPR)',
    content: `NetFlow (di seguito "l'Applicazione") tratta i dati personali e finanziari dell'utente esclusivamente per le finalità di fornitura del servizio di tracciamento contabile e generazione di documenti fiscali.

Titolare del trattamento è l'utente stesso per i propri dati inseriti. L'Applicazione agisce come responsabile del trattamento ai sensi dell'art. 28 GDPR.

I dati vengono memorizzati su server crittografati con standard AES-256 e trasmessi esclusivamente tramite protocollo HTTPS (TLS 1.3). L'infrastruttura è ospitata su provider conforme al Regolamento UE 2016/679.

Base giuridica del trattamento:
• Esecuzione del contratto di servizio (art. 6.1.b GDPR)
• Adempimento di obblighi fiscali e contabili (art. 6.1.c GDPR)
• Consenso esplicito per finalità opzionali (art. 6.1.a GDPR)

I dati non vengono trasferiti al di fuori dello Spazio Economico Europeo. In caso di sub-responsori, questi sono vincolati contrattualmente al rispetto del GDPR.`,
  },
  {
    id: 'data-processing',
    icon: FileText,
    title: 'Tipologia di Dati Trattati e Finalità',
    content: `Dati anagrafici e professionali:
• Nome, cognome, partita IVA, codice fiscale, indirizzo, email — per la profilazione fiscale e l'emissione di documenti
• Ragione sociale, regime fiscale, obiettivi finanziari — per il calcolo automatico delle metriche

Dati finanziari e contabili:
• Importi lavori, parcelle, fatture, transazioni, metodo di pagamento, date — per la contabilità e la generazione di documenti fiscali
• Split carta/contanti e inclusione in fattura — per la gestione di pagamenti misti

Dati tecnici e di preferenza:
• Tema (chiaro/scuro/sistema), layout dashboard ordinato, impostazioni notifiche — per la personalizzazione dell'esperienza
• Preferenze di sincronizzazione e backup — per la gestione offline

Dati di navigazione:
• Log di accesso anonimizzati — per sicurezza e manutenzione
• Eventi di audit su creazione/modifica/cancellazione dati — per compliance fiscale

Nessun dato sensibile (art. 9 GDPR) o giudiziario (art. 10 GDPR) viene intenzionalmente raccolto. L'utente è invitato a non inserire dati di questa natura.`,
  },
  {
    id: 'cookie',
    icon: Cookie,
    title: 'Cookie Policy e Tecnologie Analogue',
    content: `L'Applicazione utilizza esclusivamente cookie tecnici e tecnologie di memorizzazione locale necessari al funzionamento del servizio:

Cookie tecnici essenziali:
• Cookie di sessione (PHPSESSID / sb-*): per mantenere lo stato di autenticazione dell'utente — durata: sessione del browser
• Cookie di preferenza: per salvare il tema selezionato (chiaro/scuro/sistema) — durata: 365 giorni
• Local Storage (IndexedDB): per memorizzare i dati in cache e le operazioni offline — persistente fino a cancellazione esplicita
• Session Storage: per parametri temporanei di navigazione — durata: sessione del browser

Non vengono utilizzati:
• Cookie di profilazione o pubblicitari
• Cookie di tracciamento di terze parti (Google Analytics, Facebook Pixel, etc.)
• Fingerprinting o tecnologie di riconoscimento跨-sito

L'utente può disabilitare i cookie dalle impostazioni del browser in qualsiasi momento. Si noti che alcune funzionalità dell'Applicazione (autenticazione, tema persistente, funzionamento offline) potrebbero risultare compromesse.

Per gestire le preferenze sui cookie nel tuo browser:
• Chrome: Impostazioni → Privacy e sicurezza → Cookie
• Firefox: Opzioni → Privacy e Sicurezza → Cookie
• Safari: Preferenze → Privacy → Cookie
• Edge: Impostazioni → Cookie e autorizzazioni`,
  },
  {
    id: 'rights',
    icon: Scale,
    title: 'Diritti dell\'Interessato (artt. 15-22 GDPR)',
    content: `In qualità di interessato, l'utente ha il diritto di esercitare in qualsiasi momento i seguenti diritti:

Diritto di accesso (art. 15): ottenere conferma dell'esistenza o meno di dati personali che lo riguardano e riceverne comunicazione sotto forma intellegibile.

Diritto di rettifica (art. 16): ottenere la correzione dei dati personali inesatti o incompleti senza ingiustificato ritardo.

Diritto alla cancellazione (art. 17 "diritto all'oblio"): ottenere la rimozione dei propri dati personali quando non più necessari per le finalità del trattamento.

Diritto di limitazione (art. 18): ottenere la sospensione del trattamento in caso di contestazione dell'esattezza dei dati o di trattamento illecito.

Diritto alla portabilità (art. 20): ricevere i propri dati in formato strutturato, di uso comune e leggibile da dispositivo automatico (JSON), e trasmetterli a un altro titolare.

Diritto di opposizione (art. 21): opporsi al trattamento per finalità di marketing diretto o per un interesse legittimo del titolare.

Diritto di non essere sottoposto a decisioni automatizzate (art. 22): l'Applicazione non utilizza processi decisionali interamente automatizzati che producano effetti giuridici.

Per esercitare i tuoi diritti, utilizza la sezione "Portabilità dati" qui sotto per esportare i tuoi dati o contattaci via email all'indirizzo indicato nella sezione Contatti.`,
  },
  {
    id: 'retention',
    icon: Database,
    title: 'Periodo di Conservazione e Criteri',
    content: `I dati sono conservati per il tempo strettamente necessario alle finalità per cui sono stati raccolti, nel rispetto dei seguenti criteri:

Dati finanziari e contabili:
• Conservati per l'intera durata del rapporto contrattuale e per i successivi 10 anni ai fini fiscali (ex art. 22 DPR 600/73, art. 2220 CC)
• Inclusi: lavori, fatture, preventivi, transazioni, registri IVA

Dati anagrafici e di profilo:
• Conservati fino alla richiesta di cancellazione dell'account
• In caso di inattività prolungata (24 mesi), l'utente riceverà una notifica prima di eventuale sospensione

Dati tecnici e preferenze:
• Conservati fino alla cancellazione dell'account o modifica delle preferenze

Cookie e memorizzazione locale:
• Cookie di sessione: fino alla chiusura del browser
• Cookie di preferenza: 365 giorni
• Cache locale IndexedDB: fino a cancellazione esplicita da parte dell'utente

Alla richiesta di cancellazione dell'account, tutti i dati vengono rimossi entro 30 giorni, fatti salvi gli obblighi di legge che richiedono conservazione per finalità fiscali (art. 22 DPR 600/73).`,
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Misure di Sicurezza Tecniche e Organizzative',
    content: `L'Applicazione adotta le seguenti misure per garantire la sicurezza e la riservatezza dei dati trattati:

Misure tecniche:
• Crittografia a riposo: tutti i dati sono memorizzati con crittografia AES-256 su database Supabase
• Crittografia in transito: protocollo HTTPS (TLS 1.3) per tutte le comunicazioni
• Autenticazione: JWT con refresh token e PKCE flow per prevenire attacchi di scambio codice
• Row Level Security (RLS): ogni utente può accedere esclusivamente ai propri dati
• Offline-first: i dati in cache locale sono protetti dall'isolamento del browser (IndexedDB sandbox)

Misure organizzative:
• Accesso ai dati strettamente limitato al personale autorizzato (sub-responsori)
• Audit logging: tutte le operazioni di creazione, modifica e cancellazione sono tracciate
• Backup automatici: replica dei dati su storage geograficamente ridondante
• Notifica immediata in caso di data breach all'autorità competente e all'utente (art. 33-34 GDPR)

Certificazioni e compliance:
• L'infrastruttura è conforme al Regolamento UE 2016/679 (GDPR)
• I sub-responsori (Supabase, Cloudflare) sono certificati SOC 2, ISO 27001`,
  },
  {
    id: 'contact',
    icon: Mail,
    title: 'Contatti e Dati del Titolare',
    content: `Per qualsiasi richiesta relativa al trattamento dei dati personali, puoi contattarci:

Email: giorgiocalleriall@gmail.com
Tempo di risposta: entro 30 giorni (ai sensi dell'art. 12 GDPR)

Autorità di controllo:
Garante per la Protezione dei Dati Personali
Piazza Venezia 11, 00187 Roma
www.garanteprivacy.it

Se ritieni che il trattamento dei tuoi dati violi il GDPR, hai il diritto di proporre reclamo all'Autorità di controllo sopra indicata (art. 77 GDPR).`,
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
        <h2 className="text-2xl md:text-3xl font-bold">Privacy e Trattamento Dati</h2>
        <p className="text-xs md:text-sm text-text-secondary">
          Informativa completa sul trattamento dei dati personali ai sensi del Regolamento UE 2016/679 (GDPR)
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
