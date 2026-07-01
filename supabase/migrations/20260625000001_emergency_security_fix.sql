-- Migration 030: EMERGENCY SECURITY FIX
-- ============================================================
-- CONTENIMENTO IMMEDIATO (2026-07-01)
-- 
-- Vulnerabilità critiche corrette:
-- 1. shares_select RLS policy permetteva SELECT anon (auth.uid() IS NULL)
--    → chiunque poteva leggere TUTTI i token di condivisione
-- 2. password_hash salvata in chiaro (nessun hashing)
--    → password esposte via vulnerabilità #1
-- 3. get_shared_data / check_share_password / get_share_info granted TO anon
--    → anon poteva chiamare RPC senza alcuna autenticazione
-- 4. check_share_password senza rate limiting
--    → brute-force illimitato sulle password dei link
-- ============================================================

SET search_path = '';

-- ============================================================
-- 1. FIX RLS POLICY shares_select
--    Rimuove la condizione OR (select auth.uid()) IS NULL
--    che permetteva SELECT anon su TUTTA la tabella shares
-- ============================================================
DROP POLICY IF EXISTS "shares_select" ON public.shares;

-- Policy per utenti autenticati: vedono solo i propri share
CREATE POLICY "shares_select_authenticated" ON public.shares
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- Policy per INSERT/UPDATE/DELETE solo utente autenticato e proprietario
CREATE POLICY "shares_insert_authenticated" ON public.shares
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "shares_update_authenticated" ON public.shares
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "shares_delete_authenticated" ON public.shares
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- 2. FIX: Password hashing trigger per shares
--    Ogni password inserita/aggiornata viene hashata con bcrypt
-- ============================================================
CREATE OR REPLACE FUNCTION public.hash_share_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.password_hash IS NOT NULL AND NEW.password_hash !~ '^\$2[aby]\$' THEN
    NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf', 10));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_share_password_hash ON public.shares;
CREATE TRIGGER on_share_password_hash
  BEFORE INSERT OR UPDATE OF password_hash ON public.shares
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_share_password();

-- ============================================================
-- 3. REVOKE permessi anon su get_shared_data
--    Solo utenti autenticati possono chiamare questa RPC.
--    Per l'accesso pubblico via token, usare get_shared_data_by_token (nuova)
-- ============================================================
REVOKE ALL ON FUNCTION public.get_shared_data(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_shared_data(text) TO authenticated;

-- ============================================================
-- 4. NUOVA RPC: get_shared_data_by_token (pubblica ma sicura)
--    Accessibile ad anon ma richiede un token valido.
--    La sicurezza è garantita dal fatto che:
--      - I token non sono più enumerabili (RLS su shares bloccata)
--      - check_share_password ha rate limiting
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_shared_data_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  share_record public.shares;
  uid uuid;
  result jsonb;
  selected_sections text[];
BEGIN
  SELECT * INTO share_record FROM public.shares WHERE shares.token = p_token;
  IF share_record.id IS NULL THEN
    RAISE EXCEPTION 'Share token not found';
  END IF;

  IF NOT share_record.is_active THEN
    RAISE EXCEPTION 'Share link disabled';
  END IF;

  IF share_record.expires_at IS NOT NULL AND share_record.expires_at < now() THEN
    RAISE EXCEPTION 'Share link expired';
  END IF;

  IF share_record.max_views IS NOT NULL AND share_record.view_count >= share_record.max_views THEN
    RAISE EXCEPTION 'Share link max views reached';
  END IF;

  uid := share_record.user_id;

  UPDATE public.shares SET last_accessed = now(), view_count = view_count + 1 WHERE id = share_record.id;

  selected_sections := ARRAY(SELECT jsonb_array_elements_text(share_record.sections));

  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p)::jsonb FROM public.profiles p WHERE p.id = uid),
    'jobs', CASE WHEN 'jobs' = ANY(selected_sections)
      THEN (SELECT COALESCE(jsonb_agg(row_to_json(j)::jsonb ORDER BY j.created_at DESC), '[]'::jsonb) FROM public.jobs j WHERE j.user_id = uid)
      ELSE '[]'::jsonb END,
    'clients', CASE WHEN 'clients' = ANY(selected_sections)
      THEN (SELECT COALESCE(jsonb_agg(row_to_json(c)::jsonb ORDER BY c.name), '[]'::jsonb) FROM public.clients c WHERE c.user_id = uid)
      ELSE '[]'::jsonb END,
    'invoices', CASE WHEN 'invoices' = ANY(selected_sections)
      THEN (SELECT COALESCE(jsonb_agg(row_to_json(i)::jsonb ORDER BY i.issued_date DESC), '[]'::jsonb) FROM public.invoices i WHERE i.user_id = uid)
      ELSE '[]'::jsonb END,
    'expenses', CASE WHEN 'expenses' = ANY(selected_sections)
      THEN (SELECT COALESCE(jsonb_agg(row_to_json(e)::jsonb ORDER BY e.date DESC), '[]'::jsonb) FROM public.expenses e WHERE e.user_id = uid)
      ELSE '[]'::jsonb END,
    'quotes', CASE WHEN 'quotes' = ANY(selected_sections)
      THEN (SELECT COALESCE(jsonb_agg(row_to_json(q)::jsonb ORDER BY q.issued_date DESC), '[]'::jsonb) FROM public.quotes q WHERE q.user_id = uid)
      ELSE '[]'::jsonb END,
    'share', (SELECT row_to_json(s)::jsonb FROM public.shares s WHERE s.id = share_record.id)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_data_by_token(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_shared_data_by_token(text) TO anon, authenticated;

-- ============================================================
-- 5. RATE LIMITING su check_share_password
--    Blocca dopo 5 tentativi falliti per 15 minuti
-- ============================================================
ALTER TABLE public.shares
  ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;

CREATE OR REPLACE FUNCTION public.check_share_password(p_token text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  pw_hash text;
  attempts integer;
  lock_time timestamptz;
BEGIN
  SELECT password_hash, failed_attempts, locked_until
    INTO pw_hash, attempts, lock_time
    FROM public.shares WHERE token = p_token;

  IF pw_hash IS NULL THEN
    RETURN true; -- No password set
  END IF;

  -- Check if locked
  IF lock_time IS NOT NULL AND lock_time > now() THEN
    RAISE EXCEPTION 'Troppi tentativi. Riprova tra qualche minuto.';
  END IF;

  -- Reset lock if expired
  IF lock_time IS NOT NULL AND lock_time <= now() THEN
    UPDATE public.shares SET failed_attempts = 0, locked_until = NULL WHERE token = p_token;
    attempts := 0;
    lock_time := NULL;
  END IF;

  IF crypt(p_password, pw_hash) = pw_hash THEN
    -- Success: reset counter
    UPDATE public.shares SET failed_attempts = 0 WHERE token = p_token;
    RETURN true;
  ELSE
    -- Failed: increment counter
    attempts := attempts + 1;
    IF attempts >= 5 THEN
      UPDATE public.shares
        SET failed_attempts = attempts, locked_until = now() + interval '15 minutes'
        WHERE token = p_token;
    ELSE
      UPDATE public.shares SET failed_attempts = attempts WHERE token = p_token;
    END IF;
    RETURN false;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.check_share_password(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_share_password(text, text) TO anon, authenticated;

-- ============================================================
-- 6. FIX get_share_info — rimuovere GRANT TO anon
--    Non serve più, il frontend usa get_shared_data_by_token
-- ============================================================
REVOKE ALL ON FUNCTION public.get_share_info(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_share_info(text) TO authenticated;
