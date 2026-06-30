# Technical Architecture

## 1. Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript (strict mode)
- **Build Tool:** Vite 6+ con PWA plugin
- **Styling:** Tailwind CSS 4 + class-variance-authority
- **Animations:** Framer Motion (liquid/smooth transitions, AnimatePresence, module entrance)
- **Icons:** Lucide-React
- **Charts:** Chart.js + react-chartjs-2 (Area Chart sovrapposti, Bar Chart)
- **State:** Zustand (preferenze utente, UI state globale)
- **Server Data:** TanStack Query (gestione cache e sync con Supabase)
- **Forms:** React Hook Form + Zod (validazione)
- **Fonts:** Google Fonts CDN (Inter + JetBrains Mono via `<link>` in index.html)

### Backend / Database
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Auth:** Supabase Auth (Email/Password). Google OAuth disabilitato (in attesa).
- **Storage:** Supabase Storage (logo aziendale, allegati fatture)
- **Realtime:** Supabase Realtime (sync istantaneo tra dispositivi)
- **Config:** Variabili d'ambiente in `.env` (placeholder: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`)

### PWA
- **Plugin:** vite-plugin-pwa
- **SW Strategy:** Workbox (cache-first per asset statici, network-first per dati)
- **Offline:** Queue di scrittura con Optimistic UI, sync al ritorno della connessione
- **Installabile:** Manifest per iOS, Android, Desktop

### Hosting
- **Piattaforma:** Cloudflare Pages
- **Build command:** `npm run build`
- **Output directory:** `dist/`
- **SPA Routing:** `public/_redirects` → tutte le rotte servono `index.html`
- **Security Headers:** `public/_headers` → X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- **Config:** `.cloudflare/pages.toml`
- **Env vars:** Impostare `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nel dashboard Cloudflare Pages (non committare nel repo)

---

## 2. Project Structure

```
src/
├── app/                    # Root layout, providers, router
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── SyncProvider.tsx
│   ├── router.tsx          # React Router config (public routes + ProtectedRoute)
│   └── protectedRouteConfig.tsx  # Route definitions con eager-loaded pages
├── features/               # Feature modules
│   ├── account/            # Profilo, logo upload, template fatture
│   ├── auth/               # Login, register, onboarding
│   ├── calendar/           # Eventi personalizzati (scadenze, promemoria)
│   ├── clients/            # Rubrica clienti con CRUD
│   ├── dashboard/          # KPI, stato attività (ProgressRings), charts
│   ├── expenses/           # Uscite con allegati
│   ├── guide/              # Guida fiscale informativa
│   ├── invoicing/          # Fatture/parcelle, raggruppa lavori da incassare
│   ├── jobs/               # Job CRUD, tabs (generali/carta/cash/misti), filtri stato
│   ├── legal/              # Privacy, cookie policy, TOS
│   ├── not-found/          # Pagina 404
│   ├── quotes/             # Preventivi con conversione 1-click in lavoro
│   ├── register/           # Registro contabile, storico, statistiche
│   ├── settings/           # Impostazioni, backup, sync, tema, audit log, notifiche
│   ├── shared/             # Pagina pubblica condivisa per commercialista
│   └── tags/               # Tag per lavori e spese
├── shared/                 # Componenti riutilizzabili
│   ├── ui/                 # Atoms: Button, GlassCard, Input, Modal, EmptyState, Toast, AttachmentsField, NotificationCenter, BackupReminder, SyncBanner, ecc.
│   ├── layouts/            # Sidebar, BottomBar, MainLayout
│   └── charts/             # LineChart, BarChart, AreaChart
├── lib/                    # Utility, hooks, API client
│   ├── hooks/              # useJobs, useQuotes, useClients, useInvoices, useNotifications, useRealtimeNotifications, useOsNotifications, useFaviconBadge, useNotificationSound, useNotificationCleanup, useGoalNotifications, useNavigationDirection, ecc.
│   ├── stores/             # Zustand stores (fiscalYear, jobsUI, ecc.)
│   ├── supabase.ts         # Client Supabase
│   ├── calculations.ts     # Funzioni metriche finanziarie
│   ├── tax.ts              # Calcoli lordo/netto, IRPEF
│   ├── syncBridge.ts       # Offline queue management
│   ├── syncExecute.ts      # Operazioni CRUD con fallback offline
│   ├── notificationService.ts  # Notification factory: creazione e check automatici (scadenze, fatture, backup, goal, sync)
│   └── utils.ts            # Helper generici
└── types/                  # TypeScript types globali
    ├── database.ts         # Tipi allineati allo schema DB (include Notification, NotificationCategory)
    └── metrics.ts          # MoneyMetrics, GoalMetric, etc.
```

---

## 3. Design Patterns

### 3.1 Compound Components
Utilizzati per pop-up, tabelle e cards:

```tsx
<Modal.Root open={isOpen} onClose={handleClose}>
  <Modal.Backdrop />
  <Modal.Content>
    <Modal.Header title="Backup Reminder" />
    <Modal.Body>Il tuo ultimo backup risale a 7 giorni fa.</Modal.Body>
    <Modal.Footer>
      <Button variant="primary">Esegui ora</Button>
    </Modal.Footer>
  </Modal.Content>
</Modal.Root>
```

### 3.2 GlassCard Pattern
Componente standardizzato per moduli dashboard e cards:

```tsx
<GlassCard className="col-span-2">
  <GlassCard.Header title="Goal Tracker" actions={<Button variant="ghost" size="icon"><Settings /></Button>} />
  <GlassCard.Body>
    <RadialProgress value={75} max={100} color="#C5963A" />
  </GlassCard.Body>
</GlassCard>
```

Proprietà tecniche:
- `backdrop-filter: blur(25px)` via Tailwind `backdrop-blur-3xl`
- Bordo 0.5px semi-trasparente: `border border-white/[0.08]`
- Sfondo: `bg-surface/60`
- Ombra profondità: `shadow-2xl shadow-black/30`
- Hover: `hover:bg-surface/80` + `hover:scale-[1.01]`
- Transizione: `transition-all duration-300 ease-out`

### 3.3 State Management
- **Zustand:** `usePreferencesStore` (tema, goal, metric preference), `useUIStore` (sidebar aperta/chiusa, modale attivo).
- **TanStack Query:** Job list, transactions, profile data (caching, refetch, optimistic updates).
- **Supabase Realtime:** Sottoscrizione ai cambiamenti dei job per sync istantaneo.

### 3.4 Offline Strategy (Full Offline Support)
1. **Asset statici:** Service Worker cache-first per font, icone, CSS, JS.
2. **Dati in lettura:** TanStack Query con `staleTime` e `gcTime` per persistenza dati recenti. L'utente visualizza sempre l'ultimo dato disponibile anche offline.
3. **Scritture offline:** Coda di mutazioni in IndexedDB (`sync_queue`). Ogni operazione CRUD fallita in assenza di rete viene accodata con timestamp e priorità. Al ritorno della connessione (`navigator.onLine` + Supabase channel `online`), la coda viene svuotata in ordine FIFO con retry esponenziale.
4. **Push al ritorno online:** Il `SyncProvider` rileva il passaggio offline→online, processa la coda, e mostra toast di riepilogo ("Sincronizzati 3 lavori", "1 operazione fallita"). In caso di conflitto, vince l'ultima modifica locale (timestamp-based).
5. **UI States:**
   - Toast `Offline - Le modifiche verranno sincronizzate al ritorno della connessione`
   - Toast `Sincronizzazione completata (X elementi)`
   - Indicatore persistente nell'header quando ci sono elementi in coda
6. **Queue Storage (IndexedDB via idb library):**
   ```ts
   interface SyncQueueItem {
     id: string;
     table: string;
     operation: 'insert' | 'update' | 'delete';
     payload: unknown;
     record_id?: string;
     timestamp: number;
     retries: number;
   }
   ```

### 3.5 Notification System
Il sistema notifiche è **persistente** e **categorizzato**, composto da:

1. **Tabella DB `notifications`**: Archivia notifiche persistenti con campi: `category`, `title`, `message`, `link`, `is_read`, `is_dismissed`, `metadata` (JSONB).
2. **RPC PostgreSQL**: `mark_notification_read`, `dismiss_notification`, `mark_all_notifications_read`, `cleanup_notifications`, `get_unread_notification_counts`.
3. **Hook `useNotifications`**: TanStack Query con `refetchInterval: 60s` per polling automatico. Hook derivati: `useUnreadNotificationCounts`, `useMarkNotificationRead`, `useDismissNotification`, `useMarkAllNotificationsRead`, `useCreateNotification`.
4. **`notificationService.ts`**: Factory di notifiche con funzioni `checkAndCreateDeadlineNotifications`, `checkAndCreateInvoiceNotifications`, `checkAndCreateBackupNotification` — chiamate all'avvio del `NotificationCenter`.
5. **Preferenze per-categoria**: `user_settings.notification_preferences` (JSONB) con toggle per ognuna delle 8 categorie, più `backup_reminder_interval_days`.

**Categorie notifiche:**
| Categoria | Icona | Trigger |
|-----------|-------|---------|
| `deadline` | Calendar | Job `completed_pending` >30gg |
| `invoice` | AlertTriangle | Fattura scaduta non pagata |
| `backup` | Download | >N giorni da ultimo backup |
| `sync` | RefreshCw | Connessione caduta/ritornata |
| `goal` | Goal | Progresso obiettivo >80% |
| `quote` | FileText | Preventivo accettato/scaduto |
| `expense` | TrendingUp | Spesa sopra la media |
| `system` | Bell | Aggiornamenti app |

**Nuove hook (v0.40.1):**
- **`useRealtimeNotifications`**: Sottoscrizione Supabase Realtime alla tabella `notifications` — invalidazione istantanea della cache TanStack Query all'insert/update.
- **`useNewNotificationTracker`**: Traccia il cambio del conteggio notifiche non lette e dispatches un CustomEvent `new-notification` quando il documento non è in focus.
- **`useOsNotifications`**: Richiede il permesso Notification API al mount e mostra notifiche OS-level (`new Notification(...)`) quando l'app è in background e arrivano nuove notifiche.
- **`useFaviconBadge`**: Disegna un badge rosso con conteggio sulla favicon usando Canvas quando ci sono notifiche non lette.
- **`useNotificationSound`**: Riproduce un breve chime (Web Audio API, oscillatore 880→1108Hz) quando arriva una nuova notifica.
- **`useNotificationCleanup`**: Chiama `cleanup_notifications(30)` all'avvio per eliminare notifiche dismissate da >30 giorni.
- **`useGoalNotifications`**: Monitora `goalProgress` dalla dashboard e crea notifiche al 50%, 80%, 100% dell'obiettivo finanziario.

**Sync → Notifications (v0.40.1):** Il `SyncProvider` ora crea una notifica di categoria `sync` quando la connessione torna online e la coda di sync viene svuotata.

**UI Components:**
- `NotificationCenter`: Dropdown dalla campanella nell'header con badge contatore, filtri per categoria, azioni mark-read/dismiss, link "Vedi tutte le notifiche" → `/notifications`.
- `BackupReminder`: Modal fullscreen con opzioni snooze (1gg, 3gg, più tardi).
- `Toast`: Barra animata per feedback immediati (success/error/info).
- **`NotificationsPage`** (nuova): Pagina `/notifications` con storico completo, filtri per categoria, toggle mostra archiviate, badges conteggio per categoria, animazioni Framer Motion.

### 3.6 Page Transitions (Route Animation)
Le transizioni tra pagine usano `key`-based `motion.div` con spring entrance. Nessun `AnimatePresence` o exit animation (evita pagine vuote e freezing di contenuto):

```tsx
<motion.div
  key={location.pathname}
  initial={{ opacity: 0, x: 30 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
>
  {matched.element}
</motion.div>
```

- **Key change** → React smonta immediatamente la vecchia pagina (nessun exit) e monta la nuova con entrance spring.
- **Spring physics**: `stiffness: 320, damping: 28` per slide fluida non lineare.
- **Affidabilità**: nessun `AnimatePresence` o freezing di contenuto — quando il `key` cambia, React ricrea il nodo DOM da zero.

### 3.7 Theme Transition (CSS Morph)
La commutazione tra tema scuro e chiaro usa transizioni CSS pure per un morphing fluido dei colori:

1. **`transition-property: background-color, color, border-color`** su `body` (0.4s) e su `*, *::before, *::after` (0.35s) — definito in `src/index.css`.
2. **Class toggle** — il `ThemeProvider` commuta `.dark`/`.light` su `<html>`, i CSS variables cambiano istantaneamente, e le transizioni morphiano i colori su tutti gli elementi.
3. **Nessun overlay** — l'effetto è identico a design system moderni (shadcn/ui, macOS): i colori scorrono in parallelo senza tagli netti.
4. **Supporto OS** — il listener `prefers-color-scheme` tocca la classe e la transizione parte automaticamente.

### 3.6 Dashboard Module Animation
Ogni modulo della dashboard usa Framer Motion per l'entrata:

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.4, delay: index * 0.1 }}
>
  <GlassCard>{children}</GlassCard>
</motion.div>
```

### 3.6 Componenti Grafici Avanzati
- **RadialProgress:** Componente SVG con `stroke-dasharray`/`stroke-dashoffset` animato via Framer Motion per goal tracker "a petali" e progress rings.
- **AreaChart:** Chart.js Area chart con gradienti neon per confronto entrate/uscite sovrapposte.
- **DashboardGrid:** Layout modulare a 3 colonne (desktop) / 2 (tablet) / 1 (mobile). Moduli riordinabili via `profiles.dashboard_layout`.

---

## 4. PWA Configuration

```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['fonts/*', 'icons/*'],
  manifest: {
    name: 'NetFlow',
    short_name: 'NetFlow',
    description: 'Tracciamento finanziario per professionisti',
    theme_color: '#C5963A',
    background_color: '#0F0F1A',
    display: 'standalone',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,woff2}'],
    runtimeCaching: [{
      urlPattern: /^https:\/\/api\.supabase\.co\/rest\/v1\/.*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-cache' }
    }]
  }
})
```

---

## 5. Sync & Realtime

### 5.1 Istantanea
- Supabase Realtime Channel su tabella `jobs` filtrata per `user_id`.
- Ogni modifica (insert/update/delete) propagata a tutti i client connessi.
- Gestione conflitti: last-write-wins con timestamp `updated_at`.

### 5.2 Indicatori di Stato
- `SyncProvider` monitora navigator.onLine + Supabase channel status.
- Mostra badge "Syncrato" / "Offline" / "In sync..." nell'header.
- Pop-up bloccante se la sync si interrompe per > 30 secondi.
