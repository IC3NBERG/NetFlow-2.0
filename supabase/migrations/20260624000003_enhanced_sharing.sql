-- Migration 026: Enhanced sharing system — premium features
-- Adds password protection, section selection, view tracking, active toggle

-- 1. Enhance shares table with premium features
ALTER TABLE shares
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS max_views integer,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sections jsonb NOT NULL DEFAULT '["jobs","clients","invoices","expenses","quotes"]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_shares_active ON shares(user_id, is_active);

-- 2. Update get_shared_data RPC to handle enhanced features
CREATE OR REPLACE FUNCTION public.get_shared_data(token text)
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
  SELECT * INTO share_record FROM public.shares WHERE shares.token = get_shared_data.token;
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

REVOKE EXECUTE ON FUNCTION public.get_shared_data(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_shared_data(text) TO anon, authenticated;

-- 3. Add has_password field to RPC response helper (computed from password_hash)
CREATE OR REPLACE FUNCTION public.check_share_password(p_token text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  pw_hash text;
BEGIN
  SELECT password_hash INTO pw_hash FROM public.shares WHERE token = p_token;
  IF pw_hash IS NULL THEN
    RETURN true; -- No password set
  END IF;
  RETURN pw_hash = crypt(p_password, pw_hash);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_share_password(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_share_password(text, text) TO anon;

-- 4. New RPC: get_share_info (public) — returns minimal info for password gate
CREATE OR REPLACE FUNCTION public.get_share_info(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  share_record public.shares;
BEGIN
  SELECT * INTO share_record FROM public.shares WHERE shares.token = p_token;
  IF share_record.id IS NULL THEN
    RAISE EXCEPTION 'Share token not found';
  END IF;

  RETURN jsonb_build_object(
    'has_password', share_record.password_hash IS NOT NULL,
    'name', share_record.name,
    'description', share_record.description,
    'access_level', share_record.access_level
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_share_info(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_share_info(text) TO anon, authenticated;
