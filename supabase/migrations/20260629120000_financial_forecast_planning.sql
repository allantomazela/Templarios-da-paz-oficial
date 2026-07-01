-- Planejamento financeiro: contas fixas, overrides mensais e vínculo com transações

CREATE TABLE IF NOT EXISTS public.financial_forecast_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Receita', 'Despesa')),
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  expected_amount NUMERIC(12, 2) NOT NULL CHECK (expected_amount > 0),
  due_day SMALLINT NOT NULL CHECK (due_day >= 1 AND due_day <= 28),
  recurrence TEXT NOT NULL DEFAULT 'monthly'
    CHECK (recurrence IN ('monthly', 'annual', 'once')),
  recurrence_month SMALLINT CHECK (recurrence_month IS NULL OR (recurrence_month >= 1 AND recurrence_month <= 12)),
  preferred_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT check_forecast_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
  CONSTRAINT check_forecast_annual_month CHECK (
    recurrence <> 'annual' OR recurrence_month IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_financial_forecast_items_type
  ON public.financial_forecast_items(type);
CREATE INDEX IF NOT EXISTS idx_financial_forecast_items_active
  ON public.financial_forecast_items(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_financial_forecast_items_category
  ON public.financial_forecast_items(category_id);

CREATE TABLE IF NOT EXISTS public.financial_forecast_month_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_item_id UUID NOT NULL REFERENCES public.financial_forecast_items(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year >= 2000),
  month SMALLINT NOT NULL CHECK (month >= 1 AND month <= 12),
  expected_amount_override NUMERIC(12, 2) NOT NULL CHECK (expected_amount_override > 0),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (forecast_item_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_financial_forecast_month_overrides_period
  ON public.financial_forecast_month_overrides(year, month);

CREATE TABLE IF NOT EXISTS public.financial_membership_forecast_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL CHECK (year >= 2000),
  month SMALLINT NOT NULL CHECK (month >= 1 AND month <= 12),
  expected_amount_override NUMERIC(12, 2) NOT NULL CHECK (expected_amount_override > 0),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (year, month)
);

ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS forecast_item_id UUID
    REFERENCES public.financial_forecast_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_forecast_item
  ON public.financial_transactions(forecast_item_id)
  WHERE forecast_item_id IS NOT NULL;

-- RLS
ALTER TABLE public.financial_forecast_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_forecast_month_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_membership_forecast_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Editors can view forecast items" ON public.financial_forecast_items;
CREATE POLICY "Admins and Editors can view forecast items"
  ON public.financial_forecast_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins and Editors can insert forecast items" ON public.financial_forecast_items;
CREATE POLICY "Admins and Editors can insert forecast items"
  ON public.financial_forecast_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins and Editors can update forecast items" ON public.financial_forecast_items;
CREATE POLICY "Admins and Editors can update forecast items"
  ON public.financial_forecast_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins and Editors can delete forecast items" ON public.financial_forecast_items;
CREATE POLICY "Admins and Editors can delete forecast items"
  ON public.financial_forecast_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins and Editors can manage forecast month overrides" ON public.financial_forecast_month_overrides;
CREATE POLICY "Admins and Editors can manage forecast month overrides"
  ON public.financial_forecast_month_overrides FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins and Editors can manage membership forecast overrides" ON public.financial_membership_forecast_overrides;
CREATE POLICY "Admins and Editors can manage membership forecast overrides"
  ON public.financial_membership_forecast_overrides FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE OR REPLACE FUNCTION public.update_financial_forecast_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_financial_forecast_items_updated_at ON public.financial_forecast_items;
CREATE TRIGGER update_financial_forecast_items_updated_at
  BEFORE UPDATE ON public.financial_forecast_items
  FOR EACH ROW EXECUTE FUNCTION public.update_financial_forecast_items_updated_at();
