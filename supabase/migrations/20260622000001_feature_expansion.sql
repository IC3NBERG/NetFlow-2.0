-- Migration 012: Feature Expansion — Tags, Quotes, Audit Trail, Shares, Attachments

SET search_path = '';

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- 1. TAGS (feature #15)
-- ============================================================
CREATE TYPE public.quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'converted');

CREATE TABLE public.tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL DEFAULT '#6C5CE7',
  created_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_tags_user_name ON public.tags(user_id, name);
CREATE INDEX idx_tags_user ON public.tags(user_id);

CREATE TABLE public.job_tags (
  job_id      uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (job_id, tag_id)
);

CREATE TABLE public.expense_tags (
  expense_id  uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (expense_id, tag_id)
);

-- ============================================================
-- 2. QUOTES / PREVENTIVI (feature #4)
-- ============================================================
CREATE TABLE public.quotes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id         uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  quote_number      text NOT NULL,
  title             text NOT NULL,
  description       text,
  status            public.quote_status NOT NULL DEFAULT 'draft',
  gross_amount      numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount        numeric(12,2) NOT NULL DEFAULT 0,
  net_amount        numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate          numeric(5,2) NOT NULL DEFAULT 22,
  valid_until       date,
  issued_date       date NOT NULL DEFAULT CURRENT_DATE,
  converted_job_id  uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  notes             text,
  currency          text NOT NULL DEFAULT 'EUR',
  exchange_rate     numeric(10,4),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_quotes_user ON public.quotes(user_id);
CREATE INDEX idx_quotes_client ON public.quotes(client_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);

-- ============================================================
-- 3. AUDIT LOG (feature #16)
-- ============================================================
CREATE TABLE public.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  table_name  text NOT NULL,
  record_id   uuid,
  operation   text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data    jsonb,
  new_data    jsonb,
  ip_address  text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at);

-- ============================================================
-- 4. SHARES / CONDIVISIONE (feature #10)
-- ============================================================
CREATE TABLE public.shares (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token         text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  access_level  text NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'export')),
  description   text,
  expires_at    timestamptz,
  last_accessed timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_shares_user ON public.shares(user_id);
CREATE INDEX idx_shares_token ON public.shares(token);

-- ============================================================
-- 5. ATTACHMENTS via JSONB su tabelle esistenti (feature #8)
-- ============================================================
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS attachment_urls jsonb DEFAULT '[]';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS attachment_urls jsonb DEFAULT '[]';

-- ============================================================
-- 6. CURRENCY su tabelle esistenti (feature #14)
-- ============================================================
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';
-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

-- Tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_user_isolation" ON public.tags
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "job_tags_user_isolation" ON public.job_tags
  USING (EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND user_id = (select auth.uid())));

CREATE POLICY "expense_tags_user_isolation" ON public.expense_tags
  USING (EXISTS (SELECT 1 FROM public.expenses WHERE id = expense_id AND user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.expenses WHERE id = expense_id AND user_id = (select auth.uid())));

-- Quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_user_isolation" ON public.quotes
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Audit Log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_user_isolation" ON public.audit_log
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Shares
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shares_user_isolation" ON public.shares
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Allow read-only access via token (for accountants)
CREATE POLICY "shares_token_access" ON public.shares
  FOR SELECT
  USING (true);

-- ============================================================
-- 8. TRIGGERS
-- ============================================================

-- Quotes auto-updated_at
CREATE OR REPLACE FUNCTION public.handle_quotes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_quotes_updated
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_quotes_updated_at();

-- Audit trigger function (generic)
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, table_name, record_id, operation, new_data)
    VALUES ((select auth.uid()), TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, table_name, record_id, operation, old_data, new_data)
    VALUES ((select auth.uid()), TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, table_name, record_id, operation, old_data)
    VALUES ((select auth.uid()), TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
END;
$$;

-- Apply audit triggers to core tables
CREATE TRIGGER audit_jobs AFTER INSERT OR UPDATE OR DELETE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_quotes AFTER INSERT OR UPDATE OR DELETE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
