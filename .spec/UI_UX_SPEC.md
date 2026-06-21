# UI/UX Specification

## 1. Visual Identity

### 1.1 Design Language
- **Mood:** Liquid, Modern, Rounded, Premium.
- **Style:** "Futuristic Modular Glassmorphism" — interfaccia densa di dati che usa la gerarchia visiva per rendere immediata la lettura di flussi finanziari complessi.
- **Forme:** Tutto tondeggiante. Niente spigoli vivi.
- **Effetto Vetro:** Ogni card/modulo è un'entità visiva a sé stante con sfondo semi-trasparente e blur.
- **Continuità:** Ogni schermata ha la stessa struttura dimensionale, contenuti differenti.

### 1.2 Glassmorphism Effects
- **Background pagina:** Sfondo scuro (`#0F0F1A`) con gradienti radiali soffusi (brand viola e blu elettrico con opacità 5-10%).
- **Card/Moduli:** 
  - `background: rgba(26, 26, 46, 0.6)` con `backdrop-filter: blur(25px)`
  - `border: 0.5px solid rgba(255, 255, 255, 0.08)` ultra-sottile semi-trasparente
  - `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3)` per profondità
- **Hover card:** Aumento della luminosità del vetro (`background: rgba(26, 26, 46, 0.8)`) e leggero scale.

### 1.3 Border Radius
- **Cards / Moduli:** `1.5rem` (24px)
- **Buttons:** `9999px` (pill-shaped)
- **Input/Select:** `1rem` (16px)
- **Modali:** `2rem` (32px)

### 1.4 Colori
| Ruolo | Hex (Dark) | Hex (Light) | Uso |
|-------|-----------|-------------|-----|
| Brand Primary | `#6C5CE7` (Viola Cyber) | `#6C5CE7` | Bottoni, header, link, accenti, gradienti |
| Brand Secondary | `#00D2FF` (Blu Elettrico) | `#0098C7` | Hover, gradienti radiali sfondo |
| Background | `#0F0F1A` | `#F8F9FA` | Sfondo principale con gradienti radiali |
| Surface Glass | `rgba(26,26,46,0.6)` | `rgba(255,255,255,0.7)` | Cards con backdrop-blur |
| Success (Incassato) | `#00B894` (Smeraldo) | `#00B894` | Badge incassato, KPIs positive, anelli progresso |
| Pending | `#636E72` + 60% opacità | `#B2BEC3` | Badge in attesa, anelli parziali |
| Expenses | `#FF6B6B` (Corallo) | `#E17055` | Uscite, alert |
| Text Primary | `#FFFFFF` | `#1A1A2E` | Titoli, corpo |
| Text Secondary | `#A0A0B8` | `#636E72` | Sottotitoli, label |

### 1.5 Tipografia
- **Font:** Inter (variabile weight) per UI, JetBrains Mono per numeri/metriche con tracking leggero (`letter-spacing: -0.02em`).
- **Dati Finanziari:** Tutti gli importi nelle tabelle, nelle card e nei totali devono utilizzare font con pesi maggiori (es. Semibold) e avere dimensioni più grandi rispetto alle etichette descrittive. Applicare sempre `font-variant-numeric: tabular-nums;` (classe tailwind `tabular-nums`) per allineare perfettamente le colonne numeriche.
- **Gerarchia:**
  - `text-4xl font-bold` — Titolo pagina
  - `text-2xl font-semibold font-mono tabular-nums` — KPI value
  - `text-lg font-medium` — Card title
  - `text-sm` — Corpo / label

### 1.6 Icone
- **Libreria:** Lucide-React
- **Stile:** Outline, stroke-width 1.5, rounded
- **Dimensione standard:** `h-5 w-5`

---

## 2. Layout & Navigation

### 2.1 Desktop (>= 1024px)
- **Sidebar:** Fissa a sinistra, larga `280px`. Sfondo glass `bg-surface/60 backdrop-blur-xl` con bordo destro `border-border`.
- **Main content:** `ml-[280px]`, padding `p-8`.
- **Header:** Barra superiore con titolo pagina, avatar utente, indicatori di sync.
- **Dashboard Grid:** Griglia modulare a 3 colonne. Ogni modulo (KPI group, Tracker, Grafici, Registro rapido) è ridimensionabile e riordinabile.

### 2.2 Tablet (768px - 1023px)
- **Sidebar:** Collassabile. Icone + label. Larghezza ridotta a `72px` (solo icone) con expand su hover.
- **Dashboard Grid:** 2 colonne.
- **Main content:** Padding `p-6`.

### 2.3 Mobile (< 768px)
- **Sidebar:** Scompare. Sostituita da **Bottom Bar** con 5 icone principali.
- **Dashboard Grid:** 1 colonna singola.
- **Main content:** Padding `p-4`.
- **Header:** Semplificato, solo titolo e hamburger menu per drawer laterale.

### 2.4 Transizioni
- **Cambio pagina:** `AnimatePresence` con slide orizzontale (direzione basata su navigazione avanti/indietro).
- **Sidebar:** `transition-all duration-300 ease-out`.
- **Moduli Dashboard:** `initial={{ opacity: 0, scale: 0.9 }}` con Framer Motion per simulare caricamento OS futuristico.
- **Cards:** `hover:scale-[1.02]` con `transition-transform duration-200`.

---

## 3. Componenti Specifici

### 3.1 GlassCard (Wrapper Standardizzato)
```
- backdrop-filter: blur(25px)
- background: rgba(var(--color-surface), 0.6)
- border: 0.5px solid rgba(255,255,255,0.08)
- border-radius: 1.5rem
- box-shadow: 0 8px 32px rgba(0,0,0,0.3)
- hover: background luminosità aumentata + scale(1.01)
- transition: all 0.3s ease-out
```

### 3.2 Dashboard (Griglia Modulare)
- **KPI Cards:** Griglia 4x2 su desktop, 2x2 su tablet, 1x2 su mobile. Ogni KPI è una GlassCard.
- **Goal Tracker "A Petali":** Grafico radiale segmentato SVG. Ogni segmento rappresenta una categoria (Netto, Lordo, Cash). Opacità/riempimento segmento indica il progresso verso il target. Animato con Framer Motion `stroke-dashoffset`.
- **Grafici:** Chart.js + react-chartjs-2. 
  - **Area Chart sovrapposto:** Per confronto entrate/uscite. Gradienti neon con `fill: true` e `backgroundColor` gradiente lineare.
  - **Bar Chart:** Per confronto card/cash (invariato).
- **Progress Rings:** Anelli percentuali SVG per workload settimanale e "carica finanziaria".
- **Layout personalizzabile:** L'utente può riordinare i moduli della dashboard (posizione salvata in `profiles.dashboard_layout`).

### 3.3 Lavori (Tabella)
- Design "non Excel": cards glassmorfiche invece di righe di tabella.
- Ogni job è una GlassCard espandibile con dettagli.
- Filtri: pill buttons per stato (Attivi, In attesa, Incassati).
- Sottoviste come tabs: Generali | Carta | Cash | Misti.

### 3.4 RadialProgress (SVG Dinamico)
```tsx
<RadialProgress
  value={75}
  max={100}
  size={120}
  strokeWidth={8}
  color="#6C5CE7"
  label="Netto"
/>
```
- Cerchio SVG con `stroke-dasharray` e `stroke-dashoffset` animati.
- Segmenti multipli per confronto metriche.
- Animazione Framer Motion `initial={{ strokeDashoffset: circumference }}`.

### 3.5 Modali & Pop-up
- **Backdrop:** `fixed inset-0 bg-black/50 backdrop-blur-md`.
- **Posizione:** Sempre centrati orizzontalmente e verticalmente.
- **Animazione:** `scale: [0.95, 1]` con `opacity: [0, 1]` (Framer Motion).
- **Tipi:** Backup Reminder, Sync Alert, Session Expired, Conferma eliminazione.

### 3.5a SlideOver (Pannello Laterale)
- **Posizione:** Fissato a destra, scivola da `x: 100%` a `x: 0` con spring animation (damping 30, stiffness 300).
- **Backdrop:** `bg-black/50 backdrop-blur-sm`, click per chiudere.
- **Larghezza:** `max-w-lg` (480px) su desktop, `100%` su mobile.
- **Stile:** `bg-surface/80 backdrop-blur-3xl border-l border-border`.
- **Header:** Sticky con titolo a sinistra, pulsante X a destra, bordo inferiore `border-border`.
- **Contenuto:** Scrollabile, padding `px-6 py-4`. I form complessi devono evitare l'affollamento cognitivo suddividendo logicamente i campi in sezioni visibilmente distinte (es. card separate o sezioni collassabili per "Dati Anagrafici", "Dati Fiscali", "Dettagli Lavoro") con ampio padding verticale. I campi interattivi devono avere un touch target di almeno 44x44px.
- **Uso:** Form complessi (es. creazione/modifica lavori) per mantenere il contesto visivo della pagina sottostante.

### 3.6 Bottom Bar (Mobile)
- 5 voci: Dashboard, Lavori, Fatturazione, Registro, Impostazioni.
- Icona + label sotto.
- Attivo: colore brand + indicatore superiore.

### 3.7 Toast / Notifiche
- **Posizione:** Bottom-center su mobile, bottom-right su desktop.
- **Tipi:** success (smeraldo), error (corallo), warning (giallo), info (brand).
- **Auto-dismiss:** 4 secondi, tranne errori di sync.

### 3.8 Empty States (Stati Vuoti)
- **Empatia:** Evitare interfacce puramente strumentali e fredde (es. semplice testo "Nessuna spesa").
- **Visual:** Utilizzare illustrazioni vettoriali dal design morbido (line-art minimale o stile 3D) per far sentire l'utente accolto.
- **Copy:** Inserire testi persuasivi e incoraggianti (es. "Tutto ordinato! Inizia registrando la tua prima spesa").

---

## 4. Responsive Design Parameters

### 4.1 Layout & Navigation

| Elemento | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|----------|-------------------|---------------------|-----------------|
| **Sidebar** | Visibile fissa, `w-[280px]`, `hidden md:flex`, sfondo glass, bordo destro | Collassabile a `w-[72px]` (solo icone), expand su hover con `transition-all duration-300` | Nascosto, sostituito da BottomBar. Drawer laterale attivabile da hamburger menu |
| **Bottom Bar** | Nascosta (`md:hidden`) | Nascosta | Visibile fissa in basso, `fixed bottom-0 left-0 right-0`, z-40, 5 voci con icona+label, padding `py-2 px-4` |
| **Header** | `sticky top-0 z-30`, padding `px-8 py-4`, mostra titolo pagina, avatar, sync indicator, NotificationCenter, FiscalYearSelector, info-guide button | Padding `px-6 py-3`, nascondi testo descrittivo lungo, mantieni icone | Padding `px-4 py-3`, mostra solo titolo abbreviato e hamburger menu. NotificationCenter e sync indicator collassati in icona singola |
| **Main Content (offset)** | `lg:ml-[280px]` | `md:ml-[72px]` | `ml-0`, padding `pb-20` per BottomBar |
| **Main Content (padding)** | `p-8` | `p-6` | `p-4` |
| **FiscalYearSelector** | Chevron + anno, `text-base` | Chevron + anno, `text-sm` | Solo anno corrente, nessuna navigazione |
| **Sync Indicator (header)** | Testo stato + contatore coda + icona | Icona + contatore (badge numerico) | Solo icona con dot colorato (verde/rosso) |

### 4.2 Dashboard

| Elemento | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|----------|-------------------|---------------------|-----------------|
| **Dashboard Grid** | `lg:grid-cols-3`, gap-6 | `grid-cols-2`, gap-4 | `grid-cols-1`, gap-4 |
| **KPI Group (modulo)** | `lg:col-span-3`, griglia interna `lg:grid-cols-4` | `col-span-2`, griglia interna `grid-cols-2` | `col-span-1`, griglia interna `grid-cols-1` |
| **KPI Card** | Padding `p-5`, valore in `text-2xl font-mono`, label `text-sm` | Padding `p-4`, valore in `text-xl font-mono`, label `text-xs` | Padding `p-3`, valore in `text-lg font-mono`, label `text-xs` |
| **ProgressRings (modulo)** | `lg:col-span-1`, ring size 120px, segmenti in row | `col-span-1`, ring size 100px, segmenti in row con wrap | `col-span-1`, ring size 80px, segmenti in colonna o wrap |
| **GoalTracker (modulo)** | `lg:col-span-2`, radial rings 80px in row, progress bar piena | `col-span-2` (o 1 se reordinato), rings 70px, progress bar compatta | `col-span-1`, rings 60px, progress bar compatta, metric view a tabs scorrevoli |
| **AreaChart (modulo)** | `lg:col-span-2`, altezza `h-72`, legenda visibile, tooltip glass | `col-span-2` (o 1), altezza `h-56`, legenda compatta, tooltip ridotto | `col-span-1`, altezza `h-48`, legenda nascosta (solo etichette assi), scroll orizzontale se necessario |
| **BarChart (modulo)** | `lg:col-span-1`, altezza `h-64`, etichette mese complete | `col-span-1`, altezza `h-52`, etichette abbreviate (3 lettere) | `col-span-1`, altezza `h-44`, etichette mese singola lettera, scroll orizz. |
| **Quick Register (modulo)** | `lg:col-span-1`, form compatto inline | `col-span-1`, form semplificato | `col-span-1`, form essenziale (solo importo + categoria) |
| **Dashboard ModuleWrapper** | Animazione stagger con 0.1s delay, hover scale 1.01 | Stagger con 0.08s delay, nessun hover scale | Stagger con 0.05s delay, nessuna animazione di ingresso (ridurre motion) |

### 4.3 Job Cards & Job Page

| Elemento | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|----------|-------------------|---------------------|-----------------|
| **Grid Lavori** | `lg:grid-cols-3`, gap-6 | `md:grid-cols-2`, gap-4 | `grid-cols-1`, gap-3 |
| **JobCard (contratto)** | Padding `p-5`, importo `text-2xl font-mono`, dettagli inline espandibili | Padding `p-4`, importo `text-xl font-mono`, dettagli inline espandibili | Padding `p-4`, importo `text-lg font-mono`, espansione automatica full-width |
| **JobCard — Badge stato** | `text-xs`, padding `px-3 py-1` | `text-xs`, padding `px-2 py-0.5` | `text-[10px]`, padding `px-2 py-0.5` |
| **JobCard — Bottoni azione** | Icona + label testuale | Solo icona con tooltip | Solo icona (touch target min 44x44px) |
| **JobCard — Descrizione** | 3 righe max, `text-sm` | 2 righe max, `text-sm` | 2 righe max, `text-xs` |
| **Job Tab Filtri (pill)** | Row di pill button, `text-sm`, 4 voci visibili | Row scrollabile orizzontalmente, `text-sm` | Scroll orizzontale snap, `text-xs`, swipe-friendly |
| **Secondary Filter Bar** | Dropdown + pill in row | Dropdown + pill in row compatta | Accordion/sheet filtro richiudibile |
| **JobFormModal (contenuto)** | Griglia 2 colonne per campi, `max-w-lg` | Griglia 1 colonna, `max-w-md` (90vw) | Griglia 1 colonna, `w-full` (95vw), padding `p-4` |
| **ClientSelect** | Dropdown full-width con lista 6 items | Dropdown full-width | Bottom sheet nativo / modal ridotto |

### 4.4 Client Cards

| Elemento | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|----------|-------------------|---------------------|-----------------|
| **Grid Clienti** | `lg:grid-cols-3`, gap-6 | `md:grid-cols-2`, gap-4 | `grid-cols-1`, gap-3 |
| **ClientCard** | Padding `p-5`, avatar `h-14 w-14`, nome `text-lg`, info 3 righe | Padding `p-4`, avatar `h-12 w-12`, nome `text-base`, info 2 righe | Padding `p-4`, avatar `h-10 w-10`, nome `text-sm`, info essenziale |
| **ClientCard — Azioni** | Icone edit/delete visibili su hover | Icone edit/delete sempre visibili in alto a destra | Icone edit/delete sempre visibili, touch target min 44px |
| **Client Form (Modal)** | Griglia 2 colonne, color picker 8 opzioni in row | Griglia 1 colonna, color picker 6 opzioni | Griglia 1 colonna, color picker 4 opzioni scroll orizz. |

### 4.5 Expense Cards

| Elemento | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|----------|-------------------|---------------------|-----------------|
| **Grid Spese** | `lg:grid-cols-3`, gap-6 | `sm:grid-cols-2`, gap-4 | `grid-cols-1`, gap-3 |
| **ExpenseCard** | Importo `text-xl font-mono text-red`, categoria badge, data, descrizione | Importo `text-lg`, categoria badge, solo data | Importo `text-base`, solo categoria icon + data ridotta |
| **Expense Form (SlideOver)** | Campi in griglia 2 colonne, `max-w-lg` | Campi in colonna singola, `max-w-md` | Campi in colonna singola, `w-full` |

### 4.6 Invoicing

| Elemento | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|----------|-------------------|---------------------|-----------------|
| **PendingJobsList (griglia)** | `lg:grid-cols-3`, gap-5 | `md:grid-cols-2`, gap-4 | `grid-cols-1`, gap-3 |
| **Pending Job Card** | Checkbox + dettaglio completo (titolo, cliente, importo, nota metodo) | Checkbox + dettaglio ridotto | Checkbox + solo titolo e importo |
| **Select All / Deselect** | Testo link inline | Testo link inline | Pulsante full-width |
| **InvoiceFormModal (SlideOver)** | `max-w-lg`, riepilogo lavori in lista compatta | `max-w-md` (90vw), riepilogo abbreviato | `w-full`, riepilogo essenziale, totale sticky in fondo |
| **InvoiceList (griglia)** | `lg:grid-cols-3`, gap-5, card con tutte le info | `md:grid-cols-2`, gap-4, info ridotte | `grid-cols-1`, gap-3, card compatta |
| **Invoice Card** | Status badge, numero fattura, importo, date, azioni | Status badge, numero, importo, data scadenza | Status badge colorato, solo importo e numero |

### 4.7 Ledger / Registro

| Elemento | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|----------|-------------------|---------------------|-----------------|
| **LedgerStats (griglia)** | `xl:grid-cols-5`, gap-4, label+valore | `md:grid-cols-3`, gap-3, valori ridotti | `grid-cols-2`, gap-2, solo valore numerico, label abbreviata |
| **LedgerFilters** | Search + Data Da/A (2 input) + Metodo dropdown + Stato dropdown — tutti in row | Search full-width sopra, filtri in row compatta sotto | Search + filtri in accordion collassabile, solo filtro data e metodo visibili |
| **LedgerTable — Colonne** | 7 colonne: Data, Cliente, Lavoro, Metodo, Importo, Stato, Azioni | 5 colonne: Data, Lavoro, Metodo, Importo, Stato. Nascondi Cliente e Azioni | Card view: ogni riga = card con Data+Importo in header, Lavoro+Stato in body, swipe per azioni |
| **LedgerTable — Righe** | Padding `p-4`, testo `text-sm`, header `text-xs uppercase` | Padding `p-3`, testo `text-xs` | Padding `p-3`, card con bordo, layout verticale |
| **LedgerTable — Paginazione** | "Precedente" / "Successiva" + conteggio pagine | "Precedente" / "Successiva" + conteggio | "Precedente" / "Successiva" come pill, no conteggio, scroll infinito alternativo |
| **Ledger Detail (SlideOver)** | `max-w-lg`, layout 2 colonne per dettagli | `max-w-md`, layout 1 colonna | `w-full`, layout 1 colonna, padding `p-4` |

### 4.8 Overlays & Feedback

| Elemento | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|----------|-------------------|---------------------|-----------------|
| **Modal (generico)** | `max-w-md` (480px), `rounded-modal` (32px), padding `p-6`, backdrop `backdrop-blur-md` | `max-w-[90vw]`, `rounded-modal` (24px), padding `p-5` | `max-w-[95vw]`, `rounded-2xl` (16px), padding `p-4`, `mx-4` |
| **Modal — Form interno** | Griglia 2 colonne per campi, bottoni in row a destra | Griglia 1 colonna, bottoni in row centrati | Griglia 1 colonna, bottoni full-width stacked |
| **SlideOver** | `max-w-lg` (480px), padding `px-6 py-4`, spring animation | `max-w-[90vw]`, padding `px-4 py-3` | `w-full` (100vw), padding `px-4 py-3`, nessun border-radius a destra |
| **SlideOver — Header** | Titolo + X button, bordo inferiore | Titolo + X button | Titolo abbreviato + X button (touch target 44px) |
| **Toast / Notifiche** | `bottom-6 right-6`, `max-w-sm`, padding `p-4`, icona `h-5 w-5` | `bottom-4 right-4`, `max-w-xs`, padding `p-3` | `bottom-20 center`, `max-w-[90vw]`, padding `p-3`, icona `h-4 w-4`, auto-dismiss 6s |
| **SyncBanner** | `top-4 left-1/2 -translate-x-1/2`, `max-w-2xl`, padding `px-6 py-3`, icona+testo+azione | `top-2 left-1/2`, `max-w-xl`, padding `px-4 py-2`, testo ridotto | `top-0 left-0 right-0`, `w-full`, padding `px-3 py-2`, solo icona+testo, azione nascosta |
| **BackupReminder (Modal)** | `max-w-sm`, icona `h-12 w-12`, bottoni in row | `max-w-[85vw]`, icona `h-10 w-10`, bottoni in row | `max-w-[90vw]`, icona `h-8 w-8`, bottoni full-width stacked |
| **NotificationCenter (dropdown)** | `w-80`, `right-0`, 3 sezioni notifiche, item padding `p-3` | `w-72`, `right-0`, 2 sezioni, item padding `p-2` | Bottom sheet full-width, swipe per dismiss |
| **ErrorBoundary (fallback)** | Centrato, icona `h-16 w-16`, testo `text-lg` | Centrato, icona `h-12 w-12`, testo `text-base` | Centrato, icona `h-10 w-10`, testo `text-sm`, padding `p-4` |

### 4.9 Auth Pages

| Elemento | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|----------|-------------------|---------------------|-----------------|
| **Login Card** | `max-w-md`, padding `p-8`, logo `h-14 w-14` | `max-w-md`, padding `p-6`, logo `h-12 w-12` | `max-w-[90vw]`, padding `p-5`, logo `h-10 w-10`, `mx-4` |
| **Register Card** | `max-w-md`, padding `p-8`, 4 campi in colonna | `max-w-md`, padding `p-6`, 4 campi | `max-w-[90vw]`, padding `p-5`, campi stacked |
| **ForgotPassword Card** | `max-w-sm`, padding `p-6` | `max-w-sm`, padding `p-5` | `max-w-[90vw]`, padding `p-4` |
| **ResetPassword Card** | `max-w-sm`, padding `p-6` | `max-w-sm`, padding `p-5` | `max-w-[90vw]`, padding `p-4` |
| **Onboarding Wizard** | `max-w-2xl`, padding `p-8`, step indicator orizzontale, form 2 colonne | `max-w-xl`, padding `p-6`, step indicator orizzontale compatto, form 1 colonna | `max-w-[92vw]`, padding `p-4`, step indicator verticale/icone, form 1 colonna, bottoni nav full-width |

### 4.10 Feature Pages

| Elemento | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|----------|-------------------|---------------------|-----------------|
| **Settings — Tab Bar** | Tab orizzontali: 5 voci in row, `text-sm` | Tab scrollabili orizzontalmente, `text-sm` | Tab scrollabili con snap, `text-xs`, icona+label, active indicator |
| **Settings — Form sezioni** | Griglia 2 colonne per campi, padding `p-6`, gap-6 | Griglia 1-2 colonne miste, padding `p-4`, gap-4 | Griglia 1 colonna, padding `p-4`, gap-3 |
| **Settings — Theme Picker** | 3 card in row (Sistema/Chiaro/Scuro) con icona+label | 3 card in row, testo ridotto | 3 bottoni pill stacked |
| **Guide — Adempimenti Grid** | `md:grid-cols-2`, gap-6, card con icona+testo completo | `grid-cols-2`, gap-4, testo abbreviato | `grid-cols-1`, gap-3 |
| **Guide — Aliquote Table** | Tabella piena con 4+ colonne | Tabella con colonne ridotte (nascondi dettaglio) | Card list invece di tabella, ogni riga = card |
| **Guide — Scadenze List** | Lista con data, descrizione, icona | Lista con data e descrizione | Lista con solo data e titolo, descrizione collassabile |
| **Account — Form Profilo** | Griglia 2 colonne, padding `p-6` | Griglia 1-2 colonne, padding `p-4` | Griglia 1 colonna, padding `p-4` |
| **Account — Logo Upload** | Preview `h-24 w-24`, upload button con testo | Preview `h-20 w-20`, upload solo icona | Preview `h-16 w-16`, upload icona |
| **Legal Page — Cards** | 6 card in colonna singola, padding `p-6` ciascuna | Padding `p-5` | Padding `p-4`, titolo `text-base` invece di `text-lg` |
| **NotFound (404)** | Centrato, 404 badge `h-24 w-24`, titolo `text-2xl` | Centrato, badge `h-20 w-20`, titolo `text-xl` | Centrato, badge `h-16 w-16`, titolo `text-lg`, padding `p-4` |

### 4.11 Typography & Spacing

| Elemento | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|----------|-------------------|---------------------|-----------------|
| **Page Title** | `text-4xl font-bold` | `text-2xl font-bold` | `text-xl font-bold` |
| **KPI / Metrica Value** | `text-2xl font-semibold font-mono` | `text-xl font-semibold font-mono` | `text-lg font-semibold font-mono` |
| **Card Title** | `text-lg font-medium` | `text-base font-medium` | `text-sm font-medium` |
| **Body / Label** | `text-sm` | `text-sm` | `text-xs` |
| **Badge / Tag** | `text-xs`, `px-3 py-1` | `text-[11px]`, `px-2 py-0.5` | `text-[10px]`, `px-2 py-0.5` |
| **Page Padding** | `p-8` | `p-6` | `p-4` |
| **Card Padding** | `p-5` | `p-4` | `p-3` |
| **Grid Gap (Dashboard)** | `gap-6` | `gap-4` | `gap-3` |
| **Grid Gap (Cards)** | `gap-6` | `gap-4` | `gap-3` |
| **Section Margin (verticale tra sezioni)** | `mb-8` | `mb-6` | `mb-4` |

---

## 5. Accessibilità
- **Contrasto:** WCAG AA minimo (4.5:1 testi normali, 3:1 testi grandi). I bordi glass sottili non devono essere l'unico indicatore visivo di interattività.
- **Focus:** `focus-visible:ring-2 ring-brand` su tutti gli elementi interattivi.
- **Screen reader:** Aria-label su icone e bottoni icona.
- **Motion reduce:** `prefers-reduced-motion: reduce` disabilita animazioni non essenziali (es. blur entrance, glass hover scale).
