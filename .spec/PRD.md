# Product Requirement Document: NetFlow PWA

## 1. Vision & Scope
Applicazione contabile PWA per professionisti. Traccia lavori, entrate/uscite, genera fatture/parcelle e fornisce una dashboard finanziaria con sincronizzazione cross-dispositivo. **L'app deve funzionare completamente offline**: i dati devono essere visualizzabili e modificabili senza connessione, con push automatico delle modifiche appena la rete torna disponibile.

---

## 2. Auth & Onboarding

### 2.1 Registrazione/Login
- **Metodi:** Solo Email/Password con conferma mail obbligatoria. Google OAuth disabilitato (in attesa).
- **Flusso:** Registrazione -> Conferma email -> Onboarding wizard.

### 2.2 Onboarding Wizard (Obbligatorio al primo accesso)
1. **Dati personali/aziendali:** Nome, cognome, partita IVA/CF, indirizzo, logo.
2. **Regime fiscale:** `occasional`, `vat_flat` (forfettario), `vat_standard` (ordinario).
3. **Target finanziario:** Importo goal + metrica di riferimento (netto/lordo/incassato/cash).
4. **Preferenze UI:** Tema chiaro/scuro/sistema, preimpostazioni contabili.

---

## 3. Core Logic & Business Rules

### 3.1 Stato del Lavoro (State Machine)
| Stato | Descrizione | Data associata | Effetto |
|-------|-------------|----------------|---------|
| `active` | Lavoro in corso | `start_date` (impostata manualmente) | Non influisce su incassi. Visibile in Lavori. |
| `completed_pending` | Concluso, da incassare | `pending_date` (auto-impostata al cambio stato) | Appare in Fatturazione. Alimenta contatori "In Attesa". Se >30gg senza passare a `completed_settled`, genera notifica. |
| `completed_settled` | Incassato | `end_date` (auto-impostata al cambio stato) | Spostato automaticamente nel Registro. Alimenta "Incassati". |

### 3.2 Metodi di Pagamento
- `card`: Transazione tracciabile, sempre in fattura.
- `cash`: Transazione locale, toggle "Includi in fattura" (default: false).
- `mixed`: Ripartizione tra `amount_card` e `amount_cash`.

### 3.3 Gestione Transazioni Miste (Punto Critico)
Ogni `Job` ha:
- `amount_card` (numeric): Tracciabile, sempre in fattura.
- `amount_cash` (numeric): Gestito localmente.
- `include_cash_in_invoice` (boolean): Se `true`, `amount_cash` si somma all'imponibile fiscale. Se `false`, conteggiato solo nel "Guadagno Reale" interno.

### 3.4 Metriche Finanziarie (Calcoli)
```
gross_pending   = SUM(amount_card + amount_cash) WHERE status = completed_pending
gross_settled   = SUM(amount_card + amount_cash) WHERE status = completed_settled
net_pending     = gross_pending - expenses_pending
net_settled     = gross_settled - expenses_settled
cash_pending    = SUM(amount_cash) WHERE status = completed_pending
cash_settled    = SUM(amount_cash) WHERE status = completed_settled
balance         = net_settled - total_expenses
```

### 3.5 ProgressRings (Stato Attività)
- La dashboard mostra una card "Stato Attività" unificata con:
  - Anello di carico lavoro (workload) con breakdown in 3 box: Attivi / In attesa / Incassati
  - Sub-tabs filtro (Tutto/Lordo/Netto/Cash) con anelli obiettivo e barra di progresso
  - Anelli sempre 70px in tutti i tab per evitare resize
- L'utente imposta un obiettivo economico e la metrica (netto/lordo/incassato/cash) tramite onboarding/settings
- Configurazione salvata in `fiscal_setups.goal_data` e `fiscal_setups.goal_metric`

---

## 4. Sezioni dell'App

### 4.1 Dashboard (Griglia Modulare Glassmorphism)
- **KPI Cards:** Ordine in attesa, incassati, netti in attesa, netti incassati, cash in attesa, cash incassati, uscite, saldo — ogni KPI in una GlassCard.
- **ProgressRings (Stato Attività):** Card unificata con anello carico lavoro, breakdown stato, sub-tabs (Tutto/Lordo/Netto/Cash), anelli obiettivo e barra progresso.
- **Grafici:** Area Chart sovrapposto (entrate/uscite con gradienti neon) + Bar Chart (confronto card/cash).
- **Layout modulare:** Griglia a 5 colonne (desktop) / 2 (tablet) / 1 (mobile). L'utente riordina i moduli; la configurazione è salvata in `profiles.dashboard_layout` (JSONB).

### 4.2 Lavori (4 sottoviste + filtri)
1. **Generali:** Tutti i lavori. Filtri per stato (Tutti/In corso/Da incassare/Incassati).
2. **Carta:** Solo transazioni card.
3. **Cash:** Solo transazioni cash. Toggle per inclusione in fattura.
4. **Misti:** Lavori con ripartizione card+cash. L'utente decide se la parte cash appare in fattura.
- Ogni lavoro ha 3 date: inizio, attesa pagamento, fine — impostate automaticamente al cambio stato.
- Alla creazione di un lavoro viene generato automaticamente un preventivo (bozza) con stessi importi, cliente e aliquota.

### 4.3 Clienti (Rubrica)
- CRUD completo con nome, email, telefono, partita IVA, CF, indirizzo, note.
- Colore personalizzato per avatar e identificazione visiva.
- Stato vuoto con EmptyState.

### 4.4 Preventivi (Quotes)
- CRUD completo con cliente, titolo, importo lordo, IVA, netto, validità, note.
- Stati: bozza, inviato, accettato, rifiutato, convertito.
- Conversione 1-click in lavoro (stato `completed_pending`).
- Auto-generazione alla creazione di un lavoro.

### 4.5 Fatturazione
- Lavori in stato `completed_pending` appaiono qui con checkbox di selezione.
- Generazione fatture e parcelle raggruppando più lavori.
- Una volta marcata pagata, i lavori passano a `completed_settled`.
- Transazione registrata automaticamente via trigger DB.

### 4.6 Uscite (Expenses)
- Registrazione spese con titolo, importo, categoria, data.
- Allegati e supporto multi-valuta.
- Filtrabili per data e categoria.

### 4.7 Calendario
- Eventi personalizzati (scadenze, promemoria) con titolo, descrizione, data, colore.
- Gestiti tramite tabella `custom_events` con RLS.

### 4.8 Registro (Ledger)
- Archivio storico di tutti i lavori e transazioni.
- Tabella con colonne: Data, Cliente, Lavoro, Metodo, Importo, Stato, Azioni.
- Statistiche in 5 KPI: Totale lavori, Totale incassato, Media per lavoro, in attesa, media tempi.
- Filtri per data, metodo, stato. Paginazione.

### 4.9 Tag
- CRUD tag con nome e colore.
- Associabili a lavori (job_tags) e spese (expense_tags).
- Filtraggio per tag.

### 4.10 Condivisione (Shared View)
- Pagina pubblica `/shared/:token` read-only per commercialista.
- Token temporaneo con scadenza configurabile.
- Mostra dashboard, lavori, fatture, preventivi, clienti, uscite.

### 4.11 Guida Fiscale
- Sezione informativa basata sul regime fiscale scelto.
- Spiega aliquote, scadenze, adempimenti.

---

## 5. Impostazioni & Account

### 5.1 Impostazioni
- **Backup:** Export dati (JSON/CSV), backup automatico.
- **Sincronizzazione:** Stato sync, ultimo sync, forzatura sync.
- **Tema:** Chiaro/Scuro/Sistema.
- **Notifiche:** Preferenze reminder (backup, sync, scadenze).

### 5.2 Account
- **Profilo:** Modifica dati personali/aziendali, logo.
- **Personalizzazione parcelle/fatture:** Template PDF, intestazione, piè di pagina, numero documento.

---

## 6. Privacy & Legal
- Sezione dedicata con spiegazione trattamento dati finanziari.
- Cookie policy, privacy policy, termini di servizio.
- Informativa sul trattamento dei dati sensibili (ex art. 13 GDPR).

---

## 7. UX & Pop-up
- **Reminder backup:** Pop-up centrato con backdrop blur.
- **Sync alert:** Notifica quando la connessione cade/ritorna con riepilogo elementi sincronizzati.
- **Offline queue:** Coda locale delle operazioni in attesa di sync, visibile all'utente nelle impostazioni.
- **Session expired:** Pop-up bloccante con reindirizzamento al login.
- **Layout uniforme:** Ogni schermata mantiene la stessa struttura dimensionale con elementi differenti all'interno.
