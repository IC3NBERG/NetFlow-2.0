-- Migration 019: Ensure RLS policies for clients, quotes, and jobs
-- Drop and recreate all policies to guarantee correct state.
-- Previous migrations (005, 012, 015) rewrote policies but incremental
-- state may have drifted. This migration is a clean reset.

SET search_path = '';

-- ============================================================
-- 1. clients — full CRUD policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- 2. quotes — explicit SELECT + all operations
-- ============================================================

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotes_user_isolation" ON public.quotes;

CREATE POLICY "quotes_select" ON public.quotes
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "quotes_insert" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "quotes_update" ON public.quotes
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "quotes_delete" ON public.quotes
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- 3. jobs — ensure all policies exist (they already should)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own jobs" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own jobs" ON public.jobs
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- 4. invoices — ensure policies exist
-- ============================================================

DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;

CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own invoices" ON public.invoices
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
