# Changelog - NetFlow 2.0

## [2026-07-01] - Aggiornamento Portale Clienti & Chat
### Aggiunto
- **Portale Clienti Dedicato**: Nuovo link di condivisione specifico per cliente, accessibile tramite token. Include visualizzazione limitata di lavori, fatture e preventivi associati.
- **Chat Integrata**: Sistema di messaggistica bidirezionale tra proprietario e cliente direttamente dal portale e dal pannello dell'app.
- **Notifiche Messaggi**: Nuova categoria di notifica `message` che avvisa il proprietario quando il cliente invia un messaggio tramite il portale, con link rapido.
- **Owner Chat Panel**: Interfaccia dedicata in `Settings > Condivisione` per rispondere ai clienti in tempo reale.
- Schermata di blocco di sicurezza (Accesso Limitato) per impedire al proprietario di visualizzare la vista cliente del proprio portale per errore.

### Modificato
- **Impostazioni Fiscali**: Salvataggio automatico durante la modifica dei dati fiscali dell'account.
- Isolata la configurazione fiscale per anno, garantendo che le informazioni storiche non vengano alterate dalle nuove modifiche (preservazione dati).
- **SharesManager UI**: Migliorata la separazione visiva e logica tra "Portali Clienti" e "Condivisioni Classiche".
- **Fatture & Lavori**: Relazione database aggiornata (`client_id` portato direttamente su fatture) tramite nuova migration e trigger.

### Sicurezza e Database
- 3 Nuove migrations (da `20260701000001` a `20260701000003`) applicate e allineate remotamente in Supabase.
- Configurate policies RLS (Row Level Security) per tabelle `shares`, `share_messages` e `invoices` relative al `client_id`.
