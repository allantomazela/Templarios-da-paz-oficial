-- Integração Ágape → Financeiro: fechamento mensal e cobranças por irmão

-- Fechamento mensal consolidado
CREATE TABLE IF NOT EXISTS public.agape_monthly_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  total_consumed NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_consumed >= 0),
  total_paid NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_paid >= 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_agape_closing_month_year UNIQUE (month, year)
);

-- Cobrança individual por irmão (consumo × pagamento)
CREATE TABLE IF NOT EXISTS public.agape_brother_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  consumed_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (consumed_amount >= 0),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pago', 'Pendente', 'Atrasado')),
  payment_date DATE,
  transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  closing_id UUID REFERENCES public.agape_monthly_closings(id) ON DELETE SET NULL,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_agape_charge_brother_month_year UNIQUE (brother_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_agape_monthly_closings_year_month
  ON public.agape_monthly_closings(year DESC, month DESC);

CREATE INDEX IF NOT EXISTS idx_agape_brother_charges_brother_id
  ON public.agape_brother_charges(brother_id);

CREATE INDEX IF NOT EXISTS idx_agape_brother_charges_year_month
  ON public.agape_brother_charges(year DESC, month DESC);

CREATE INDEX IF NOT EXISTS idx_agape_brother_charges_transaction_id
  ON public.agape_brother_charges(transaction_id);

CREATE INDEX IF NOT EXISTS idx_agape_brother_charges_closing_id
  ON public.agape_brother_charges(closing_id);

-- Categoria financeira para receitas do ágape
INSERT INTO public.financial_categories (name, type, description, color)
VALUES (
  'Ágape',
  'Receita',
  'Pagamentos de consumo no ágape pelos irmãos',
  '#2563eb'
)
ON CONFLICT (name, type) DO NOTHING;

-- Triggers updated_at
CREATE TRIGGER update_agape_monthly_closings_updated_at
  BEFORE UPDATE ON public.agape_monthly_closings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agape_updated_at();

CREATE TRIGGER update_agape_brother_charges_updated_at
  BEFORE UPDATE ON public.agape_brother_charges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agape_updated_at();

-- RLS
ALTER TABLE public.agape_monthly_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agape_brother_charges ENABLE ROW LEVEL SECURITY;

-- Irmãos veem apenas suas cobranças
CREATE POLICY "Brothers can view own agape charges"
  ON public.agape_brother_charges FOR SELECT
  TO authenticated
  USING (brother_id = auth.uid());

-- Tesouraria / admin / editor gerenciam fechamentos
CREATE POLICY "Financial staff can manage agape closings"
  ON public.agape_monthly_closings FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    ) OR
    public.has_module_permission(auth.uid(), 'financial') OR
    public.has_module_permission(auth.uid(), 'agape')
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    ) OR
    public.has_module_permission(auth.uid(), 'financial') OR
    public.has_module_permission(auth.uid(), 'agape')
  );

CREATE POLICY "Financial staff can manage agape charges"
  ON public.agape_brother_charges FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    ) OR
    public.has_module_permission(auth.uid(), 'financial') OR
    public.has_module_permission(auth.uid(), 'agape')
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    ) OR
    public.has_module_permission(auth.uid(), 'financial') OR
    public.has_module_permission(auth.uid(), 'agape')
  );

-- Tesouraria pode visualizar todas as cobranças
CREATE POLICY "Financial staff can view all agape charges"
  ON public.agape_brother_charges FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    ) OR
    public.has_module_permission(auth.uid(), 'financial') OR
    public.has_module_permission(auth.uid(), 'agape')
  );

CREATE POLICY "Financial staff can view agape closings"
  ON public.agape_monthly_closings FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    ) OR
    public.has_module_permission(auth.uid(), 'financial') OR
    public.has_module_permission(auth.uid(), 'agape')
  );

-- Função: totais de consumo por irmão no mês (sessões fechadas/finalizadas)
CREATE OR REPLACE FUNCTION public.get_agape_monthly_consumption_totals(
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  brother_id UUID,
  brother_name TEXT,
  total_amount NUMERIC(10, 2),
  total_items BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ac.brother_id,
    COALESCE(p.full_name, 'Sem nome') AS brother_name,
    COALESCE(SUM(ac.total_amount), 0)::NUMERIC(10, 2) AS total_amount,
    COUNT(*)::BIGINT AS total_items
  FROM public.agape_consumptions ac
  INNER JOIN public.agape_sessions s ON s.id = ac.session_id
  LEFT JOIN public.profiles p ON p.id = ac.brother_id
  WHERE EXTRACT(MONTH FROM s.date)::INTEGER = p_month
    AND EXTRACT(YEAR FROM s.date)::INTEGER = p_year
    AND s.status IN ('closed', 'finalized')
  GROUP BY ac.brother_id, p.full_name
  ORDER BY brother_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_agape_monthly_consumption_totals(INTEGER, INTEGER)
  TO authenticated;

COMMENT ON TABLE public.agape_monthly_closings IS
  'Fechamento mensal do ágape — consolida consumo vs. pagamentos recebidos';

COMMENT ON TABLE public.agape_brother_charges IS
  'Cobrança mensal por irmão no ágape, vinculada à tesouraria quando paga';
