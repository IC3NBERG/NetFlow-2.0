# Debugging, Repair & Maintenance Protocol

## 1. Gerarchia di Intervento (Priorità)
In caso di malfunzionamento, l'agente (Builder o QA) deve affrontare il problema seguendo questo ordine di criticità:
1. **Integrità del Dato (Data Integrity):** Errori nei calcoli Carta/Cash, mancata sincronizzazione o corruzione dello stato locale.
2. **Stato della PWA:** Malfunzionamenti del Service Worker, errori di caching o blocco della modalità offline.
3. **Regressioni UI/UX:** Rottura del layout Glassmorphic, perdita di trasparenze o animazioni Framer Motion frammentate.

---

## 2. Error Scenarios & Fixes

### 2.1 Tabella Scenari

| Sintomo | Causa Probabile | Procedura di Fix |
|---|---|---|
| Saldo totale errato nella Dashboard | `calculateMetrics` ignora `include_cash_in_invoice` o IRPEF in % | 1. Ispezionare `src/lib/calculations.ts` e `src/lib/tax.ts` (`normalizeIrpefRate`). 2. Verificare `balance = net_settled - expenses`. 3. Eseguire `npm run test`. |
| Job `completed_settled` senza transazione | Trigger `on_job_status_change` non attivo o job incassato via fattura | 1. Query: `SELECT * FROM transactions WHERE job_id = '<id>'`. 2. Verificare migration `20260617000002`. 3. UI legge `jobs`; `transactions` è audit trail DB. |
| Dati non sincronizzati tra dispositivi | Realtime disabilitato o conflitto sync | 1. Verificare `useRealtimeSync` attivo. 2. Controllare `useSyncStatus()` — stato `conflict` su HTTP 409. 3. `queryClient.invalidateQueries()`. |
| PWA non si aggiorna dopo il deploy | Service Worker bloccato su versione precedente | Seguire **3.1 Hard Reset**. |
| Schermata bianca / crash al caricamento | Errore in una query Supabase o stato iniziale corrotto in Zustand | 1. Aprire console → cercare errori rete/JS. 2. `localStorage.clear()` e ricaricare. 3. Se persiste, è un bug nel rendering conditionale — cercare `?.` mancanti. |
| Animazioni glassmorphic framerate basso | `backdrop-filter` applicato su troppi elementi nidificati | 1. Ispezionare con DevTools → Performance. 2. Rimuovere `backdrop-filter` dai figli diretti di elementi con già `backdrop-filter`. 3. Sostituire con colore solido opaco su nodi profondi. |
| Pop-up di sistema fuori posizione o nascosto | Z-index conflict o contenitore padre con `overflow: hidden` | Verificare che i pop-up (Backup/Sync/Error) usino `className="fixed inset-0 z-[999]"` e siano fuori dal flusso dei contenitori scrollabili. |
| Offline queue non si svuota | Sync fallisce silenziosamente e la coda si accumula | 1. IndexedDB `fintrack-sync` → store `queue`. 2. Controllare `navigator.onLine` e `SyncProvider`. 3. Impostazioni → Hard reset PWA. |

### 2.2 Dati "Misti" — Protocollo Specifico
Se un lavoro con `payment_method = 'mixed'` presenta discrepanze tra totale reale e fattura:
1. Verificare `include_cash_in_invoice` sul job.
2. Calcolare manualmente: `invoice_total = amount_card + (include_cash_in_invoice ? amount_cash : 0)`.
3. Confrontare con `invoices.gross_amount` / `invoices.net_amount`.
4. Se il mapping è corrotto, rieseguire `mapJobToInvoice(job)` forzando i valori grezzi da `jobs` (non da cache Zustand).

---

## 3. Sync Conflict Resolution

### 3.1 Strategia di Merge
```
           Stato Locale (Zustand)     Stato Remoto (Supabase)
                   │                          │
                   └─────────┬───────────────┘
                             │
                    ┌────────▼────────┐
                    │  Confronta      │
                    │  `updated_at`    │
                    └────────┬────────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
         Locale > Remoto              Remoto >= Locale
               │                           │
     [Local vince]                   [Remote vince]
     Push ottimistico               Pull & sovrascrivi
     (con retry se 409)             locale + refetch
```

### 3.2 Caso Limite: Stesso `updated_at`
Se i timestamp sono identici ma i dati divergono:
- **Job / Transaction:** vince il record con più campi popolati (merge conservativo).
- **Profile / Settings:** vince remoto (fonte di verità).
- **Offline Queue:** priorità FIFO; se in conflitto, loggare l'evento e notificare l'utente.

### 3.3 Rilevamento Conflitti
- `syncManager` espone `useSyncStatus()` con stati: `idle | syncing | conflict | error` (implementato in `SyncProvider.tsx`).
- In caso di `conflict`, mostrare un alert systems: "Conflitto di sincronizzazione rilevato. Usa i dati più recenti?"

---

## 4. Protocollo di Debugging per l'IA
Prima di modificare il codice, l'agente deve eseguire una diagnosi basata su:

### 4.1 Tracciamento del Flusso Finanziario
- **Ispezione Stato:** Verificare lo stato globale (Zustand) confrontandolo con i dati in `localstorage` e nel database remoto.
- **Log di Calcolo:** Ogni funzione di calcolo (es. `calculateNetProfit`) deve includere log granulari che separano `amount_card` e `amount_cash`.
- **Check delle Relazioni:** Verificare che ogni `Job` con stato `COMPLETED_SETTLED` abbia una transazione corrispondente nel registro.

### 4.2 Strumenti di Diagnostica (DevTools Console)
Snippet replicabili per ispezione rapida:

```js
// Ispezionare stato Zustand
window.__ZUSTAND_STORE__ = window.__ZUSTAND_STORE__ || useStore.getState();
console.table(window.__ZUSTAND_STORE__);

// Controllare offline queue (IndexedDB)
openDB('fintrack-sync').then(db => db.getAll('queue')).then(console.log);

// Verificare cache PWA
caches.open('v0-assets').then(c => c.keys()).then(console.log);

// Confronto job locale vs remoto
const localJobs = useStore.getState().jobs;
const { data: remoteJobs } = await supabase.from('jobs').select('*');
console.log('Diff:', localJobs.filter(j => !remoteJobs.find(r => r.id === j.id)));

// Controllare Service Worker stato
navigator.serviceWorker.controller?.postMessage({ type: 'STATUS' });
```

### 4.3 Debugging UI (Visual Repair)
- **Blur & Backdrop Check:** In caso di cali di performance, verificare che l'effetto `backdrop-filter` non sia applicato a elementi nidificati eccessivi.
- **Z-Index Auditing:** Verificare che i pop-up di sistema (Backup/Sync) siano sempre al livello `z-[999]` e centrati nello schermo.

---

## 5. Procedure di Ripristino (Fixing)

### 5.1 Hard Reset della PWA
1. **Notificare l'utente:** Mostrare l'alert "Sincronizzazione forzata in corso..." con barra di progresso.
2. **Forzare SW update:**
   ```js
   const registration = await navigator.serviceWorker.ready;
   registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
   ```
3. **Svuotare cache:**
   ```js
   await caches.delete('v0-assets');
   await caches.delete('v0-data');
   ```
4. **Refetch completo:** Invalidare TanStack Query con `queryClient.invalidateQueries()`.
5. **Ricaricare:** `window.location.reload()`.

> **Nota:** Se l'utente ha più tab aperti, `SKIP_WAITING` su un tab non controlla gli altri. In quel caso, usare `registration.update()` su ogni tab o suggerire all'utente di chiudere/ricaricare tutte le finestre.

### 5.2 Rollback Rapido
Se un fix introduce una regressione grave:
1. `git revert HEAD --no-edit` (o `git reset --hard HEAD~1` se non pushato).
2. Se la migration Supabase è stata alterata: `supabase migration repair --status reverted <timestamp>`.
3. Eseguire il **Regression Testing** completo (Sezione 6) prima di riprovare il fix.

### 5.3 Correzione Dati "Misti"
Se un lavoro presenta discrepanze tra il totale reale e quello in fattura:
- Verificare il valore del flag `include_cash_in_invoice`.
- Rieseguire la funzione di mapping per il modulo `documenti_fiscali` basandosi sui valori grezzi di `jobs`.

---

## 6. Regression Testing
Dopo ogni riparazione, l'agente deve confermare che:
- [ ] Il calcolo del saldo totale sia rimasto coerente.
- [ ] La PWA sia ancora installabile e funzionante offline.
- [ ] Le animazioni del Tracker Circolare non presentino glitch grafici.
- [ ] La sync queue si svuoti correttamente dopo un ciclo online/offline/online.
- [ ] Nessun warning in console per `backdrop-filter` o z-index.

---

## 7. Repair Log

### 7.1 Template per CHANGELOG.md
Ogni riparazione significativa DEVE essere documentata con questo formato:

```markdown
### Fixed
- **Fix:** [descrizione breve]
- **File modificati:** `src/file1.ts`, `src/file2.ts`
- **Root cause:** [causa primaria]
- **Scenari coperti:** [riferimento alla sezione 2.x]
- **Versione:** [+0.0.1]
```

### 7.2 Esempio Concreto
```markdown
### Fixed
- **Fix:** Corretto calcolo `calculateNetProfit` per lavori misti — ora somma `amount_cash` solo se `include_cash_in_invoice = true`.
- **File modificati:** `src/lib/calculations.ts`, `src/hooks/useFinancialSummary.ts`
- **Root cause:** La funzione ignorava il flag `include_cash_in_invoice` nei job con `payment_method = 'mixed'`.
- **Scenari coperti:** 2.1 (saldo errato), 2.2 (dati misti)
- **Versione:** v0.4.1
```
