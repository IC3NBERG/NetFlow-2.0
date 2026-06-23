# Regole di condotta

1. **CHANGELOG.md** — Ogni volta che modifichi codice, UI, DB, o file di specifica, aggiorna `.spec/CHANGELOG.md` con una entry datata prima di concludere. Se il cambiamento è minimo (PATCH), aggiungi una riga all'entry corrente. Se è significativo (MINOR/MAJOR), crea una nuova entry.

2. **Rispetto dei .spec/** — Ogni modifica deve essere coerente con i file in `.spec/`. In particolare:
   - `SCHEMA.md`: qualsiasi modifica al DB (tabella, colonna, tipo, RPC, trigger) deve essere documentata qui.
   - `UI_UX_SPEC.md`: componenti, stili, token, animazioni devono seguire le specifiche.
   - `ARCHITECTURE.md`: struttura progetto, pattern, provider, routing.
   - `PRD.md`: funzionalità implementate devono corrispondere ai requisiti.
   - `COMMANDS.md`: comandi di build/test/deploy.
   - `PROCESS_AND_AGENTS.md`: orchestrazione e ruoli.

3. **Summary** — Mantieni aggiornata la sezione "Progress" del summary con lo stato di ogni feature (done/in progress/blocked).

4. **TSC + build + test** — Prima di concludere un task, verifica sempre che `npx tsc --noEmit`, `npm run build` e i test passino.
