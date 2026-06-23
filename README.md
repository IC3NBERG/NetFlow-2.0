# NetFlow 2.0

Applicazione contabile PWA per professionisti. Traccia lavori, entrate/uscite, genera fatture/parcelle e fornisce una dashboard finanziaria con sincronizzazione offline-first.

**Versione:** 0.33.x

## Tech Stack

- **Frontend:** React 19 + TypeScript (strict), Vite 6, Tailwind CSS 4, Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage, RLS)
- **State:** TanStack Query, Zustand, React Hook Form + Zod
- **Design:** Futuristic Modular Glassmorphism
- **PWA:** Offline-first con sync queue in IndexedDB

## Prerequisiti

- Node.js 20+
- Supabase project (URL + anon key)

## Setup

```bash
npm install
cp .env.example .env
# Inserisci VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env
npm run dev
```

## Comandi

| Comando | Descrizione |
|---|---|
| `npm run dev` | Server sviluppo (localhost:5173) |
| `npm run build` | Build produzione |
| `npm run preview` | Preview build produzione |
| `npm run lint` | Linting |
| `npx tsc --noEmit` | Type check |
| `npm run test` | Test unitari (Vitest) |
| `npm run test:e2e` | Test E2E (Playwright) |
| `npm run deploy` | Deploy su Cloudflare Pages |

## Rotta pubbliche

| Percorso | Descrizione |
|---|---|
| `/` | Dashboard con KPI, grafici, stato attività |
| `/jobs` | Lavori (filtri per metodo/stato) |
| `/clients` | Rubrica clienti |
| `/quotes` | Preventivi con conversione 1-click in lavoro |
| `/invoices` | Fatturazione (raggruppa lavori da incassare) |
| `/expenses` | Uscite registrate |
| `/calendar` | Calendario eventi personalizzati |
| `/ledger` | Registro contabile |
| `/settings` | Impostazioni profilo, tema, backup |
| `/shared/:token` | Pagina pubblica read-only per commercialista |

## Documentazione

Tutta la documentazione di progetto è in `.spec/`:

- [PRD](.spec/PRD.md) — Requisiti prodotto
- [Architettura](.spec/ARCHITECTURE.md) — Stack, pattern, struttura
- [Schema DB](.spec/SCHEMA.md) — Database, RLS, tipi TypeScript
- [UI/UX](.spec/UI_UX_SPEC.md) — Design system glassmorphism, responsive
- [Processo](.spec/PROCESS_AND_AGENTS.md) — Multi-agent orchestration
- [Debug & Repair](.spec/DEBUG_AND_REPAIR.md) — Manutenzione e recovery
- [Changelog](.spec/CHANGELOG.md) — Storico versioni
- [In attesa](.spec/IN_ATTESA.md) — Roadmap e backlog
