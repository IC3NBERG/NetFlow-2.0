-- Migration: 008_trigger_on_insert
-- Description: Make job status change trigger fire on INSERT too
-- Needed so that jobs created directly with completed_settled/completed_pending
-- get auto-created transactions and dates, not just via UPDATE

DROP TRIGGER IF EXISTS on_job_status_change ON public.jobs;

CREATE TRIGGER on_job_status_change
  BEFORE INSERT OR UPDATE OF status ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_job_status_change();
