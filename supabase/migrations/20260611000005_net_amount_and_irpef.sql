-- Migration: 005_net_amount_and_irpef
-- Description: Add net_amount to jobs, custom_irpef_rate to fiscal_setups
-- Date: 2026-06-11

-- ============================================================
-- PART 1: Add net_amount to jobs table
-- ============================================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS net_amount numeric(12,2) NOT NULL DEFAULT 0;

-- ============================================================
-- PART 2: Add custom_irpef_rate to fiscal_setups table
-- ============================================================
ALTER TABLE fiscal_setups ADD COLUMN IF NOT EXISTS custom_irpef_rate numeric(5,2);

-- ============================================================
-- PART 3: Backfill net_amount for existing jobs
-- The calculation uses the user's tax regime from fiscal_setups.
-- For jobs where net_amount is 0, estimate from gross.
-- ============================================================
WITH job_regime AS (
  SELECT
    j.id AS job_id,
    COALESCE(f.tax_regime, p.tax_regime, 'occasional') AS regime,
    j.amount_card + j.amount_cash AS gross
  FROM jobs j
  LEFT JOIN fiscal_setups f ON f.user_id = j.user_id AND f.year = EXTRACT(YEAR FROM j.created_at)
  LEFT JOIN profiles p ON p.id = j.user_id
  WHERE j.net_amount = 0
)
UPDATE jobs j
SET net_amount = ROUND(
  CASE
    WHEN jr.regime = 'occasional' THEN jr.gross * 0.59424
    WHEN jr.regime = 'vat_flat' THEN jr.gross * 0.679654
    WHEN jr.regime = 'vat_standard' THEN jr.gross * 0.51751
    ELSE jr.gross
  END, 2
)
FROM job_regime jr
WHERE j.id = jr.job_id;
