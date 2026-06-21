-- Migration: 004_security_performance_fixes
-- Description: Fix Supabase advisor warnings: secure search_path, revoke EXECUTE on trigger functions, optimize RLS policies
-- Date: 2026-06-11

-- ============================================================
-- PART 1: Fix function_search_path_mutable
-- handle_updated_at had no search_path set, making it vulnerable
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- PART 2: Revoke EXECUTE on SECURITY DEFINER trigger functions
-- These functions are ONLY invoked by triggers, never called
-- directly via RPC. Removing EXECUTE from anon/authenticated
-- eliminates the security_definer_function_executable warnings.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_settings() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_job_settled() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_invoice_paid() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_fiscal_setup() FROM anon, authenticated;

-- Also revoke from public for good measure
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_settings() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_job_settled() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_invoice_paid() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_fiscal_setup() FROM public;

-- ============================================================
-- PART 3: Optimize RLS policies for auth_rls_initplan
-- Replace auth.uid() with (select auth.uid()) to avoid
-- per-row re-evaluation of the auth functions
-- ============================================================

-- 3a. profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- 3b. clients
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING ((select auth.uid()) = user_id);

-- 3c. jobs
DROP POLICY IF EXISTS "Users can view own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON jobs;

CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own jobs" ON jobs
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own jobs" ON jobs
  FOR DELETE USING ((select auth.uid()) = user_id);

-- 3d. transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- 3e. invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;

CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own invoices" ON invoices
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own invoices" ON invoices
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- 3f. user_settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- 3g. invoice_jobs
DROP POLICY IF EXISTS "Users can view own invoice_jobs" ON invoice_jobs;
DROP POLICY IF EXISTS "Users can insert own invoice_jobs" ON invoice_jobs;
DROP POLICY IF EXISTS "Users can delete own invoice_jobs" ON invoice_jobs;

CREATE POLICY "Users can view own invoice_jobs" ON invoice_jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND (select auth.uid()) = invoices.user_id)
  );

CREATE POLICY "Users can insert own invoice_jobs" ON invoice_jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND (select auth.uid()) = invoices.user_id)
  );

CREATE POLICY "Users can delete own invoice_jobs" ON invoice_jobs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND (select auth.uid()) = invoices.user_id)
  );

-- 3h. fiscal_setups
DROP POLICY IF EXISTS "Users can view own fiscal_setups" ON fiscal_setups;
DROP POLICY IF EXISTS "Users can insert own fiscal_setups" ON fiscal_setups;
DROP POLICY IF EXISTS "Users can update own fiscal_setups" ON fiscal_setups;
DROP POLICY IF EXISTS "Users can delete own fiscal_setups" ON fiscal_setups;

CREATE POLICY "Users can view own fiscal_setups" ON fiscal_setups
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own fiscal_setups" ON fiscal_setups
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own fiscal_setups" ON fiscal_setups
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own fiscal_setups" ON fiscal_setups
  FOR DELETE USING ((select auth.uid()) = user_id);
