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
│   └── router.tsx          # React Router config
├── features/               # Feature modules
│   ├── auth/               # Login, register, onboarding
│   ├── dashboard/          # KPI, goal tracker, charts
│   ├── jobs/               # Job CRUD, sottoviste (general/card/cash/mixed)
│   ├── invoicing/          # Fatture, parcelle, stato pending
│   ├── register/           # Archivio storico, statistiche
│   ├── settings/           # Impostazioni, backup, sync
│   ├── account/            # Profilo, template fatture
│   ├── guide/              # Guida fiscale informativa
│   └── legal/              # Privacy, cookie policy, TOS
├── shared/                 # Componenti riutilizzabili
│   ├── ui/                 # Atoms: Button, GlassCard, Input, Modal, RadialProgress, Toast
│   ├── layouts/            # Sidebar, BottomBar, MainLayout
│   └── charts/             # LineChart, BarChart, AreaChart
├── lib/                    # Utility, hooks, API client
│   ├── supabase.ts         # Client Supabase
│   ├── calculations.ts     # Funzioni metriche finanziarie
│   └── utils.ts            # Helper generici
└── types/                  # TypeScript types globali
    ├── database.ts         # Tipi allineati allo schema DB
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
    <RadialProgress value={75} max={100} color="#6C5CE7" />
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

### 3.5 Dashboard Module Animation
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
    theme_color: '#6C5CE7',
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
