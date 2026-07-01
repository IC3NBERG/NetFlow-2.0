#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseArgs() {
  const map = {}
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.+)$/)
    if (m) map[m[1]] = m[2]
  }
  return map
}

function readDotEnv() {
  const p = resolve(__dirname, '..', '.env')
  if (!existsSync(p)) {
    console.error('ERRORE: .env non trovato. Crea .env con VITE_SUPABASE_URL.')
    process.exit(1)
  }
  const text = readFileSync(p, 'utf-8')
  const m = text.match(/^VITE_SUPABASE_URL=(.+)$/m)
  if (!m) {
    console.error('ERRORE: VITE_SUPABASE_URL non trovato in .env')
    process.exit(1)
  }
  return m[1].trim()
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10)
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// ───────────────────────────────────────
// DATA DEFINITIONS
// ───────────────────────────────────────

const CLIENTS = [
  // Completi (tutti i campi)
  { name: 'Mario Rossi', email: 'mario.rossi@gmail.com', phone: '+39 333 1234567', vat_number: '01234567890', fiscal_code: 'RSSMRA80A01F205X', address: 'Via Roma 12, 20121 Milano', color: '#3B82F6', notes: null },
  { name: 'Azienda Beta SRL', email: 'info@aziendabeta.it', phone: '+39 02 9876543', vat_number: '09876543210', fiscal_code: null, address: 'Corso Italia 25, 00198 Roma', color: '#EF4444', notes: 'Azienda IT, 15 dipendenti' },
  { name: 'Luigi Verdi', email: 'luigi.verdi@pec.it', phone: null, vat_number: '04567890123', fiscal_code: 'VRDLGU85B20L219Y', address: 'Via Garibaldi 10, 10122 Torino', color: '#10B981', notes: null },
  { name: 'Bar Centrale di G. Neri', email: null, phone: '+39 02 5554433', vat_number: null, fiscal_code: null, address: 'Piazza Duomo 5, 20122 Milano', color: '#F59E0B', notes: 'Locale storico Milano' },
  { name: 'Studio Legale Bianchi & Associati', email: 'segreteria@studiobianchi.it', phone: '+39 051 1234567', vat_number: '07654321098', fiscal_code: null, address: 'Via Dante 15, 40125 Bologna', color: '#8B5CF6', notes: null },
  { name: 'Dott.ssa Anna Ferrari', email: 'anna.ferrari@commercialista.it', phone: '+39 055 6789012', vat_number: '06543210987', fiscal_code: 'FRRANN75C41D612X', address: 'Viale delle Rose 8, 50125 Firenze', color: '#EC4899', notes: 'Studio commercialista' },
  // Senza email o telefono
  { name: 'Ristorante Da Gigi', email: null, phone: '+39 081 3456789', vat_number: '08765432109', fiscal_code: null, address: 'Via Roma 55, 80142 Napoli', color: '#14B8A6', notes: null },
  { name: 'Marco Romano', email: 'marco.romano@outlook.it', phone: null, vat_number: '05432109876', fiscal_code: 'RMNMRC82E01G224V', address: null, color: '#F97316', notes: 'Fotografo, senza indirizzo' },
  { name: 'TecnoBeta SPA', email: 'acquisti@tecnobeta.it', phone: '+39 045 6123456', vat_number: null, fiscal_code: null, address: 'Via dell\'Industria 30, 37135 Verona', color: '#6366F1', notes: null },
  { name: 'Cristina Gallo', email: null, phone: '+39 030 7654321', vat_number: null, fiscal_code: null, address: null, color: '#A855F7', notes: 'Solo telefono, niente P.IVA' },
  { name: 'Agriturismo La Quercia', email: 'info@laquercia.it', phone: '+39 035 2345678', vat_number: '02109876543', fiscal_code: null, address: 'Strada Provinciale 7, 24125 Bergamo', color: '#22C55E', notes: null },
  { name: 'WebFactory di Paolo Conti', email: 'paolo@webfactory.it', phone: null, vat_number: '01098765432', fiscal_code: 'CNTPLA85D01H501U', address: 'Via della Repubblica 12, 00185 Roma', color: '#06B6D4', notes: null },
  // Solo nome e colore
  { name: 'Gabriele Esposito', email: null, phone: null, vat_number: null, fiscal_code: null, address: null, color: '#84CC16', notes: null },
  { name: 'Farmacia Dott. Galli', email: 'info@farmaciagalli.it', phone: '+39 0522 123456', vat_number: '06789012345', fiscal_code: null, address: 'Piazza della Vittoria 3, 42121 Reggio Emilia', color: '#0EA5E9', notes: null },
  { name: 'Elena Conti', email: 'elena.conti@gmail.com', phone: null, vat_number: null, fiscal_code: 'CNTLNE88E51L736X', address: null, color: '#D946EF', notes: 'Graphic designer freelance' },
  { name: 'Officina Rossi SRL', email: 'info@officinarossi.it', phone: '+39 011 7890123', vat_number: '05678901234', fiscal_code: null, address: 'Via Torino 50, 10123 Torino', color: '#E11D48', notes: 'Officina meccanica' },
  { name: 'Martina Belli', email: null, phone: null, vat_number: null, fiscal_code: null, address: null, color: null, notes: 'Cliente occasionale, nessun dato fiscale' },
  { name: 'Boutique Moda Sui Pedana', email: 'info@suitpedana.it', phone: '+39 041 9876543', vat_number: '07890123456', fiscal_code: null, address: 'Via Mercerie 5, 30124 Venezia', color: '#7C3AED', notes: null },
]

const TAGS = [
  { name: 'Sviluppo Web', color: '#3B82F6' },
  { name: 'Consulenza', color: '#10B981' },
  { name: 'Design', color: '#F59E0B' },
  { name: 'Assistenza Tecnica', color: '#8B5CF6' },
  { name: 'Formazione', color: '#EC4899' },
  { name: 'Manutenzione', color: '#EF4444' },
  { name: 'Marketing', color: '#F97316' },
  { name: 'Fotografia', color: '#06B6D4' },
]

function jobDate(month, day) {
  return fmtDate(new Date(2026, month - 1, day))
}

const JOBS_DATA = [
  // ===================== ACTIVE (10) =====================
  { title: 'Sviluppo e-commerce WooCommerce', description: 'Implementazione carrello, pagamenti, gestione ordini', status: 'active', payment_method: 'card', amount_card: 3500, amount_cash: 0, start_date: jobDate(4, 2), clientIdx: 1, tags: [0] },
  { title: 'Consulenza SEO tecnica', description: 'Audit SEO completo e piano di ottimizzazione', status: 'active', payment_method: 'card', amount_card: 1200, amount_cash: 0, start_date: jobDate(5, 10), clientIdx: 1, tags: [1] },
  { title: 'Progettazione brand identity', description: 'Logo, palette colori, tipografia', status: 'active', payment_method: 'mixed', amount_card: 800, amount_cash: 500, include_cash_in_invoice: true, start_date: jobDate(5, 20), clientIdx: 4, tags: [2] },
  { title: 'Riparazione sito WordPress', description: 'Risoluzione vulnerabilità e aggiornamento', status: 'active', payment_method: 'card', amount_card: 450, amount_cash: 0, start_date: jobDate(6, 1), clientIdx: 3, tags: [3, 5] },
  { title: 'Corso formazione social media', status: 'active', payment_method: 'card', amount_card: 2000, amount_cash: 0, start_date: jobDate(6, 5), clientIdx: 4, tags: [4] },
  { title: 'Consulenza fiscale annuale', status: 'active', payment_method: 'cash', amount_card: 0, amount_cash: 3500, start_date: jobDate(6, 8), clientIdx: 5, tags: [1] },
  { title: 'Sviluppo app gestionale mobile', description: 'Prototipo React Native per gestione ordini', status: 'active', payment_method: 'card', amount_card: 5500, amount_cash: 0, start_date: jobDate(5, 15), clientIdx: 8, tags: [0] },
  { title: 'Manutenzione server trimestrale', status: 'active', payment_method: 'mixed', amount_card: 400, amount_cash: 200, include_cash_in_invoice: false, start_date: jobDate(6, 12), clientIdx: 8, tags: [5] },
  { title: 'Campagna Google Ads', description: 'Impostazione e gestione campagne ADS', status: 'active', payment_method: 'card', amount_card: 1500, amount_cash: 0, start_date: jobDate(6, 15), clientIdx: 11, tags: [6] },
  { title: 'Servizio fotografico eventi', status: 'active', payment_method: 'cash', amount_card: 0, amount_cash: 1200, start_date: jobDate(6, 20), clientIdx: 7, tags: [7] },

  // ===================== COMPLETED_PENDING (10) =====================
  { title: 'Sito vetrina ristorante', description: 'Sito responsive con menu digitale e prenotazioni', status: 'completed_pending', payment_method: 'card', amount_card: 2800, amount_cash: 0, start_date: jobDate(2, 10), pending_date: jobDate(4, 1), clientIdx: 6, tags: [0, 2] },
  { title: 'Consulenza cloud migration', description: 'Migrazione infrastruttura su AWS', status: 'completed_pending', payment_method: 'card', amount_card: 4200, amount_cash: 0, start_date: jobDate(3, 5), pending_date: jobDate(5, 1), clientIdx: 8, tags: [1] },
  { title: 'Servizio fotografico catalogo', status: 'completed_pending', payment_method: 'mixed', amount_card: 900, amount_cash: 600, include_cash_in_invoice: true, start_date: jobDate(3, 20), pending_date: jobDate(5, 15), clientIdx: 7, tags: [7] },
  { title: 'Corso Excel avanzato', description: 'Corso per 8 dipendenti: tabelle pivot e macro', status: 'completed_pending', payment_method: 'cash', amount_card: 0, amount_cash: 1500, start_date: jobDate(4, 10), pending_date: jobDate(5, 20), clientIdx: 2, tags: [4] },
  { title: 'Traduzione documenti tecnici', status: 'completed_pending', payment_method: 'card', amount_card: 1800, amount_cash: 0, start_date: jobDate(4, 15), pending_date: jobDate(6, 1), clientIdx: 9, tags: null },
  { title: 'Assistenza helpdesk (20 ore)', description: 'Supporto tecnico su gestionale', status: 'completed_pending', payment_method: 'card', amount_card: 1000, amount_cash: 0, start_date: jobDate(5, 2), pending_date: jobDate(6, 10), clientIdx: 2, tags: [3] },
  { title: 'Sviluppo API REST', description: 'API per integrazione CRM con e-commerce', status: 'completed_pending', payment_method: 'card', amount_card: 3800, amount_cash: 0, start_date: jobDate(4, 20), pending_date: jobDate(6, 15), clientIdx: 11, tags: [0] },
  { title: 'Certificazione GDPR', description: 'Analisi compliance e redazione privacy policy', status: 'completed_pending', payment_method: 'mixed', amount_card: 500, amount_cash: 300, include_cash_in_invoice: false, start_date: jobDate(5, 5), pending_date: jobDate(6, 18), clientIdx: 3, tags: [1] },
  { title: 'Consulenza marketing digitale', status: 'completed_pending', payment_method: 'card', amount_card: 2200, amount_cash: 0, start_date: jobDate(5, 10), pending_date: jobDate(6, 20), clientIdx: 0, tags: [6] },
  { title: 'Revisione codici privacy', description: 'Adeguamento normativa privacy sito web', status: 'completed_pending', payment_method: 'card', amount_card: 750, amount_cash: 0, start_date: jobDate(5, 15), pending_date: jobDate(6, 22), clientIdx: 14, tags: [1] },

  // ===================== COMPLETED_SETTLED (15) =====================
  { title: 'Consulenza strategia marketing', description: 'Piano marketing per lancio nuovo prodotto', status: 'completed_settled', payment_method: 'card', amount_card: 2500, amount_cash: 0, start_date: jobDate(1, 10), pending_date: jobDate(2, 1), end_date: jobDate(2, 15), clientIdx: 0, tags: [6] },
  { title: 'Tema WordPress custom', description: 'Tema su misura per azienda di servizi', status: 'completed_settled', payment_method: 'card', amount_card: 3200, amount_cash: 0, start_date: jobDate(1, 15), pending_date: jobDate(2, 20), end_date: jobDate(3, 1), clientIdx: 0, tags: [0] },
  { title: 'Hosting annuale + dominio', status: 'completed_settled', payment_method: 'card', amount_card: 600, amount_cash: 0, start_date: jobDate(1, 20), pending_date: jobDate(2, 1), end_date: jobDate(2, 1), clientIdx: 0, tags: null },
  { title: 'Brochure aziendale 12 pagine', description: 'Progettazione grafica e impaginazione', status: 'completed_settled', payment_method: 'mixed', amount_card: 600, amount_cash: 400, include_cash_in_invoice: true, start_date: jobDate(2, 1), pending_date: jobDate(2, 25), end_date: jobDate(3, 5), clientIdx: 10, tags: [2] },
  { title: 'Supporto tecnico WordPress', status: 'completed_settled', payment_method: 'card', amount_card: 350, amount_cash: 0, start_date: jobDate(2, 5), pending_date: jobDate(2, 15), end_date: jobDate(2, 20), clientIdx: 3, tags: [3] },
  { title: 'Corso JavaScript base', description: '4 sessioni online per 6 partecipanti', status: 'completed_settled', payment_method: 'card', amount_card: 2800, amount_cash: 0, start_date: jobDate(2, 10), pending_date: jobDate(3, 20), end_date: jobDate(3, 25), clientIdx: 1, tags: [4] },
  { title: 'Consulenza ottimizzazione processi', status: 'completed_settled', payment_method: 'cash', amount_card: 0, amount_cash: 2000, start_date: jobDate(2, 20), pending_date: jobDate(3, 10), end_date: jobDate(3, 15), clientIdx: 4, tags: [1] },
  { title: 'Sviluppo PWA prenotazioni', description: 'PWA con sincronizzazione calendario', status: 'completed_settled', payment_method: 'mixed', amount_card: 3200, amount_cash: 1500, include_cash_in_invoice: true, start_date: jobDate(3, 1), pending_date: jobDate(5, 1), end_date: jobDate(5, 10), clientIdx: 10, tags: [0] },
  { title: 'Refactoring codice legacy', description: 'Review e bonifica moduli critici', status: 'completed_settled', payment_method: 'card', amount_card: 2200, amount_cash: 0, start_date: jobDate(3, 10), pending_date: jobDate(4, 15), end_date: jobDate(4, 20), clientIdx: 11, tags: [0] },
  { title: 'Sito vetrina con booking', description: 'Sito con sistema prenotazione online', status: 'completed_settled', payment_method: 'card', amount_card: 2700, amount_cash: 0, start_date: jobDate(2, 15), pending_date: jobDate(3, 25), end_date: jobDate(4, 10), clientIdx: 10, tags: [0, 2] },
  { title: 'Installazione firewall rete', status: 'completed_settled', payment_method: 'card', amount_card: 950, amount_cash: 0, start_date: jobDate(1, 25), pending_date: jobDate(2, 10), end_date: jobDate(2, 12), clientIdx: 15, tags: [5] },
  { title: 'Formazione Wordpress base', description: 'Corso base di Wordpress per 3 dipendenti', status: 'completed_settled', payment_method: 'mixed', amount_card: 800, amount_cash: 400, include_cash_in_invoice: false, start_date: jobDate(2, 8), pending_date: jobDate(3, 5), end_date: jobDate(3, 8), clientIdx: 3, tags: [4] },
  { title: 'Servizio fotografico matrimonio', status: 'completed_settled', payment_method: 'cash', amount_card: 0, amount_cash: 1800, start_date: jobDate(3, 15), pending_date: jobDate(4, 1), end_date: jobDate(4, 5), clientIdx: 7, tags: [7] },
  { title: 'Consulenza sicurezza informatica', description: 'Vulnerability assessment e report', status: 'completed_settled', payment_method: 'card', amount_card: 1600, amount_cash: 0, start_date: jobDate(3, 20), pending_date: jobDate(4, 20), end_date: jobDate(4, 25), clientIdx: 14, tags: [1] },
  { title: 'Realizzazione logo e biglietti da visita', status: 'completed_settled', payment_method: 'card', amount_card: 450, amount_cash: 0, start_date: jobDate(1, 5), pending_date: jobDate(1, 20), end_date: jobDate(1, 25), clientIdx: 16, tags: [2] },
]

const QUOTES_DATA = [
  { title: 'Sviluppo app mobile gestionale', description: 'App React Native per ordini e magazzino', status: 'draft', payment_method: 'card', amount_card: 7000, amount_cash: 0, gross_amount: 7000, tax_amount: 1260, net_amount: 5740, tax_rate: 22, clientIdx: null },
  { title: 'Consulenza SEO annuale', description: 'Piano SEO annuale con report mensili', status: 'sent', payment_method: 'card', amount_card: 3600, amount_cash: 0, gross_amount: 3600, tax_amount: 648, net_amount: 2952, tax_rate: 22, clientIdx: 1, validUntilDays: 60 },
  { title: 'Restyling sito web completo', description: 'Restyling completo del sito aziendale', status: 'accepted', payment_method: 'mixed', amount_card: 2500, amount_cash: 1000, gross_amount: 3500, tax_amount: 550, net_amount: 2950, tax_rate: 22, clientIdx: 6, validUntilDays: 30 },
  { title: 'Corso formazione React avanzato', status: 'rejected', payment_method: 'card', amount_card: 5000, amount_cash: 0, gross_amount: 5000, tax_amount: 900, net_amount: 4100, tax_rate: 22, clientIdx: 4, validUntilDays: 15 },
  { title: 'Pacchetto siti vetrina (3 siti)', status: 'draft', payment_method: 'card', amount_card: 7200, amount_cash: 0, gross_amount: 7200, tax_amount: 1296, net_amount: 5904, tax_rate: 22, clientIdx: null },
  { title: 'Audit sicurezza informatica', description: 'Penetration test e vulnerability assessment', status: 'sent', payment_method: 'card', amount_card: 1800, amount_cash: 0, gross_amount: 1800, tax_amount: 324, net_amount: 1476, tax_rate: 22, clientIdx: 8, validUntilDays: 45 },
  { title: 'Traduzione sito e-commerce EN', description: 'Traduzione IT-EN dell\'intero e-commerce', status: 'accepted', payment_method: 'card', amount_card: 2400, amount_cash: 0, gross_amount: 2400, tax_amount: 432, net_amount: 1968, tax_rate: 22, clientIdx: 1, validUntilDays: 30 },
  { title: 'Pacchetto social media 3 mesi', status: 'rejected', payment_method: 'cash', amount_card: 0, amount_cash: 2700, gross_amount: 2700, tax_amount: 0, net_amount: 2700, tax_rate: 0, clientIdx: 2, validUntilDays: 30 },
  { title: 'Campagna ADV Instagram + FB', description: 'Creazione e gestione ADV per 2 mesi', status: 'draft', payment_method: 'card', amount_card: 1500, amount_cash: 0, gross_amount: 1500, tax_amount: 270, net_amount: 1230, tax_rate: 22, clientIdx: 10 },
  { title: 'Servizio fotografico annuale', description: '12 servizi foto in abbonamento annuale', status: 'sent', payment_method: 'mixed', amount_card: 2400, amount_cash: 1200, gross_amount: 3600, tax_amount: 432, net_amount: 3168, tax_rate: 22, clientIdx: 7, validUntilDays: 90 },
  { title: 'Installazione impianto videosorveglianza', status: 'accepted', payment_method: 'card', amount_card: 4500, amount_cash: 0, gross_amount: 4500, tax_amount: 810, net_amount: 3690, tax_rate: 22, clientIdx: 16, validUntilDays: 20 },
  { title: 'Consulenza GDPR completa', description: 'Adeguamento completo GDPR aziendale', status: 'rejected', payment_method: 'card', amount_card: 1800, amount_cash: 0, gross_amount: 1800, tax_amount: 324, net_amount: 1476, tax_rate: 22, clientIdx: 1, validUntilDays: 60 },
  { title: 'Sito e-commerce abbigliamento', status: 'draft', payment_method: 'card', amount_card: 4800, amount_cash: 0, gross_amount: 4800, tax_amount: 864, net_amount: 3936, tax_rate: 22, clientIdx: null },
  { title: 'Manutenzione WordPress annuale', description: '1 anno di manutenzione e aggiornamenti', status: 'sent', payment_method: 'card', amount_card: 900, amount_cash: 0, gross_amount: 900, tax_amount: 162, net_amount: 738, tax_rate: 22, clientIdx: 3, validUntilDays: 30 },
]

// Invoices reference completed_settled jobs by index
const INVOICES_DATA = [
  { type: 'invoice', status: 'paid', jobIndices: [20, 21, 22], issuedDateOffset: 60, paidDateOffset: 40, invoiceNumber: 'FT-2026-001' },
  { type: 'parcella', status: 'paid', jobIndices: [25, 27], issuedDateOffset: 45, paidDateOffset: 30, invoiceNumber: 'PA-2026-001' },
  { type: 'invoice', status: 'paid', jobIndices: [23, 29], issuedDateOffset: 35, paidDateOffset: 20, invoiceNumber: 'FT-2026-002' },
  { type: 'invoice', status: 'paid', jobIndices: [24, 33], issuedDateOffset: 50, paidDateOffset: 25, invoiceNumber: 'FT-2026-003' },
  { type: 'invoice', status: 'sent', jobIndices: [28], issuedDateOffset: 15, paidDateOffset: null, invoiceNumber: 'FT-2026-004' },
  { type: 'parcella', status: 'sent', jobIndices: [30, 34], issuedDateOffset: 20, paidDateOffset: null, invoiceNumber: 'PA-2026-002' },
  { type: 'invoice', status: 'draft', jobIndices: [31], issuedDateOffset: 5, paidDateOffset: null, invoiceNumber: 'FT-2026-005' },
  { type: 'parcella', status: 'draft', jobIndices: [26, 32], issuedDateOffset: 8, paidDateOffset: null, invoiceNumber: 'PA-2026-003' },
]

const EXPENSES_DATA = [
  { title: 'Abbonamento VPS DigitalOcean', description: 'Server droplet 6 mesi', amount: 348.00, category: 'Software e hosting', dateDaysAgo: 150 },
  { title: 'Rinnovo dominio .it', description: 'Rinnovo annuale dominio', amount: 42.00, category: 'Servizi online', dateDaysAgo: 120 },
  { title: 'Carburante auto', description: 'Trasferte clienti', amount: 180.50, category: 'Viaggi e trasporti', dateDaysAgo: 90 },
  { title: 'Cena con cliente', amount: 95.00, category: 'Rappresentanza', dateDaysAgo: 75 },
  { title: 'Adobe Creative Cloud', amount: 119.97, category: 'Software e hosting', dateDaysAgo: 60 },
  { title: 'Cancelleria ufficio', description: 'Cartucce, block notes, penne', amount: 67.80, category: 'Ufficio', dateDaysAgo: 40 },
  { title: 'Corso aggiornamento Cloud', amount: 350.00, category: 'Formazione', dateDaysAgo: 30 },
  { title: 'Assicurazione RC professionale', amount: 520.00, category: 'Assicurazioni', dateDaysAgo: 20 },
  { title: 'Abbonamento telefonico business', amount: 89.97, category: 'Telefonia', dateDaysAgo: 10 },
  { title: 'Materiale promozionale', description: 'Biglietti visita e roll up', amount: 245.00, category: 'Marketing', dateDaysAgo: 5 },
  { title: 'Noleggio auto per fiera', description: 'Noleggio 2 giorni per fiera settore', amount: 195.00, category: 'Viaggi e trasporti', dateDaysAgo: 55 },
  { title: 'Software antivirus licenza', amount: 79.99, category: 'Software e hosting', dateDaysAgo: 45 },
  { title: 'Caffè e generi ufficio', amount: 32.50, category: 'Ufficio', dateDaysAgo: 25 },
  { title: 'Quota associativa ordine', amount: 200.00, category: 'Varie', dateDaysAgo: 70 },
  { title: 'Hosting sito vetrina personale', amount: 180.00, category: 'Software e hosting', dateDaysAgo: 100 },
]

const EXPENSE_TAGS_MAP = [
  [0], [], [], [], [0], [], [4], [], [], [6], [], [0], [], [], [0],
]

const EVENTS_DATA = [
  { title: 'Scadenza dichiarazione IVA', description: 'Invio telematico IVA trimestrale', date: new Date(2026, 4, 18), color: '#EF4444' },
  { title: 'Meeting con commercialista', description: 'Revisione annuale situazione fiscale', date: new Date(2026, 5, 10), color: '#3B82F6' },
  { title: 'Consegna progetto e-commerce', description: 'Collaudo con cliente', date: new Date(2026, 5, 15), color: '#10B981' },
  { title: 'Fiera del professionista digitale', description: 'Stand e workshop', date: new Date(2026, 5, 22), color: '#F59E0B' },
  { title: 'Scadenza F24', description: 'Contributi e saldo IVA', date: new Date(2026, 5, 30), color: '#EF4444' },
  { title: 'Call con cliente USA', description: 'Presentazione preventivo progetto', date: new Date(2026, 6, 3), color: '#8B5CF6' },
  { title: 'Revisione obiettivi trimestrale', date: new Date(2026, 6, 8), color: '#EC4899' },
  { title: 'Scadenza fatture emesse', description: 'Invio solleciti pagamento', date: new Date(2026, 6, 14), color: '#EF4444' },
]

const SHARES_DATA = [
  { description: 'Link per commercialista', name: 'Commercialista', is_active: true, access_level: 'view', max_views: null, password_hash: null, sections: ['jobs', 'clients', 'invoices', 'expenses', 'quotes'], expires_at: null },
  { description: 'Vista limitata al cliente', name: 'Cliente Beta', is_active: true, access_level: 'view', max_views: 20, password_hash: '$2b$10$VLxwGzP2HwYWH5L8K3QzUuF5p4d6e7f8g9h0j1k2l3m4n5o6p7q8r9s', sections: ['jobs', 'invoices'], expires_at: daysAgo(-90) },
  { description: 'Copia backup, inattivo', name: 'Backup', is_active: false, access_level: 'export', max_views: null, password_hash: null, sections: ['jobs', 'clients', 'invoices', 'expenses', 'quotes'], expires_at: null },
  { description: 'Link rapido per un preventivo', name: 'Preventivo Rapido', is_active: true, access_level: 'view', max_views: 5, password_hash: null, sections: ['quotes'], expires_at: daysAgo(-30) },
]

const AUDIT_LOG_DATA = [
  { table_name: 'clients', operation: 'INSERT', description: 'Creazione cliente Azienda Beta SRL' },
  { table_name: 'clients', operation: 'INSERT', description: 'Creazione cliente Mario Rossi' },
  { table_name: 'jobs', operation: 'INSERT', description: 'Creazione lavoro: Consulenza strategia marketing' },
  { table_name: 'jobs', operation: 'UPDATE', description: 'Stato lavoro cambiato in completed_settled' },
  { table_name: 'invoices', operation: 'INSERT', description: 'Creazione fattura FT-2026-001' },
  { table_name: 'invoices', operation: 'UPDATE', description: 'Fattura FT-2026-001 marcata pagata' },
  { table_name: 'quotes', operation: 'INSERT', description: 'Creazione preventivo: Consulenza SEO' },
  { table_name: 'quotes', operation: 'UPDATE', description: 'Preventivo accettato dal cliente' },
  { table_name: 'expenses', operation: 'INSERT', description: 'Registrazione spesa: Abbonamento VPS' },
  { table_name: 'shares', operation: 'INSERT', description: 'Creato link condivisione per commercialista' },
]

// ───────────────────────────────────────
// MAIN
// ───────────────────────────────────────

async function main() {
  const args = parseArgs()
  const userId = args['user-id']
  const serviceKey = args['service-key']

  if (!userId || !serviceKey) {
    console.error('Uso: node scripts/seed-demo.mjs --user-id=<UUID> --service-key=<service_role_key>')
    process.exit(1)
  }

  const supabaseUrl = readDotEnv()

  console.log('NetFlow — Seed dati demo per account avanzato')
  console.log('==============================================\n')

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: pingErr } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (pingErr) {
    console.error('ERRORE di connessione o user_id non valido:', pingErr.message)
    process.exit(1)
  }

  // ── 0. CLEANUP ──
  console.log('  Pulizia dati esistenti...')
  await supabase.from('custom_events').delete().eq('user_id', userId)
  await supabase.from('audit_log').delete().eq('user_id', userId)
  await supabase.from('shares').delete().eq('user_id', userId)

  const { data: userInvoices } = await supabase.from('invoices').select('id').eq('user_id', userId)
  const userInvoiceIds = (userInvoices || []).map(i => i.id)
  if (userInvoiceIds.length) {
    await supabase.from('invoice_jobs').delete().in('invoice_id', userInvoiceIds)
  }
  const { data: userJobs } = await supabase.from('jobs').select('id').eq('user_id', userId)
  const userJobIds = (userJobs || []).map(j => j.id)
  if (userJobIds.length) {
    await supabase.from('job_tags').delete().in('job_id', userJobIds)
  }
  const { data: userExpenses } = await supabase.from('expenses').select('id').eq('user_id', userId)
  const userExpenseIds = (userExpenses || []).map(e => e.id)
  if (userExpenseIds.length) {
    await supabase.from('expense_tags').delete().in('expense_id', userExpenseIds)
  }

  await supabase.from('transactions').delete().eq('user_id', userId)
  await supabase.from('quotes').delete().eq('user_id', userId)
  await supabase.from('invoices').delete().eq('user_id', userId)
  await supabase.from('expenses').delete().eq('user_id', userId)
  await supabase.from('jobs').delete().eq('user_id', userId)
  await supabase.from('tags').delete().eq('user_id', userId)
  await supabase.from('clients').delete().eq('user_id', userId)
  await supabase.from('fiscal_setups').delete().eq('user_id', userId)
  console.log('  ✓ Dati esistenti rimossi\n')

  // ── 1. CLIENTS ──
  const clientIds = []
  for (const c of CLIENTS) {
    const id = randomUUID()
    const payload = { id, user_id: userId, name: c.name }
    if (c.email) payload.email = c.email
    if (c.phone) payload.phone = c.phone
    if (c.vat_number) payload.vat_number = c.vat_number
    if (c.fiscal_code) payload.fiscal_code = c.fiscal_code
    if (c.address) payload.address = c.address
    if (c.color) payload.color = c.color
    if (c.notes) payload.notes = c.notes

    const { error } = await supabase.from('clients').insert(payload)
    if (error) { console.error('ERRORE client:', c.name, error.message); process.exit(1) }
    clientIds.push(id)
  }
  console.log(`  ✓ ${clientIds.length} clienti creati (${CLIENTS.filter(c => !c.email).length} senza email, ${CLIENTS.filter(c => !c.address).length} senza indirizzo)`)

  // ── 2. TAGS ──
  const tagIds = []
  for (const t of TAGS) {
    const id = randomUUID()
    const { error } = await supabase.from('tags').insert({
      id, user_id: userId, name: t.name, color: t.color,
    })
    if (error) { console.error('ERRORE tag:', t.name, error.message); process.exit(1) }
    tagIds.push(id)
  }
  console.log(`  ✓ ${tagIds.length} tags creati`)

  // ── 3. JOBS (all inserted as 'active' to avoid BEFORE INSERT trigger FK issues) ──
  const jobIds = []
  let noDescriptionCount = 0
  let noTagCount = 0
  for (const j of JOBS_DATA) {
    const id = randomUUID()
    const clientId = clientIds[j.clientIdx]
    const gross = j.amount_card + j.amount_cash
    const net = Math.round(gross * 0.82 * 100) / 100

    const payload = {
      id, user_id: userId, client_id: clientId,
      title: j.title,
      status: 'active',
      payment_method: j.payment_method,
      amount_card: j.amount_card, amount_cash: j.amount_cash,
      net_amount: net,
      include_cash_in_invoice: j.include_cash_in_invoice ?? false,
      start_date: j.start_date,
      currency: 'EUR',
    }
    if (j.description) {
      payload.description = j.description
    } else {
      noDescriptionCount++
    }

    const { error } = await supabase.from('jobs').insert(payload)
    if (error) { console.error('ERRORE job:', j.title, error.message); process.exit(1) }
    jobIds.push(id)

    if (!j.tags || !j.tags.length) noTagCount++
  }
  console.log(`  ✓ ${jobIds.length} lavori creati (${noDescriptionCount} senza descrizione, ${noTagCount} senza tag)`)

  // Phase 2: UPDATE jobs to target status (trigger creates transactions for settled)
  let statusUpdateCount = 0
  for (let i = 0; i < JOBS_DATA.length; i++) {
    const targetStatus = JOBS_DATA[i].status
    if (targetStatus === 'active') continue

    const updateData = { status: targetStatus }
    if (JOBS_DATA[i].pending_date) updateData.pending_date = JOBS_DATA[i].pending_date
    if (JOBS_DATA[i].end_date) updateData.end_date = JOBS_DATA[i].end_date

    const { error } = await supabase.from('jobs').update(updateData).eq('id', jobIds[i])
    if (error) { console.error('ERRORE status update:', JOBS_DATA[i].title, error.message); process.exit(1) }
    statusUpdateCount++
  }
  console.log(`  ✓ ${statusUpdateCount} lavori aggiornati allo stato target`)

  // ── 3b. JOB_TAGS ──
  let jobTagCount = 0
  for (let i = 0; i < JOBS_DATA.length; i++) {
    const tagIdxs = JOBS_DATA[i].tags
    if (!tagIdxs) continue
    for (const ti of tagIdxs) {
      const { error } = await supabase.from('job_tags').insert({
        job_id: jobIds[i], tag_id: tagIds[ti],
      })
      if (error) { console.error('ERRORE job_tag:', error.message); process.exit(1) }
      jobTagCount++
    }
  }
  console.log(`  ✓ ${jobTagCount} job_tags creati`)

  // ── 4. QUOTES ──
  const quoteIds = []
  let noClientCount = 0
  let noDescCount = 0
  for (let i = 0; i < QUOTES_DATA.length; i++) {
    const q = QUOTES_DATA[i]
    const id = randomUUID()
    const clientId = q.clientIdx != null ? clientIds[q.clientIdx] : null
    if (!clientId) noClientCount++
    if (!q.description) noDescCount++

    const validUntil = q.validUntilDays
      ? fmtDate(daysAgo(-q.validUntilDays))
      : null

    const payload = {
      id, user_id: userId,
      quote_number: `Q-2026-${String(i + 1).padStart(3, '0')}`,
      title: q.title, status: q.status, payment_method: q.payment_method,
      amount_card: q.amount_card, amount_cash: q.amount_cash,
      include_cash_in_invoice: false,
      gross_amount: q.gross_amount, tax_amount: q.tax_amount,
      net_amount: q.net_amount, tax_rate: q.tax_rate,
      valid_until: validUntil,
      issued_date: fmtDate(daysAgo(90 - i * 5)),
      currency: 'EUR',
    }
    if (clientId) payload.client_id = clientId
    if (q.description) payload.description = q.description

    const { error } = await supabase.from('quotes').insert(payload)
    if (error) { console.error('ERRORE quote:', q.title, error.message); process.exit(1) }
    quoteIds.push(id)
  }
  console.log(`  ✓ ${quoteIds.length} preventivi creati (${noClientCount} senza cliente, ${noDescCount} senza descrizione)`)

  // ── 5. INVOICES + INVOICE_JOBS ──
  const invoiceIds = []
  let invoiceJobCount = 0
  let paidInvoiceCount = 0

  for (const inv of INVOICES_DATA) {
    const invId = randomUUID()
    const jobIdxs = inv.jobIndices

    let gross = 0
    for (const ji of jobIdxs) {
      gross += JOBS_DATA[ji].amount_card + JOBS_DATA[ji].amount_cash
    }
    const tax = Math.round(gross * 0.18 * 100) / 100
    const net = Math.round((gross - tax) * 100) / 100

    const issued = fmtDate(daysAgo(inv.issuedDateOffset))
    const paid = inv.paidDateOffset != null ? fmtDate(daysAgo(inv.paidDateOffset)) : null

    const { error: invErr } = await supabase.from('invoices').insert({
      id: invId, user_id: userId,
      invoice_number: inv.invoiceNumber,
      type: inv.type, status: 'draft',
      gross_amount: gross, tax_amount: tax, net_amount: net,
      issued_date: issued,
      due_date: paid ? fmtDate(daysAgo(inv.paidDateOffset - 30)) : null,
      paid_date: null,
      currency: 'EUR',
    })
    if (invErr) { console.error('ERRORE invoice:', inv.invoiceNumber, invErr.message); process.exit(1) }
    invoiceIds.push(invId)

    for (const ji of jobIdxs) {
      const { error: ijErr } = await supabase.from('invoice_jobs').insert({
        invoice_id: invId, job_id: jobIds[ji],
      })
      if (ijErr) { console.error('ERRORE invoice_job:', ijErr.message); process.exit(1) }
      invoiceJobCount++
    }

    if (inv.status !== 'draft') {
      const updateData = { status: inv.status }
      if (paid) updateData.paid_date = paid
      const { error } = await supabase.from('invoices').update(updateData).eq('id', invId)
      if (error) { console.error('ERRORE invoice status:', error.message); process.exit(1) }
      if (inv.status === 'paid') paidInvoiceCount++
    }
  }
  console.log(`  ✓ ${invoiceIds.length} fatture create, ${invoiceJobCount} invoice_jobs, ${paidInvoiceCount} pagate`)

  // ── 6. EXPENSES + EXPENSE_TAGS ──
  const expenseIds = []
  let noDescExpCount = 0
  for (const e of EXPENSES_DATA) {
    const id = randomUUID()
    const payload = {
      id, user_id: userId,
      title: e.title, amount: e.amount, category: e.category,
      date: fmtDate(daysAgo(e.dateDaysAgo)),
      currency: 'EUR',
    }
    if (e.description) {
      payload.description = e.description
    } else {
      noDescExpCount++
    }
    const { error } = await supabase.from('expenses').insert(payload)
    if (error) { console.error('ERRORE expense:', e.title, error.message); process.exit(1) }
    expenseIds.push(id)
  }

  let expTagCount = 0
  for (let i = 0; i < EXPENSE_TAGS_MAP.length; i++) {
    for (const ti of EXPENSE_TAGS_MAP[i]) {
      const { error } = await supabase.from('expense_tags').insert({
        expense_id: expenseIds[i], tag_id: tagIds[ti],
      })
      if (error) { console.error('ERRORE expense_tag:', error.message); process.exit(1) }
      expTagCount++
    }
  }
  console.log(`  ✓ ${expenseIds.length} spese create (${noDescExpCount} senza descrizione)`)

  // ── 7. FISCAL_SETUPS ──
  const { error: fsErr } = await supabase.from('fiscal_setups').insert({
    id: randomUUID(), user_id: userId,
    year: 2026, tax_regime: 'vat_flat',
    financial_goal: 35000, goal_metric: 'net_settled',
    goal_data: {
      target: 35000, metric: 'net_settled',
      segments: [
        { label: 'Gen-Feb', value: 8500, color: '#3B82F6' },
        { label: 'Mar-Apr', value: 12000, color: '#10B981' },
        { label: 'Mag-Giu', value: 8000, color: '#F59E0B' },
      ],
    },
  })
  if (fsErr) { console.error('ERRORE fiscal_setup:', fsErr.message); process.exit(1) }
  console.log('  ✓ fiscal_setup 2026 creato')

  // ── 8. SHARES ──
  for (const s of SHARES_DATA) {
    const { error } = await supabase.from('shares').insert({
      id: randomUUID(), user_id: userId,
      token: randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, ''),
      description: s.description, name: s.name,
      is_active: s.is_active, access_level: s.access_level,
      max_views: s.max_views, password_hash: s.password_hash,
      sections: s.sections,
      expires_at: s.expires_at ? s.expires_at.toISOString() : null,
    })
    if (error) { console.error('ERRORE share:', s.name, error.message); process.exit(1) }
  }
  console.log(`  ✓ ${SHARES_DATA.length} link condivisione creati (${SHARES_DATA.filter(s => s.is_active).length} attivi)`)

  // ── 9. AUDIT_LOG ──
  for (const a of AUDIT_LOG_DATA) {
    const { error } = await supabase.from('audit_log').insert({
      id: randomUUID(), user_id: userId,
      table_name: a.table_name, operation: a.operation,
      new_data: { description: a.description },
      created_at: fmtDate(daysAgo(Math.floor(Math.random() * 60))),
    })
    if (error) { console.error('ERRORE audit_log:', error.message); process.exit(1) }
  }
  console.log(`  ✓ ${AUDIT_LOG_DATA.length} voci audit log create`)

  // ── 10. CUSTOM_EVENTS ──
  for (const ev of EVENTS_DATA) {
    const payload = { id: randomUUID(), user_id: userId, title: ev.title, date: fmtDate(ev.date), color: ev.color }
    if (ev.description) payload.description = ev.description
    const { error } = await supabase.from('custom_events').insert(payload)
    if (error) { console.error('ERRORE event:', ev.title, error.message); process.exit(1) }
  }
  console.log(`  ✓ ${EVENTS_DATA.length} eventi calendario creati`)

  // ── SUMMARY ──
  const activeCount = JOBS_DATA.filter(j => j.status === 'active').length
  const pendingCount = JOBS_DATA.filter(j => j.status === 'completed_pending').length
  const settledCount = JOBS_DATA.filter(j => j.status === 'completed_settled').length
  const quoteStatuses = {}
  for (const q of QUOTES_DATA) {
    quoteStatuses[q.status] = (quoteStatuses[q.status] || 0) + 1
  }
  const invPaid = INVOICES_DATA.filter(i => i.status === 'paid').length
  const invSent = INVOICES_DATA.filter(i => i.status === 'sent').length
  const invDraft = INVOICES_DATA.filter(i => i.status === 'draft').length

  console.log('\n' + '='.repeat(47))
  console.log('===  RIEPILOGO DATI INSERITI  ===')
  console.log('='.repeat(47))
  console.log(`  Clienti:         ${clientIds.length}`)
  console.log(`  Lavori:          ${jobIds.length}  (${activeCount} attivi, ${pendingCount} da incassare, ${settledCount} incassati)`)
  console.log(`  Preventivi:      ${quoteIds.length}  (${Object.entries(quoteStatuses).map(([k, v]) => `${v} ${k}`).join(', ')})`)
  console.log(`  Fatture:         ${invoiceIds.length}  (${invPaid} pagate, ${invSent} inviate, ${invDraft} bozza)`)
  console.log(`  Spese:           ${expenseIds.length}`)
  console.log(`  Tags:            ${tagIds.length}`)
  console.log(`  Link condivisione: ${SHARES_DATA.length}`)
  console.log(`  Audit log entries: ${AUDIT_LOG_DATA.length}`)
  console.log(`  Eventi calendario: ${EVENTS_DATA.length}`)
  console.log('  Transazioni:     (create automaticamente dai trigger DB)')
  console.log('')
  console.log('✅ Tutti i dati sono stati inseriti. Apri l\'app e fai refresh.')
  console.log('')
  console.log('Per cancellare tutto: vai su Supabase SQL Editor ed esegui:')
  console.log('  SELECT clean_user_data();')
  console.log('')
}

main().catch(err => {
  console.error('ERRORE imprevisto:', err)
  process.exit(1)
})
