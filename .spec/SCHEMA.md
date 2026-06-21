# Data Schema (PostgreSQL / TypeScript)

## 1. Enums

```sql
CREATE TYPE tax_regime AS ENUM ('occasional', 'vat_flat', 'vat_standard');
CREATE TYPE job_status AS ENUM ('active', 'completed_pending', 'completed_settled');
CREATE TYPE payment_method AS ENUM ('card', 'cash', 'mixed');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE goal_metric AS ENUM ('net_settled', 'gross_total', 'cash_only', 'gross_settled', 'net_pending');
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
  goal_data         jsonb DEFAULT '{}',        -- { "target": 50000, "metric": "net_settled", "segments": [...] }
  dashboard_layout  jsonb DEFAULT '[]',        -- [{ "id": "kpi-group", "order": 0, "visible": true }, { "id": "goal-tracker", "order": 1, "visible": true }, { "id": "charts", "order": 2, "visible": true }]
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
  pending_date            date,             -- auto-set when status becomes completed_pending
  end_date                date,             -- auto-set when status becomes completed_settled
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
  -- Create a transaction for the invoice payment
  INSERT INTO transactions (job_id, invoice_id, user_id, type, amount, category, is_settled, date)
  VALUES (NULL, NEW.id, NEW.user_id, 'income', NEW.net_amount, 'invoice_payment', true, NEW.paid_date);

  -- Mark all linked jobs as settled
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

### 2.6a fiscal_setups / 2.6b expenses
Vedi migrations `20260611000003_fiscal_setups.sql` e `20260611000007_expenses.sql`.

### 2.7 sync_queue (Offline — IndexedDB `fintrack-sync`)
Non è una tabella SQL, ma una collezione IndexedDB gestita dal Service Worker / SyncProvider.

```typescript
interface SyncQueueItem {
  id: string;
  table: 'jobs' | 'transactions' | 'invoices' | 'clients' | 'profiles' | 'user_settings' | 'expenses' | 'fiscal_setups' | 'invoice_jobs';
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  record_id?: string;
  temp_id?: string;
  timestamp: number;
  retries: number;
  max_retries: number;
}
```

Regole di sync:
- All'avvio, se `navigator.onLine`, svuota la coda FIFO.
- Ogni operazione viene inviata a Supabase REST API.
- Se successo: rimuovi da IndexedDB e aggiorna eventuali `temp_id` con l'ID reale.
- Se fallito: incrementa `retries`, riprova con backoff esponenziale (1s, 2s, 4s, 8s...).
- Dopo `max_retries` fallimenti: marca come `failed`, notifica l'utente.

### 2.6 user_settings
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

---

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

export interface GoalData {
  target: number;
  metric: GoalMetric;
  segments: Array<{
    label: string;
    value: number;
    color: string;
  }>;
}

export interface DashboardModule {
  id: 'kpi-group' | 'goal-tracker' | 'charts' | 'quick-register' | 'progress-rings';
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
  created_at: string;
}

export interface InvoiceJob {
  invoice_id: string;
  job_id: string;
  created_at: string;
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
