# NetFlow 2.0

Applicazione contabile PWA per professionisti. Traccia lavori, entrate/uscite, genera fatture/parcelle e fornisce una dashboard finanziaria con sincronizzazione cross-dispositivo.

## Tech Stack

- **Frontend:** React 19 + TypeScript (strict), Vite 6, Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **State:** TanStack Query, Zustand
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

## Comandi principali

| Comando | Descrizione |
|---|---|
| `npm run dev` | Server sviluppo |
| `npm run build` | Build produzione |
| `npm run lint` | Linting |
| `npx tsc` | Type check |
| `npm run test:e2e` | Test E2E (Playwright) |
| `npm run deploy` | Deploy su Cloudflare Pages |

## Documentazione

Tutta la documentazione di progetto è in `.spec/`:

- [PRD](.spec/PRD.md) — Requisiti prodotto
- [Architettura](.spec/ARCHITECTURE.md) — Stack, pattern, struttura
- [Schema DB](.spec/SCHEMA.md) — Database e tipi TypeScript
- [UI/UX](.spec/UI_UX_SPEC.md) — Design system e responsive
- [Processo](.spec/PROCESS_AND_AGENTS.md) — Multi-agent orchestration
- [Debug & Repair](.spec/DEBUG_AND_REPAIR.md) — Manutenzione
