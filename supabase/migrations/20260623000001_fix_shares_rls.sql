-- Migration 017: Fix shares RLS — add missing INSERT, UPDATE, DELETE policies
-- Root cause: migration 015 (20260622000004) replaced the original multi-operation
-- shares_user_isolation policy with a single FOR SELECT policy, leaving INSERT,
-- UPDATE, DELETE operations with no policy → 403 Forbidden errors.
SET search_path = '';

-- Add INSERT policy for authenticated owners
CREATE POLICY "shares_insert" ON public.shares
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Add UPDATE policy for authenticated owners (needed for last_accessed updates)
CREATE POLICY "shares_update" ON public.shares
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Add DELETE policy for authenticated owners
CREATE POLICY "shares_delete" ON public.shares
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
