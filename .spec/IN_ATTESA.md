# In Attesa

Cose da fare, rimandate a dopo.

## Google OAuth (Disabilitato)
- Attualmente rimosso da UI (LoginPage e RegisterPage).
- Per riattivare serve:
  - Creare OAuth client su Google Cloud Console
  - Ottenere `VITE_GOOGLE_CLIENT_ID` e inserirlo in `.env`
  - Abilitare Google provider in Supabase Auth settings
  - Riaggiungere il bottone nelle pagine di auth

## SMTP
- Configurare SMTP su Supabase (Gmail / SendGrid / Mailtrap)
- Necessario per:
  - Email di conferma registrazione
  - Email di reset password
  - Notifiche

## Deploy
- Caricare `dist/` su Cloudflare Pages o Vercel
- Testare PWA offline con SW reale

## Test con utenti reali
- Login email/password
- Flusso completo onboarding → lavori → fatture → registro
