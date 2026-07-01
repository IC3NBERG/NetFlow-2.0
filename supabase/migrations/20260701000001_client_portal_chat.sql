-- Migration: Client Portal + Chat System
-- Extends shares table with client_id for scoped client portals
-- Adds share_messages table for bidirectional chat

-- 1. Add client_id to shares table
ALTER TABLE public.shares
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shares_client ON public.shares(client_id);

-- 2. Create share_messages table
CREATE TABLE IF NOT EXISTS public.share_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id    uuid NOT NULL REFERENCES public.shares(id) ON DELETE CASCADE,
  sender      text NOT NULL CHECK (sender IN ('owner', 'client')),
  sender_name text,
  content     text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_messages_share ON public.share_messages(share_id);
CREATE INDEX IF NOT EXISTS idx_share_messages_created ON public.share_messages(created_at);

-- 3. Enable RLS on share_messages
ALTER TABLE public.share_messages ENABLE ROW LEVEL SECURITY;

-- Owner can read/write their own share messages
CREATE POLICY "share_messages_owner_access" ON public.share_messages
  USING (EXISTS (
    SELECT 1 FROM public.shares s
    WHERE s.id = share_id AND s.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shares s
    WHERE s.id = share_id AND s.user_id = (SELECT auth.uid())
  ));

-- 4. RPC: get_client_portal_data — returns client-scoped data by token
CREATE OR REPLACE FUNCTION public.get_client_portal_data(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  share_record public.shares;
  uid uuid;
  cid uuid;
  result jsonb;
BEGIN
  SELECT * INTO share_record FROM public.shares WHERE shares.token = p_token;
  IF share_record.id IS NULL THEN
    RAISE EXCEPTION 'Share token not found';
  END IF;

  IF NOT share_record.is_active THEN
    RAISE EXCEPTION 'Share link disabled';
  END IF;

  IF share_record.expires_at IS NOT NULL AND share_record.expires_at < now() THEN
    RAISE EXCEPTION 'Share link expired';
  END IF;

  IF share_record.client_id IS NULL THEN
    RAISE EXCEPTION 'This share is not a client portal';
  END IF;

  uid := share_record.user_id;
  cid := share_record.client_id;

  UPDATE public.shares SET last_accessed = now(), view_count = view_count + 1 WHERE id = share_record.id;

  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p)::jsonb FROM public.profiles p WHERE p.id = uid),
    'client', (SELECT row_to_json(c)::jsonb FROM public.clients c WHERE c.id = cid),
    'jobs', (
      SELECT COALESCE(jsonb_agg(row_to_json(j)::jsonb ORDER BY j.created_at DESC), '[]'::jsonb)
      FROM public.jobs j
      WHERE j.user_id = uid AND j.client_id = cid
    ),
    'invoices', (
      SELECT COALESCE(jsonb_agg(row_to_json(i)::jsonb ORDER BY i.issued_date DESC), '[]'::jsonb)
      FROM public.invoices i
      WHERE i.user_id = uid AND i.client_id = cid
    ),
    'quotes', (
      SELECT COALESCE(jsonb_agg(row_to_json(q)::jsonb ORDER BY q.issued_date DESC), '[]'::jsonb)
      FROM public.quotes q
      WHERE q.user_id = uid AND q.client_id = cid
    ),
    'share', (SELECT row_to_json(s)::jsonb FROM public.shares s WHERE s.id = share_record.id)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_client_portal_data(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_client_portal_data(text) TO anon, authenticated;

-- 5. RPC: get_share_messages — returns messages for a share channel
CREATE OR REPLACE FUNCTION public.get_share_messages(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  share_record public.shares;
BEGIN
  SELECT * INTO share_record FROM public.shares WHERE shares.token = p_token;
  IF share_record.id IS NULL THEN
    RAISE EXCEPTION 'Share token not found';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(m)::jsonb ORDER BY m.created_at ASC), '[]'::jsonb)
    FROM public.share_messages m
    WHERE m.share_id = share_record.id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_share_messages(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_share_messages(text) TO anon, authenticated;

-- 6. RPC: send_share_message — client or owner sends a message
CREATE OR REPLACE FUNCTION public.send_share_message(
  p_token      text,
  p_sender     text,
  p_content    text,
  p_sender_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  share_record public.shares;
  new_msg public.share_messages;
BEGIN
  IF p_sender NOT IN ('owner', 'client') THEN
    RAISE EXCEPTION 'Invalid sender type';
  END IF;

  IF length(trim(p_content)) = 0 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;

  SELECT * INTO share_record FROM public.shares WHERE shares.token = p_token;
  IF share_record.id IS NULL THEN
    RAISE EXCEPTION 'Share token not found';
  END IF;

  IF NOT share_record.is_active THEN
    RAISE EXCEPTION 'Share link disabled';
  END IF;

  INSERT INTO public.share_messages (share_id, sender, sender_name, content)
  VALUES (share_record.id, p_sender, p_sender_name, trim(p_content))
  RETURNING * INTO new_msg;

  RETURN row_to_json(new_msg)::jsonb;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_share_message(text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.send_share_message(text, text, text, text) TO anon, authenticated;

-- 7. RPC: mark_share_messages_read — owner marks client messages as read
CREATE OR REPLACE FUNCTION public.mark_share_messages_read(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  share_record public.shares;
BEGIN
  SELECT * INTO share_record FROM public.shares WHERE shares.token = p_token;
  IF share_record.id IS NULL THEN RETURN; END IF;
  IF share_record.user_id != (SELECT auth.uid()) THEN RETURN; END IF;

  UPDATE public.share_messages
  SET read_at = now()
  WHERE share_id = share_record.id AND sender = 'client' AND read_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_share_messages_read(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_share_messages_read(text) TO authenticated;
