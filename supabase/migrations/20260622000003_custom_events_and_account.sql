-- Migration 014: Custom calendar events + account management RPCs

SET search_path = '';

-- ============================================================
-- 1. CUSTOM EVENTS (feature: libera creazione eventi calendario)
-- ============================================================
CREATE TABLE public.custom_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  date        date NOT NULL,
  color       text NOT NULL DEFAULT '#6C5CE7',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_custom_events_user ON public.custom_events(user_id);
CREATE INDEX idx_custom_events_date ON public.custom_events(date);

ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_events_user_isolation" ON public.custom_events
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================
-- 2. DELETE USER ACCOUNT RPC (distruzione totale account)
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := (select auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete auth user — this cascades to profiles and all child tables
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- ============================================================
-- 3. CLEAN USER DATA RPC (reset totale account, mantiene profilo)
-- ============================================================
CREATE OR REPLACE FUNCTION public.clean_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := (select auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.custom_events WHERE user_id = uid;
  DELETE FROM public.audit_log WHERE user_id = uid;
  DELETE FROM public.shares WHERE user_id = uid;
  DELETE FROM public.job_tags WHERE job_id IN (SELECT id FROM public.jobs WHERE user_id = uid);
  DELETE FROM public.expense_tags WHERE expense_id IN (SELECT id FROM public.expenses WHERE user_id = uid);
  DELETE FROM public.tags WHERE user_id = uid;
  DELETE FROM public.quotes WHERE user_id = uid;
  DELETE FROM public.invoice_jobs WHERE invoice_id IN (SELECT id FROM public.invoices WHERE user_id = uid);
  DELETE FROM public.invoices WHERE user_id = uid;
  DELETE FROM public.transactions WHERE user_id = uid;
  DELETE FROM public.expenses WHERE user_id = uid;
  DELETE FROM public.jobs WHERE user_id = uid;
  DELETE FROM public.clients WHERE user_id = uid;
END;
$$;
