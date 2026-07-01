-- Migration 029: Fix refresh_calendar_token — schema-qualify profiles reference
-- Same search_path bug as get_calendar_events_by_token (fixed in 028).
-- With SET search_path = '', unqualified table names fail at runtime.

CREATE OR REPLACE FUNCTION public.refresh_calendar_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_token text;
BEGIN
  new_token := replace(gen_random_uuid()::text, '-', '');
  UPDATE public.profiles
  SET calendar_token = new_token
  WHERE id = (select auth.uid());
  RETURN new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_calendar_token TO authenticated;
