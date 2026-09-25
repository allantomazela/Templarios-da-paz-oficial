-- Vendas do Templo + cargo Hospitaleiro + permissão temple_sales

ALTER TYPE public.lodge_position_type ADD VALUE IF NOT EXISTS 'hospitaleiro';

CREATE TABLE IF NOT EXISTS public.temple_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  sale_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  due_date DATE,
  payment_mode TEXT NOT NULL DEFAULT 'prazo'
    CHECK (payment_mode IN ('avista', 'prazo')),
  status TEXT NOT NULL DEFAULT 'Pendente'
    CHECK (status IN ('Pago', 'Pendente', 'Atrasado', 'Cancelado')),
  payment_date DATE,
  transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT temple_sales_description_not_blank CHECK (length(trim(description)) > 0),
  CONSTRAINT temple_sales_paid_requires_account CHECK (
    status <> 'Pago' OR account_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_temple_sales_brother_id
  ON public.temple_sales(brother_id);

CREATE INDEX IF NOT EXISTS idx_temple_sales_status
  ON public.temple_sales(status);

CREATE INDEX IF NOT EXISTS idx_temple_sales_sale_date
  ON public.temple_sales(sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_temple_sales_transaction_id
  ON public.temple_sales(transaction_id);

INSERT INTO public.financial_categories (name, type, description, color)
VALUES (
  'Venda do Templo',
  'Receita',
  'Vendas e cobranças avulsas do templo por irmão',
  '#0f766e'
)
ON CONFLICT (name, type) DO NOTHING;

CREATE OR REPLACE FUNCTION public.update_temple_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_temple_sales_updated_at ON public.temple_sales;
CREATE TRIGGER update_temple_sales_updated_at
  BEFORE UPDATE ON public.temple_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_temple_sales_updated_at();

CREATE OR REPLACE FUNCTION public.can_manage_temple_sales(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_admin_or_editor() THEN
    RETURN TRUE;
  END IF;

  IF public.has_module_permission(p_user_id, 'financial') THEN
    RETURN TRUE;
  END IF;

  IF public.has_module_permission(p_user_id, 'temple_sales') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION public.can_manage_temple_sales(UUID) IS
  'Admin/editor, tesouraria (financial) ou cargos com módulo temple_sales.';

GRANT EXECUTE ON FUNCTION public.can_manage_temple_sales(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.has_module_permission(
  p_user_id uuid,
  p_module text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_position public.lodge_position_type;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND email = 'allantomazela@gmail.com'
  ) THEN
    RETURN TRUE;
  END IF;

  v_position := public.get_user_current_position(p_user_id);

  IF v_position IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_position = 'veneravel_mestre' THEN
    RETURN TRUE;
  END IF;

  CASE v_position
    WHEN 'secretario' THEN
      RETURN p_module IN ('secretariat', 'agenda', 'library', 'agape', 'temple_sales');
    WHEN 'chanceler' THEN
      RETURN p_module IN ('chancellor', 'agenda', 'agape', 'temple_sales');
    WHEN 'tesoureiro' THEN
      RETURN p_module IN ('financial', 'agape', 'temple_sales');
    WHEN 'orador' THEN
      RETURN p_module IN ('reports', 'agape');
    WHEN 'mestre_banquete' THEN
      RETURN p_module IN ('agape', 'temple_sales');
    WHEN 'hospitaleiro' THEN
      RETURN p_module = 'temple_sales';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

COMMENT ON FUNCTION public.has_module_permission(uuid, text) IS
  'Permissões por cargo. Inclui temple_sales e cargo hospitaleiro.';

ALTER TABLE public.temple_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brothers can view own temple sales" ON public.temple_sales;
CREATE POLICY "Brothers can view own temple sales"
  ON public.temple_sales FOR SELECT
  TO authenticated
  USING (brother_id = auth.uid());

DROP POLICY IF EXISTS "Temple sales managers can manage sales" ON public.temple_sales;
CREATE POLICY "Temple sales managers can manage sales"
  ON public.temple_sales FOR ALL
  TO authenticated
  USING (public.can_manage_temple_sales(auth.uid()))
  WITH CHECK (public.can_manage_temple_sales(auth.uid()));

DROP POLICY IF EXISTS "Temple sales managers can read approved profiles" ON public.profiles;
CREATE POLICY "Temple sales managers can read approved profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    AND public.can_manage_temple_sales(auth.uid())
  );

DROP POLICY IF EXISTS "Temple sales managers can view financial accounts" ON public.financial_accounts;
CREATE POLICY "Temple sales managers can view financial accounts"
  ON public.financial_accounts FOR SELECT
  TO authenticated
  USING (public.can_manage_temple_sales(auth.uid()));

DROP POLICY IF EXISTS "Temple sales managers can insert temple sale transactions"
  ON public.financial_transactions;
CREATE POLICY "Temple sales managers can insert temple sale transactions"
  ON public.financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_manage_temple_sales(auth.uid())
    AND category = 'Venda do Templo'
  );

DROP POLICY IF EXISTS "Temple sales managers can update temple sale transactions"
  ON public.financial_transactions;
CREATE POLICY "Temple sales managers can update temple sale transactions"
  ON public.financial_transactions FOR UPDATE
  TO authenticated
  USING (
    public.can_manage_temple_sales(auth.uid())
    AND (
      category = 'Venda do Templo'
      OR EXISTS (
        SELECT 1 FROM public.temple_sales ts
        WHERE ts.transaction_id = financial_transactions.id
      )
    )
  )
  WITH CHECK (
    public.can_manage_temple_sales(auth.uid())
    AND category = 'Venda do Templo'
  );

DROP POLICY IF EXISTS "Temple sales managers can delete temple sale transactions"
  ON public.financial_transactions;
CREATE POLICY "Temple sales managers can delete temple sale transactions"
  ON public.financial_transactions FOR DELETE
  TO authenticated
  USING (
    public.can_manage_temple_sales(auth.uid())
    AND (
      category = 'Venda do Templo'
      OR EXISTS (
        SELECT 1 FROM public.temple_sales ts
        WHERE ts.transaction_id = financial_transactions.id
      )
    )
  );

DROP POLICY IF EXISTS "Temple sales managers can view temple sale transactions"
  ON public.financial_transactions;
CREATE POLICY "Temple sales managers can view temple sale transactions"
  ON public.financial_transactions FOR SELECT
  TO authenticated
  USING (
    public.can_manage_temple_sales(auth.uid())
    AND (
      category = 'Venda do Templo'
      OR EXISTS (
        SELECT 1 FROM public.temple_sales ts
        WHERE ts.transaction_id = financial_transactions.id
      )
    )
  );
