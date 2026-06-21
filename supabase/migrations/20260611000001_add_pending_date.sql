-- Migration: 002_add_pending_date
-- Description: Add pending_date to jobs, auto-set dates on status change

ALTER TABLE jobs ADD COLUMN pending_date date;

-- Drop and recreate the trigger function to handle all status transitions
CREATE OR REPLACE FUNCTION public.handle_job_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Auto-set pending_date when status becomes completed_pending
  IF NEW.status = 'completed_pending' AND (OLD.status IS NULL OR OLD.status <> 'completed_pending') THEN
    NEW.pending_date = COALESCE(NEW.pending_date, CURRENT_DATE);
  END IF;

  -- Auto-set end_date when status becomes completed_settled
  IF NEW.status = 'completed_settled' AND (OLD.status IS NULL OR OLD.status <> 'completed_settled') THEN
    NEW.end_date = COALESCE(NEW.end_date, CURRENT_DATE);

    -- Create a transaction for the settled job
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

  RETURN NEW;
END;
$$;

-- Drop old trigger
DROP TRIGGER IF EXISTS on_job_settled ON public.jobs;

-- Create new trigger for all status changes
CREATE TRIGGER on_job_status_change
  BEFORE INSERT OR UPDATE OF status ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_job_status_change();

CREATE INDEX IF NOT EXISTS idx_jobs_pending_date ON jobs(user_id, pending_date);
