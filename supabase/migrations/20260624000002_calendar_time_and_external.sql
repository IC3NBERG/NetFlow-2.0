-- Migration 025: Calendar time slots + external calendar connection
-- Adds time support to custom_events, external calendar token, and ICS feed

-- 1. Add time columns to custom_events
ALTER TABLE custom_events
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time;

-- 2. Add calendar_token to profiles (unique, for ICS feed subscription)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS calendar_token text UNIQUE;

-- Generate a unique token for all existing profiles that don't have one
-- Note: gen_random_uuid() is built-in PG13+, no extension needed.

UPDATE profiles
SET calendar_token = replace(gen_random_uuid()::text, '-', '')
WHERE calendar_token IS NULL;

-- Ensure future profiles get a token on insert
CREATE OR REPLACE FUNCTION public.ensure_calendar_token()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.calendar_token IS NULL THEN
    NEW.calendar_token := replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_calendar_token
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_calendar_token();

-- 3. Calendar feeds table (external calendar connections)
CREATE TABLE public.calendar_feeds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider        text NOT NULL CHECK (provider IN ('ics', 'google', 'apple', 'outlook')),
  name            text NOT NULL,
  sync_url        text,
  last_synced_at  timestamptz,
  enabled         boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_calendar_feeds_user ON calendar_feeds(user_id);
CREATE INDEX idx_calendar_feeds_enabled ON calendar_feeds(user_id, enabled);

ALTER TABLE calendar_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_feeds_select" ON calendar_feeds
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "calendar_feeds_insert" ON calendar_feeds
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_feeds_update" ON calendar_feeds
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_feeds_delete" ON calendar_feeds
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER on_calendar_feeds_updated
  BEFORE UPDATE ON calendar_feeds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. RPC to return calendar events by token (public, for ICS feed)
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
    SELECT COALESCE(json_agg(json_build_object(
      'title', ce.title,
      'description', ce.description,
      'date', ce.date::text,
      'start_time', ce.start_time::text,
      'end_time', ce.end_time::text,
      'color', ce.color,
      'created_at', ce.created_at::text
    ) ORDER BY ce.date ASC, ce.start_time ASC NULLS LAST), '[]'::json)
    FROM custom_events ce
    WHERE ce.user_id = uid
  );
END;
$$;

-- Allow anon to execute this RPC (token-based access, no auth required)
GRANT EXECUTE ON FUNCTION public.get_calendar_events_by_token TO anon;

-- 5. RPC to generate/refresh calendar token
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
  UPDATE profiles
  SET calendar_token = new_token
  WHERE id = (select auth.uid());
  RETURN new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_calendar_token TO authenticated;
