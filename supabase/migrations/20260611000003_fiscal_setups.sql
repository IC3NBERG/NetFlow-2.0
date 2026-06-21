-- Migration: 003_fiscal_setups
-- Description: Year-scoped fiscal regime and financial goal setups
-- Date: 2026-06-11

-- 1. Create fiscal_setups table
CREATE TABLE fiscal_setups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year            integer NOT NULL,
  tax_regime      tax_regime NOT NULL DEFAULT 'occasional',
  financial_goal  numeric(12,2) DEFAULT 0,
  goal_metric     goal_metric DEFAULT 'net_settled',
  goal_data       jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (user_id, year)
);

CREATE INDEX idx_fiscal_setups_user_year ON fiscal_setups(user_id, year);

-- 2. RLS
ALTER TABLE fiscal_setups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fiscal_setups" ON fiscal_setups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fiscal_setups" ON fiscal_setups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fiscal_setups" ON fiscal_setups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fiscal_setups" ON fiscal_setups
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Updated_at trigger
CREATE TRIGGER on_fiscal_setup_updated
  BEFORE UPDATE ON fiscal_setups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Auto-create fiscal_setup for current year when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_fiscal_setup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  current_year integer := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  INSERT INTO public.fiscal_setups (user_id, year, tax_regime, financial_goal, goal_metric, goal_data)
  VALUES (
    NEW.id,
    current_year,
    COALESCE(NEW.tax_regime, 'occasional'),
    COALESCE(NEW.financial_goal, 0),
    COALESCE(NEW.goal_metric, 'net_settled'),
    COALESCE(NEW.goal_data, '{}')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_profile_created_fiscal_setup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_fiscal_setup();
