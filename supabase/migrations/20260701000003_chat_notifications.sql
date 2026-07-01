-- Migration: Add message category and trigger notification on client message

-- 1. Update notifications category constraint to include 'message'
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_category_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_category_check 
  CHECK (category IN ('deadline','invoice','backup','sync','goal','quote','expense','system','message'));

-- 2. Update send_share_message to insert notification
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

  IF p_sender = 'client' THEN
    INSERT INTO public.notifications (
      user_id, category, title, message, link, icon
    ) VALUES (
      share_record.user_id,
      'message',
      'Messaggio da ' || COALESCE(p_sender_name, 'Portale Cliente'),
      left(trim(p_content), 50) || CASE WHEN length(trim(p_content)) > 50 THEN '...' ELSE '' END,
      '/settings?tab=sharing',
      'MessageCircle'
    );
  END IF;

  RETURN row_to_json(new_msg)::jsonb;
END;
$$;
