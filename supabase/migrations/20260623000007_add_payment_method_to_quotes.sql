-- Migration 023: Add payment method fields to quotes
-- Aligns quotes with the same fiscal model as jobs (netto/lordo/cash/mixed).
SET search_path = '';

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS payment_method public.payment_method NOT NULL DEFAULT 'card',
  ADD COLUMN IF NOT EXISTS amount_card numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_cash numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS include_cash_in_invoice boolean NOT NULL DEFAULT false;
