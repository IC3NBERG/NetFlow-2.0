-- Migration 016: Shared data RPC for accountant access via share token

SET search_path = '';

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
BEGIN
  -- Validate token and get share record
  SELECT * INTO share_record FROM public.shares WHERE shares.token = get_shared_data.token;
  IF share_record.id IS NULL THEN
    RAISE EXCEPTION 'Share token not found';
  END IF;

  -- Check expiration
  IF share_record.expires_at IS NOT NULL AND share_record.expires_at < now() THEN
    RAISE EXCEPTION 'Share link expired';
  END IF;

  uid := share_record.user_id;

  -- Update last_accessed
  UPDATE public.shares SET last_accessed = now() WHERE id = share_record.id;

  -- Build result JSON
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p)::jsonb FROM public.profiles p WHERE p.id = uid),
    'jobs', (SELECT COALESCE(jsonb_agg(row_to_json(j)::jsonb), '[]'::jsonb) FROM public.jobs j WHERE j.user_id = uid ORDER BY j.created_at DESC),
    'clients', (SELECT COALESCE(jsonb_agg(row_to_json(c)::jsonb), '[]'::jsonb) FROM public.clients c WHERE c.user_id = uid ORDER BY c.name),
    'invoices', (SELECT COALESCE(jsonb_agg(row_to_json(i)::jsonb), '[]'::jsonb) FROM public.invoices i WHERE i.user_id = uid ORDER BY i.issued_date DESC),
    'expenses', (SELECT COALESCE(jsonb_agg(row_to_json(e)::jsonb), '[]'::jsonb) FROM public.expenses e WHERE e.user_id = uid ORDER BY e.date DESC),
    'quotes', (SELECT COALESCE(jsonb_agg(row_to_json(q)::jsonb), '[]'::jsonb) FROM public.quotes q WHERE q.user_id = uid ORDER BY q.issued_date DESC),
    'share', (SELECT row_to_json(s)::jsonb FROM public.shares s WHERE s.id = share_record.id)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_shared_data(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_shared_data(text) TO anon, authenticated;
