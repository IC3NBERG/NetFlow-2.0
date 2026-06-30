# Multi-Agent Orchestration Protocol

## 1. Agent Roles & Responsibilities

### 1.1 Architect (Logica & Dati)
- **Focus:** Coerenza di `SCHEMA.md`, formule di calcolo finanziario, state machine.
- **Compiti:**
  - Validare le relazioni tra tabelle.
  - Garantire che i calcoli di `MoneyMetrics` siano corretti.
  - Definire i vincoli di business (es. un lavoro `completed_settled` non torna `active`).
  - Review delle migrazioni SQL.
- **Non fa:** Scrivere componenti UI, stili Tailwind, animazioni.

### 1.2 Builder (UI / Codice)
- **Focus:** Scrittura di componenti React, stili, animazioni, PWA.
- **Compiti:**
  - Implementare componenti seguendo `UI_UX_SPEC.md`.
  - Rispettare `ARCHITECTURE.md` per struttura progetto e pattern.
  - Collegare UI a TanStack Query/Zustand/Supabase.
  - Scrivere tipi TypeScript coerenti con `SCHEMA.md`.
- **Non fa:** Modificare la logica di calcolo finanziario senza approvazione dell'Architect.

### 1.3 QA (Review)
- **Focus:** Type safety, performance, connettività, aderenza agli standard.
- **Compiti:**
  - Controllare assenza di `any` e `as` non necessari.
  - Verificare che i componenti siano mobile-first.
  - Testare flussi offline/online.
  - Validare che ogni modifica rispetti `PRD.md`.
- **Non fa:** Scrivere nuove feature.

---

## 2. Handover Protocol (Obbligatorio)

Ogni sessione di vibecoding deve terminare con questo output esatto:

```
## STATUS
[Funzionalità completata / In progress / Bloccata]

## FILES CHANGED
- src/features/dashboard/DashboardPage.tsx
- src/features/dashboard/hooks/useDashboardMetrics.ts
- ...

## LOGIC SYNC
[Spiegare come i dati economici sono stati gestiti nel codice scritto.
 Esempio: "Le metriche della dashboard sono calcolate aggregando i job con status completed_pending e completed_settled. amount_card e amount_cash sono sommati separatamente. include_cash_in_invoice determina se amount_cash contribuisce a gross_settled oppure solo a cash_settled."]

## NEXT STEP
[Cosa deve fare l'agente successivo. Esempio: "L'agente Builder deve implementare la pagina Lavori con le 3 sottoviste (Generali, Carta, Cash, Misti) seguendo UI_UX_SPEC.md sezione 4.2."]
```

---

## 3. Rules of Engagement

### 3.1 Codice
- **No segnaposti:** Non accettare `// ... rest of the code` o `// TODO: implement`.
- **No `any`:** Tutti i tipi devono essere esplicitamente definiti.
- **DRY:** Estrarre logica ripetuta in hook/utility.
- **Naming:** Componenti in PascalCase, hook in camelCase con prefisso `use`, file in kebab-case.
- **Glassmorphism:** Ogni card/modulo dashboard deve usare il pattern GlassCard (`bg-surface/60 backdrop-blur-3xl border border-white/5`). Home/Tabelle devono usare card glass con bordo 0.5px.
- **Entrance Animations:** Ogni modulo dashboard deve avere `initial={{ opacity: 0, scale: 0.9 }}` con Framer Motion. Delay scalato su indice del modulo.
- **SVG Animations:** `RadialProgress` e goal tracker "a petali" devono usare `stroke-dasharray`/`stroke-dashoffset` animati con Framer Motion.

### 3.2 Mobile First
- Ogni componente deve essere sviluppato prima per schermi piccoli poi espanso per tablet/desktop.
- Usare `md:`, `lg:` Tailwind per varianti responsive.
- Testare con Chrome DevTools mobile view prima di passare a viewport più grandi.

### 3.3 Git & Commit
- Un commit per funzionalità logica completa.
- Messaggio di commit: `feat(scope): descrizione in italiano`.
- Esempi: `feat(dashboard): aggiunto calcolo metriche KPI`, `feat(jobs): implementata creazione lavoro con pagamento misto`.

### 3.4 Obbligo di Aggiornamento CHANGELOG
Ogni volta che un agente completa un task di codifica, deve obbligatoriamente:
1. Aprire `.spec/CHANGELOG.md`.
2. Valutare il tipo di modifica (PATCH/MINOR/MAJOR) secondo la logica di versioning.
3. Incrementare la versione e aggiungere una voce descrittiva sotto la versione corrente.
4. Includere nel commit message il numero di versione aggiornato (es. `feat(dashboard): grafico entrate - v0.2.0`).

### 3.5 Priorità di Implementazione

| Priorità | Feature | Stato |
|----------|---------|-------|
| ✅ P0 | Auth (email/password) | Fatto |
| ✅ P0 | Onboarding wizard | Fatto |
| ✅ P0 | Schema DB + migrazioni | Fatto |
| ✅ P1 | Dashboard (KPI + ProgressRings + grafici) | Fatto |
| ✅ P1 | Lavori CRUD con pagamento misto | Fatto |
| ✅ P1 | Clienti (rubrica) | Fatto |
| ✅ P2 | Preventivi (quotes) con auto-generazione | Fatto |
| ✅ P2 | Fatturazione (raggruppa lavori) | Fatto |
| ✅ P2 | Registro (ledger con statistiche) | Fatto |
| ✅ P2 | Uscite (expenses) | Fatto |
| ✅ P2 | Impostazioni (backup, sync, tema, audit) | Fatto |
| ✅ P3 | Guida Fiscale | Fatto |
| ✅ P3 | PWA (offline, installabile) | Fatto |
| ✅ P3 | Sync cross-device (Realtime) | Fatto |
| ✅ P3 | Calendario eventi personalizzati | Fatto |
| ✅ P3 | Tag per lavori/spese | Fatto |
| ⬜ | Condivisione pubblica commercialista | Fatto |
| ⬜ | Google OAuth | In attesa |
| ✅ | Fattura PDF export con QR e dati cliente | Fatto |

---

## 4. Tech Decision Records (TDR)

Quando si prende una decisione tecnica importante, registrarla qui.

### TDR-001: Zustand vs Context per tema e preferenze
- **Data:** 2026-06-03
- **Decisione:** Zustand.
- **Motivazione:** Performance (nessun re-render di massa), persistenza middleware automatica, accesso fuori dal React tree.
- **Alternative:** React Context (scartato per re-render a cascata).

### TDR-002: TanStack Query vs Supabase Client diretto
- **Data:** 2026-06-03
- **Decisione:** TanStack Query per dati server, Supabase client per auth/realtime.
- **Motivazione:** Cache granulare, optimistic updates, retry, deduplication richieste.
- **Alternative:** RTK Query (troppo boilerplate), SWR (meno features di caching).

### TDR-003: Glassmorphism vs Solido
- **Data:** 2026-06-03
- **Decisione:** Glassmorphism con `backdrop-filter: blur(25px)` e bordi 0.5px.
- **Motivazione:** Effetto visivo moderno e premium, differenzia NetFlow da siti contabili istituzionali, permette layering di informazioni senza appesantire visivamente.
- **Alternative:** Cards solide con ombre (troppo "istituzionale"), flat design (troppo semplice per dati finanziari).

### TDR-004: Layout con sidebar vs bottom bar
- **Data:** 2026-06-03
- **Decisione:** Sidebar su desktop/tablet, bottom bar su mobile.
- **Motivazione:** Sidebar dà accesso rapido a tutte le sezioni; bottom bar è ergonomica su mobile.
- **Alternative:** Sidebar sempre visibile (troppo ingombrante su mobile), bottom bar sempre (spreca spazio su desktop).

---

## 5. Prompt Template per Nuova Sessione IA

All'apertura di una nuova chat con un agente IA:

> Leggi i file in `.spec/` per capire il progetto completo.
>
> **Ruolo:** [Architect | Builder | QA]
>
> **Obiettivo:** Implementare [Nome Funzionalità] seguendo rigorosamente PRD.md e SCHEMA.md per la logica, ARCHITECTURE.md per la struttura, UI_UX_SPEC.md per lo stile.
>
> **Vincoli:**
> - TypeScript strict mode, niente `any`
> - Mobile-first
> - Nessun segnaposto
> - Glassmorphism: ogni card/modulo usa il pattern `GlassCard` (`bg-surface/60 backdrop-blur-3xl border border-white/[0.08]`).
> - Entrance animations: ogni modulo dashboard ha `initial={{ opacity: 0, scale: 0.9 }}` con Framer Motion.
> - SVG animati: `RadialProgress` e goal tracker "a petali" usano `stroke-dasharray`/`stroke-dashoffset` animati.
>
> Termina la sessione con il formato Handover Protocol della sezione 2.
