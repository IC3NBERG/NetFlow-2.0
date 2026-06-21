-- Migration: 010_fix_triggers_and_rls
-- Description: Fix duplicate transactions on invoice payment, re-settlement guard, invoice_jobs RLS, security hardening

-- 1. handle_job_status_change: skip duplicate transactions + skip when settled via paid invoice
CREATE OR REPLACE FUNCTION public.handle_job_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'completed_pending' AND (OLD.status IS NULL OR OLD.status <> 'completed_pending') THEN
    NEW.pending_date = COALESCE(NEW.pending_date, CURRENT_DATE);
  END IF;

  IF NEW.status = 'completed_settled' AND (OLD.status IS NULL OR OLD.status <> 'completed_settled') THEN
    NEW.end_date = COALESCE(NEW.end_date, CURRENT_DATE);

    -- Skip if transaction already exists (re-settlement guard)
    IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE job_id = NEW.id) THEN
      -- Skip if job is linked to a paid invoice (invoice trigger records payment)
      IF NOT EXISTS (
        SELECT 1 FROM public.invoice_jobs ij
        JOIN public.invoices i ON i.id = ij.invoice_id
        WHERE ij.job_id = NEW.id AND i.status = 'paid'
      ) THEN
        INSERT INTO public.transactions (job_id, user_id, type, description, amount, category, is_settled, date)
        VALUES (
          NEW.id,
          NEW.user_id,
          'income',
          'Incasso: ' || NEW.title,
          NEW.amount_card + CASE WHEN NEW.include_cash_in_invoice THEN NEW.amount_cash ELSE 0 END,
          'job_payment',
          true,
          COALESCE(NEW.end_date, CURRENT_DATE)
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. handle_invoice_paid: add category on transaction insert
CREATE OR REPLACE FUNCTION public.handle_invoice_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    INSERT INTO public.transactions (invoice_id, user_id, type, description, amount, category, is_settled, date)
    VALUES (
      NEW.id,
      NEW.user_id,
      'income',
      'Fattura: ' || NEW.invoice_number,
      NEW.net_amount,
      'invoice_payment',
      true,
      COALESCE(NEW.paid_date, CURRENT_DATE)
    );

    UPDATE public.jobs
    SET status = 'completed_settled'
    WHERE id IN (
      SELECT job_id FROM public.invoice_jobs WHERE invoice_id = NEW.id
    )
    AND status <> 'completed_settled';
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Harden trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_job_status_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_invoice_paid() FROM anon, authenticated, public;

-- 4. invoice_jobs RLS: require job ownership on insert
DROP POLICY IF EXISTS "Users can insert own invoice_jobs" ON invoice_jobs;

CREATE POLICY "Users can insert own invoice_jobs" ON invoice_jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_id AND (select auth.uid()) = invoices.user_id
    )
    AND EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_id AND (select auth.uid()) = jobs.user_id
    )
  );
