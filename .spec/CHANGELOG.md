# Changelog & Version Control

## Logica di Versioning
- **PATCH (+0.0.1):** Bug fix, micro-modifiche UI, aggiornamento testi.
- **MINOR (+0.1.0):** Nuova funzionalità, modifica schema DB, nuova pagina.
- **MAJOR (+1.0.0):** Migrazione architetturale, cambio design system, rilascio MVP.

---

## [v0.27.2] - 2026-06-22
### Stato: Fix migrazioni DB — trigger updated_at expenses, header migration
- **[FIX] Spese senza updated_at trigger:** Aggiunto `on_expenses_updated` trigger su tabella `expenses` — il campo `updated_at` ora si aggiorna automaticamente come su tutte le altre tabelle.
- **[FIX] Commento migration 003:** Corretto header da "002_add_pending_date" a "003_add_pending_date".
- **[FIX] Header migration 010 e 011:** Aggiunti header con numero migrazione mancanti.
- **Versione:** v0.27.2

## [v0.27.1] - 2026-06-22
### Stato: GitHub repo setup — README, templates, contributing guide
- **[LOW] README.md:** Creata overview progetto con tech stack, setup, comandi e link alla documentazione `.spec/`.
- **[LOW] Issue templates:** Aggiunti bug report (con categorie da DEBUG_AND_REPAIR.md) e feature request template.
- **[LOW] PR template:** Basato sull'Handover Protocol di PROCESS_AND_AGENTS.md.
- **[LOW] CONTRIBUTING.md:** Guida contribuzione con regole di codifica, commit e checklist.
- **[LOW] SECURITY.md:** Policy di sicurezza e best practice.
- **Versione:** v0.27.1

## [v0.27.0] - 2026-06-17
### Stato: Dashboard restructure — 3 fasce, modulo bar-chart, expenses modal, responsive polishing
- **[MEDIUM] Dashboard a 3 fasce:** Griglia passata da 3 a 4 colonne. Prima fascia: KPI numerici (full width). Seconda fascia: Andamento Economico a sinistra (3/4) + Stato Attivita a destra (1/4). Terza fascia: Confronto Carta/Cash (full width).
- **[MEDIUM] Modulo bar-chart separato:** Il modulo `charts` è stato diviso in `charts` (solo AreaChart) e `'bar-chart'` (solo BarChart). Aggiunto `'bar-chart'` alla default layout e all'onboarding. `resolveDashboardLayout` aggiunge automaticamente `'bar-chart'` per gli utenti esistenti.
- **[MEDIUM] Rimosso duplicato goal-tracker:** Rimosso il modulo `'goal-tracker'` dal type `DashboardModuleId` e dalla mappa `modules`. `normalizeModuleId` continua a gestire i layout legacy. Aggiunta deduplicazione in `resolveDashboardLayout`.
- **[MEDIUM] Ordine moduli fisso:** Sostituito ordinamento per `order` con `MODULE_PRIORITY` per garantire ordine consistente: kpi-group → charts → progress-rings → bar-chart → quick-register.
- **[MEDIUM] ProgressRings compattato:** Ridisegnato per colonna stretta (1/4): ring workload 80→60px, ring metriche 70→50px, layout impilato, testi ridotti. Card con `h-full` per allineamento altezza con charts.
- **[MEDIUM] Charts con h-full:** Aggiunto `h-full flex flex-col` alla card Andamento Economico per allineamento verticale con ProgressRings nella stessa riga.
- **[MEDIUM] Expenses passa a Modal:** Sostituito `SlideOver` con `Modal` per il form creazione/modifica spese — ora appare centrato come Lavori e Clienti.
- **[LOW] Responsive polish:** Padding, margini, dimensioni testi e ring uniformati su tutta la dashboard con classi responsive (`p-4 md:p-6`, `text-sm md:text-lg`, ecc).
- **Build verificata:** tsc + lint passano (0 errori, 0 warnings).
- **Versione:** v0.27.0

## [v0.26.0] - 2026-06-17
### Stato: Offline-first engine, real-time sync, dashboard modulare, test
- **[MAJOR] Offline-first sync engine:** Tutte le CRUD (jobs, invoices, expenses, clients) ora si accodano in IndexedDB quando offline e si sincronizzano con backoff esponenziale al ritorno della connessione. Nuovo `SyncProvider` con stati idle/syncing/conflict/error. `syncBridge` + `syncExecute` per mutazioni offline-aware.
- **[HIGH] Supabase Realtime:** Sottoscrizioni `postgres_changes` su jobs/invoices/expenses/clients — invalidazione cache incrociata multi-tab.
- **[HIGH] Dashboard modulare:** Layout ordinabile tramite `profiles.dashboard_layout`; utility `resolveDashboardLayout()` con fallback default. Hard-reset PWA in Impostazioni.
- **[HIGH] Calcolo fiscale riscritto:** `normalizeIrpefRate()` (supporto % e decimale), `computeJobNetAmount()` per pagamenti misti (carta tassata, contanti opzionale). Saldo dashboard ora = `net_settled − spese`.
- **[MEDIUM] Creazione fatture offline:** Estratta in `useCreateInvoiceWithJobs()` con coda composita `__job_ids` e supporto offline completo.
- **[MEDIUM] Settings potenziate:** Editor template fattura (intestazione, piè di pagina, logo su storage `logos`), backup restore esteso con `client_id`, `description`, `start_date`, `pending_date`, `end_date`.
- **[MEDIUM] Clients CRUD completo:** Modale creazione/modifica con tutti i campi (email, telefono, partita IVA, CF, indirizzo, note, colore). Toast offline-aware.
- **[MEDIUM] Filtro anno fiscale:** Dashboard e registro ora filtrano per anno fiscale su `start_date`. Metriche registro con netto e fisco reali.
- **[MEDIUM] Error boundary globale:** `ErrorBoundary` class-based + `QueryState` (QueryLoading/QueryError con retry).
- **[MEDIUM] Unit test Vitest:** Test per `normalizeIrpefRate`, `grossToNet`, `computeJobNetAmount`, `calculateMetrics`.
- **[FIX] Trigger DB:** `handle_job_status_change` — guard re-settlement (salta se transazione già esiste o job linked a fattura pagata). `handle_invoice_paid` — categoria `invoice_payment`. RLS `invoice_jobs` con verifica ownership job.
- **[FIX] Nuove migrazioni:** Migration 009 (`fix_triggers_and_rls`), Migration 010 (`storage_and_rls`). Bucket `logos` pubblico con RLS per utente. Policy DELETE su invoices, UPDATE/DELETE su transactions.
- **File modificati:** 31 file modificati (+1282/−381), 14 nuovi file. `src/lib/syncBridge.ts`, `src/lib/syncExecute.ts`, `src/app/providers/SyncProvider.tsx`, `src/lib/hooks/useCreateInvoiceWithJobs.ts`, `src/lib/hooks/useRealtimeSync.ts`, `src/lib/dashboardLayout.ts`, `src/lib/tax.ts`, `src/lib/calculations.ts`, `src/lib/calculations.test.ts`, `src/shared/ui/ErrorBoundary.tsx`, `src/shared/ui/QueryState.tsx`, `supabase/migrations/20260617000002_fix_triggers_and_rls.sql`, `supabase/migrations/20260617000003_storage_and_rls.sql`
- **Dipendenza aggiunta:** `idb`, `vitest`
- **Versione:** v0.26.0

---

## [v0.25.4] - 2026-06-17
### Stato: Audit stabilità — fix critici integrità dati, sync offline, UI
- **Fix:** Corretto `normalizeIrpefRate` — aliquota IRPEF in % (30) convertita a decimale (0.30) nei calcoli fiscali.
- **Fix:** Trigger DB — eliminati duplicati transazioni su fattura pagata; guard re-settlement; RLS `invoice_jobs` con verifica ownership job.
- **Fix:** Coda offline collegata alle mutazioni CRUD; REST sync con filtro `?id=eq.`; backoff esponenziale; `sync_enabled` rispettato.
- **Fix:** Filtro anno fiscale su `start_date` (jobs); saldo dashboard = netto incassato − spese; metriche registro con netto/fisco reali.
- **Fix:** Router mostra loader durante auth; ErrorBoundary globale; rotte `/account` e `/legal` attivate.
- **File modificati:** `src/lib/tax.ts`, `src/lib/calculations.ts`, `src/lib/syncExecute.ts`, `src/lib/syncBridge.ts`, `src/app/providers/SyncProvider.tsx`, hook mutazioni, `useDashboardData.ts`, `useLedgerData.ts`, `JobFormModal.tsx`, `router.tsx`, `App.tsx`, `supabase/migrations/20260617000002_fix_triggers_and_rls.sql`
- **Root cause:** Audit stabilità — gap tra spec e implementazione su sync, trigger, calcoli fiscali e filtri anno.
- **Scenari coperti:** DEBUG §2.1 (saldo, dati misti), §3 (sync), §4.1 (calcoli), §5.1 (PWA)
- **Versione:** v0.25.4

---

## [v0.25.3] - 2026-06-17
### Stato: Stato lavoro derivato automaticamente da date in creazione
- **[FIX] Status derivato da date in creazione:** Quando si crea un lavoro compilando `end_date` o `pending_date`, lo status viene ora impostato automaticamente a `completed_settled` o `completed_pending` invece di rimanere `active` ("In corso").
- **[FIX] Trigger DB su INSERT:** Il trigger `on_job_status_change` ora scatta anche su `INSERT` (non solo `UPDATE`), creando automaticamente la transazione di incasso per i job creati come `completed_settled`.
- **[FIX] UX reattiva nel form:** Il form di creazione aggiorna dinamicamente lo stato al variare delle date.
- **Migration 008 applicata.**
- **Versione:** v0.25.3

---

## [v0.25.2] - 2026-06-17
### Stato: Favicon e icone PWA in JPG
- **[FIX] Favicon aggiornata:** `index.html` ora usa `logo.jpg` come favicon e apple-touch-icon (rimosso mask-icon SVG).
- **[FIX] PWA icons JPG:** `vite.config.ts` — icone manifest puntano a `icon-192.jpg` e `icon-512.jpg`. Aggiunto `logo.jpg` agli assets precache.
- **Versione:** v0.25.2

---

## [v0.25.1] - 2026-06-17
### Stato: Aggiornamento logo personalizzato
- **[MINOR] Logo aggiornato:** Sostituito il logo SVG con la nuova immagine fornita dall'utente. Il componente `<Logo />` ora utilizza `object-contain` per adattare il logo ed evitare qualsiasi storpiatura delle proporzioni originali.
- **Versione:** v0.25.1

---

## [v0.25.0] - 2026-06-17
### Stato: Logo NetFlow — icona rete/flow su tutte le pagine
- **[MAJOR] Nuovo logo SVG:** Creata icona rete/flow (nodi collegati + linee ondulate) su sfondo viola gradient. File `public/logo-icon.svg` (solo icona) e `public/logo-full.svg` (icona + testo NETFLOW).
- **[MEDIUM] Componente Logo.tsx:** Componente riutilizzabile con due varianti — `icon` (40px, per sidebar/header) e `full` (56px, per auth pages).
- **[HIGH] Sidebar:** Sostituito cerchio "N" con `<Logo />` (solo icona) + testo "NetFlow".
- **[HIGH] Auth pages:** LoginPage, RegisterPage, ResetPasswordPage, ForgotPasswordPage — sostituiti cerchi "N"/"F" con `<Logo variant="full" />`.
- **[FIX] Rimosso logo e nome dalla header bar:** La barra header ora mostra solo il FiscalYearSelector (senza logo e testo "NetFlow").
- **[LOW] Favicon e icone PWA aggiornate:** `icon-192.svg` e `icon-512.svg` ora usano il design della rete/flow. Favicon punt a `logo-icon.svg`.
- **Build verificata:** tsc + lint passano (0 errori).
- **Versione:** v0.25.0

---

## [v0.24.2] - 2026-06-11
### Stato: Bordi moderni per sidebar, header e bottom bar
- **[FIX] Rimosse linee solide:** `border-r border-border` sidebar, `border-b border-border` header, `border-t border-border` logout e bottom bar sostituite con `box-shadow` sottili (`rgba(255,255,255,0.06)`) per un effetto glow moderno e minimale.
- **[FIX] Sidebar e BottomBar:** Aggiunto `backdrop-blur-xl` + `bg-surface/60` per effetto vetro coerente con il design system.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.24.2

## [v0.24.1] - 2026-06-11
### Stato: Fix light mode per Modal e SlideOver
- **[FIX] Modal e SlideOver ora responsive al tema:** Sostituiti colori hardcoded (`rgba(26,26,46,...)`, `rgba(30,30,50,...)`) con classi Tailwind `bg-surface/60 backdrop-blur-xl border-border`. In light mode lo sfondo è bianco trasparente, in dark mode è scuro — secondo le variabili CSS definite in `index.css`.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.24.1

## [v0.24.0] - 2026-06-11
### Stato: Ritorno al Modal centrato per lavori e clienti
- **[CHANGE] JobFormModal:** Modal centrato sia per creazione che modifica (rimosso SlideOver).
- **[CHANGE] ClientsPage:** Modal centrato per creazione e modifica (rimossa form inline + SlideOver).
- **[FIX] Modal.tsx aggiornato:** Ora segue la spec `UI_UX_SPEC.md` — `rgba(26,26,46,0.6)` con `backdrop-filter: blur(25px)`, bordo `0.5px solid rgba(255,255,255,0.08)`, `box-shadow: 0 8px 32px rgba(0,0,0,0.3)`, `border-radius: 2rem`.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.24.0

## [v0.23.2] - 2026-06-11
### Stato: Fix SlideOver trasparente
- **[FIX] SlideOver glassmorphism:** Rimosso backdrop-filter dal pannello (doppio blur = nero solido). Background `rgba(30,30,50,0.35)` con border-left. Il blur è gestito solo dall'overlay.
- **[FIX] Titolo visibile:** Titolo e bottone X con testo bianco esplicito.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.23.2

## [v0.23.1] - 2026-06-11
### Stato: Fix visivi SlideOver e Modal
- **[FIX] SlideOver più trasparente:** Background `rgba(15,15,26,0.6)` invece di 0.85, header 0.65 invece di 0.9. L'effetto vetro ora lascia trasparire lo sfondo.
- **[FIX] Modal centrato scrollabile:** Aggiunto `max-h-[85vh] overflow-y-auto` per evitare che il form esca dallo schermo.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.23.1

## [v0.23.0] - 2026-06-11
### Stato: Create = Modal centrato, Edit = SlideOver
- **[MEDIUM] JobFormModal split:** Creazione lavoro usa `Modal` centrato, modifica usa `SlideOver`. Il form content è condiviso.
- **[MEDIUM] ClientsPage edit in SlideOver:** Modifica cliente ora apre SlideOver laterale invece del form inline. Creazione resta inline centrata.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.23.0

## [v0.22.0] - 2026-06-11
### Stato: SlideOver glassmorphism + tutti i form convertiti
- **[MEDIUM] SlideOver glassmorphism polish:** Background `rgba(15,15,26,0.85)`, backdrop-blur 40px, `rounded-modal` (2rem), shimmer header, animazione spring. Ogni pannello è ora trasparente e organico.
- **[MEDIUM] Tutti i form convertiti a SlideOver:** InvoiceFormModal, ExpensesPage form, RegisterPage dettaglio — ora usano tutti SlideOver invece di Modal centrato. Modal.tsx non è più importato da nessuna parte.
- **[LOW] Bottoni pill-shaped:** Tutti i bottoni annulla/salva nei form usano `rounded-full` per coerenza con il design system.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.22.0

## [v0.21.0] - 2026-06-11
### Stato: SlideOver panel per form lavori
- **[MEDIUM] Nuovo componente SlideOver:** Pannello laterale che scivola da destra con backdrop blur. Mantiene il contesto della pagina sottostante. Stesso design glassmorphism del resto dell'app.
- **[MEDIUM] JobFormModal convertito:** Il form di creazione/modifica lavori ora usa SlideOver invece del Modal centrato. Preferibile su desktop (480px) e full-width su mobile.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.21.0

## [v0.20.0] - 2026-06-11
### Stato: Rimosso backup automatico
- **[MEDIUM] Rimosso useAutoBackup:** Hook e integrazione MainLayout eliminati. Il backup manuale (export/import JSON) resta in Impostazioni.
- **[LOW] Settings pulite:** Rimossa UI backup automatico (toggle + frequenza) dalla scheda Notifiche.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.20.0

## [v0.19.0] - 2026-06-11
### Stato: Nuova sezione Uscite — spese reali in dashboard
- **[MAJOR] Nuova tab /expenses:** Pagina "Uscite" con CRUD completo (creazione, modifica, elimina). Card glassmorfiche con importo, categoria, descrizione, data. Form modale con selezione categoria.
- **[HIGH] Tabella expenses:** Migration 007 — `CREATE TABLE expenses` (id, user_id, title, description, amount, category, date) con RLS policies.
- **[HIGH] Dashboard integrata:** `useDashboardData` ora fetcha le spese reali dal DB e le passa a `calculateMetrics`. KPI "Uscite" e "Saldo" ora mostrano dati reali.
- **[MEDIUM] Sidebar + BottomBar:** Aggiunto tab `Receipt` ("Uscite") tra Registro e Impostazioni in entrambe le nav.
- **[MEDIUM] Hook useExpenses:** CRUD completo su TanStack Query con invalidazione incrociata `['expenses']` e `['dashboard']`.
- **Migration 007 applicata.**
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.19.0

## [v0.18.0] - 2026-06-11
### Stato: Dashboard ridisegnata — GoalTracker rimosso, ProgressRings migliorato
- **[MAJOR] Rimosso GoalTracker:** Sostituito interamente dal ProgressRings potenziato. La dashboard ora ha una card "Stato Attivita" unificata invece di due card separate.
- **[HIGH] ProgressRings — Carico lavoro migliorato:** Ora mostra anello workload + breakdown status in 3 box (Attivi / In attesa / Incassati). Dati passati da DashboardPage con conteggi reali.
- **[MEDIUM] ProgressRings — Counter attivita integrato:** Sub-tabs Tutto/Lordo/Netto/Cash con anelli obiettivo e barra progresso fissa basata su goal_metric (onboarding/settings). Anelli sempre 70px in tutti i tab per evitare resize.
- **[MEDIUM] BarChart full-width:** "Confronto Carta / Cash" ora span-3 (tutta la larghezza).
- **[LOW] Versione automatica:** Sidebar ora legge `__APP_VERSION__` da `package.json` via Vite `define`. Basta aggiornare `package.json` per aggiornare la sidebar.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.18.0

## [v0.17.0] - 2026-06-11
### Stato: Tre date per lavori + ProgressRings redesign + 5 fix UX/Backup/Clienti
- **[HIGH] Tre date per lavori:** Ogni job ora ha tre date distinte — `start_date` (inizio), `pending_date` (passaggio a completed_pending), `end_date` (passaggio a completed_settled). Notifica triggerata a 7 giorni da `pending_date` per sollecitare l'incasso.
- **[HIGH] Redesign ProgressRings (Dashboard):** Le "Stato Attività" ora mostrano separazione chiara tra lavori attivi, completati in attesa di pagamento e completati saldati. Conteggi numerici sotto ogni anello.
- **[CRITICAL] Fix salva modifiche JobFormModal:** `initialData.net_amount ?? 0` — i job pre-migrazione 005 (senza `net_amount`) ora defaultano a 0 invece di `undefined`, evitando che la validazione Zod blocchi il salvataggio.
- **[MEDIUM] Logout sidebar:** Aggiunto pulsante "Esci" con icona `LogOut` nel footer della sidebar — chiama `signOut()` e reindirizza a `/login`.
- **[MEDIUM] Guida fiscale in header:** Rimosso tab `BookOpen` dalla sidebar; spostato come bottone `Info` (i) nell'header accanto alla campanella, naviga a `/guide`.
- **[HIGH] Auto backup funzionante:** Nuovo hook `useAutoBackup` — salva i jobs in localStorage (`netflow-auto-backup`) con frequenza daily/weekly/monthly basata su `user_settings`. Integrato in `MainLayout` con toast di conferma.
- **[MEDIUM] Colore personalizzabile per clienti:** Nuovo campo `color` su tabella `clients`. Selettore a 8 colori predefiniti nel form. Avatar e dropdown `ClientSelect` mostrano il colore. Migration 006.
- **Migration 001:** `jobs.pending_date` aggiunta.
- **Migration 005:** `jobs.net_amount`, `fiscal_setups.custom_irpef_rate`.
- **Migration 006:** `clients.color`.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.17.0

## [v0.16.0] - 2026-06-11
### Stato: Netto/Lordo automatico — Calcolo fiscale su jobs + Metric toggle tracker
- **[MAJOR] Nuova utility `src/lib/tax.ts`:** Funzioni `netToGross()` e `grossToNet()` che calcolano il lordo dal netto (e viceversa) in base al regime fiscale. Supporto per: `occasional` (ritenuta 20% + INPS 25.72%), `vat_flat` (coefficiente 78%, imposta sostitutiva 15%, INPS 26.07%), `vat_standard` (IRPEF configurabile + INPS 26.07%).
- **[MAJOR] Nuovo campo `net_amount` su jobs:** Ogni lavoro ora memorizza l'importo netto desiderato. Il form di creazione/modifica mostra entrambi i campi (Netto + Lordo) con calcolo bidirezionale — modificando uno si aggiorna l'altro automaticamente.
- **[HIGH] Configurazione IRPEF in Settings:** Aggiunto campo "Aliquota IRPEF stimata (%)" nelle impostazioni profilo, visibile solo per regime `vat_standard`. Salvato in `fiscal_setups.custom_irpef_rate`.
- **[HIGH] Dashboard KPI corretti:** "Netti In Attesa" e "Netti Incassati" ora usano `net_amount` dai job invece di essere identici al lordo. "In Attesa" e "Incassati" continuano a mostrare il lordo (`amount_card + amount_cash`).
- **[MEDIUM] Metric toggle nel GoalTracker:** Nuovi pulsanti Lordo/Netto/Cash per cambiare la metrica visualizzata nel tracker obiettivo. Il valore mostrato si adatta alla selezione.
- **[MEDIUM] Goal segments aggiornati:** I segmenti Netto/Lordo/Cash nel radiale ora calcolano correttamente i valori netti dai `net_amount` (con fallback `grossToNet` per job esistenti).
- **[HIGH] Migration 005:** `jobs.net_amount` (numeric, default 0), `fiscal_setups.custom_irpef_rate` (numeric, nullable). Backfill per job esistenti basato sul regime fiscale dell'utente.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.16.0

## [v0.15.0] - 2026-06-11
### Stato: Dashboard Reattività + UX Card + Scoping Annuale + Sicurezza Backup
- **[HIGH] Dashboard reattività:** `useJobs` mutation ora invalida anche `['dashboard']` — la Dashboard si aggiorna senza refresh manuale dopo creazione/modifica lavori.
- **[MEDIUM] UX Card Obiettivo Netto:** Ridisegnata `GoalTracker` — mostra importi correnti/target con gerarchia tipografica chiara, percentuali sotto ogni segmento radiale, barra progresso con valori.
- **[MEDIUM] UX Card Carichi:** Ridisegnata `ProgressRings` — aggiunti conteggi attivi/totali, descrizioni, layout verticale con separatore.
- **[LOW] Layout Dashboard:** Ridotto spacing da `gap-6` a `gap-4` — eliminati spazi vuoti ridondanti.
- **[MEDIUM] Fix overflow JobFormModal:** Aggiunto `max-h-[75vh] overflow-y-auto` al form — la sezione "Crea cliente" non sfora più il contenitore.
- **[MEDIUM] Fix tema onboarding:** Integrato `useTheme().setTheme()` — il tema cambia immediatamente alla selezione nello step 4, sovrascrivendo le preferenze di sistema.
- **[MAJOR] Scoping annuale regime fiscale:** Nuova tabella `fiscal_setups` (user_id, year, tax_regime, financial_goal, goal_metric, goal_data) con isolamento per anno fiscale. La modifica del regime/obiettivo per un anno non intacca i periodi passati. Nuovo hook `useFiscalSetup` + `useUpsertFiscalSetup`. Settings aggiornati con editor obiettivo per anno.
- **[HIGH] Validazione backup/restore:** Aggiunto schema Zod `backupFileSchema` per validazione strutturale del JSON. Ante-injection XSS. File size limit (10MB). Mapping strict dei campi.
- **[HIGH] Sicurezza Supabase:** Migration 004 — ricreata `handle_updated_at` con `SET search_path = ''`. Revocato EXECUTE su 5 trigger function da anon/authenticated. Ottimizzate 24 RLS policy con `(select auth.uid())`.
- **Build verificata:** tsc + eslint passano (0 errori).
- **Versione:** v0.15.0

## [v0.14.1] - 2026-06-11
### Stato: Bug Fix Login + Routing
- **[CRITICAL] AuthProvider:** `clearError` ora avvolta in `useCallback` — prima creava un nuovo reference a ogni render di `AuthProvider`, causando la rifire del `useEffect` in `PublicRoute` che cancellava immediatamente l'errore di login appena impostato. L'utente non vedeva mai "Email o password non validi" e sembrava che cliccare "Accedi" non facesse nulla.
- **[MEDIUM] router.tsx:** Aggiunta route `/ → /dashboard` — prima la root path mostrava la pagina 404 perché non c'era un match esplicito per `/`.
- **Versione:** v0.14.1

## [v0.14.0] - 2026-06-11
### Stato: NetFlow Rebrand + Sidebar Refactor + Notifiche + Clienti
- **[MAJOR] Rebrand:** Rinominata l'app da FinTrack a NetFlow — aggiornato index.html, PWA manifest, sidebar, header, pagine auth, package name.
- **[HIGH] Sidebar:** Ristrutturata — aggiunto tab Clienti, rimosso Account e Privacy & Legal (unificati in Impostazioni), logo aggiornato da "F" a "N".
- **[HIGH] Centro Impostazioni unificato:** Unite le ex pagine /account, /settings, /legal in un'unica pagina /settings con tabs (Profilo, Preferenze, Fatture, Backup, Privacy).
- **[HIGH] Pagina Clienti:** Nuova pagina /clients con CRUD completo (creazione, modifica, elimina), card glassmorfiche, form inline.
- **[HIGH] Centro Notifiche:** Nuovo dropdown notifiche nell'header con badge contatore — avvisi per lavori in scadenza, fatture scadute, backup overdue.
- **[MEDIUM] Selettore Anno Fiscale:** Nuovo componente `FiscalYearSelector` nell'header per navigare tra anni fiscali.
- **[MEDIUM] Backup & Ripristino:** Aggiunta sezione ripristino con validazione schema JSON in Settings > Backup.
- **[LOW] BottomBar:** Aggiornata con tab Clienti (6 icone).
- **[LOW] Sidebar:** Versione aggiornata a v0.14.0.
- **[MEDIUM] Switch regime fiscale:** Aggiunto selettore regime fiscale nel Profilo (Impostazioni) con aggiornamento su Supabase — la Guida Fiscale si adatta automaticamente.
- **[MEDIUM] Filtro anno fiscale:** Tutte le query (jobs, invoices, ledger, dashboard) ora filtrano per anno selezionato dal FiscalYearSelector. I dati di anni diversi non alterano bilanci e grafici.
- **[MEDIUM] Ripristino backup:** Implementato restore effettivo su Supabase dal file JSON — validazione schema, pulizia dati esistenti, inserimento batch con user_id forzato.
- **Build verificata:** tsc + vite build passano (0 errori).
- **Versione:** v0.14.0
### Stato: Bug Fix Audit pre-deploy (13 issue risolti)
- **[CRITICAL] ResetPasswordPage:** Aggiunta cleanup subscription `onAuthStateChange` + flag `cancelled` per evitare setState su componente smontato.
- **[CRITICAL] SyncProvider:** `processQueue` ora avvolto in try/finally per garantire `setIsSyncing(false)` anche se IndexedDB fallisce.
- **[CRITICAL] Filtro user_id:** Aggiunto `.eq('user_id', userId)` in tutte le query Supabase — `useJobs`, `useInvoices`, `useClients`, `useLedgerData`, `useDashboardData`. Prima si affidavano solo alle RLS (difesa in profondità).
- **[HIGH] Ledger metrics:** Rimosso `include_cash_in_invoice` dal calcolo di `grossTotal` in `useLedgerData.ts` — ora allineato a PRD §3.4 (SUM sempre amount_card + amount_cash).
- **[HIGH] Invoice number:** Aggiunto check digit random di disambiguazione per evitare race condition su numerazione fatture concorrenti.
- **[MEDIUM] AuthProvider:** Aggiunta funzione `clearError()` chiamata da `PublicRoute` all'attraversamento — l'errore di login non persiste più su `/register`.
- **[MEDIUM] supabase.ts:** Sostituito fallback silenzioso con `throw new Error` esplicito se env var mancanti.
- **[MEDIUM] Query error propagation:** Aggiunto `if (error) throw error` dopo ogni `supabase.from().select()` per garantire che TanStack Query catturi e propaghi errori API.
- **[MEDIUM] BackupReminder:** Aggiunta validazione `Number.isFinite()` per gestire localStorage corrotto.
- **[LOW] Sidebar:** Versione aggiornata da v0.9.0 a v0.13.1.
- **[LOW] Card:** Aggiunto effetto glassmorphism alla variante `surface` (`backdrop-blur-3xl`, bordo semi-trasparente).
- **[LOW] Google Fonts:** Aggiunto runtime caching Workbox per `fonts.googleapis.com` (CacheFirst, 30gg) e `fonts.gstatic.com` (CacheFirst, 60gg).
- **[LOW] 404 page:** Creata `NotFoundPage` (`/features/not-found/pages/NotFoundPage.tsx`), rimpiazzato redirect generico `* → /dashboard` con la pagina 404 dedicata.
- **14 test E2E passanti.**
- **Versione:** v0.13.1

---

## [v0.13.0] - 2026-06-10
### Stato: Cloudflare Pages + Password Recovery
- **Google OAuth disabilitato:** Rimossi bottoni "Continua con Google" e divisori da LoginPage e RegisterPage. Solo email/password.
- **Password recovery:** Creata `ForgotPasswordPage.tsx` (form email → `resetPasswordForEmail()`), `ResetPasswordPage.tsx` (form nuova password → `updateUser()`, rileva token `type=recovery` dall'URL). Route `/forgot-password` e `/reset-password` aggiunte al router. Link "Password dimenticata?" in LoginPage.
- **Cloudflare Pages setup:** `.cloudflare/pages.toml` (build command + output dir), `public/_redirects` (SPA routing `/* → /index.html`), `public/_headers` (security headers).
- **Aggiornati:** `.spec/ARCHITECTURE.md` (sezione Hosting), `.spec/COMMANDS.md` (sezione Deploy), `.env.example` (istruzioni CF Pages + valori reali Supabase).
- **Wrangler:** Installato, script `npm run deploy` in `package.json`.
- **14 test E2E passanti** (inclusi 2 nuovi per forgot/reset password).
- **Versione:** v0.13.0

---

## [v0.12.0] - 2026-06-10
### Stato: Performance + Testing (Code-splitting + E2E)
- **Code-splitting:** `src/app/router.tsx` — tutte le pagine protette ora usano `React.lazy()` + `Suspense` con `PageLoader` (spinner + "Caricamento..."). Named exports conservati via `.then(m => ({ default: m.Component }))`. Pagine pubbliche (Login, Register, Onboarding) restano eager per first paint.
- **Vendor chunking:** `vite.config.ts` — aggiunto `build.rollupOptions.output.manualChunks` che separa react, chart.js, framer-motion, tanstack-query, react-hook-form/zod, supabase in chunk dedicati. Main chunk ridotto da 736 KB → 250 KB.
- **E2E testing:** Playwright installato (chromium headless v1223). Config `playwright.config.ts` con webServer (porta 5173), screenshot on failure, trace on retry.
- **Test creati:** `e2e/auth.spec.ts` (4 test: login page, register page, validation errors, route guard), `e2e/navigation.spec.ts` (2 test: sidebar, 404 redirect), `e2e/pages.spec.ts` (4 test: struttura pagine pubbliche, link incrociati), `e2e/visual.spec.ts` (2 test: snapshot glassmorphism cards).
- **Playwright:** 12 test, 12 passanti.
- **Script aggiunti:** `package.json` — `test:e2e` (headless) e `test:e2e:ui` (Playwright UI mode).
- **Build verificata:** 0 errori lint, 0 errori tsc, build con PWA (31 entries precache, ~1 MB). Nessun warning chunk size.
- **Versione:** v0.12.0

---

## [v0.11.0] - 2026-06-10
### Stato: Guida Fiscale + PWA (Phase 7)
- **Riscritto:** `src/features/guide/pages/GuidePage.tsx` — contenuti fiscali dinamici per regime `occasional` / `vat_flat` / `vat_standard` con sezioni: aliquote, scadenze, adempimenti, note. Dati letti da `user.tax_regime` via `useAuth()`.
- **Riscritto:** `src/features/legal/pages/LegalPage.tsx` — informativa privacy completa (ex art. 13 GDPR), cookie policy, diritti interessato, periodo conservazione, contatti.
- **Aggiunta:** `src/shared/ui/SyncBanner.tsx` — banner flottante centrato che mostra stato offline/online + coda sync. Animato con Framer Motion. Usa `useSync()`.
- **Aggiunta:** `src/shared/ui/BackupReminder.tsx` — pop-up modale con backdrop blur che appare dopo 7 giorni dall'ultimo dismiss. Pulsanti "Più tardi" / "Vai alle impostazioni".
- **Modificato:** `src/shared/layouts/MainLayout.tsx` — integrati `SyncBanner` e `BackupReminder` nel layout globale.
- **Build verificata:** lint + tsc + vite build passano.
- **Versione:** v0.11.0

---

## [v0.10.0] - 2026-06-10
### Stato: Impostazioni & Account (Phase 6)
- **Aggiunta:** `src/lib/hooks/useUserSettings.ts` — hook TanStack Query per fetch e update di `user_settings`.
- **Aggiunta:** `src/lib/hooks/useProfile.ts` — hook per aggiornamento tabella `profiles`.
- **Riscritto:** `src/features/settings/pages/SettingsPage.tsx` — tema (chiaro/scuro/sistema), stato sync con indicatore online/offline/coda, backup export CSV/JSON con dati reali, notifiche toggle, backup automatico con frequenza, toggle sincronizzazione.
- **Riscritto:** `src/features/account/pages/AccountPage.tsx` — form profilo collegato a Supabase (nome, ragione sociale, partita IVA, CF, indirizzo), sezione template fatture con intestazione/piè di pagina e upload logo.
- **Build verificata:** lint + tsc + vite build passano.
- **Versione:** v0.10.0

---

## [v0.9.1] - 2026-06-10
### Stato: Bug Fix Audit Completo
- **Fix (CRITICAL):** `src/lib/calculations.ts` e `src/features/dashboard/hooks/useDashboardData.ts` — `sumGross()` ora somma sempre `amount_card + amount_cash` senza dipendere da `include_cash_in_invoice`, allineato a PRD §3.4. Le metriche lorde (gross_pending, gross_settled, net_pending, net_settled) sono ora corrette.
- **Fix (CRITICAL):** `src/app/providers/SyncProvider.tsx` — le richieste REST di sync ora includono l'header `Authorization: Bearer` con il JWT token di Supabase, risolvendo il bypass di autenticazione che causava errori 401/403.
- **Fix (HIGH):** `src/shared/ui/RadialProgress.tsx` — `bgColor` corretto da `rgba(var(--color-border))` (formato invalido) a `var(--color-border)`.
- **Fix (HIGH):** `src/shared/charts/BarChart.tsx`, `AreaChart.tsx`, `LineChart.tsx` — aggiunte registrazioni mancanti di `BarController` e `LineController` per Chart.js v4.
- **Fix (HIGH):** `src/features/invoicing/pages/InvoicingPage.tsx` — `handleMarkAsPaid` ora usa `Promise.all` per aggiornamenti batch dei job, eliminando il waterfall di mutazioni sequenziali.
- **Fix (LOW):** `src/shared/layouts/Sidebar.tsx` — versione aggiornata da v0.1.0 a v0.9.0.
- **Refactor:** `useDashboardData.ts` — rimosso `calculateGoalProgressValue` duplicato, ora riusa `calculateGoalProgress` da `calculations.ts`.
- **Build verificata:** lint + tsc + vite build passano (0 errori, 0 warning).
- **Versione:** v0.9.1

---

## [v0.9.0] - 2026-06-10
### Stato: Registro (Phase 5)
- **Aggiunta:** `src/lib/hooks/useLedgerData.ts` — hook con filtri (data, metodo, stato, search), metriche aggregate (totale lordo, carta, contanti, media), client-side filtering su `completed_settled` / `completed_pending`.
- **Aggiunta:** `src/shared/ui/Badge.tsx` — componente badge con varianti success/warning/danger/info/neutral.
- **Aggiunta:** `src/lib/export.ts` — utility per export CSV e JSON del registro.
- **Aggiunta:** `src/features/register/components/LedgerFilters.tsx` — filtri: ricerca testo, date range, metodo pagamento, stato.
- **Aggiunta:** `src/features/register/components/LedgerStats.tsx` — 5 metric card animate (lavori incassati, lordo, carta, contanti, media).
- **Aggiunta:** `src/features/register/components/LedgerTable.tsx` — tabella paginata e ordinabile con colonne data/cliente/lavoro/metodo/importo/stato, righe con Framer Motion staggered.
- **Riscritto:** `src/features/register/pages/RegisterPage.tsx` — composizione completa: stats + filtri + tabella + modale dettaglio + export dropdown.
- **Build verificata:** lint + tsc + vite build passano.
- **Versione:** v0.9.0

---

## [v0.8.0] - 2026-06-03
### Stato: Fatturazione (Phase 4)
- **Aggiunta:** `src/lib/hooks/useInvoices.ts` — TanStack Query hooks per invoices (fetch, create, update) con cache invalidation incrociata jobs + invoices.
- **Aggiunta:** `src/shared/ui/Checkbox.tsx` — componente checkbox custom con stile glassmorphism.
- **Aggiunta:** `src/features/invoicing/components/PendingJobsList.tsx` — lista lavori `completed_pending` con selezione multipla, checkbox, metadati cliente/importo/metodo.
- **Aggiunta:** `src/features/invoicing/components/InvoiceFormModal.tsx` — modale creazione fattura/parcella con selezione tipo documento, aliquota IVA, riepilogo imponibile/IVA/totale, date emissione/scadenza.
- **Aggiunta:** `src/features/invoicing/components/InvoiceList.tsx` — lista documenti generati con badge stato (Bozza/Inviata/Pagata), azioni (segna inviata, segna pagata), dettaglio lavori correlati.
- **Riscritto:** `src/features/invoicing/pages/InvoicingPage.tsx` — flusso completo: pending jobs → selezione multipla → creazione fattura con numero auto-generato (FT/PA-YYYY-NNNN) → transizione a `completed_settled` al pagamento.
- **Build verificata:** lint + tsc + vite build passano.
- **Versione:** v0.8.0

---

## [v0.7.0] - 2026-06-03
### Stato: Dashboard Reale (Phase 3)
- **Aggiunta:** `src/shared/ui/RadialProgress.tsx` — componente SVG circolare animato con Framer Motion (`stroke-dasharray`/`stroke-dashoffset`), supporto dimensioni variabili, colori, etichette.
- **Aggiunta:** `src/features/dashboard/components/GoalTracker.tsx` — tracker "a petali" segmentato con 3 RadialProgress (Netto, Lordo, Cash) + barra progresso lineare gradient.
- **Aggiunta:** `src/features/dashboard/components/ProgressRings.tsx` — due anelli percentuali (Carico lavoro + Carica finanziaria) in GlassCard.
- **Aggiunta:** `src/features/dashboard/components/KPIGroup.tsx` — griglia 4x2 KPI cards con formattazione automatica.
- **Aggiunta:** `src/shared/charts/AreaChart.tsx` — area chart sovrapposto con gradienti neon (brand viola per entrate, corallo per uscite), fill gradient, legenda interattiva.
- **Aggiunta:** `src/features/dashboard/hooks/useDashboardData.ts` — hook TanStack Query che calcola metriche reali da jobs: MoneyMetrics, goals, segmenti, monthly summary, workload percent.
- **Riscritto:** `src/features/dashboard/pages/DashboardPage.tsx` — layout modulare 3 colonne con Framer Motion entrance animations (`scale: 0.9`, delay scalato), moduli: KPI group, GoalTracker, AreaChart + summary, ProgressRings, BarChart. Fallback per stato vuoto. Sostituiti tutti i mock con dati reali da Supabase.
- **Build verificata:** lint + tsc + vite build passano.
- **Versione:** v0.7.0

---

## [v0.6.0] - 2026-06-03
### Stato: Jobs CRUD + Clients (Phase 2)
- **Aggiunta:** `src/lib/stores/jobsUI.ts` — Zustand store per stato UI (tab, filtro, modale aperto/chiuso).
- **Aggiunta:** `src/lib/hooks/useJobs.ts` — TanStack Query hooks per jobs (fetch, create, update, delete) con cache invalidation.
- **Aggiunta:** `src/lib/hooks/useClients.ts` — TanStack Query hooks per clients (fetch, create) con cache invalidation.
- **Aggiunta:** `src/shared/ui/GlassCard.tsx` — componente glassmorphism standardizzato (`bg-surface/60 backdrop-blur-3xl border border-border`, hover scale[1.01]).
- **Aggiunta:** `src/features/jobs/components/ClientSelect.tsx` — dropdown clienti con ricerca e creazione inline.
- **Aggiunta:** `src/features/jobs/components/JobCard.tsx` — card espandibile con stato, importi, metadati, pulsanti azione e transizioni stato (active → completed_pending → completed_settled).
- **Aggiunta:** `src/features/jobs/components/JobFormModal.tsx` — form creazione/modifica con React Hook Form + Zod, supporto pagamento card/cash/mixed, toggle cash in fattura, selezione cliente, date picker.
- **Riscritto:** `src/features/jobs/pages/JobsPage.tsx` — tab navigazione (Generali | Carta | Cash | Misti), filtri stato (pill), grid responsive 3/2/1 colonne, toast notifiche.
- **Aggiunta:** `src/lib/utils.ts` — `formatDate()` helper.
- **Build verificata:** lint + tsc + vite build passano.
- **Versione:** v0.6.0

---

## [v0.5.1] - 2026-06-03
### Stato: Bug Fix Audit (Phase 0 & 1)
- **Fix:** Risolto conflitto route `/register` — il registro contabile ora vive su `/ledger`, l' auth signup resta su `/register`.
- **Fix:** `bg-surface` ora supporta opacità (`/ <alpha-value>`) — effetti `bg-surface/80` funzionano correttamente.
- **Fix:** Aggiunto trigger `on_job_settled` in SQL migration — auto-crea transazione `income` quando un job passa a `completed_settled`.
- **Fix:** `SyncProvider` — `processQueue` e `updateQueueLength` ora usano `useCallback`, dipendenze useEffect complete.
- **Fix:** Colori hardcoded nei chart (`LineChart`, `BarChart`) ora leggono le CSS variables — adattamento automatico a tema dark/light.
- **Fix:** Rimosso `as never` type cast in `OnboardingPage` — type safety preservata.
- **Aggiunta:** `eslint.config.js` (flat config v9) + dipendenze dev — lint passa con 0 warnings.
- **Aggiunta:** `public/icons/icon-192.svg` e `icon-512.svg` — icone PWA funzionanti (placeholder).
- **File modificati:** `src/app/router.tsx`, `src/shared/layouts/Sidebar.tsx`, `src/shared/layouts/BottomBar.tsx`, `tailwind.config.ts`, `supabase/migrations/20260603000001_initial_schema.sql`, `src/app/providers/SyncProvider.tsx`, `src/features/auth/pages/OnboardingPage.tsx`, `src/lib/utils.ts`, `src/shared/charts/LineChart.tsx`, `src/shared/charts/BarChart.tsx`, `vite.config.ts`, `index.html`, `package.json`, `eslint.config.js`, `public/icons/*.svg`, `.spec/CHANGELOG.md`
- **Root cause:** Audit post-fase ha rivelato bug strutturali e code quality issues non intercettati in fase di scrittura iniziale.
- **Scenari coperti:** 2.1 (trigger mancante), 2.1 (sync/queue)
- **Versione:** v0.5.1

---

## [v0.5.0] - 2026-06-03
### Stato: Auth & Onboarding (Phase 1)
- **Aggiunta:** `src/lib/validations.ts` — Zod schemas per login, register, onboarding (4 step).
- **Aggiornamento:** `src/app/providers/AuthProvider.tsx` — error handling localizzato, `refreshProfile`, Google OAuth redirect.
- **Riscritto:** `LoginPage.tsx` — React Hook Form + Zod, Google OAuth, loading/error states, animazione Framer Motion.
- **Riscritto:** `RegisterPage.tsx` — form completo con conferma password, schermata success "verifica email".
- **Riscritto:** `OnboardingPage.tsx` — wizard multi-step (Dati Aziendali → Regime Fiscale → Obiettivo → Preferenze), animazioni AnimatePresence, salvataggio su Supabase.
- **Aggiornamento:** `router.tsx` — onboarding guard (redirect se profilo incompleto), route protection migliorata.
- **Build verificata:** TypeScript strict + Vite build passano.

---

## [v0.4.0] - 2026-06-03
### Stato: Database Foundation (Phase 0)
- **Aggiunta:** `supabase/migrations/20260603000001_initial_schema.sql` — migrazione completa con enums, tabelle (profiles, clients, jobs, transactions, invoices, user_settings), RLS policies, trigger updated_at, auto-create profile/settings su signup.
- **Aggiunta:** `supabase/seed.sql` — dati di esempio per clients.
- **Aggiunta:** `supabase/config.toml` — configurazione Supabase locale (auth, storage, realtime).
- **Aggiornamento:** `.env.example` — istruzioni complete per collegare progetto Supabase remoto.
- **Aggiornamento:** `src/types/database.ts` — aggiunti tipi `GoalData`, `DashboardModule`, nuovi campi `goal_data` e `dashboard_layout` in Profile.
- **Aggiornamento:** `src/types/metrics.ts` — aggiunto `segments[]` a `DashboardKPIs`.
- **Build verificata:** TypeScript strict + Vite build passano.

---

## [v0.3.0] - 2026-06-03
### Stato: Glassmorphism Design System (Aggiornamento Visivo)
- **Aggiornamento:** UI_UX_SPEC.md — design language "Futuristic Modular Glassmorphism", effetti vetro con `backdrop-filter: blur(25px)`, bordi 0.5px, gradienti radiali sfondo.
- **Aggiornamento:** UI_UX_SPEC.md — goal tracker "a petali" radiale segmentato SVG, area chart sovrapposti con gradienti neon, progress rings.
- **Aggiornamento:** UI_UX_SPEC.md — nuovo componente `GlassCard` (wrapper standardizzato con blur + hover) e `RadialProgress` (SVG animato).
- **Aggiornamento:** SCHEMA.md — nuovi campi JSONB in profiles: `dashboard_layout` (ordinamento moduli) e `goal_data` (target + segmenti tracker).
- **Aggiornamento:** SCHEMA.md — nuovo tipo `GoalData`, `DashboardModule`, estensione `DashboardKPIs.segments`.
- **Aggiornamento:** ARCHITECTURE.md — GlassCard pattern, Dashboard Module Animation (Framer Motion `scale: 0.9`), AreaChart, RadialProgress.
- **Aggiornamento:** PRD.md — griglia modulare dashboard 3 colonne, goal tracker a petali segmentato, progress rings.
- **Aggiornamento:** PROCESS_AND_AGENTS.md — direttive glassmorphism per Builder (GlassCard, entrance animations, SVG stroke-dasharray).
- **Aggiunta:** TDR-003 Glassmorphism vs Solido.

---

## [v0.2.0] - 2026-06-03
### Stato: Boilerplate Iniziale (Project Setup)
- **Aggiunta:** `package.json` con tutte le dipendenze (React 19, Vite 6, Supabase, Chart.js, TanStack Query, Zustand, Framer Motion, PWA).
- **Aggiunta:** `vite.config.ts` con PWA plugin (Workbox, Manifest, Service Worker).
- **Aggiunta:** `tailwind.config.ts` con tema CSS variables (brand viola/blu, surface, dark/light mode).
- **Aggiunta:** `tsconfig.json` strict mode con path alias `@/`.
- **Aggiunta:** `.env.example` con placeholder Supabase + Google OAuth.
- **Aggiunta:** `src/index.css` con CSS variables per theme switching (dark/light).
- **Aggiunta:** Provider layer (Auth, Theme, Sync con offline queue IndexedDB).
- **Aggiunta:** Router completo con protected/public routes e sidebar layout.
- **Aggiunta:** Shared UI components (Button, Card, Modal, Input, Toast).
- **Aggiunta:** Layout responsive (Sidebar 280px desktop, collassabile tablet, BottomBar mobile).
- **Aggiunta:** Chart wrappers (LineChart, BarChart con Chart.js).
- **Aggiunta:** Placeholder pages per tutte le feature (Dashboard, Lavori, Fatturazione, Registro, Impostazioni, Account, Guida, Legal, Auth).
- **Aggiunta:** Types allineati allo SCHEMA (database.ts, metrics.ts).
- **Aggiunta:** Calcoli finanziari (calculateMetrics, calculateGoalProgress, formatCurrency).
- **Aggiunta:** SyncProvider con coda IndexedDB e push automatico su riconnessione.
- **Build verificata:** TypeScript strict + Vite build passano senza errori.

---

## [v0.1.0] - 2026-06-03
### Stato: Definizione Specifiche (Inception)
- **Aggiunta:** Creazione documentazione tecnica `.spec/` (PRD, SCHEMA, ARCHITECTURE, UI_UX, PROCESS).
- **Aggiunta:** Definizione protocollo multi-agente per vibecoding.
- **Aggiunta:** Guida comandi locali di sviluppo (COMMANDS.md).
- **Aggiunta:** Registro versioni e changelog (CHANGELOG.md).
- **Aggiornamento:** ARCHITECTURE.md — chart library Chart.js, font Google Fonts CDN, .env placeholder, offline strategy con sync queue completa.
- **Aggiornamento:** UI_UX_SPEC.md — grafici specificati come Chart.js + react-chartjs-2.
- **Aggiornamento:** PRD.md — requisito offline-first con push su riconnessione.
- **Aggiornamento:** COMMANDS.md — aggiunto step `.env.example`, sezione variabili d'ambiente.
- **Aggiornamento:** SCHEMA.md — aggiunta tabella `sync_queue` per mutazioni offline in IndexedDB.

---

## [v0.0.1] - 2026-06-03
### Stato: Concept
- **Aggiunta:** Analisi idea originale (PWA Finanziaria Carta/Cash).
- **Definizione:** Scelta stack tecnico (React 19, Supabase, Vite).
