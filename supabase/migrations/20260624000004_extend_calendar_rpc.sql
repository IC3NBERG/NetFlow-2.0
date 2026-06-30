-- Migration 027: Extend get_calendar_events_by_token to include jobs and invoices
-- This was previously modified in migration 025 but after it was already applied to remote.
-- Now applied as a separate migration.

CREATE OR REPLACE FUNCTION public.get_calendar_events_by_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM profiles WHERE calendar_token = p_token;
  IF uid IS NULL THEN RETURN '[]'::json; END IF;

  RETURN (
    SELECT COALESCE(json_agg(sub ORDER BY sub.date ASC, sub.start_time ASC NULLS LAST), '[]'::json)
    FROM (
      SELECT ce.title, ce.description, ce.date::text AS date,
             ce.start_time::text AS start_time, ce.end_time::text AS end_time,
             ce.color, ce.created_at::text AS created_at
      FROM custom_events ce
      WHERE ce.user_id = uid

      UNION ALL

      SELECT 'Da incassare: ' || j.title, NULL, j.pending_date::text,
             NULL, NULL, NULL, j.created_at::text
      FROM jobs j
      WHERE j.user_id = uid AND j.pending_date IS NOT NULL

      UNION ALL

      SELECT 'Incassato: ' || j.title, NULL, j.end_date::text,
             NULL, NULL, NULL, j.created_at::text
      FROM jobs j
      WHERE j.user_id = uid AND j.end_date IS NOT NULL

      UNION ALL

      SELECT 'Scadenza fattura ' || i.invoice_number, NULL, i.due_date::text,
             NULL, NULL, NULL, i.created_at::text
      FROM invoices i
      WHERE i.user_id = uid AND i.due_date IS NOT NULL
    ) sub
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_calendar_events_by_token TO anon;
