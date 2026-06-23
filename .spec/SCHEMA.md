# Data Schema (PostgreSQL / TypeScript)

## 1. Enums

```sql
CREATE TYPE tax_regime AS ENUM ('occasional', 'vat_flat', 'vat_standard');
CREATE TYPE job_status AS ENUM ('active', 'completed_pending', 'completed_settled');
CREATE TYPE payment_method AS ENUM ('card', 'cash', 'mixed');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE goal_metric AS ENUM ('net_settled', 'gross_total', 'cash_only', 'gross_settled', 'net_pending');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'converted');
```

## 2. Tables

### 2.1 profiles
```sql
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
```

### 2.2 jobs
```sql
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
  net_amount              numeric(12,2) NOT NULL DEFAULT 0,
  include_cash_in_invoice boolean NOT NULL DEFAULT false,
  start_date              date NOT NULL,
  pending_date            date,
  end_date                date,
  attachment_urls         jsonb DEFAULT '[]',
  currency                text NOT NULL DEFAULT 'EUR',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX idx_jobs_user_dates ON jobs(user_id, start_date, end_date);
```

### 2.3 clients
```sql
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
  color       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_clients_user ON clients(user_id);
```

### 2.4 transactions (Ledger / Partita Doppia)
```sql
CREATE TABLE transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid REFERENCES jobs(id) ON DELETE CASCADE,
  invoice_id  uuid REFERENCES invoices(id) ON DELETE SET NULL,
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
```

### 2.5 invoices
```sql
CREATE TABLE invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
  currency        text NOT NULL DEFAULT 'EUR',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
```

### 2.5a invoice_jobs (join table)
```sql
CREATE TABLE invoice_jobs (
  invoice_id  uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  job_id      uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (invoice_id, job_id)
);
```

### 2.5b Trigger: on_invoice_paid
```sql
CREATE OR REPLACE FUNCTION handle_invoice_paid()
RETURNS trigger AS $$
BEGIN
  INSERT INTO transactions (job_id, invoice_id, user_id, type, amount, category, is_settled, date)
  VALUES (NULL, NEW.id, NEW.user_id, 'income', NEW.net_amount, 'invoice_payment', true, NEW.paid_date);

  UPDATE jobs j
  SET status = 'completed_settled'
  FROM invoice_jobs ij
  WHERE ij.invoice_id = NEW.id AND ij.job_id = j.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_invoice_paid
  AFTER UPDATE OF status ON invoices
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid')
  EXECUTE FUNCTION handle_invoice_paid();
```

### 2.5c Trigger: on_job_status_change
Sostituisce `on_job_settled`. Crea transazione su passaggio a `completed_settled`, salvo job collegato a fattura già `paid`.

> **Fonte di verità UI:** Dashboard e Registro leggono `jobs`. `transactions` è audit trail DB dai trigger.

### 2.6 fiscal_setups
```sql
CREATE TABLE fiscal_setups (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year              integer NOT NULL,
  tax_regime        tax_regime NOT NULL DEFAULT 'occasional',
  financial_goal    numeric(12,2) DEFAULT 0,
  goal_metric       goal_metric DEFAULT 'net_settled',
  goal_data         jsonb DEFAULT '{}',
  custom_irpef_rate numeric(5,2),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (user_id, year)
);

CREATE INDEX idx_fiscal_setups_user_year ON fiscal_setups(user_id, year);

ALTER TABLE fiscal_setups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fiscal_setups" ON fiscal_setups
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fiscal_setups" ON fiscal_setups
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fiscal_setups" ON fiscal_setups
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fiscal_setups" ON fiscal_setups
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER on_fiscal_setup_updated
  BEFORE UPDATE ON fiscal_setups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2.7 expenses
```sql
CREATE TABLE expenses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  amount      numeric(12,2) NOT NULL DEFAULT 0,
  category    text,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  attachment_urls jsonb DEFAULT '[]',
  currency    text NOT NULL DEFAULT 'EUR',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(user_id, date);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER on_expenses_updated
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2.8 user_settings
```sql
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
```

### 2.9 tags
```sql
CREATE TABLE tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL DEFAULT '#6C5CE7',
  created_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_tags_user_name ON tags(user_id, name);
CREATE INDEX idx_tags_user ON tags(user_id);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_user_isolation" ON tags
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
```

### 2.9a job_tags (join table)
```sql
CREATE TABLE job_tags (
  job_id      uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (job_id, tag_id)
);

ALTER TABLE job_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_tags_user_isolation" ON job_tags
  USING (EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND user_id = (select auth.uid())));
```

### 2.9b expense_tags (join table)
```sql
CREATE TABLE expense_tags (
  expense_id  uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (expense_id, tag_id)
);

ALTER TABLE expense_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_tags_user_isolation" ON expense_tags
  USING (EXISTS (SELECT 1 FROM expenses WHERE id = expense_id AND user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM expenses WHERE id = expense_id AND user_id = (select auth.uid())));
```

### 2.10 quotes
```sql
CREATE TABLE quotes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id               uuid REFERENCES clients(id) ON DELETE SET NULL,
  quote_number            text NOT NULL,
  title                   text NOT NULL,
  description             text,
  status                  quote_status NOT NULL DEFAULT 'draft',
  payment_method          payment_method NOT NULL DEFAULT 'card',
  amount_card             numeric(12,2) NOT NULL DEFAULT 0,
  amount_cash             numeric(12,2) NOT NULL DEFAULT 0,
  include_cash_in_invoice boolean NOT NULL DEFAULT false,
  gross_amount            numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount              numeric(12,2) NOT NULL DEFAULT 0,
  net_amount              numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate                numeric(5,2) NOT NULL DEFAULT 22,
  valid_until             date,
  issued_date             date NOT NULL DEFAULT CURRENT_DATE,
  converted_job_id        uuid REFERENCES jobs(id) ON DELETE SET NULL,
  notes                   text,
  currency                text NOT NULL DEFAULT 'EUR',
  exchange_rate           numeric(10,4),
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_quotes_user ON quotes(user_id);
CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_user_isolation" ON quotes
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE TRIGGER on_quotes_updated
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_quotes_updated_at();
```

### 2.11 audit_log
```sql
CREATE TABLE audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  table_name  text NOT NULL,
  record_id   uuid,
  operation   text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data    jsonb,
  new_data    jsonb,
  ip_address  text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "audit_log_update" ON audit_log
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "audit_log_delete" ON audit_log
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

### 2.12 shares
```sql
CREATE TABLE shares (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token         text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  access_level  text NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'export')),
  description   text,
  expires_at    timestamptz,
  last_accessed timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_shares_user ON shares(user_id);
CREATE INDEX idx_shares_token ON shares(token);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Combined SELECT: owner sees own shares; unauthenticated (anon) sees by token
CREATE POLICY "shares_select" ON public.shares
  FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IS NULL
  );

CREATE POLICY "shares_insert" ON public.shares
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "shares_update" ON public.shares
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "shares_delete" ON public.shares
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
```

### 2.13 custom_events
```sql
CREATE TABLE custom_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  date        date NOT NULL,
  color       text NOT NULL DEFAULT '#6C5CE7',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_custom_events_user ON custom_events(user_id);
CREATE INDEX idx_custom_events_date ON custom_events(date);

ALTER TABLE custom_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_events_user_isolation" ON custom_events
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
```

### 2.14 Storage: attachments bucket
```sql
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
```

### 2.15 RPC: delete_user_account
```sql
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := (select auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;
```

### 2.16 RPC: clean_user_data
```sql
CREATE OR REPLACE FUNCTION public.clean_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := (select auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM public.custom_events WHERE user_id = uid;
  DELETE FROM public.audit_log WHERE user_id = uid;
  DELETE FROM public.shares WHERE user_id = uid;
  DELETE FROM public.job_tags WHERE job_id IN (SELECT id FROM public.jobs WHERE user_id = uid);
  DELETE FROM public.expense_tags WHERE expense_id IN (SELECT id FROM public.expenses WHERE user_id = uid);
  DELETE FROM public.tags WHERE user_id = uid;
  DELETE FROM public.quotes WHERE user_id = uid;
  DELETE FROM public.invoice_jobs WHERE invoice_id IN (SELECT id FROM public.invoices WHERE user_id = uid);
  DELETE FROM public.invoices WHERE user_id = uid;
  DELETE FROM public.transactions WHERE user_id = uid;
  DELETE FROM public.expenses WHERE user_id = uid;
  DELETE FROM public.jobs WHERE user_id = uid;
  DELETE FROM public.clients WHERE user_id = uid;
END;
$$;
```

## 3. TypeScript Types

```typescript
// src/types/database.ts

export type TaxRegime = 'occasional' | 'vat_flat' | 'vat_standard';
export type JobStatus = 'active' | 'completed_pending' | 'completed_settled';
export type PaymentMethod = 'card' | 'cash' | 'mixed';
export type TransactionType = 'income' | 'expense';
export type GoalMetric = 'net_settled' | 'gross_total' | 'cash_only' | 'gross_settled' | 'net_pending';
export type InvoiceType = 'invoice' | 'parcella';
export type InvoiceStatus = 'draft' | 'sent' | 'paid';
export type Theme = 'light' | 'dark' | 'system';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
export type DashboardModuleId = 'kpi-group' | 'charts' | 'quick-register' | 'progress-rings' | 'bar-chart';

export interface GoalData {
  target: number;
  metric: GoalMetric;
  segments: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  invoice_footer?: string;
}

export interface DashboardModule {
  id: DashboardModuleId;
  order: number;
  visible: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  tax_regime: TaxRegime;
  vat_number: string | null;
  fiscal_code: string | null;
  address: string | null;
  logo_url: string | null;
  financial_goal: number;
  goal_metric: GoalMetric;
  goal_data: GoalData | null;
  dashboard_layout: DashboardModule[] | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: JobStatus;
  payment_method: PaymentMethod;
  amount_card: number;
  amount_cash: number;
  net_amount: number;
  include_cash_in_invoice: boolean;
  start_date: string;
  pending_date: string | null;
  end_date: string | null;
  attachment_urls: string[];
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  vat_number: string | null;
  fiscal_code: string | null;
  address: string | null;
  notes: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  job_id: string | null;
  invoice_id: string | null;
  user_id: string;
  type: TransactionType;
  description: string | null;
  amount: number;
  category: string | null;
  is_settled: boolean;
  date: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  type: InvoiceType;
  gross_amount: number;
  tax_amount: number;
  net_amount: number;
  status: InvoiceStatus;
  issued_date: string;
  due_date: string | null;
  paid_date: string | null;
  pdf_url: string | null;
  currency: string;
  created_at: string;
}

export interface InvoiceJob {
  invoice_id: string;
  job_id: string;
  created_at: string;
}

export interface FiscalSetup {
  id: string;
  user_id: string;
  year: number;
  tax_regime: TaxRegime;
  financial_goal: number;
  goal_metric: GoalMetric;
  goal_data: GoalData | null;
  custom_irpef_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: Theme;
  currency: string;
  auto_backup: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  sync_enabled: boolean;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  amount: number;
  category: string | null;
  date: string;
  attachment_urls: string[];
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  client_id: string | null;
  quote_number: string;
  title: string;
  description: string | null;
  status: QuoteStatus;
  payment_method: PaymentMethod;
  amount_card: number;
  amount_cash: number;
  include_cash_in_invoice: boolean;
  gross_amount: number;
  tax_amount: number;
  net_amount: number;
  tax_rate: number;
  valid_until: string | null;
  issued_date: string;
  converted_job_id: string | null;
  notes: string | null;
  currency: string;
  exchange_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface JobTag {
  job_id: string;
  tag_id: string;
  created_at: string;
}

export interface ExpenseTag {
  expense_id: string;
  tag_id: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string | null;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface Share {
  id: string;
  user_id: string;
  token: string;
  access_level: 'view' | 'export';
  description: string | null;
  expires_at: string | null;
  last_accessed: string | null;
  created_at: string;
}

export interface CustomEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  color: string;
  created_at: string;
}
```

## 4. Calculated Types

```typescript
// src/types/metrics.ts

export interface MoneyMetrics {
  gross_pending: number;
  gross_settled: number;
  net_pending: number;
  net_settled: number;
  cash_pending: number;
  cash_settled: number;
  expenses_total: number;
  balance: number;
  goal_progress: number;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  cash_income: number;
  card_income: number;
}

export interface DashboardKPIs {
  order_pending: number;
  settled: number;
  net_pending: number;
  net_settled: number;
  cash_pending: number;
  cash_settled: number;
  expenses: number;
  balance: number;
  goal: {
    target: number;
    current: number;
    metric: GoalMetric;
    progress: number;
  };
  segments: Array<{
    label: string;
    value: number;
    max: number;
    progress: number;
    color: string;
  }>;
}
```
