-- Permissões de fechamento do Ágape: administração, tesouraria e Mestre de Banquete
-- Inclui transações financeiras vinculadas (categoria Ágape)

CREATE OR REPLACE FUNCTION public.can_manage_agape_closing(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND email = 'allantomazela@gmail.com'
  ) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role IN ('admin', 'editor')
  ) THEN
    RETURN TRUE;
  END IF;

  IF public.can_manage_agape(p_user_id) THEN
    RETURN TRUE;
  END IF;

  IF public.has_module_permission(p_user_id, 'financial') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION public.can_manage_agape_closing(UUID) IS
  'Administração, tesouraria e Mestre de Banquete/VM podem gerenciar o fechamento do Ágape';

GRANT EXECUTE ON FUNCTION public.can_manage_agape_closing(UUID) TO authenticated;

-- Fechamentos mensais
DROP POLICY IF EXISTS "Financial staff can manage agape closings" ON public.agape_monthly_closings;
CREATE POLICY "Agape closing managers can manage agape closings"
  ON public.agape_monthly_closings FOR ALL
  TO authenticated
  USING (public.can_manage_agape_closing(auth.uid()))
  WITH CHECK (public.can_manage_agape_closing(auth.uid()));

DROP POLICY IF EXISTS "Financial staff can view agape closings" ON public.agape_monthly_closings;
CREATE POLICY "Agape closing managers can view agape closings"
  ON public.agape_monthly_closings FOR SELECT
  TO authenticated
  USING (public.can_manage_agape_closing(auth.uid()));

-- Cobranças por irmão
DROP POLICY IF EXISTS "Financial staff can manage agape charges" ON public.agape_brother_charges;
CREATE POLICY "Agape closing managers can manage agape charges"
  ON public.agape_brother_charges FOR ALL
  TO authenticated
  USING (public.can_manage_agape_closing(auth.uid()))
  WITH CHECK (public.can_manage_agape_closing(auth.uid()));

DROP POLICY IF EXISTS "Financial staff can view all agape charges" ON public.agape_brother_charges;
CREATE POLICY "Agape closing managers can view all agape charges"
  ON public.agape_brother_charges FOR SELECT
  TO authenticated
  USING (public.can_manage_agape_closing(auth.uid()));

-- Leitura de contas e categorias para registrar pagamentos
DROP POLICY IF EXISTS "Agape closing managers can view financial accounts" ON public.financial_accounts;
CREATE POLICY "Agape closing managers can view financial accounts"
  ON public.financial_accounts FOR SELECT
  TO authenticated
  USING (public.can_manage_agape_closing(auth.uid()));

DROP POLICY IF EXISTS "Agape closing managers can view financial categories" ON public.financial_categories;
CREATE POLICY "Agape closing managers can view financial categories"
  ON public.financial_categories FOR SELECT
  TO authenticated
  USING (public.can_manage_agape_closing(auth.uid()));

-- Transações financeiras do Ágape (insert/update/delete ao confirmar ou excluir pagamento)
DROP POLICY IF EXISTS "Agape closing managers can insert agape transactions" ON public.financial_transactions;
CREATE POLICY "Agape closing managers can insert agape transactions"
  ON public.financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_manage_agape_closing(auth.uid())
    AND category = 'Ágape'
  );

DROP POLICY IF EXISTS "Agape closing managers can update agape transactions" ON public.financial_transactions;
CREATE POLICY "Agape closing managers can update agape transactions"
  ON public.financial_transactions FOR UPDATE
  TO authenticated
  USING (
    public.can_manage_agape_closing(auth.uid())
    AND (
      category = 'Ágape'
      OR EXISTS (
        SELECT 1 FROM public.agape_brother_charges ac
        WHERE ac.transaction_id = financial_transactions.id
      )
    )
  )
  WITH CHECK (
    public.can_manage_agape_closing(auth.uid())
    AND category = 'Ágape'
  );

DROP POLICY IF EXISTS "Agape closing managers can delete agape transactions" ON public.financial_transactions;
CREATE POLICY "Agape closing managers can delete agape transactions"
  ON public.financial_transactions FOR DELETE
  TO authenticated
  USING (
    public.can_manage_agape_closing(auth.uid())
    AND (
      category = 'Ágape'
      OR EXISTS (
        SELECT 1 FROM public.agape_brother_charges ac
        WHERE ac.transaction_id = financial_transactions.id
      )
    )
  );

DROP POLICY IF EXISTS "Agape closing managers can view agape transactions" ON public.financial_transactions;
CREATE POLICY "Agape closing managers can view agape transactions"
  ON public.financial_transactions FOR SELECT
  TO authenticated
  USING (
    public.can_manage_agape_closing(auth.uid())
    AND (
      category = 'Ágape'
      OR EXISTS (
        SELECT 1 FROM public.agape_brother_charges ac
        WHERE ac.transaction_id = financial_transactions.id
      )
    )
  );
