-- Migration 013: Attachments storage bucket for documents/receipts

SET search_path = '';

INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments');

CREATE POLICY "Users upload own attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'attachments'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own attachments" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'attachments'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'attachments'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );
