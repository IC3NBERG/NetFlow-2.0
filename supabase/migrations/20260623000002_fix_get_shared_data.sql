-- Migration 018: Fix get_shared_data — ORDER BY inside jsonb_agg
-- Root cause: ORDER BY was placed OUTSIDE jsonb_agg aggregate function
-- causing PostgreSQL error 42803:
--   "column j.created_at must appear in the GROUP BY clause or be used in an aggregate function"
-- Fix: move ORDER BY inside jsonb_agg(... ORDER BY col) syntax
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
  SELECT * INTO share_record FROM public.shares WHERE shares.token = get_shared_data.token;
  IF share_record.id IS NULL THEN
    RAISE EXCEPTION 'Share token not found';
  END IF;

  IF share_record.expires_at IS NOT NULL AND share_record.expires_at < now() THEN
    RAISE EXCEPTION 'Share link expired';
  END IF;

  uid := share_record.user_id;

  UPDATE public.shares SET last_accessed = now() WHERE id = share_record.id;

  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p)::jsonb FROM public.profiles p WHERE p.id = uid),
    'jobs', (SELECT COALESCE(jsonb_agg(row_to_json(j)::jsonb ORDER BY j.created_at DESC), '[]'::jsonb) FROM public.jobs j WHERE j.user_id = uid),
    'clients', (SELECT COALESCE(jsonb_agg(row_to_json(c)::jsonb ORDER BY c.name), '[]'::jsonb) FROM public.clients c WHERE c.user_id = uid),
    'invoices', (SELECT COALESCE(jsonb_agg(row_to_json(i)::jsonb ORDER BY i.issued_date DESC), '[]'::jsonb) FROM public.invoices i WHERE i.user_id = uid),
    'expenses', (SELECT COALESCE(jsonb_agg(row_to_json(e)::jsonb ORDER BY e.date DESC), '[]'::jsonb) FROM public.expenses e WHERE e.user_id = uid),
    'quotes', (SELECT COALESCE(jsonb_agg(row_to_json(q)::jsonb ORDER BY q.issued_date DESC), '[]'::jsonb) FROM public.quotes q WHERE q.user_id = uid),
    'share', (SELECT row_to_json(s)::jsonb FROM public.shares s WHERE s.id = share_record.id)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_shared_data(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_shared_data(text) TO anon, authenticated;
