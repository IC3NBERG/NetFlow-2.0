export type TaxRegime = 'occasional' | 'vat_flat' | 'vat_standard'
export type JobStatus = 'active' | 'completed_pending' | 'completed_settled'
export type PaymentMethod = 'card' | 'cash' | 'mixed'
export type TransactionType = 'income' | 'expense'
export type GoalMetric = 'net_settled' | 'gross_total' | 'cash_only' | 'gross_settled' | 'net_pending'
export type InvoiceType = 'invoice' | 'parcella'
export type InvoiceStatus = 'draft' | 'sent' | 'paid'
export type Theme = 'light' | 'dark' | 'system'

export interface GoalData {
  target: number
  metric: GoalMetric
  segments: Array<{
    label: string
    value: number
    color: string
  }>
  invoice_footer?: string
}

export type DashboardModuleId = 'kpi-group' | 'charts' | 'quick-register' | 'progress-rings' | 'bar-chart'

export interface DashboardModule {
  id: DashboardModuleId
  order: number
  visible: boolean
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  business_name: string | null
  tax_regime: TaxRegime
  vat_number: string | null
  fiscal_code: string | null
  address: string | null
  logo_url: string | null
  financial_goal: number
  goal_metric: GoalMetric
  goal_data: GoalData | null
  dashboard_layout: DashboardModule[] | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  user_id: string
  client_id: string | null
  title: string
  description: string | null
  status: JobStatus
  payment_method: PaymentMethod
  amount_card: number
  amount_cash: number
  net_amount: number
  include_cash_in_invoice: boolean
  start_date: string
  pending_date: string | null
  end_date: string | null
  attachment_urls: string[]
  currency: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  vat_number: string | null
  fiscal_code: string | null
  address: string | null
  notes: string | null
  color: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  job_id: string | null
  invoice_id: string | null
  user_id: string
  type: TransactionType
  description: string | null
  amount: number
  category: string | null
  is_settled: boolean
  date: string
  created_at: string
}

export interface Invoice {
  id: string
  user_id: string
  invoice_number: string
  type: InvoiceType
  gross_amount: number
  tax_amount: number
  net_amount: number
  status: InvoiceStatus
  issued_date: string
  due_date: string | null
  paid_date: string | null
  pdf_url: string | null
  currency: string
  created_at: string
}

export interface InvoiceJob {
  invoice_id: string
  job_id: string
  created_at: string
}

export interface FiscalSetup {
  id: string
  user_id: string
  year: number
  tax_regime: TaxRegime
  financial_goal: number
  goal_metric: GoalMetric
  goal_data: GoalData | null
  custom_irpef_rate: number | null
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  theme: Theme
  currency: string
  auto_backup: boolean
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  sync_enabled: boolean
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  title: string
  description: string | null
  amount: number
  category: string | null
  date: string
  attachment_urls: string[]
  currency: string
  created_at: string
  updated_at: string
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted'

export interface Quote {
  id: string
  user_id: string
  client_id: string | null
  quote_number: string
  title: string
  description: string | null
  status: QuoteStatus
  gross_amount: number
  tax_amount: number
  net_amount: number
  tax_rate: number
  valid_until: string | null
  issued_date: string
  converted_job_id: string | null
  notes: string | null
  currency: string
  exchange_rate: number | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface JobTag {
  job_id: string
  tag_id: string
  created_at: string
}

export interface ExpenseTag {
  expense_id: string
  tag_id: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  table_name: string
  record_id: string | null
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface Share {
  id: string
  user_id: string
  token: string
  access_level: 'view' | 'export'
  description: string | null
  expires_at: string | null
  last_accessed: string | null
  created_at: string
}
