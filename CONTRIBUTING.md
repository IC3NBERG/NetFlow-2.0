# Contributing

## Setup

```bash
npm install
cp .env.example .env
# Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

## Specifiche

Leggi i file in `.spec/` prima di iniziare:
- **PRD.md** — Requisiti prodotto
- **ARCHITECTURE.md** — Stack, pattern, struttura progetto
- **SCHEMA.md** — Database e tipi TypeScript
- **UI_UX_SPEC.md** — Design system glassmorphism
- **PROCESS_AND_AGENTS.md** — Protocollo multi-agente

## Regole di codifica

- TypeScript strict mode, niente `any`
- Mobile-first (sviluppa prima per schermi piccoli)
- Glassmorphism: ogni card usa `bg-surface/60 backdrop-blur-3xl border border-white/[0.08]`
- Entrance animations: Framer Motion `initial={{ opacity: 0, scale: 0.9 }}`
- Componenti in PascalCase, hook in camelCase con prefisso `use`, file in kebab-case
- Nessun segnaposto (`// ... rest of the code` o `// TODO`)

## Commit

Un commit per funzionalità completa. Messaggio:
```
feat(scope): descrizione in italiano
```
Esempio: `feat(dashboard): aggiunto calcolo metriche KPI - v0.2.0`

## Checklist pre-commit

- [ ] `npm run lint` passa
- [ ] `npx tsc` passa (0 errori)
- [ ] `npm run build` passa
- [ ] `.spec/CHANGELOG.md` aggiornato con versione incrementata

## Handover Protocol

Ogni sessione di codifica deve terminare con un messaggio che include:
1. STATO (completata/in progress/bloccata)
2. FILE MODIFICATI
3. LOGIC SYNC (spiegazione dati economici)
4. PROSSIMO PASSO
