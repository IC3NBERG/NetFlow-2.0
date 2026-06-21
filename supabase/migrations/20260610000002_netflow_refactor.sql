-- Migration: 002_netflow_refactor
-- Description: invoice_jobs pivot, invoice_id in transactions, referential integrity
-- Date: 2026-06-10

-- 1. Create invoice_jobs pivot table
CREATE TABLE invoice_jobs (
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  job_id     uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (invoice_id, job_id)
);

CREATE INDEX idx_invoice_jobs_invoice ON invoice_jobs(invoice_id);
CREATE INDEX idx_invoice_jobs_job ON invoice_jobs(job_id);

-- 2. Migrate existing data from invoices.job_ids to invoice_jobs
INSERT INTO invoice_jobs (invoice_id, job_id)
SELECT id, unnest(job_ids)
FROM invoices
WHERE job_ids IS NOT NULL AND array_length(job_ids, 1) > 0;

-- 3. Add invoice_id to transactions (nullable, FK)
ALTER TABLE transactions ADD COLUMN invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL;
CREATE INDEX idx_transactions_invoice ON transactions(invoice_id);

-- 4. Drop job_ids array column from invoices
ALTER TABLE invoices DROP COLUMN job_ids;

-- 5. RLS for invoice_jobs
ALTER TABLE invoice_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoice_jobs" ON invoice_jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND invoices.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own invoice_jobs" ON invoice_jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND invoices.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own invoice_jobs" ON invoice_jobs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND invoices.user_id = auth.uid())
  );

-- 6. Update handle_job_settled to skip if transaction already exists for this job
CREATE OR REPLACE FUNCTION public.handle_job_settled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'completed_settled' AND (OLD.status IS NULL OR OLD.status <> 'completed_settled') THEN
    IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE job_id = NEW.id) THEN
      INSERT INTO public.transactions (job_id, user_id, type, description, amount, is_settled, date)
      VALUES (
        NEW.id,
        NEW.user_id,
        'income',
        'Incasso: ' || NEW.title,
        NEW.amount_card + CASE WHEN NEW.include_cash_in_invoice THEN NEW.amount_cash ELSE 0 END,
        true,
        COALESCE(NEW.end_date, CURRENT_DATE)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Trigger: auto-create single transaction when invoice is marked paid
CREATE OR REPLACE FUNCTION public.handle_invoice_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    -- Create a single transaction for the invoice total
    INSERT INTO public.transactions (invoice_id, user_id, type, description, amount, is_settled, date)
    VALUES (
      NEW.id,
      NEW.user_id,
      'income',
      'Fattura: ' || NEW.invoice_number,
      NEW.net_amount,
      true,
      COALESCE(NEW.paid_date, CURRENT_DATE)
    );

    -- Mark all linked jobs as settled
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

CREATE TRIGGER on_invoice_paid
  AFTER UPDATE OF status ON public.invoices
  FOR EACH ROW
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION public.handle_invoice_paid();
