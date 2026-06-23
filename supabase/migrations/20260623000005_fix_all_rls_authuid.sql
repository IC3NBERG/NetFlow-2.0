-- Migration 021: Fix (select auth.uid()) subquery → direct auth.uid() on quotes, jobs, invoices
-- Migration 019 converted all policies to explicit FOR SELECT/INSERT/UPDATE/DELETE
-- but used (select auth.uid()) subquery which can return NULL on some Supabase projects.
-- Migration 020 already fixed clients; this migration fixes the remaining tables.
-- See migration 020 for the original diagnosis.

SET search_path = '';

-- ============================================================
-- 1. quotes — direct auth.uid()
-- ============================================================

DROP POLICY IF EXISTS "quotes_select" ON public.quotes;
DROP POLICY IF EXISTS "quotes_insert" ON public.quotes;
DROP POLICY IF EXISTS "quotes_update" ON public.quotes;
DROP POLICY IF EXISTS "quotes_delete" ON public.quotes;

CREATE POLICY "quotes_select" ON public.quotes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "quotes_insert" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quotes_update" ON public.quotes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quotes_delete" ON public.quotes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. jobs — direct auth.uid()
-- ============================================================

DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" ON public.jobs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. invoices — direct auth.uid()
-- ============================================================

DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;

CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices" ON public.invoices
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
