-- Migration: 001_initial_schema
-- Description: Initial database schema for FinTrack
-- Date: 2026-06-03

-- 1. Enums
CREATE TYPE tax_regime AS ENUM ('occasional', 'vat_flat', 'vat_standard');
CREATE TYPE job_status AS ENUM ('active', 'completed_pending', 'completed_settled');
CREATE TYPE payment_method AS ENUM ('card', 'cash', 'mixed');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE goal_metric AS ENUM ('net_settled', 'gross_total', 'cash_only', 'gross_settled', 'net_pending');

-- 2. Profiles (extends auth.users)
CREATE TABLE profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text NOT NULL,
  full_name         text,
  business_name     text,
  tax_regime        tax_regime NOT NULL DEFAULT 'occasional',
  vat_number        text,
  fiscal_code       text,
  address           text,
  logo_url          text,
  financial_goal    numeric(12,2) DEFAULT 0,
  goal_metric       goal_metric DEFAULT 'net_settled',
  goal_data         jsonb DEFAULT '{}',
  dashboard_layout  jsonb DEFAULT '[]',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Clients
CREATE TABLE clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text,
  phone       text,
  vat_number  text,
  fiscal_code text,
  address     text,
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_clients_user ON clients(user_id);

-- 4. Jobs
CREATE TABLE jobs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id               uuid REFERENCES clients(id) ON DELETE SET NULL,
  title                   text NOT NULL,
  description             text,
  status                  job_status NOT NULL DEFAULT 'active',
  payment_method          payment_method NOT NULL DEFAULT 'card',
  amount_card             numeric(12,2) DEFAULT 0,
  amount_cash             numeric(12,2) DEFAULT 0,
  include_cash_in_invoice boolean NOT NULL DEFAULT false,
  start_date              date NOT NULL,
  end_date                date,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX idx_jobs_user_dates ON jobs(user_id, start_date, end_date);

-- 5. Transactions (Ledger)
CREATE TABLE transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid REFERENCES jobs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        transaction_type NOT NULL,
  description text,
  amount      numeric(12,2) NOT NULL,
  category    text,
  is_settled  boolean NOT NULL DEFAULT false,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_job ON transactions(job_id);
CREATE INDEX idx_transactions_date ON transactions(user_id, date);

-- 6. Invoices
CREATE TABLE invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_ids         uuid[] NOT NULL,
  invoice_number  text NOT NULL,
  type            text NOT NULL CHECK (type IN ('invoice', 'parcella')),
  gross_amount    numeric(12,2) NOT NULL,
  tax_amount      numeric(12,2) DEFAULT 0,
  net_amount      numeric(12,2) NOT NULL,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  issued_date     date NOT NULL DEFAULT CURRENT_DATE,
  due_date        date,
  paid_date       date,
  pdf_url         text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);

-- 7. User Settings
CREATE TABLE user_settings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme             text NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  currency          text NOT NULL DEFAULT 'EUR',
  auto_backup       boolean NOT NULL DEFAULT true,
  backup_frequency  text NOT NULL DEFAULT 'weekly' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
  sync_enabled      boolean NOT NULL DEFAULT true,
  notifications_enabled boolean NOT NULL DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Auto-create settings on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_settings();

-- 8. Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own jobs" ON jobs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- 9. Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_client_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_job_updated BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_settings_updated BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. Auto-create transaction when job is settled
CREATE OR REPLACE FUNCTION public.handle_job_settled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'completed_settled' AND (OLD.status IS NULL OR OLD.status <> 'completed_settled') THEN
    INSERT INTO public.transactions (job_id, user_id, type, description, amount, is_settled, date)
    VALUES (
      NEW.id,
      NEW.user_id,
      'income',
      'Incasso: ' || NEW.title,
      NEW.amount_card + CASE WHEN NEW.include_cash_in_invoice THEN NEW.amount_cash ELSE 0 END,
      true,
      COALESCE(NEW.end_date, CURRENT_DATE)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_job_settled
  AFTER UPDATE OF status ON public.jobs
  FOR EACH ROW
  WHEN (NEW.status = 'completed_settled')
  EXECUTE FUNCTION public.handle_job_settled();
