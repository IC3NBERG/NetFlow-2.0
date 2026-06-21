# Project Commands & Local Development

## 1. Setup Iniziale
```bash
npm install           # Installa tutte le dipendenze
cp .env.example .env  # Crea file env con placeholder (personalizza dopo)
npx supabase login    # Collega ambiente locale al database
```

## 2. Anteprima Locale
```bash
npm run dev           # Server sviluppo (http://localhost:5173)
npm run build && npm run preview   # Build produzione + preview PWA
```
> **Nota:** Solo `npm run preview` testa correttamente i Service Worker della PWA.

## 3. Test & Qualità
```bash
npm run lint          # Verifica errori formali TypeScript/React
npx tsc               # Controllo dei tipi (obbligatorio per dati finanziari)
npm run test:e2e      # Test E2E con Playwright (headless)
npm run test:e2e:ui   # Test E2E con Playwright UI mode
```

## 4. Database (Supabase)
```bash
npx supabase start    # Avvia il database locale
npx supabase stop     # Ferma il database locale
npx supabase db push  # Applica le migrazioni al DB remoto
```

## 5. Deploy (Cloudflare Pages)
```bash
npm run build                    # Genera dist/
npx wrangler pages deploy dist/  # Deploy su Cloudflare Pages
```
In alternativa, collegare il repo Git su https://dash.cloudflare.com → **Pages**:
- **Build command:** `npm run build`
- **Build output:** `dist/`
- **Env vars (produzione):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Env vars (preview):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## 6. Variabili d'Ambiente
```bash
VITE_SUPABASE_URL=https://zkbyuhxnrehybkuaezte.supabase.co  # URL progetto Supabase
VITE_SUPABASE_ANON_KEY=your-anon-key                         # Chiave anonima Supabase
VITE_GOOGLE_CLIENT_ID=your-google-client-id                  # Client ID Google OAuth (non usato)
```

## 7. Troubleshooting PWA
Se la PWA mostra dati vecchi o non si aggiorna:
1. Apri DevTools (F12) → **Application** → **Service Workers**
2. Clicca **Unregister**
3. Ricarica la pagina (Cmd+R / Ctrl+R)
