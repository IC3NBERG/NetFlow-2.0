-- Migration 028: Fix get_calendar_events_by_token — schema-qualify all table references
-- With SET search_path = '', unqualified names fail. All tables must use public. prefix.

CREATE OR REPLACE FUNCTION public.get_calendar_events_by_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM public.profiles WHERE calendar_token = p_token;
  IF uid IS NULL THEN RETURN '[]'::json; END IF;

  RETURN (
    SELECT COALESCE(json_agg(sub ORDER BY sub.date ASC, sub.start_time ASC NULLS LAST), '[]'::json)
    FROM (
      SELECT ce.title, ce.description, ce.date::text AS date,
             ce.start_time::text AS start_time, ce.end_time::text AS end_time,
             ce.color, ce.created_at::text AS created_at
      FROM public.custom_events ce
      WHERE ce.user_id = uid

      UNION ALL

      SELECT 'Da incassare: ' || j.title, NULL, j.pending_date::text,
             NULL, NULL, NULL, j.created_at::text
      FROM public.jobs j
      WHERE j.user_id = uid AND j.pending_date IS NOT NULL

      UNION ALL

      SELECT 'Incassato: ' || j.title, NULL, j.end_date::text,
             NULL, NULL, NULL, j.created_at::text
      FROM public.jobs j
      WHERE j.user_id = uid AND j.end_date IS NOT NULL

      UNION ALL

      SELECT 'Scadenza fattura ' || i.invoice_number, NULL, i.due_date::text,
             NULL, NULL, NULL, i.created_at::text
      FROM public.invoices i
      WHERE i.user_id = uid AND i.due_date IS NOT NULL
    ) sub
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_calendar_events_by_token TO anon;
