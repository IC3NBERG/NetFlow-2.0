# Security Policy

## Segnalazione vulnerabilità

Per segnalare una vulnerabilità, apri una issue su GitHub o contatta il maintainer direttamente.

Non esporre dati finanziari sensibili in issue pubbliche.

## Best practice

### Credenziali e variabili d'ambiente
- Le credenziali Supabase (URL, anon key, service key) non devono mai essere committate
- Usa sempre `.env` per variabili d'ambiente locali
- Il file `.env` non va incluso nel repository (già in `.gitignore`)
- La service key Supabase va usata solo in contesti server-side (migrazioni DB, RPC SECURITY DEFINER)

### Database (Supabase)
- **RLS (Row Level Security):** Ogni tabella ha RLS abilitata con policy `user_isolation` che filtra per `auth.uid()`
- **SECURITY DEFINER:** Le funzioni RPC che accedono a dati cross-user (es. `get_shared_data`) usano SECURITY DEFINER e sono esplicitamente REVOKE EXECUTE da anon se non necessarie
- **Validazione input:** Tutte le operazioni CRUD passano da hook che sanitizzano i payload lato server
- **Trigger `updated_at`:** Ogni tabella ha un trigger automatico per la colonna `updated_at`

### Sincronizzazione offline
- Le operazioni offline vengono accodate in IndexedDB e sincronizzate al ritorno della connessione
- La sync queue usa `executeWithSync` che previene doppie esecuzioni
- OfflineQueuedError gestisce il fallback senza perdita dati

### Autenticazione
- Auth gestito via Supabase con email/password
- Le sessioni sono gestite tramite refresh token automatico
- La route `/shared/:token` usa token temporanei con scadenza configurabile

### Frontend
- Sanitizzazione URL allegati: validazione URL prima del render
- Nessun dato sensibile in console.log o errori esposti all'utente
- Error Boundary che cattura errori React senza esporre stack informativi
