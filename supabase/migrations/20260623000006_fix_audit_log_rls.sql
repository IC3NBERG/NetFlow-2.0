-- Migration 022: Fix audit_log RLS — add INSERT/UPDATE/DELETE policies
-- The audit_trigger() function runs with the caller's permissions (not SECURITY DEFINER).
-- audit_log had RLS enabled but only a SELECT policy, so any trigger-driven write
-- was blocked by RLS, causing 403 errors on insert/update/delete of tracked tables.
SET search_path = '';

-- Drop the overly restrictive single policy
DROP POLICY IF EXISTS "audit_log_user_isolation" ON public.audit_log;

-- Create separate policies for each operation, following the same pattern
-- used by other tables in the codebase

CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "audit_log_update" ON public.audit_log
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "audit_log_delete" ON public.audit_log
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
