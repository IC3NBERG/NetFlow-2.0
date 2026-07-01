-- Migration: Fix client_id on invoices + correct get_client_portal_data RPC
-- The invoices table was missing client_id. 
-- We add it and derive it from linked jobs via invoice_jobs pivot.
-- Also fixes the quotes filter (already has client_id, just needed correct approach).

-- 1. Add client_id to invoices table
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);

-- 2. Backfill client_id on existing invoices from their linked jobs
UPDATE public.invoices i
SET client_id = (
  SELECT j.client_id
  FROM public.invoice_jobs ij
  JOIN public.jobs j ON j.id = ij.job_id
  WHERE ij.invoice_id = i.id
    AND j.client_id IS NOT NULL
  LIMIT 1
)
WHERE i.client_id IS NULL;

-- 3. Trigger: auto-set client_id on invoice from linked jobs when invoice_jobs row is inserted
CREATE OR REPLACE FUNCTION public.sync_invoice_client_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_client_id uuid;
BEGIN
  SELECT j.client_id INTO v_client_id
  FROM public.jobs j
  WHERE j.id = NEW.job_id
  LIMIT 1;

  IF v_client_id IS NOT NULL THEN
    UPDATE public.invoices
    SET client_id = v_client_id
    WHERE id = NEW.invoice_id AND client_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_invoice_job_inserted ON public.invoice_jobs;
CREATE TRIGGER on_invoice_job_inserted
  AFTER INSERT ON public.invoice_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_invoice_client_id();

-- 4. Fix get_client_portal_data RPC — use correct client_id columns
CREATE OR REPLACE FUNCTION public.get_client_portal_data(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  share_record public.shares;
  uid uuid;
  cid uuid;
  result jsonb;
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

  IF share_record.client_id IS NULL THEN
    RAISE EXCEPTION 'This share is not a client portal';
  END IF;

  uid := share_record.user_id;
  cid := share_record.client_id;

  UPDATE public.shares SET last_accessed = now(), view_count = view_count + 1 WHERE id = share_record.id;

  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p)::jsonb FROM public.profiles p WHERE p.id = uid),
    'client',  (SELECT row_to_json(c)::jsonb FROM public.clients c WHERE c.id = cid),
    'jobs', (
      SELECT COALESCE(jsonb_agg(row_to_json(j)::jsonb ORDER BY j.created_at DESC), '[]'::jsonb)
      FROM public.jobs j
      WHERE j.user_id = uid AND j.client_id = cid
    ),
    'invoices', (
      SELECT COALESCE(jsonb_agg(row_to_json(i)::jsonb ORDER BY i.issued_date DESC), '[]'::jsonb)
      FROM public.invoices i
      WHERE i.user_id = uid AND i.client_id = cid
    ),
    'quotes', (
      SELECT COALESCE(jsonb_agg(row_to_json(q)::jsonb ORDER BY q.issued_date DESC), '[]'::jsonb)
      FROM public.quotes q
      WHERE q.user_id = uid AND q.client_id = cid
    ),
    'share', (SELECT row_to_json(s)::jsonb FROM public.shares s WHERE s.id = share_record.id)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_client_portal_data(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_client_portal_data(text) TO anon, authenticated;
