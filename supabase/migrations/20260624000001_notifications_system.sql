-- Migration 024: Enhanced Notifications System
-- Adds persistent notifications table and per-category preferences

-- 1. Notifications table
CREATE TABLE public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category        text NOT NULL CHECK (category IN ('deadline','invoice','backup','sync','goal','quote','expense','system')),
  title           text NOT NULL,
  message         text NOT NULL,
  link            text,
  icon            text,
  is_read         boolean NOT NULL DEFAULT false,
  is_dismissed    boolean NOT NULL DEFAULT false,
  dismissed_at    timestamptz,
  read_at         timestamptz,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_dismissed;
CREATE INDEX idx_notifications_category ON notifications(user_id, category);
CREATE INDEX idx_notifications_created ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 2. Add notification_preferences column to user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{
    "deadline": true,
    "invoice": true,
    "backup": true,
    "sync": true,
    "goal": true,
    "quote": true,
    "expense": true,
    "system": true
  }';

-- 3. Add backup_reminder_interval_days column to user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS backup_reminder_interval_days integer NOT NULL DEFAULT 7;

-- 4. RPC to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE id = p_notification_id AND user_id = (select auth.uid());
END;
$$;

-- 5. RPC to dismiss notification
CREATE OR REPLACE FUNCTION public.dismiss_notification(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.notifications
  SET is_dismissed = true, dismissed_at = now()
  WHERE id = p_notification_id AND user_id = (select auth.uid());
END;
$$;

-- 6. RPC to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE user_id = (select auth.uid()) AND NOT is_read AND NOT is_dismissed;
END;
$$;

-- 7. RPC to clear dismissed notifications older than N days
CREATE OR REPLACE FUNCTION public.cleanup_notifications(p_older_than_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.notifications
  WHERE user_id = (select auth.uid())
    AND is_dismissed = true
    AND dismissed_at < now() - (p_older_than_days || ' days')::interval;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 8. RPC to get unread notification count per category
CREATE OR REPLACE FUNCTION public.get_unread_notification_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_object_agg(category, count)
  INTO result
  FROM (
    SELECT category, COUNT(*)::int as count
    FROM public.notifications
    WHERE user_id = (select auth.uid())
      AND NOT is_read
      AND NOT is_dismissed
    GROUP BY category
  ) sub;
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;
