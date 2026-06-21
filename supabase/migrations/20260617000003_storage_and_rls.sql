-- Storage bucket for user logos + RLS policies for invoices/transactions

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Users upload own logo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own logo" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own logo" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- invoices DELETE policy
CREATE POLICY "Users can delete own invoices" ON invoices
  FOR DELETE USING ((select auth.uid()) = user_id);

-- transactions UPDATE/DELETE for corrections
CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING ((select auth.uid()) = user_id);
