# Changelog & Version Control

## Logica di Versioning

- **PATCH (+0.0.1):** Bug fix, micro-modifiche UI, aggiornamento testi.
- **MINOR (+0.1.0):** Nuova funzionalità, modifica schema DB, nuova pagina.
- **MAJOR (+1.0.0):** Migrazione architetturale, cambio design system, rilascio MVP.

---

## [v0.44.12] - 2026-07-01

### Sidebar — toggle solo in basso (freccia), floating button in basso
- **[PATCH] Sidebar:** Rimosso toggle dall'header (full mode). Il pulsante comprimi è ora sempre in basso, solo icona chevron (senza testo), sia in full che icons mode.
- **[PATCH] Hidden mode:** Floating button spostato in basso a sinistra (`fixed left-3 bottom-6`), stile semplice (rounded-full con bordo).
- **File modificati:** `src/shared/layouts/Sidebar.tsx`
- **Build:** `npx tsc --noEmit` — 0 errori.

### PDF & QR — fix font Inter 404 e QR vuoto su iPhone
- **[PATCH] PDF font:** Sostituiti URL Google Fonts v12 (404) con font Inter .ttf locali in `public/fonts/` — scaricati da release ufficiale Inter v4.1.
- **[PATCH] QR code:** Passato da `toDataURL` (canvas) a `toString` (SVG) per compatibilità iOS Safari. Aggiunto stato errore visivo.
- **File modificati:** `src/shared/ui/InvoiceDocument.tsx`, `src/shared/ui/InvoiceQRCode.tsx`, `public/fonts/Inter-{Regular,SemiBold,Bold}.ttf`
- **Build:** `npx tsc --noEmit` — 0 errori.

## [v0.44.11] - 2026-07-01

### Fix: 400 creazione fattura — due_date vuota
- **[PATCH] useCreateInvoiceWithJobs:** `due_date` vuoto (`''`) inviato a colonna `date` di Supabase causava errore 400. Cambiato `due_date ?? null` in `due_date || null` per convertire stringa vuota in `null`.
- **File modificati:** `src/lib/hooks/useCreateInvoiceWithJobs.ts`
- **Build:** `npx tsc --noEmit` + `npm run build` — 0 errori.

### Sezione Preferenze rinominata in Notifiche
- **[PATCH] SettingsPage:** Tab "Preferenze" rinominato in "Notifiche" (id: `preferences` → `notifications`, icona: Moon → Bell); intestazione "Notifiche e preferenze" → "Notifiche"; subtitle "Gestisci profilo, preferenze e impostazioni" → "Gestisci profilo, notifiche e impostazioni"
- **[PATCH] AccountPage:** Subtitle "Il tuo profilo e le tue preferenze" → "Il tuo profilo e le tue notifiche"
- **[PATCH] .spec:** Allineati PRD.md e ARCHITECTURE.md
- **File modificati:** `src/features/settings/pages/SettingsPage.tsx`, `src/features/account/pages/AccountPage.tsx`, `.spec/PRD.md`, `.spec/ARCHITECTURE.md`

### Form fattura da SlideOver a Modal centrato
- **[PATCH] InvoiceFormModal:** Sostituito `SlideOver` (pannello laterale) con `Modal` centrato — la creazione fattura ora appare al centro della pagina invece che scorrere da destra
- **File modificati:** `src/features/invoicing/components/InvoiceFormModal.tsx`
- **Build:** `npx tsc --noEmit` — 0 errori.

### Sidebar a 3 stati — full (240px) / icone / nascosta
- **[MINOR] Sidebar 3-state:** Sidebar desktop da 280px → 240px. Tre modalità ciclabili:
  - **Full (240px):** layout normale con logo, label e toggle in alto
  - **Icone (72px):** solo icone, label nascoste, logo centrato, toggle in fondo
  - **Nascosta (0px):** sidebar nascosta, floating half-pill a sinistra per riaprire
- **[MINOR] useUIStore:** Nuovo store Zustand (`src/lib/stores/ui.ts`) con stato `sidebarMode` persistito su localStorage
- **[PATCH] MainLayout:** Margine sinistro dinamico in base a `sidebarMode` con transizione fluida
- **File modificati:** `src/lib/stores/ui.ts` (nuovo), `src/shared/layouts/Sidebar.tsx`, `src/shared/layouts/MainLayout.tsx`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — OK.

## [v0.44.10] - 2026-07-01
### Ristrutturazione form lavori e preventivi — Dati Fiscali dinamici per contanti/misto
- **[MINOR] JobFormModal:** Il form creazione lavori ora mostra i campi "Dati Fiscali" in base al metodo di pagamento:
  - **Carta:** Netto + Lordo (invariato)
  - **Contanti senza "Includi contanti in fattura":** Singolo campo "Contanti (€)" — non tassato, non in fattura
  - **Contanti con "Includi contanti in fattura":** Netto + Lordo — tassato e fatturabile
  - **Misto:** Carta di credito (Netto + Lordo) sempre visibile; Contanti con Netto+Lordo (se incluso in fattura) o singolo campo (se non incluso)
  - Rimossi i campi importo carta/contanti dalla sezione "Tipo di Pagamento" per il metodo misto (spostati in Dati Fiscali)
- **[MINOR] QuotesPage:** Stessa ristrutturazione applicata al form di creazione preventivi, con correzione del bug per cui i contanti venivano salvati su `amount_card` invece di `amount_cash`
- **File modificati:** `src/features/jobs/components/JobFormModal.tsx`, `src/features/quotes/pages/QuotesPage.tsx`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — OK.

## [v0.44.9] - 2026-07-01
### Storico cliente — pulsante (i) con storico lavori, preventivi e modifiche
- **[MINOR] ClientHistoryModal:** Nuovo componente che mostra in un modale lo storico completo di un cliente: lavori, preventivi e registro modifiche (audit_log). Accessibile tramite un pulsante (i) su ogni card cliente.
- **[PATCH] Pulsante (i) in ClientsPage:** Aggiunto pulsante `Info` in ogni card cliente, visibile all'hover su desktop e sempre su mobile, che apre il modale storico.
- **File modificati:** `src/features/clients/components/ClientHistoryModal.tsx` (nuovo), `src/features/clients/pages/ClientsPage.tsx`
- **Build:** `npx tsc --noEmit` — 0 errori.

### Fix refresh_calendar_token — 404 cliccando refresh del calendario esterno
- **[PATCH] Fix RPC `refresh_calendar_token` search_path:** La RPC aveva `SET search_path = ''` ma riferiva `profiles` senza schema qualificato (`public.`), causando errore runtime 404. Stesso bug già fixato in `get_calendar_events_by_token` (v0.44.4). Aggiunto prefisso `public.` alla tabella `profiles`.
- **[PATCH] Nuova migration `20260624000006_fix_refresh_calendar_token_search_path.sql`:** `CREATE OR REPLACE FUNCTION` con `UPDATE public.profiles`.
- **Nuovo file:** `supabase/migrations/20260624000006_fix_refresh_calendar_token_search_path.sql`
- **Build:** `npx tsc --noEmit` — verificare.

## [v0.44.8] - 2026-07-01
### Bottone "Fatturalo" nei lavori da incassare
- **[MINOR] Bottone "Fatturalo" in JobCard:** Aggiunto bottone "Fatturalo" affianco a "Segna come incassato" per i lavori con stato `completed_pending`. Il bottone reindirizza alla pagina Fatturazione con il lavoro pre-selezionato tramite query param `?job=ID`.
- **[PATCH] Pre-selezione lavoro in InvoicingPage:** La pagina Fatturazione ora legge il query param `job` e pre-seleziona automaticamente il lavoro corrispondente nella lista dei lavori in attesa.
- **File modificati:** `src/features/jobs/components/JobCard.tsx`, `src/features/invoicing/pages/InvoicingPage.tsx`

## [v0.44.7] - 2026-07-01
### Fix forms centrati — SlideOver sostituito con Modal per lavori e clienti
- **[PATCH] JobFormModal da SlideOver a Modal:** Il form creazione/modifica lavori ora appare centrato invece che laterale.
- **[PATCH] ClientsPage da SlideOver a Modal:** Il form creazione/modifica clienti ora appare centrato invece che laterale.
- **File modificati:** `src/features/jobs/components/JobFormModal.tsx`, `src/features/clients/pages/ClientsPage.tsx`

## [v0.44.6] - 2026-07-01
### Nuovo logo brand — Ocra Caldo, rimossi asset viola legacy
- **[PATCH] Sostituiti tutti gli asset logo:** Rimosso il vecchio logo con gradiente viola (#5B4BD5→#8B7CF7). Nuovo logo: simbolo N-arrow su sfondo ocra `#C5963A` (primary brand color), con variante dark `#0F0F1A` e full logo orizzontale/verticale con scritta "NETFLOW".
- **[PATCH] Generati nuovi PWA icons:** `icon-192.png`, `icon-512.png`, `icon-192-maskable.png`, `icon-512-maskable.png`, versioni dark per tema scuro.
- **[PATCH] Nuovi asset:** `favicon.png` (32×32), `favicon-16.png` (16×16), `apple-touch-icon.png` (180×180), `logo-full.png` (orizzontale), `logo-vertical.png` (stacked), `logo-icon.png` (gold bg), `logo-icon-dark.png` (dark bg), `logo-symbol.png` (trasparente).
- **[PATCH] Aggiornati riferimenti:** `vite.config.ts` (PWA manifest → png con maskable), `index.html` (favicon/apple-touch → png), `Logo.tsx` (logo.jpg → logo-icon.png), `useFaviconBadge.ts` (logo-icon.svg → favicon.png), `useOsNotifications.ts` (logo-icon.svg → logo-icon.png).
- **[PATCH] Rimossi vecchi asset viola:** `logo-full.svg`, `logo-icon.svg`, `logo.jpg`, `icons/icon-192.{svg,jpg}`, `icons/icon-512.{svg,jpg}`.
- **Build:** `npx tsc --noEmit` — 0 errori.

## [v0.44.5] - 2026-07-01
### Eliminato loading spinner cambio pagina — import eager, no Suspense
- **[PATCH] Rimossi React.lazy() e Suspense:** Tutte le pagine protette sono ora importate eager invece di `React.lazy()`. Eliminati i 14 `<Suspense fallback={<PageLoader />}>` dal router. Il cambio pagina è istantaneo — nessun loading spinner durante la navigazione.
- **[PATCH] AuthGate loading → null:** Sostituito `<PageLoader />` con `null` negli stati `isLoading` di `AuthGate`, `OnboardingGuard` e `PublicRoute`. L'auth check iniziale è tipicamente <100ms.
- **File modificati:** `src/app/protectedRouteConfig.tsx`, `src/app/router.tsx`, `.spec/UI_UX_SPEC.md`, `.spec/ARCHITECTURE.md`
- **Build:** `npx tsc --noEmit` — 0 errori.

## [v0.44.4] - 2026-07-01
### Stato: Fix feed ICS calendario — RPC schema-qualify, CORS, Google Calendar URL
- **[PATCH] Fix RPC `get_calendar_events_by_token`:** Con `SET search_path = ''`, i riferimenti a tabelle senza schema (es. `profiles`) non venivano risolti. Aggiunto prefisso `public.` a tutte le tabelle (`public.profiles`, `public.custom_events`, `public.jobs`, `public.invoices`) nella RPC.
- **[PATCH] Nuova migration `20260624000005_fix_calendar_rpc_search_path.sql`:** `CREATE OR REPLACE FUNCTION` con riferimenti schema-qualificati.
- **[PATCH] CORS nel Cloudflare Function:** Aggiunti header `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods`, gestione OPTIONS preflight per compatibilità calendari esterni.
- **[PATCH] Fix Google Calendar subscription URL:** Cambiato `webcal://` in `https://` nel parametro `cid` — Google Calendar non gestiva `webcal://` per la sottoscrizione.
- **[PATCH] Fix `_redirects`:** Aggiunta regola esplicita `/ics/*` per evitare interferenze con il catch-all SPA.
- **Nuovo file:** `supabase/migrations/20260624000005_fix_calendar_rpc_search_path.sql`
- **File modificati:** `functions/ics/[token].ts`, `src/features/calendar/pages/CalendarPage.tsx`, `public/_redirects`, `package.json`, `.spec/CHANGELOG.md`
- **Migration push:** `npx supabase db push` — ✓ applicata al remoto.

## [v0.44.3] - 2026-07-01
### Stato: Pagina Aiuto rinominata in Aiuto/Contatti
- **[PATCH] Pagina Aiuto → Aiuto/Contatti:** Rinominata la pagina "Aiuto" in "Aiuto/Contatti" in Sidebar, BottomBar e titolo pagina per riflettere entrambe le sezioni (FAQ + Contatti).
- **File modificati:** `src/shared/layouts/Sidebar.tsx`, `src/shared/layouts/BottomBar.tsx`, `src/features/help/pages/HelpPage.tsx`

## [v0.44.2] - 2026-07-01
### Stato: Rimosso rimbalzo (theme-breath) dal cambio tema
- **[PATCH] Rimosso bounce animation sul cambio tema:** Eliminata l'animazione `theme-breath` (damped spring scale 1→0.992→1.006→0.997→1) e la classe `.theme-changing` da `ThemeProvider.tsx` e `index.css`. Il cambio tema ora morphia i colori senza rimbalzo.
- **File modificati:** `src/app/providers/ThemeProvider.tsx`, `src/index.css`, `.spec/UI_UX_SPEC.md`
- **Build:** `npx tsc --noEmit` — 0 errori.

## [v0.44.1] - 2026-07-01
### Stato: Fix posizione form creazione Lavori e Clienti — da Modal a SlideOver
- **[PATCH] Fix form creazione Lavori:** `JobFormModal` ora usa `SlideOver` invece di `Modal` secondo UI_UX_SPEC 3.5a. Il pannello scorre da destra e mantiene il contesto della pagina sottostante visibile.
- **[PATCH] Fix form creazione Clienti:** Form in `ClientsPage` ora usa `SlideOver` invece di `Modal`. Pannello laterale fisso a destra con spring animation.
- **File modificati:** `src/features/jobs/components/JobFormModal.tsx`, `src/features/clients/pages/ClientsPage.tsx`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓

## [v0.44.0] - 2026-07-01
### Stato: Brand color cambiato da viola a giallo ocra caldo
- **[MINOR] Brand Primary cambiato in #C5963A (Ocra Caldo):** Sostituito `--color-brand` in `index.css` (RGB: 108 92 231 → 197 150 58). Aggiornati tutti i riferimenti hardcoded: PWA manifest, theme-color meta, chart default colors, gradienti dashboard, palette colori clienti/eventi, glow effects sidebar/glasscard/shared, store default e localStorage migration.
- **[PATCH] Old default migration:** Aggiunto `'fintrack-color-brand': '#6c5ce7'` a `OLD_DEFAULTS` in `customization.ts` — se un utente ha ancora il vecchio viola in localStorage, viene automaticamente rimosso al prossimo avvio.
- **Build:** `npx tsc --noEmit` — 0 errori.

## [v0.43.2] - 2026-07-01
### Stato: Migration fix — RPC esteso spostato in nuova migration (027)
- **[PATCH] Nuova migration `20260624000004_extend_calendar_rpc.sql`:** La modifica a `get_calendar_events_by_token` (inclusione jobs e invoices nell'ICS feed) era stata applicata direttamente su `20260624000002_calendar_time_and_external.sql` DOPO che questa era già stata deployata sul DB remoto. Creata nuova migration separata contenente solo l'aggiornamento dell'RPC. Migration 025 ripristinata alla versione committed.
- **[PATCH] Version bump:** package.json allineato a v0.43.2.
- **Nuovo file:** `supabase/migrations/20260624000004_extend_calendar_rpc.sql`
- **File modificati:** `package.json`, `supabase/migrations/20260624000002_calendar_time_and_external.sql`
- **Migration push:** `npx supabase db push` — ✓ applicata al remoto.
- **Build:** `npm run build` — ✓. `npx tsc --noEmit` — 0 errori. `npx vitest run` — 4/4 test passanti.
### Stato: QR code fatture con contenuto pagamento + PDF scaricabile con dati cliente
- **[PATCH] QR code fatture con EPC QR:** Il QR ora contiene il formato EPC standard europeo (`BCD\n001\n1\nSCT\n{IBAN}\n...`) quando l'IBAN è configurato, altrimenti mostra dati fattura strutturati. Il QR è scansionabile dalle app bancarie per precompilare il bonifico.
- **[PATCH] Nuovo campo IBAN in Account → Personalizzazione Fatture:** Aggiunto input IBAN salvato in `profiles.goal_data.iban` (JSONB). L'IBAN viene passato al QR code e usato nel formato EPC.
- **[PATCH] PDF scaricabile con dati cliente:** Il download PDF ora cerca il cliente dal primo job collegato alla fattura e include nome, indirizzo, P.IVA, CF nel documento.
- **[PATCH] Fix salvataggio template fatture:** `handleSaveTemplate` ora salva correttamente `goal_data` con `invoice_footer` e `iban`.
- **File modificati:** `src/types/database.ts`, `src/shared/ui/InvoiceQRCode.tsx`, `src/features/invoicing/components/InvoiceList.tsx`, `src/features/invoicing/pages/InvoicingPage.tsx`, `src/features/account/pages/AccountPage.tsx`, `.spec/CHANGELOG.md`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓

## [v0.43.1] - 2026-07-01
### Stato: Fix ICS feed e UI calendario — bottoni subscribe, RPC all-eventi, toast feedback
- **[PATCH] RPC `get_calendar_events_by_token` esteso:** Ora include eventi da `jobs` (pending_date, end_date) e `invoices` (due_date) oltre ai `custom_events` — il feed ICS sottoscrivibile contiene tutti gli eventi del calendario.
- **[PATCH] Bottoni subscribe one-click:** Aggiunti bottoni "Google Calendar", "Apple Calendar", "Outlook" nella card di collegamento calendario esterno — link diretti per sottoscrizione con webcal:// e URL dedicati.
- **[PATCH] Fix pulsante refresh token:** Aggiunto `toast` di feedback (successo/errore) quando si rigenera il token. Icona cambiata da `ExternalLink` a `RefreshCw`.
- **[PATCH] Fix copia link:** Aggiunto `toast` di feedback quando il link viene copiato negli appunti.
- **File modificati:** `supabase/migrations/20260624000002_calendar_time_and_external.sql`, `src/features/calendar/pages/CalendarPage.tsx`, `.spec/SCHEMA.md`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓

## [v0.43.1] - 2026-07-01
### Stato: SharedViewPage — tema chiaro/scuro, UX premium, animazioni migliorate
- **[PATCH] SharedViewPage tema-aware:** Sostituiti tutti i colori hardcoded dark (`bg-[#0F0F1A]`, `bg-[rgba(26,26,46,0.6)]`, `border-white/[X]`) con variabili tema (`bg-surface-alt`, `bg-surface/60`, `border-border`). La pagina rispetta ora il tema di sistema (light/dark).
- **[PATCH] UI premium:** StatCard con ring-1 vetro, icona in bg-color/10, glow brand on hover migliorato. Sezioni espandibili trasformate in pill glass con bordo arrotondato 1.5rem e backdrop-blur.
- **[PATCH] UX migliorata:** Multi-sezione espandibile simultaneamente (Set invece di single string), jobs e invoices aperti di default, bottone clear nella barra di ricerca, empty state per ricerca senza risultati, supporto tastiera (role=button + onKeyDown), animazione accordion con cubic-bezier emphasized deceleration.
- **File modificati:** `src/features/shared/pages/SharedViewPage.tsx`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓

## [v0.43.0] - 2026-06-24
### Stato: Condivisione premium — link protetti, selettore sezioni, vista pubblica migliorata
- **[MINOR] Condivisione premum:** Nuove colonne sulla tabella `shares`: `name` (nome link), `is_active` (toggle on/off), `password_hash` (protezione password), `max_views` + `view_count` (limite visite), `sections` (seleziona quali dati condividere).
- **[MINOR] RPC `get_share_info`:** Nuova funzione pubblica che restituisce metadati del link (has_password, name) prima di autenticarsi — abilita la schermata di sblocco password.
- **[MINOR] RPC `check_share_password`:** Nuova funzione pubblica per verificare la password di un link condiviso.
- **[MINOR] RPC `get_shared_data` aggiornata:** Ora rispetta `is_active`, `max_views`/`view_count` (blocca se superato), filtra per `sections` (restituisce solo i dati selezionati). Incrementa `view_count` a ogni accesso.
- **[MINOR] SharesManager riscritto (Impostazioni):** Nuovo form con nome link, descrizione, accesso, scadenza, max visite, protezione password (con toggle mostra/nascondi), selettore sezioni a pill buttons. Ogni link mostra edit, toggle attivo/disattivo, copia, apri, elimina. Stato vuoto con CTA.
- **[MINOR] SharedViewPage ridisegnata (Premium):** Nuovo layout con ambient light orbs, header brandizzato con badge "Verificato", animazioni stagger Framer Motion, card KPIs con effetto vetro premium e glow, riepilogo finanziario (Incassato/In Attesa/Uscite), barra di ricerca globale, sezioni espandibili/collassabili con conteggio, pulsante "Mostra tutti" per dati >5 items, footer professionale con token parziale e data.
- **[MINOR] Tipi `ShareSection` aggiunti:** Nuovo tipo `ShareSection` e costante `SHARE_SECTIONS` in `database.ts` per selezionare le sezioni da condividere.
- **[MINOR] Hook `useUpdateShare`:** Nuova mutation per modificare link esistenti (nome, descrizione, access_level, scadenza, max_views, sezioni, active).
- **[MINOR] Tipi `SharedData` migliorati:** Ora usa interfacce tipizzate (`Profile`, `Job`, `Client`, `Invoice`, `Expense`, `Quote`) invece di `Record<string, unknown>`.
- **Nuovo file:** `supabase/migrations/20260624000003_enhanced_sharing.sql`
- **File modificati:** `src/features/shared/pages/SharedViewPage.tsx`, `src/features/settings/components/SharesManager.tsx`, `src/lib/hooks/useShares.ts`, `src/lib/hooks/useSharedData.ts`, `src/types/database.ts`, `.spec/SCHEMA.md`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓

## [v0.42.1] - 2026-06-24
### Stato: Fix console errors — Notification user gesture, off-by-zero dispatch
- **[PATCH] Fix Notification.requestPermission() senza gesto utente:** Rimosso `useEffect` al mount che chiamava `Notification.requestPermission()`. I browser moderni bloccano la richiesta di permesso se non originatesi da un gesto dell'utente (click/tap). La funzione `sendOsNotification()` controlla già `permission === 'granted'`.
- **[PATCH] Fix useNewNotificationTracker dispatch count sempre 0:** `prevTotalRef.current` veniva aggiornato prima del calcolo, risultando sempre 0 nel `CustomEvent('new-notification')`.
- **[PATCH] Aggiunto error handling a .subscribe() in useRealtimeNotifications:** Aggiunto callback con `console.warn`, allineato a `useRealtimeSync.ts`.
- **File modificati:** `src/lib/hooks/useOsNotifications.ts`, `src/lib/hooks/useRealtimeNotifications.ts`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓.

## [v0.42.0] - 2026-06-24
### Stato: Calendario potenziato — fasce orarie, esportazione ICS, collegamento calendari esterni
- **[MINOR] Fasce orarie eventi custom:** Aggiunti `start_time` (time) e `end_time` (time) alla tabella `custom_events`. Il form creazione evento ora include due input time per orario inizio/fine. Mostrati nella vista giorno e agenda.
- **[MINOR] Vista Agenda:** Nuova vista alternativa a quella mensile — elenco cronologico di tutti gli eventi del mese con data, ora e tipo. Toggle Mese/Agenda.
- **[MINOR] Esportazione ICS mese:** Bottone "Esporta mese" nella toolbar — scarica un file `.ics` con tutti gli eventi del mese corrente (scadenze, incassi, eventi custom) importabile in Google Calendar, Apple Calendar, Outlook.
- **[MINOR] Collegamento calendario esterno:** Nuova card "Collegamento calendario esterno" nella pagina calendario con link ICS unico (per utente). Il link è sottoscrivibile da Google Calendar / Apple Calendar / Outlook per sincronizzazione continua. Bottone copia link + refresh token.
- **[MINOR] Nuova tabella `calendar_feeds`:** Memorizza le connessioni a calendari esterni (provider, URL sync, abilitato). RLS scoped all'utente. Per futura espansione (Google Calendar API, CalDAV).
- **[MINOR] Nuova colonna `calendar_token` su `profiles`:** Token univoco per generare l'ICS feed pubblico. Generato automaticamente per tutti gli utenti esistenti e nuovi. Funzione RPC `refresh_calendar_token()` per rigenerarlo.
- **[MINOR] RPC `get_calendar_events_by_token`:** Funzione pubblica SECURITY DEFINER che restituisce gli eventi del calendario dato un token valido — usata dal Cloudflare Pages Function per il feed ICS.
- **[MINOR] Cloudflare Pages Function `/ics/[token]`:** Nuova funzione serverless edge che espone il feed ICS sottoscrivibile. Richiede `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` come env vars in Cloudflare.
- **Nuovi file:** `supabase/migrations/20260624000002_calendar_time_and_external.sql`, `src/lib/icsGenerator.ts`, `functions/ics/[token].ts`
- **File modificati:** `src/features/calendar/pages/CalendarPage.tsx`, `src/lib/hooks/useCustomEvents.ts`, `src/types/database.ts`, `.spec/SCHEMA.md`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓

## [v0.41.1] - 2026-06-24
### Stato: Miglioramento impatto visivo — orbi ambientali, transizioni premium, sidebar glow
- **[PATCH] Ambient light orbs:** Aggiunti tre gradienti radiali animati (viola brand, blu elettrico, brand soffuso) fissi nello sfondo con blur 80-120px e animazioni floating/pulse. Visibili attraverso gli elementi glass (`backdrop-blur`) per maggiore profondità "futuristic modular glassmorphism".
- **[PATCH] Enhanced page transition:** Transizione cambio pagina migliorata: ora usa `y: 24 + scale: 0.97 → 1` combinato a opacità, con spring più morbido (`stiffness: 280, damping: 24, mass: 1.1`) per un effetto di "sollevamento" più premium.
- **[PATCH] Sidebar active glow:** Aggiunta ombra brand (`shadow-[0_0_20px_rgba(108,92,231,0.35)]`) al pill animato della navigazione attiva, per un effetto glow che segue lo slide.
- **[PATCH] GlassCard migliorata:** Aggiunto bordo sottile `border-white/[0.06]` e, on hover, glow brand `shadow-[0_8px_40px_rgba(108,92,231,0.08)]` + bordo più luminoso. Allineato alla spec UI (`border: 0.5px solid rgba(255,255,255,0.08)`).
- **[PATCH] Intersezione sidebar/header ridisegnata:** Sidebar come colonna verticale, header come transetto orizzontale. Aggiunto un arco di congiunzione SVG (`A 32 32`) posizionato all'angolo di intersezione — una linea curva brand che parte dalla colonna sidebar e si raccorda al transetto header, creando un collegamento architettonico tra le due superfici glass. Header reso un transetto pulito (rimosso `rounded-l-2xl`). Logo area sidebar ridotto da `py-6` a `py-4` per allineamento verticale con l'header.
- **File modificati:** `src/shared/layouts/MainLayout.tsx`, `src/shared/layouts/Sidebar.tsx`, `.spec/UI_UX_SPEC.md`

- **[PATCH] Verde success schiarito:** `--color-success` da `0 60 10` (`#003C0A`) a `0 156 19` (`#009C13`), poi ulteriormente a `16 185 129` (`#10B981`, smeraldo) — il verde era troppo scuro. Allineato UI_UX_SPEC e customization.ts.

- **[PATCH] Pending color in dark mode:** `--color-pending` in `.dark` cambiato da `50 55 60` (grigio scuro, illeggibile) a `253 245 220` (bianco panna). I numeri "In attesa" nei KPI e badge ora sono visibili in dark mode.
- **File modificati:** `src/index.css`, `src/lib/stores/customization.ts`, `.spec/UI_UX_SPEC.md`

- **[PATCH] Theme bounce animation:** Sostituito il micro-respiro (scale 0.998→1→1.002) con un leggero rimbalzo elastico (damped spring: 1→0.992→1.006→0.997→1, 0.8s, `cubic-bezier(0.22, 1, 0.36, 1)`). Il rimbalzo accompagna il morphing dei colori con un effetto naturale di "assestamento".
- **File modificati:** `src/index.css`, `.spec/UI_UX_SPEC.md`

- **[PATCH] Animazione tema anche su cambio OS:** Il `prefers-color-scheme` change handler ora aggiunge `theme-changing` a `body`, così il rimbalzo si attiva anche quando il sistema operativo cambia tema automaticamente.
- **File modificati:** `src/app/providers/ThemeProvider.tsx`

- **[PATCH] Fix sidebar spostata dal bounce:** Aggiunto `transform-origin: top left` a `body.theme-changing` — il `scale` sul body creava un nuovo containing block per gli elementi `position: fixed` (sidebar, bottombar), spostandoli fuori schermo. L'origine top-left mantiene l'ancoraggio al viewport.
- **File modificati:** `src/index.css`

### Stato: Premium theme transition — cubic-bezier custom + micro-scale breath
- **[MINOR] Premium theme morph:** Rimosso il catch-all `* { transition }` che appiattiva tutti gli elementi allo stesso ritmo. Sostituito con transizione selettiva sul solo `body` usando `cubic-bezier(0.16, 1, 0.3, 1)` — Material Design "emphasized deceleration": partenza rapida, decelerazione che si addolcisce verso la fine. Aggiunta animazione `theme-breath` (scale 0.998→1→1.002 in 0.5s) attivata dalla classe `.theme-changing` su `body` — dà un micro-respiro di profondità. Le componenti esistenti (GlassCard, bottoni) usano le proprie transizioni naturali, creando uno stagger organico.
- **File modificati:** `src/app/providers/ThemeProvider.tsx`, `src/index.css`, `.spec/UI_UX_SPEC.md`
- **File rimossi:** `src/shared/ui/ThemeTransitionOverlay.tsx`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓

- **[PATCH] Sidebar e BottomBar layout animation:** Aggiunto `motion.div` con `layout` spring sugli item navigabili di Sidebar e BottomBar. Quando l'ordine viene modificato dalla pagina Personalizzazione, gli item si riposizionano con animazione fluida invece di uno switch istantaneo.
- **File modificati:** `src/shared/layouts/Sidebar.tsx`, `src/shared/layouts/BottomBar.tsx`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓

---

## [v0.41.0] - 2026-06-24
### Stato: Privacy nella barra superiore — nuova LegalPage professionale, GDPR approfondito
- **[MINOR] Privacy spostata nella barra superiore:** Aggiunto pulsante Shield (`/legal`) nell'header di `MainLayout.tsx` accanto alla Guida Fiscale (Info), visibile su desktop. Rimosso tab "Privacy" dalle Impostazioni.
- **[MINOR] Nuova LegalPage professionale:** Riscritta completamente `LegalPage.tsx` — 7 sezioni GDPR approfondite (Informativa Privacy, Dati trattati, Cookie Policy, Diritti, Conservazione, Sicurezza tecnica/organizzativa, Contatti). Email contatto: `giorgiocalleriall@gmail.com`. Portabilità dati rimossa (resta nelle Impostazioni).
- **[MINOR] Rimossa sezione Privacy da Settings:** Rimossi tab `legal`, array `legalSections` e contenuti privacy da `SettingsPage.tsx`.
- **[MINOR] Pulisci account ed Elimina account spostati in Impostazioni → Profilo:** Le due card azione (pulizia dati con `clean_user_data` ed eliminazione account con `delete_user_account`) sono state spostate dalla LegalPage alla sezione Profilo delle Impostazioni (`SettingsPage.tsx`), sotto "Salva profilo".
- **[PATCH] Fix timeline audit log tagliata:** Ristrutturato layout timeline audit log — rimossi `border-l-2` e dots assoluti dal container scrollabile (che forzava overflow clipping). Ora usa layout flex a 2 colonne: linea timeline separata + dots con `z-10` centrate sulla linea. I dots non vengono più tagliati dall'overflow.
- **File modificati:** `src/shared/layouts/MainLayout.tsx`, `src/features/legal/pages/LegalPage.tsx`, `src/features/settings/pages/SettingsPage.tsx`, `src/features/settings/components/AuditLogViewer.tsx`, `package.json`, `src/lib/hooks/useOsNotifications.ts`, `src/lib/hooks/useGoalNotifications.ts`, `src/lib/hooks/useNotificationCleanup.ts`
- **[PATCH] Ottimizzazioni Supabase config:** Impostato `auto_expose_new_tables = false`, abilitato pooler (transaction mode), `minimum_password_length` portato da 6 a 8. Applicata migrazione `20260624000001_notifications_system.sql` al remoto.
- **File modificati:** `supabase/config.toml`, `.spec/CHANGELOG.md`
- **Build:** `npx tsc --noEmit` — 0 errori.

## [v0.40.2] - 2026-06-24
### Stato: Fix taglio netto header allo scroll
- **[PATCH] Header scroll transition:** Sostituito `bg-surface-alt/80` con `bg-gradient-to-b from-surface-alt via-surface-alt/70 to-surface-alt/0` + `backdrop-blur-xl`. L'header sfuma gradualmente da opaco (top) a trasparente (bottom), creando una transizione morbida quando il contenuto scorre sotto. Aggiunta anche box-shadow per profondità e bordo inferiore con gradiente sottile.
- **File modificati:** `src/shared/layouts/MainLayout.tsx`, `src/index.css`

### Stato: Aggiornamento colori entrate/uscite
- **[PATCH] Colori entrate/uscite aggiornati:** Entrate da `#00b894` a `#003c0a` (verde più scuro), Uscite da `#ff6b6b` a `#ff2d2d` (rosso più vivo). Migrazione automatica: i vecchi default vengono rimossi da localStorage all'avvio.
- **File modificati:** `src/index.css`, `src/lib/stores/customization.ts`

---

## [v0.40.1] - 2026-06-24
### Stato: Enhanced Notifications v2 — Realtime, OS notifiche, favicon badge, suono, goal milestone, pagina notifiche
- **[MAJOR] Realtime push notifiche:** Nuovo `useRealtimeNotifications` — sottoscrizione Supabase Realtime alla tabella `notifications`. Le notifiche arrivano istantaneamente senza polling.
- **[MINOR] Notifiche OS (Browser API):** `useOsNotifications` — richiede permesso `Notification` al mount e mostra notifiche desktop native quando l'app è in background. Icona: `logo-icon.svg`.
- **[MINOR] Favicon badge:** `useFaviconBadge` — badge rosso con conteggio (Canvas) sovrapposto alla favicon. `9+` per oltre 9 notifiche.
- **[MINOR] Suono notifiche:** `useNotificationSound` — chime via Web Audio API (oscillatore 880→1108Hz, 300ms) all'arrivo di nuove notifiche.
- **[MINOR] Auto-cleanup:** `useNotificationCleanup` — chiama RPC `cleanup_notifications(30)` all'avvio per eliminare notifiche dismissate da >30gg.
- **[MINOR] Goal milestone:** `useGoalNotifications` — notifiche automatiche al 50%, 80%, 100% dell'obiettivo finanziario.
- **[MINOR] Sync notifications:** SyncProvider ora crea notifica `sync` quando la connessione torna online e la coda si svuota.
- **[MINOR] Nuova pagina /notifications:** `NotificationsPage` — storico completo con filtri per categoria, toggle archiviate, badges conteggio, azioni leggi/nascondi.
- **[MINOR] Link "Vedi tutte" nel NotificationCenter:** Footer del dropdown che porta a `/notifications`.
- **Nuovi file:** `src/lib/hooks/useRealtimeNotifications.ts`, `src/lib/hooks/useOsNotifications.ts`, `src/lib/hooks/useFaviconBadge.ts`, `src/lib/hooks/useNotificationSound.ts`, `src/lib/hooks/useNotificationCleanup.ts`, `src/lib/hooks/useGoalNotifications.ts`, `src/features/notifications/pages/NotificationsPage.tsx`
- **File modificati:** `src/shared/layouts/MainLayout.tsx`, `src/shared/ui/NotificationCenter.tsx`, `src/app/providers/SyncProvider.tsx`, `src/app/router.tsx`, `src/app/protectedRouteConfig.tsx`, `.spec/ARCHITECTURE.md`, `.spec/UI_UX_SPEC.md`, `.spec/PRD.md`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓.

## [v0.40.0] - 2026-06-24
### Stato: Enhanced Notifications System — persistente, categorizzato, personalizzabile
- **[MAJOR] Nuovo sistema notifiche persistente:** Creata tabella `notifications` (DB migration 024) con 8 categorie, RLS, indici. Nuove RPC: `mark_notification_read`, `dismiss_notification`, `mark_all_notifications_read`, `cleanup_notifications`, `get_unread_notification_counts`. Aggiunte colonne `notification_preferences` (JSONB per-categoria) e `backup_reminder_interval_days` a `user_settings`.
- **[MINOR] Nuovo hook useNotifications:** TanStack Query con polling 60s, hooks derivati per mark-read/dismiss/create/mark-all-read. `useUnreadNotificationCounts` per badge in tempo reale.
- **[MINOR] NotificationService (notificationService.ts):** Factory lato client con `checkAndCreateDeadlineNotifications`, `checkAndCreateInvoiceNotifications`, `checkAndCreateBackupNotification` — chiamate all'apertura del centro notifiche.
- **[MINOR] NotificationCenter riscritto:** Dropdown persistente da DB con badge contatore (9+), filtri per categoria (pill buttons), azioni mark-read/dismiss individuali, bottone "Leggi tutto", timestamp relativi, stato caricamento/vuoto.
- **[MINOR] BackupReminder migliorato:** Nuove opzioni snooze (1 giorno, 3 giorni, più tardi). Intervallo configurabile in Impostazioni.
- **[MINOR] Impostazioni notifiche potenziate:** 8 toggle per-categoria (Scadenze lavori, Fatture scadute, Backup, Sincronizzazione, Obiettivi, Preventivi, Spese elevate, Sistema). Nuovo select per intervallo promemoria backup.
- **Nuovi file:** `src/lib/hooks/useNotifications.ts`, `src/lib/notificationService.ts`, `supabase/migrations/20260624000001_notifications_system.sql`
- **File modificati:** `src/types/database.ts`, `src/shared/ui/NotificationCenter.tsx`, `src/shared/ui/BackupReminder.tsx`, `src/features/settings/pages/SettingsPage.tsx`, `src/lib/hooks/useUserSettings.ts`, `.spec/SCHEMA.md`, `.spec/ARCHITECTURE.md`, `.spec/UI_UX_SPEC.md`, `.spec/PRD.md`
- **Build:** `npx tsc --noEmit` — verificare.

## [v0.38.0] - 2026-06-24
### Stato: Dashboard — nuovi colori saldo, layout metriche verticali, fix pending dark mode
- **[MINOR] Nuovi colori base dashboard:** Sostituito `--color-success` da `#00B894` a `#009C13` (verde) e `--color-expense` da `#FF6B6B` a `#E32400` (rosso) in `index.css`. Il saldo ora si colora dinamicamente: verde (`text-success`) se >= 0, rosso (`text-expense`) se negativo.
- **[PATCH] Pending color dark mode:** `--color-pending` in `.dark` cambiato da `148 163 184` (grigio chiaro) a `50 55 60` (grigio scuro, uguale alla light mode) per leggibilità.
- **[MINOR] Layout metriche KPI ridisegnato:** Le 8 metriche ora sono raggruppate in 4 coppie verticali: Lordo In Attesa/Lordo, Netto In Attesa/Netto, Cash In Attesa/Cash, Uscite/Saldo. Nuove label: "Lordo In Attesa" (ex "In Attesa"), "Lordo" (ex "Incassati"), "Netto In Attesa" (ex "Netti In Attesa"), "Netto" (ex "Netti Incassati"), "Cash" (ex "Cash Incassati").
- **[PATCH] Animazione cambio tab sidebar e bottom bar:** Aggiunta animazione spring con Framer Motion `layoutId` — il pill di sfondo attivo (`bg-brand`) ora scivola fluidamente tra le voci di navigazione al cambio tab, sia nella sidebar desktop che nella bottom bar mobile. Parametri spring: `stiffness 380, damping 30`. Allineato `transition-colors` a `duration-300` (come da UI_UX_SPEC).
- **File modificati:** `src/index.css`, `src/features/dashboard/components/KPIGroup.tsx`, `src/features/dashboard/pages/DashboardPage.tsx`, `src/shared/layouts/Sidebar.tsx`, `src/shared/layouts/BottomBar.tsx`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓

## [v0.37.1] - 2026-06-24
### Stato: Fix 400 su /token dopo conferma email — PKCE flow e redirectTo
- **[FIX] 400 su /token dopo conferma email:** Aggiunto `emailRedirectTo: \`${window.location.origin}/auth/callback\`` in `signUp()` (`AuthProvider.tsx:82`) — il PKCE verifier ora corrisponde all'origine corretta. Aggiunta nuova rotta `/auth/callback` con `AuthCallbackPage` per gestire esplicitamente il redirect post-conferma. Aggiornato `auth_config.json` — `uri_allow_list` include ora `http://localhost:5173` e `http://localhost:5173/auth/callback`. Fixata race condition in `AuthProvider` useEffect: se l'URL contiene un codice auth (`?code=` o `#access_token=`), `isLoading` rimane `true` finché `onAuthStateChange` non completa lo scambio PKCE.
- **Root cause:** `signUp()` chiamava Supabase senza `redirectTo`, quindi il link di conferma usava `SITE_URL` (`netflow-v3.pages.dev`). In sviluppo locale il PKCE verifier era salvato su `localhost:5173` ma il redirect andava su produzione, causando il fallimento dello scambio del codice (400 su `/auth/v1/token`).
- **[PATCH] AuthCallbackPage mostra schermata di conferma:** Sostituito auto-redirect a `/login` con una schermata di conferma visiva ("Email confermata!") + bottone manuale "Vai al login". La nuova tab non esegue redirect automatici — l'utente la chiude e resta sulla tab originale.
- **[FIX] HomeRedirect preserva auth params:** Se la rotta `/` contiene `?code=` o `#access_token=`, invece di fare `<Navigate to="/dashboard">` (perdendo i parametri), reindirizza a `/auth/callback?code=...` preservandoli. Gestisce le vecchie email di conferma che puntano alla `SITE_URL` nuda.
- **File modificati:** `src/app/providers/AuthProvider.tsx`, `src/app/router.tsx`, `src/features/auth/pages/AuthCallbackPage.tsx` (new), `auth_config.json`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ✓

## [v0.37.0] - 2026-06-23
### Stato: Ottimizzazioni Supabase, Fix PDF e QR Code, Personalizzazioni Colori
- **[PATCH] Ottimizzazione Auth Query:** Sostituiti tutti i richiami a `auth.getUser()` (che generavano continue chiamate di rete al server di autenticazione Supabase) con `auth.getSession()` (che sfrutta la sessione memorizzata in locale). Ottimizzati gli hook: `useInvoices`, `useExpenses`, `useLedgerData`, `useFiscalSetup`, `useUserSettings`, `useCreateInvoiceWithJobs`, `useDashboardData` e la pagina `SettingsPage.tsx`. Risparmiati oltre 10+ roundtrip di rete ad ogni avvio/aggiornamento dell'applicazione.
- **[FIX] Fix Realtime Memory Leak:** Risolto un potenziale memory leak in `useRealtimeSync.ts` modificando la gestione del canale di cleanup. La disconnessione dei canali di sottoscrizione viene ora tracciata e invocata correttamente anche se il componente si smonta prima della risoluzione asincrona della sessione.
- **[FIX] Generazione PDF:** Sostituiti i font `.woff2` remoti di `fontsource` con font `.ttf` stabili forniti tramite Google Fonts static CDN all'interno di `InvoiceDocument.tsx`, risolvendo il blocco asincrono del metodo `.toBlob()` di `@react-pdf/renderer` che impediva il download del documento nei browser moderni. Aggiunto logging degli errori in console.
- **[FIX] QR Code Fatture:** Sostituita la libreria `QRCodeLib.toCanvas` con `QRCodeLib.toDataURL` in `InvoiceQRCode.tsx` per generare direttamente l'immagine Base64 in memoria, eliminando i problemi di render su canvas non ancora montato e visualizzando correttamente i QR code.
- **[PATCH] Personalizzazione Colori Dashboard:** Ricolorati in nero gli elementi e i valori di *Entrate totali*, *Uscite totali* e *Saldo netto* nel pannello dell'Andamento Economico di `DashboardPage.tsx` per uniformarli al design richiesto.
- **[PATCH] Contrasto Valori in Attesa:** Scurita la tonalità del grigio associato alla variabile `--color-pending` in `index.css` portandola da `99 110 114` a `50 55 60` in modalità chiara per migliorare la leggibilità e il contrasto dei valori a zero/in attesa sulla dashboard.
- **File modificati:** `src/features/dashboard/components/ProgressRings.tsx`, `src/features/dashboard/hooks/useDashboardData.ts`, `src/features/dashboard/pages/DashboardPage.tsx`, `src/features/invoicing/components/InvoiceList.tsx`, `src/features/settings/pages/SettingsPage.tsx`, `src/index.css`, `src/lib/pwaRegistration.ts`, `src/shared/ui/InvoiceDocument.tsx`, `src/shared/ui/InvoiceQRCode.tsx`
- **Build:** `npm run build` — ✓ Build completata con successo.

## [v0.36.0] - 2026-06-23
### Stato: Rimozione Tag, nuova pagina Personalizzazione, nuova pagina Aiuto/FAQ, fix UI
- **[MINOR] Rimossa funzionalità Tag:** Eliminata completamente la feature dei tag dall'applicazione. Rimossi: `src/features/tags/TagsManager.tsx`, `src/lib/hooks/useTags.ts`, interfacce `Tag`/`JobTag`/`ExpenseTag` da `database.ts`. Rimosso blocco Tag dalla sezione Profilo in `SettingsPage.tsx`, rimossa voce `tags` dall'esportazione dati GDPR e dalla descrizione pulizia account.
- **[MINOR] Nuova pagina Personalizzazione (`/customization`):** Aggiunta pagina dedicata alla personalizzazione dell'app con tre sezioni: riorganizzazione drag-and-drop della sidebar, sistema di personalizzazione dei colori/tema, selezione del tema (spostato da Impostazioni). Voce aggiunta in sidebar e bottom bar sopra Impostazioni.
- **[MINOR] Nuova pagina Aiuto/FAQ (`/help`):** Aggiunta pagina Centro Aiuto con FAQ accordion espandibile (6 domande frequenti su calcoli fiscali, condivisione, PDF/fatture, offline, sicurezza dati, spese), form di contatto che apre il client email con `mailto:giorgiocalleriall@gmail.com` pre-compilato (tipo richiesta: bug/feature/altro), card GDPR e badge PWA offline. Voce aggiunta in sidebar e bottom bar sotto Impostazioni.
- **[PATCH] Router:** Aggiunte route `/customization` e `/help` in `router.tsx` e `protectedRouteConfig.tsx`.
- **[PATCH] Fix import inutilizzato HelpPage:** Rimosso `MessageSquare` da lucide-react (causava errore `TS6133` e bloccava la build).
- **[PATCH] ClientSelect UI:** Migliorato stile glassmorphism del dropdown di selezione cliente nel form lavori — bordi sfumati, transizioni icona, evidenziazione elemento selezionato coerente.
- **[FIX] Fix tema ThemeProvider:** Allineato il provider del tema alla nuova pagina Personalizzazione.
- **[FIX] Sidebar e BottomBar:** Aggiornate con i nuovi link a Personalizzazione e Aiuto; rimossa voce changelog deprecata.
- **[FIX] InvoiceDocument / InvoiceQRCode:** Aggiornamenti minori componenti fattura/QR code.
- **File modificati:** `src/features/settings/pages/SettingsPage.tsx`, `src/features/help/pages/HelpPage.tsx` (new), `src/features/customization/pages/CustomizationPage.tsx` (new), `src/lib/stores/customization.ts` (new), `src/app/router.tsx`, `src/app/protectedRouteConfig.tsx`, `src/app/providers/ThemeProvider.tsx`, `src/shared/layouts/Sidebar.tsx`, `src/shared/layouts/BottomBar.tsx`, `src/shared/ui/InvoiceDocument.tsx`, `src/shared/ui/InvoiceQRCode.tsx`, `src/features/jobs/components/ClientSelect.tsx`, `src/types/database.ts`
- **File eliminati:** `src/features/tags/TagsManager.tsx`, `src/lib/hooks/useTags.ts`
- **Build:** `npm run build` — ✓ 0 errori TypeScript. PWA precache 58 entries.

## [v0.35.1] - 2026-06-23

### Stato: Miglioramenti grafici ClientSelect e piccoli fix UI
- **[PATCH] ClientSelect styling:** Migliorato il componente di selezione cliente con stile glassmorphism avanzato, bordi sfumati/attivi, transizioni sull'icona e evidenziazione coerente dell'elemento selezionato.
- **[PATCH] JobFormModal:** Cambiata l'etichetta del campo "Data attesa pag." in "Scadenza pag." e migliorata la spaziatura del grid a 3 colonne delle tempistiche.
- **[PATCH] QuotesPage layout:** Gestito correttamente il fallback per il nome cliente vuoto (`\u00A0`) nella card per prevenire shift di layout durante il caricamento o in assenza di dati.
- **File modificati:** `src/features/jobs/components/ClientSelect.tsx`, `src/features/jobs/components/JobFormModal.tsx`, `src/features/quotes/pages/QuotesPage.tsx`
- **Build:** `npx tsc --noEmit` — 0 errori.

## [v0.35.0] - 2026-06-23
### Stato: Preventivi con calcolo fiscale — netto/lordo, cash/carta/misto, regime fiscale
- **[MAJOR] Preventivi con modello fiscale completo:** Il form preventivo ora usa lo stesso calcolo fiscale dei lavori — `netToGross`/`grossToNet`/`computeJobNetAmount` in base al regime fiscale (`tax.ts`). Aggiunti campi: `payment_method`, `amount_card`, `amount_cash`, `include_cash_in_invoice`. Il netto e il lordo sono bidirezionali (modificando uno si aggiorna l'altro). Preimpostato in base al regime fiscale dell'utente (`useFiscalSetup`).
- **[HIGH] Nuova migration 023:** `20260623000007_add_payment_method_to_quotes.sql` — aggiunte colonne `payment_method`, `amount_card`, `amount_cash`, `include_cash_in_invoice` alla tabella `quotes`.
- **[HIGH] Conversione preventivo → lavoro migliorata:** `useConvertQuoteToJob` ora passa tutti i dati di pagamento (`payment_method`, `amount_card`, `amount_cash`, `include_cash_in_invoice`, `net_amount`) al nuovo lavoro.
- **[FIX] Auto-preventivo su creazione lavoro:** Aggiornato per usare i nuovi campi (`payment_method`, `amount_card`, `amount_cash`, `include_cash_in_invoice`, `net_amount`).
- **File modificati:** `src/features/quotes/pages/QuotesPage.tsx`, `src/lib/hooks/useQuotes.ts`, `src/types/database.ts`, `src/features/jobs/pages/JobsPage.tsx`, `.spec/SCHEMA.md`
- **Build:** `npx tsc --noEmit` — 0 errori.

## [v0.34.6] - 2026-06-23
### Stato: Fix 403 creazione clienti — audit_log RLS policies mancanti
- **[CRITICAL] Fix 403 creazione clienti — audit_log RLS:** Migrazione 022 (`20260623000006_fix_audit_log_rls.sql`). La tabella `audit_log` aveva RLS attivo ma solo una policy `FOR SELECT`. Il trigger `audit_clients` (e `audit_jobs`, `audit_invoices`, `audit_expenses`, `audit_quotes`) tentava di inserire in `audit_log` ma veniva bloccato da RLS, causando 403 su ogni INSERT/UPDATE/DELETE delle tabelle tracciate. Aggiunte policy `INSERT`, `UPDATE`, `DELETE` con `auth.uid() = user_id`.
- **Build:** `npx tsc --noEmit` — 0 errori.

## [v0.34.5] - 2026-06-23
### Stato: Fix 403 preventivi/lavori/fatture — auth.uid() diretto su tutte le RLS
- **[CRITICAL] Fix 403 preventivi, lavori, fatture — auth.uid() diretto:** Migrazione 021 (`20260623000005_fix_all_rls_authuid.sql`). Le policy RLS di `quotes`, `jobs` e `invoices` usavano ancora `(select auth.uid())` (subquery introdotta in migration 019), che in alcuni progetti Supabase restituisce NULL causando 403 su ogni operazione. Sostituito con `auth.uid()` diretto — stessa fix di migration 020 per `clients`. **File:** `supabase/migrations/20260623000005_fix_all_rls_authuid.sql`
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ok.

## [v0.34.4] - 2026-06-23
### Stato: Fix 403 creazione preventivi, 400 condivisione, query builder sicuro, fix 403 clienti
- **[CRITICAL] Fix 403 clienti — auth.uid() diretto:** Migrazione 020 (`20260623000004_fix_clients_rls_authuid.sql`). Le policy RLS usavano `(select auth.uid())` come subquery (fix warning Supabase advisor introdotto in migrazione 005), che in alcuni progetti Supabase può restituire NULL. Sostituito con `auth.uid()` diretto — pattern originale della migrazione 001. **File:** `supabase/migrations/20260623000004_fix_clients_rls_authuid.sql`
- **[MEDIUM] Session check preventivo in useCreateClient:** Aggiunta verifica `supabase.auth.getSession()` prima dell'insert. Se la sessione è scaduta, mostra messaggio "Sessione scaduta. Effettua di nuovo il login." invece del 403 generico. **File:** `src/lib/hooks/useClients.ts`
- **[MEDIUM] Logging errori in ClientsPage:** Il toast di errore ora mostra il messaggio reale dell'errore (invece di "Errore durante il salvataggio" generico) + `console.error` del dettaglio. **File:** `src/features/clients/pages/ClientsPage.tsx`
- **[CRITICAL] Fix condivisione — get_shared_data 400:** Migrazione 018 (`20260623000002_fix_get_shared_data.sql`) corregge la funzione RPC `get_shared_data`. **Root cause:** `ORDER BY j.created_at DESC` era posto FUORI dall'aggregato `jsonb_agg`, causando l'errore PostgreSQL 42803 _"column j.created_at must appear in the GROUP BY clause or be used in an aggregate function"_. Fix: spostato `ORDER BY` DENTRO `jsonb_agg(... ORDER BY col)`. Tutte e 5 le subquery (jobs, clients, invoices, expenses, quotes) sono state corrette. Migrazione 016 (`20260622000005_shared_data_rpc.sql`) aggiornata come source of truth.
- **[HIGH] Fix 403 preventivi + clienti — RLS reset:** Migrazione 019 (`20260623000003_ensure_rls_policies.sql`) droppa e ricrea tutte le policy RLS per `clients`, `quotes`, `jobs`, `invoices` con policy esplicite `FOR SELECT`/`FOR INSERT`/`FOR UPDATE`/`FOR DELETE` e target `TO authenticated`. La precedente policy unica `quotes_user_isolation` (senza `FOR` clause) è stata sostituita da 4 policy separate per operazione.
- **[MEDIUM] Fix useCreateQuote:** Aggiunto `executeWithSync` wrapper, guard `if (!user) throw new Error('Not authenticated')`, e `onSettled` con check `OfflineQueuedError` — allineato a `useCreateClient`. **File:** `src/lib/hooks/useQuotes.ts`.
- **[MEDIUM] Fix useQuotes crash su user null:** Spostata costruzione query Supabase dentro `queryFn` invece di farla durante il render — eliminato `user!` che causava TypeError se `user = null` al primo render. La query ora costruisce `.eq('user_id', user.id)` solo dopo il guard `if (!user)`. **File:** `src/lib/hooks/useQuotes.ts`.
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ok.

## [v0.34.3] - 2026-06-23
### Stato: Fix route warnings e 403 creazione clienti
- **[FIX] Route warnings "Matched leaf route" definitivo:** Sostituito il pattern `<Route element={<ProtectedRoute />}>` layout-route (che causava i warning in React Router v7) con `AuthGate` wrapper esplicito su ogni rotta protetta in `src/app/router.tsx`. Ogni `<Route>` ha ora un `element` diretto (`<AuthGate><Suspense ...><Page /></Suspense></AuthGate>`) — non più layout route con Outlet condizionale. `MainLayout` in `src/shared/layouts/MainLayout.tsx` accetta `children` opzionali con fallback a `<Outlet />`.
- **[FIX] 403 creazione clienti:** Sostituito `supabase.auth.getUser()` con `useAuth()` context in `src/lib/hooks/useClients.ts`. Le query/mutation ora usano il `user` dal React context invece di chiamare l'API Auth (che può restituire un token divergente dal JWT usato nella richiesta REST, causando mismatch RLS). Query key aggiornato a `['clients', user?.id]` con `enabled: !!user`.
- **Root cause route warnings:** React Router v7 emette il warning "Matched leaf route at location ... does not have an element or Component" quando un layout route (`<Route element={<ConditionalComponent />}>`) con `children` generati via `.map()` viene renderizzato — il nodo foglia non ha un `element` esplicito assegnato.
- **Root cause 403 clienti:** `supabase.auth.getUser()` fa una validazione JWT via rete che può forzare un refresh del token; la richiesta `insert()` successiva può usare un token diverso da quello validato, causando `auth.uid() != user_id` in RLS.
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run build` — ok.

## [v0.34.1] - 2026-06-23
### Stato: Fix pagine vuote nelle transizioni — rimosso AnimatePresence, key-based motion.div
- **[FIX] Pagine vuote su cambio rotta:** Rimosso `AnimatePresence mode="wait"` e conditional rendering che causava pagine bianche durante le transizioni. Sostituito con `motion.div key={location.pathname}` + spring entrance (`opacity: 0→1, x: 30→0`). Quando il `key` cambia, React smonta immediatamente la vecchia pagina (nessun exit) e monta la nuova con entrance animation — zero pagine vuote.
- **[DOC] ARCHITECTURE.md, UI_UX_SPEC.md:** Aggiornate sezioni Page Transitions.
- **Build:** `npx tsc --noEmit` — 0 errori. `npm run lint` — 0 warnings. `npm run build` — ok.

## [v0.34.0] - 2026-06-23
### Stato: Riordine form creazione lavori, code-split, fix shares RLS, rimossa pagina Changelog
- **[HIGH] Code-split InvoicingPage:** Aggiunti chunk `vendor-pdf` e `vendor-qrcode` in `vite.config.ts`. InvoicingPage passa da 1.5MB a 20.9KB. `@react-pdf/renderer` (1.46MB) ora è caricato in chunk separato e cached indipendentemente.
- **[MEDIUM] Fix ESLint warning react-refresh:** Spostato componente `InvoiceDocument` in `src/shared/ui/InvoiceDocument.tsx`. `pdfInvoice.tsx` ora esporta solo `generateInvoicePdf` (funzione pura) — risolto warning "Fast refresh only works when a file only exports components".
- **[HIGH] Fix condivisione — shares RLS:** Creata migration 017 (`20260623000001_fix_shares_rls.sql`) che aggiunge policy INSERT, UPDATE, DELETE mancanti sulla tabella `shares`. La migration 015 (fix_supabase_warnings) aveva sostituito la policy multi-operazione con una sola `FOR SELECT`, bloccando creazione/eliminazione link con 403.
- **[MEDIUM] Realtime error handling:** Aggiunto callback `.subscribe((status, err) => ...)` in `useRealtimeSync.ts` per loggare errori di connessione WebSocket senza crash silenziosi.
- **[DOC] SCHEMA.md:** Aggiornata sezione 2.12 `shares` con le 4 policy corrette (SELECT/INSERT/UPDATE/DELETE).
- **[LOW] Rimossa pagina Changelog:** Rimossa tab `/changelog` da sidebar e router. Eliminato file `ChangelogPage.tsx`. La versione (`v{__APP_VERSION__}`) resta visibile nel footer della sidebar.
- **[MEDIUM] Riordinato form creazione lavoro:** Nuovo ordine sezioni: Dati Principali → Tempistiche (date ordinate) → Tipo di Pagamento (solo metodo + toggle contanti, senza importi) → Dati Fiscali (netto+lordo) → Valuta (solo select, rimossi allegati). Per pagamento Carta: solo selezione metodo, importo gestito da Dati Fiscali. Per Contanti/Misto: split importi visibile solo per Misto, checkbox "Includi contanti in fattura" con testo `Solo 0 € sarà in fattura. Il contanti sarà tracciato internamente.`
- **[FIX] Ricalcolo netto su toggle contanti:** Aggiunto `useEffect` che ricalcola `net_amount` tramite `computeJobNetAmount` quando l'utente attiva/disattiva "Includi contanti in fattura". Se spunta attiva → netto = lordo con deduzione fiscale. Se disattiva → netto = lordo (solo tracciamento interno, nessuna deduzione). Funziona per pagamenti Contanti e Misti.
- **[FIX] LedgerStats colori neutri:** Tutti i valori numerici delle statistiche Registro (Lavori incassati, Totale lordo, carta, contanti, Media) ora usano `text-text-primary` al posto dei colori brand/azzurro/verde — coerente con il resto dell'app.
- **[FIX] Transizioni pagina consistenti:** Risolto bug con `AnimatePresence` — `Outlet` re-renderizza con la nuova pagina durante l'exit, causando animazioni saltate/assenti. Rimpiazzato con **conditional rendering per pathname** dentro `AnimatePresence`: il componente uscente non è più nell'albero React, quindi Framer Motion congela il suo contenuto → la vecchia pagina resta visibile durante l'exit. Estratte route protette in `protectedRouteConfig.tsx`, spostato `ProtectedRoute` da wrapper a componente che restituisce `<MainLayout />`. Aggiunto `PageLoader.tsx` in shared. Riordinato router: redirect `/ → /dashboard` prima del layout route pathless.
- **[REFACTOR] protectedRouteConfig + PageLoader:** Creata configurazione centralizzata delle route protette in `src/app/protectedRouteConfig.tsx` per evitare duplicazione route tra router e layout. Spostato `PageLoader` in `src/shared/ui/PageLoader.tsx`.
- **Build verificata:** `npx tsc --noEmit` — 0 errori. `npm run build` — ok. `npm run lint` — 0 warnings, 0 errori. `npx vitest run` — 4/4 test passanti.

## [v0.33.7] - 2026-06-23
### Stato: Bug fix — crash AttachmentsField su nuovo lavoro
- **Bug fix:** Aggiunti `attachment_urls` e `currency` mancanti nei `reset()` di `JobFormModal.tsx` — causavano `undefined` che rompeva `urls.length` in `AttachmentsField`.
- **Bug fix:** Reso `urls` opzionale in `AttachmentsField` con fallback a `[]`.

## [v0.33.6] - 2026-06-23
### Stato: UI Fix — ProgressRings grandezza stabile nei tab
- **UI Fix:** Aggiunto `min-h-[120px]` al container dei ring in `ProgressRings.tsx` per evitare che la card cambi altezza cambiando tab (Tutto/Lordo/Netto/Cash).

## [v0.33.5] - 2026-06-23
### Stato: UI Fix — Fatturazione allineata a Clienti + auto-preventivo corretto
- **UI Fix:** Rimosso wrapper `GlassCard` dallo stato vuoto di `PendingJobsList` — ora usa `EmptyState` come Clienti/Preventivi.
- **UI Fix:** Bottone "Crea fattura" nascosto quando il form è aperto (coerente con Clienti).
- **Fix auto-preventivo:** Calcolo IVA corretto nella creazione automatica del preventivo alla creazione di un lavoro. Ora usa aliquota IVA 22% standard invece del calcolo errato lordo-netto fiscale.
- **UX:** Toast "Lavoro creato con preventivo" quando il preventivo viene generato automaticamente.

## [v0.33.4] - 2026-06-23
### Stato: UI Fix — pagina Preventivi allineata a Clienti
- **UI Fix:** Rimosso wrapper `GlassCard` dallo stato vuoto della pagina Preventivi — ora identico a Clienti.
- **UI Fix:** Bottone "Nuovo Preventivo" nascosto quando il form è aperto (coerente con Clienti).

## [v0.33.3] - 2026-06-23
### Stato: UI Fix — tabs filtro Stato Attività centrate
- **UI Fix:** Centrate le tabs filtro (Tutto/Lordo/Netto/Cash) nella card "Stato Attività" della dashboard. Aggiunto `justify-center` al container delle tabs in `ProgressRings.tsx`.
- **Spec:** Aggiornata `UI_UX_SPEC.md` con indicazione esplicita tabs centrati per ProgressRings, GoalTracker e Job Tab Filtri.

## [v0.33.2] - 2026-06-23
### Stato: Fix UI — header Preventivi allineato a Clienti, bottone ridondante rimosso
- **UI Fix:** Header pagina Preventivi aggiornato per copiare lo stile della pagina Clienti — titolo `<h2>` con sottotitolo descrittivo e bottone responsive.
- **UI Fix:** Rimosso bottone ridondante "+ Crea Preventivo" dallo stato vuoto della pagina Preventivi — ora esiste solo il bottone nell'header.

## [v0.33.1] - 2026-06-23
### Stato: Rimossi bordi divider — sidebar, header, bottom bar
- **UI Fix:** Rimossi tutti i bordi divider (`border-r`, `border-b`, `border-t`) da `Sidebar`, `MainLayout` e `BottomBar`. Il sito ora usa solo sfondi semi-trasparenti e ombre per separare le sezioni, senza linee visibili in dark e light mode.

## [v0.33.0] - 2026-06-22
### Stato: Condivisione funzionante + Regole automatiche AI — SharedViewPage + SCHEMA.md aggiornato
- **Regole AI:** Creato `opencode.json` con `instructions` → `.spec/rules.md`. Ogni sessione ora carica automaticamente le regole: aggiornare CHANGELOG.md a ogni modifica, rispettare tutti i file `.spec/`, verificare TSC/build/test prima di concludere.
- **References:** `.spec/` aggiunto come reference `@spec` per accesso rapido ai file di specifica.
- **Migrazione DB #016:** Nuovo RPC `get_shared_data(token)` SECURITY DEFINER — valida token/scadenza, restituisce profilo + lavori + fatture + clienti + uscite + preventivi dell'utente. GRANT EXECUTE ad anon per accesso pubblico.
- **Condivisione commercialista (#10):** Creata `SharedViewPage` — pagina pubblica su `/shared/:token` con dashboard read-only (stats card, lista lavori/fatture/preventivi, griglia clienti/uscite). Gestione errori per token invalido o scaduto.
- **Router:** Route `/shared/:token` aggiunta come rotta pubblica (nessun auth richiesto).
- **Router:** Tool route `/tool/:toolId` rimossa (feature drop).
- **SCHEMA.md:** Completato con tutte le tabelle mancanti — `tags`, `job_tags`, `expense_tags`, `quotes`, `audit_log`, `shares`, `custom_events`, `expenses`, `fiscal_setups`, storage bucket `attachments`, RPC `delete_user_account`/`clean_user_data`/`get_shared_data`. Nuove colonne: `attachment_urls`, `currency`, `color`, `exchange_rate`, `custom_irpef_rate`. Tipi TypeScript portati da 12 a 21 interfacce, enum `quote_status` aggiunto.
- **UI Fix:** Rimosso `bg-surface/60 backdrop-blur-xl` duplicato da `EmptyState` — eliminato effetto bordo bianco quando annidato dentro `GlassCard`.
- **Build verificata:** `npx tsc --noEmit` — 0 errori. `npm run build` — 52 precache entries.

## [v0.32.1] - 2026-06-22
### Stato: Security hardening — warning Supabase risolti
- **Migrazione DB #015:** Fix warning Supabase lint:
  - `public_bucket_allows_listing`: SELECT su storage scoped per user (attachments + logos)
  - `anon_security_definer_function_executable`: REVOKE EXECUTE da anon su tutti gli RPC SECURITY DEFINER non necessari
  - `handle_updated_at`: rimosso SECURITY DEFINER (trigger function)
  - `auth_rls_initplan` (expenses): RLS riscritte con `(select auth.uid())` al posto di `auth.uid()` diretto
  - `multiple_permissive_policies` (shares): unificate `shares_user_isolation` + `shares_token_access` in singola policy `shares_select`
- **UI Fix:** Rimosso bordo da `GlassCard` e `EmptyState`. Sostituiti `bg-white/5` → `bg-surface`, `hover:bg-white/5` → `hover:bg-surface/80`, `ring-white` → `ring-brand`, boxShadow inline → `border-border`. Hardcoded hex (`#FDCB6E`, `#00B894`, `#F59E0B`, `#00D2FF`) → token tema (`text-pending`, `text-success`, `text-brand/70`). Coerenza visiva cross-tema.
- **Build verificata:** `npx tsc --noEmit` — 0 errori. `npm run build` — OK.
- **Test:** `npx vitest run` — 4/4 test passanti.
- **Versione:** v0.32.1

## [v0.32.0] - 2026-06-22
### Stato: UX avanzata — Eventi calendario, auto-preventivo, navigazione ottimizzata
- **[MEDIUM] Eventi calendario manuali:** Nuova tabella `custom_events` con RLS. Pulsante "Nuovo evento" in pagina `/calendar` e nel dettaglio giorno. Modal con titolo, descrizione, data, colore. Eliminazione immediata. `useCustomEvents` hook.
- **[MEDIUM] Auto-preventivo su lavoro:** Alla creazione di un lavoro in `/jobs`, viene generato automaticamente un preventivo (stato bozza) con gli stessi importi lordo/netto, cliente e aliquota. Best-effort — non blocca la creazione del lavoro.
- **[LOW] Sidebar/BottomBar riordinate:** Nuovo ordine: Dashboard → Lavori → Clienti → Preventivi → Fatture → Uscite → Calendario → Registro. Impostazioni spostato sotto il nav (sopra Esci).
- **[HIGH] Account management potenziato:** RPC `delete_user_account` — elimina `auth.users` con cascata su tutte le tabelle (distruzione totale account). RPC `clean_user_data` — cancella tutti i dati (lavori, fatture, clienti, spese, preventivi, tag, audit, shares, eventi) mantenendo il profilo attivo. Doppia conferma per entrambi.
- **Migrazione DB #014:** Tabella `custom_events` + RPC `delete_user_account` + RPC `clean_user_data`
- **Dipendenze aggiunte:** nessuna
- **Build verificata:** `npx tsc --noEmit` — 0 errori. `npm run build` — 55 precache.
- **Test:** `npx vitest run` — 4/4 test passanti.
- **Versione:** v0.32.0

## [v0.31.0] - 2026-06-22
### Stato: Feature Expansion — 15 nuove funzionalità
- **[MAJOR] Migrazione DB #12:** Nuove tabelle `tags`, `job_tags`, `expense_tags`, `quotes`, `audit_log`, `shares`. Colonne `attachment_urls` e `currency` su jobs/expenses/invoices. Trigger audit su 5 tabelle. RLS per tutte le nuove tabelle.
- **[HIGH] Preventivi (#4):** Nuova pagina `/quotes` con CRUD completo. Stati: bozza/inviato/accettato/rifiutato/convertito. Conversione 1-click in lavoro. Calcolo automatico IVA. Numerazione automatica.
- **[HIGH] Tag & Filtri (#15):** Nuovo `TagsManager` in Impostazioni. Colori personalizzabili. Filtri per tag su lavori e spese. Tag selector embeddable.
- **[HIGH] Audit Trail (#16):** Tabella `audit_log` popolata da trigger PostgreSQL su INSERT/UPDATE/DELETE per jobs, invoices, clients, expenses, quotes. Viewer in Impostazioni.
- **[HIGH] Ricerca Globale Cmd+K (#5):** Nuova `CommandPalette` accessibile via ⌘K/ctrl+K. Ricerca full-text in lavori, clienti, fatture, spese. Navigazione rapida con tastiera.
- **[HIGH] PDF Fatture (#1):** Generazione PDF lato client con `@react-pdf/renderer`. Template professionale con logo, dati mittente/cliente, dettaglio lavori, IVA. Download diretto dalla lista fatture.
- **[HIGH] QR Code fatture (#18):** QR code dinamico per ogni fattura contenente dati di pagamento. Scaricabile come PNG. Visualizzabile direttamente nella card fattura.
- **[MEDIUM] Calendario Scadenze (#3):** Nuova pagina `/calendar`. Vista mensile con eventi da `pending_date`, `end_date`, `due_date`. Giorni con scadenze evidenziati. Dettaglio click sul giorno.
- **[MEDIUM] Condivisione Commercialista (#10):** Gestione link di condivisione in Impostazioni. Accesso view-only o view+export. Scadenza configurabile. Copia link con un click.
- **[MEDIUM] Allegati/Documenti (#8):** Colonna `attachment_urls` (JSONB) su jobs e expenses. Pronta per storage Cloudflare R2 tramite link firmati.
- **[MEDIUM] Multi-Valuta (#14):** Colonna `currency` su jobs, invoices, expenses, quotes. Utility `exchangeRate.ts` con caching 12h. Supporto EUR/USD/GBP/CHF. `CurrencySelect` component.
- **[MEDIUM] GDPR Avanzato (#20):** Tab Privacy in Impostazioni potenziata con portabilità dati (download JSON completo) e cancellazione account (2-step confirm).
- **[LOW] Sidebar/BottomBar aggiornate:** Aggiunte voci Preventivi e Calendario alla sidebar desktop e bottom bar mobile.
- **[LOW] Header:** Aggiunto pulsante Cerca (⌘K) nell'header accanto a Guida Fiscale.
- **Dipendenze aggiunte:** `@react-pdf/renderer`, `qrcode`, `date-fns` + `@types/qrcode`
- **Build verificata:** `npx tsc --noEmit` — 0 errori. `npm run build` — OK.
- **Test:** `npx vitest run` — 4/4 test passanti.
- **Versione:** v0.31.0

## [v0.30.1] - 2026-06-22
### Stato: ProgressRings ottimizzazione spazio — layout compatto e info più dense
- **[MEDIUM] Header compatto:** Titolo "Stato Attivita" + percentuale goal affiancati in una riga con `flex justify-between`, eliminato spazio centrato del cerchio workload.
- **[MEDIUM] Layout workload orizzontale:** Cerchio workload (56px) + 3 status counter (Attivi/In attesa/Incassati) affiancati con `flex gap-3 items-center` + `grid-cols-3`. Occupa meno spazio verticale.
- **[MEDIUM] StatusItem più leggibile:** Dimensioni testo `text-base` per valori e `text-[10px]` per label, padding `py-2 px-1`, gap generoso tra icone e testo.
- **[LOW] Pill buttons più spaziose:** `px-2.5 py-1` per click più comodo su mobile e desktop.
- **[LOW] Metriche singole più grandi:** Anello 64px (vs 55px precedenti) quando si seleziona una singola metrica (Lordo/Netto/Cash), più spazio per info importi.
- **[LOW] Progress bar semplificata:** Rimossa label "Progresso" ridondante, barra `h-2` più visibile.
- **Build verificata:** `npx tsc --noEmit` — 0 errori.
- **Versione:** v0.30.1

## [v0.30.0] - 2026-06-22
### Stato: Audit completo — test E2E riparati, pagine auth allineate, console OK
- **[HIGH] Fix test E2E:** Aggiornati selettori `getByPlaceholder` → `getByRole('textbox', ...)` su login e register — ora usano label HTML invece di placeholder (14 test passanti).
- **[MEDIUM] ForgotPasswordPage allineata:** Aggiunte label, logo centrato, rimossa icona dal pulsante, stile coerente con LoginPage.
- **[MEDIUM] ResetPasswordPage allineata:** Aggiunte label, password toggle, logo centrato, stile coerente.
- **[VERIFIED] npm run lint:** 0 errori + version check passa.
- **[VERIFIED] npx tsc --noEmit:** 0 errori.
- **[VERIFIED] npm run build:** Build produce dist/ con PWA.
- **[VERIFIED] npm run test:e2e:** 14/14 test passanti (Playwright).
- **[VERIFIED] npx vitest run:** 4/4 test unitari passanti.
- **[VERIFIED] Console browser:** 0 errori JS, 0 warning.
- **Versione:** v0.30.0
### Stato: Audit finale — allineamento .env.example e COMMANDS.md
- **[FIX] .env.example:** Riferimenti aggiornati da `fintrack` a `NetFlow`.
- **[FIX] COMMANDS.md:** Aggiunto `version check` in sezione lint, stato Supabase attuale, deploy con `npm run deploy`.
- **Versione:** v0.29.1

## [v0.29.0] - 2026-06-22
### Stato: Dashboard grid 5 colonne — AreaChart e ProgressRings allineati in altezza
- **[CHANGE] Griglia dashboard da 4 a 5 colonne:** `lg:grid-cols-5`. AreaChart (Andamento Economico) occupa 3 colonne, ProgressRings (Stato Attività) occupa 2 colonne → entrambi allineati in altezza e ProgressRings più largo.
- **[FIX] Empty state AreaChart:** Sostituito `h-48 md:h-72` con `h-full flex flex-col` + `flex-1` centrato — si allinea perfettamente con la card dei dati.
- **[FIX] ColSpan aggiornati:** KPI group → 5 colonne, charts → 3 colonne, progress-rings → 2 colonne, quick-register → 2 colonne, bar-chart → 5 colonne per occupare tutta la larghezza.
- **Versione:** v0.29.0

## [v0.28.2] - 2026-06-22
### Stato: Logo centrato + RegisterPage allineata a LoginPage
- **[FIX] Logo centrato:** Logo ora è centrato con `flex flex-col items-center` su tutte le pagine auth (Login e Register).
- **[MEDIUM] RegisterPage aggiornata:** Aggiunte label esterne ai campi (Nome, Email, Password, Conferma password), password toggle, rimossa icona UserPlus dal pulsante, link "Accedi" in `text-brand font-medium`. Allineata allo stile della LoginPage.
- **Versione:** v0.28.2

## [v0.28.1] - 2026-06-22
### Stato: Version check automatico — blocca commit se package.json e CHANGELOG divergono
- **[HIGH] Script check-version.js:** Nuovo script `scripts/check-version.js` confronta la versione in `package.json` con l'ultima in `.spec/CHANGELOG.md`. Se divergono, esce con errore.
- **[MEDIUM] Integrato in lint:** `npm run lint` ora esegue il version check prima di ESLint. Il commit viene bloccato automaticamente se le versioni non coincidono.
- **Versione:** v0.28.1

## [v0.28.0] - 2026-06-22
### Stato: UX Login — label, password toggle, Ricordami, stati input
- **[HIGH] Label esterne ai campi:** Aggiunte label "Email" e "Password" sopra i campi di input — l'utente sa sempre cosa sta inserendo anche dopo aver digitato.
- **[HIGH] Mostra/nascondi password:** Icona Eye/EyeOff nel campo password. Permette di verificare visivamente la password digitata.
- **[HIGH] Stati Focus/Error/Success:** Bordo viola (brand) al focus, bordo rosso (expense) in errore con messaggio sotto il campo. Ring focus brand/50 su entrambi.
- **[MEDIUM] Pulsante Accedi:** Rimossa icona LogIn per un look più pulito e minimal.
- **[MEDIUM] Checkbox Resta connesso:** Nuova checkbox "Resta connesso" tra password e bottone. Se deselezionata, la sessione non persiste alla chiusura del browser. Implementata via localStorage flag `netflow_remember_me`.
- **[MEDIUM] Spaziatura migliorata:** "Password dimenticata?" allineato a destra nella stessa riga della checkbox. Spaziatura verticale aumentata per più respiro visivo.
- **[LOW] Link Registrati:** Già in `text-brand` (viola), aggiunto `font-medium` per maggiore enfasi.
- **Build verificata:** tsc + lint + vite build passano (0 errori).
- **Versione:** v0.28.0

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
