-- Migration 023: Fix audit trigger and account management RPCs to prevent constraint failures and incomplete cleanup
SET search_path = '';

-- ============================================================
-- 1. Redefine audit_trigger to support bypass and check profile existence
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  uid uuid;
BEGIN
  -- Check if audit logging is bypassed for this transaction
  IF current_setting('fintrack.bypass_audit', true) = 'true' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  uid := (select auth.uid());
  IF uid IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Verify user profile still exists to prevent FK violation constraints during profile cascade delete
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid) THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, table_name, record_id, operation, new_data)
    VALUES (uid, TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, table_name, record_id, operation, old_data, new_data)
    VALUES (uid, TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, table_name, record_id, operation, old_data)
    VALUES (uid, TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
END;
$$;

-- ============================================================
-- 2. Redefine clean_user_data with bypass_audit setting
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

  -- Set bypass_audit to true for the duration of this transaction
  PERFORM set_config('fintrack.bypass_audit', 'true', true);

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

-- ============================================================
-- 3. Redefine delete_user_account with bypass_audit setting
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

  -- Set bypass_audit to true for the duration of this transaction
  PERFORM set_config('fintrack.bypass_audit', 'true', true);

  -- Delete auth user — this cascades to profiles and all child tables
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- Re-verify revokes
REVOKE EXECUTE ON FUNCTION public.clean_user_data() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon;
