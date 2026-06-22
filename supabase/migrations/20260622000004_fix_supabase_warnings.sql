-- Migration 015: Fix Supabase warnings — security & performance hardening
SET search_path = '';

-- ============================================================
-- 1. Fix: storage bucket listing (public_bucket_allows_listing)
--    Restrict SELECT to own files only, not public listing
-- ============================================================

-- Drop the overly broad SELECT policies
DROP POLICY IF EXISTS "Public read attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public read logos" ON storage.objects;

-- Create scoped SELECT policies (required for object URL to work, but prevent listing)
CREATE POLICY "Select own attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'attachments'
    AND ((select auth.uid())::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Select own logos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'logos'
    AND ((select auth.uid())::text = (storage.foldername(name))[1])
  );

-- ============================================================
-- 2. Fix: Revoke EXECUTE from anon role for SECURITY DEFINER RPCs
--    Only authenticated users can call these
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.clean_user_data() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon;

-- Keep EXECUTE for authenticated (they need it), but handle_updated_at is a trigger
-- function that should NOT be callable via REST at all
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated;

-- Same for other trigger-only functions to be safe
REVOKE EXECUTE ON FUNCTION public.handle_quotes_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_trigger() FROM anon, authenticated;

-- ============================================================
-- 3. Fix: handle_updated_at misconfigured as SECURITY DEFINER
--    It's a trigger function, doesn't need SECURITY DEFINER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. Fix: auth_rls_initplan on expenses
--    Wrap auth.uid() in (select auth.uid()) to avoid per-row re-evaluation
-- ============================================================
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own expenses" ON public.expenses
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own expenses" ON public.expenses
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- 5. Fix: multiple_permissive_policies on shares
--    Original had 2 SELECT policies (owner isolation + token public)
--    causing Supabase to warn about multiple permissive policies.
--    Combine into ONE policy:
--      - owner (authenticated) → only their own shares
--      - public (no auth) → needed for token-based accountant access
-- ============================================================
DROP POLICY IF EXISTS "shares_user_isolation" ON public.shares;
DROP POLICY IF EXISTS "shares_token_access" ON public.shares;

CREATE POLICY "shares_select" ON public.shares
  FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IS NULL
  );
