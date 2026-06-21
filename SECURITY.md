# Security Policy

## Segnalazione vulnerabilità

Per segnalare una vulnerabilità, apri una issue su GitHub o contatta il maintainer direttamente.

Non esporre dati finanziari sensibili in issue pubbliche.

## Best practice

- Le credenziali Supabase (URL, anon key) non devono mai essere committate
- Usa sempre `.env` per variabili d'ambiente
- Il file `.env` non va incluso nel repository
- RLS policies su Supabase proteggono i dati a livello database
- Auth gestito via Supabase con email/password
