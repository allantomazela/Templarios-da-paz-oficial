-- Planos de pagamento ritualístico (Iniciação, Elevação, Exaltação, Outros) com parcelas

CREATE TABLE IF NOT EXISTS public.brother_ceremony_payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (
    payment_type IN ('Iniciacao', 'Elevacao', 'Exaltacao', 'Outros')
  ),
  description TEXT,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0),
  installments_count INTEGER NOT NULL DEFAULT 1 CHECK (installments_count >= 1),
  ceremony_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'cancelled')),
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT brother_ceremony_plans_outros_description CHECK (
    payment_type <> 'Outros' OR (description IS NOT NULL AND length(trim(description)) > 0)
  )
);

CREATE TABLE IF NOT EXISTS public.brother_ceremony_payment_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.brother_ceremony_payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL CHECK (installment_number >= 1),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pago', 'Pendente', 'Atrasado')),
  payment_date DATE,
  transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_ceremony_installment UNIQUE (plan_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_ceremony_plans_brother_id
  ON public.brother_ceremony_payment_plans(brother_id);

CREATE INDEX IF NOT EXISTS idx_ceremony_plans_status
  ON public.brother_ceremony_payment_plans(status);

CREATE INDEX IF NOT EXISTS idx_ceremony_installments_plan_id
  ON public.brother_ceremony_payment_installments(plan_id);

CREATE INDEX IF NOT EXISTS idx_ceremony_installments_transaction_id
  ON public.brother_ceremony_payment_installments(transaction_id);

INSERT INTO public.financial_categories (name, type, description, color)
VALUES
  ('Iniciação', 'Receita', 'Taxas de iniciação', '#7c3aed'),
  ('Elevação', 'Receita', 'Taxas de elevação', '#9333ea'),
  ('Exaltação', 'Receita', 'Taxas de exaltação', '#a855f7'),
  ('Outros (Irmãos)', 'Receita', 'Demais pagamentos de irmãos', '#64748b')
ON CONFLICT (name, type) DO NOTHING;

CREATE OR REPLACE FUNCTION public.update_ceremony_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_brother_ceremony_payment_plans_updated_at
  ON public.brother_ceremony_payment_plans;
CREATE TRIGGER update_brother_ceremony_payment_plans_updated_at
  BEFORE UPDATE ON public.brother_ceremony_payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ceremony_payment_updated_at();

DROP TRIGGER IF EXISTS update_brother_ceremony_payment_installments_updated_at
  ON public.brother_ceremony_payment_installments;
CREATE TRIGGER update_brother_ceremony_payment_installments_updated_at
  BEFORE UPDATE ON public.brother_ceremony_payment_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ceremony_payment_updated_at();

CREATE OR REPLACE FUNCTION public.refresh_ceremony_plan_status(p_plan_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total NUMERIC(10, 2);
  v_paid NUMERIC(10, 2);
  v_installments INTEGER;
  v_paid_count INTEGER;
BEGIN
  SELECT total_amount, installments_count
  INTO v_total, v_installments
  FROM public.brother_ceremony_payment_plans
  WHERE id = p_plan_id;

  SELECT COALESCE(SUM(amount), 0), COUNT(*) FILTER (WHERE status = 'Pago')
  INTO v_paid, v_paid_count
  FROM public.brother_ceremony_payment_installments
  WHERE plan_id = p_plan_id;

  UPDATE public.brother_ceremony_payment_plans
  SET status = CASE
    WHEN v_paid_count >= v_installments AND v_paid >= v_total THEN 'paid'
    ELSE 'open'
  END
  WHERE id = p_plan_id
    AND status <> 'cancelled';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.brother_ceremony_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brother_ceremony_payment_installments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brothers can view own ceremony plans" ON public.brother_ceremony_payment_plans;
CREATE POLICY "Brothers can view own ceremony plans"
  ON public.brother_ceremony_payment_plans FOR SELECT
  TO authenticated
  USING (brother_id = auth.uid());

DROP POLICY IF EXISTS "Brothers can view own ceremony installments" ON public.brother_ceremony_payment_installments;
CREATE POLICY "Brothers can view own ceremony installments"
  ON public.brother_ceremony_payment_installments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.brother_ceremony_payment_plans p
      WHERE p.id = plan_id AND p.brother_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Financial staff can manage ceremony plans" ON public.brother_ceremony_payment_plans;
CREATE POLICY "Financial staff can manage ceremony plans"
  ON public.brother_ceremony_payment_plans FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    ) OR
    public.has_module_permission(auth.uid(), 'financial')
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    ) OR
    public.has_module_permission(auth.uid(), 'financial')
  );

DROP POLICY IF EXISTS "Financial staff can manage ceremony installments" ON public.brother_ceremony_payment_installments;
CREATE POLICY "Financial staff can manage ceremony installments"
  ON public.brother_ceremony_payment_installments FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    ) OR
    public.has_module_permission(auth.uid(), 'financial')
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    ) OR
    public.has_module_permission(auth.uid(), 'financial')
  );
