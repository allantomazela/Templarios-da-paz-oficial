-- Otimiza RLS: evita reavaliar auth.uid()/funções por linha (initplan)
-- e torna is_admin_or_editor STABLE para cache no statement.

CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (auth.jwt() ->> 'email') = 'allantomazela@gmail.com' THEN
    RETURN TRUE;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'editor')
  );
END;
$$;

-- brothers
DROP POLICY IF EXISTS "Members can view own brother record" ON public.brothers;
CREATE POLICY "Members can view own brother record"
  ON public.brothers FOR SELECT
  TO authenticated
  USING (public.is_own_brother_row(brothers.*));

DROP POLICY IF EXISTS "Members can update own brother record" ON public.brothers;
CREATE POLICY "Members can update own brother record"
  ON public.brothers FOR UPDATE
  TO authenticated
  USING (public.is_own_brother_row(brothers.*))
  WITH CHECK (public.is_own_brother_row(brothers.*));

DROP POLICY IF EXISTS "Secretariat can view brothers" ON public.brothers;
CREATE POLICY "Secretariat can view brothers"
  ON public.brothers FOR SELECT
  TO authenticated
  USING ((SELECT public.can_manage_secretariat((SELECT auth.uid()))));

DROP POLICY IF EXISTS "Secretariat can update brothers" ON public.brothers;
CREATE POLICY "Secretariat can update brothers"
  ON public.brothers FOR UPDATE
  TO authenticated
  USING ((SELECT public.can_manage_secretariat((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.can_manage_secretariat((SELECT auth.uid()))));

DROP POLICY IF EXISTS "Secretariat can delete brothers" ON public.brothers;
CREATE POLICY "Secretariat can delete brothers"
  ON public.brothers FOR DELETE
  TO authenticated
  USING ((SELECT public.can_manage_secretariat((SELECT auth.uid()))));

DROP POLICY IF EXISTS "Secretariat can insert brothers" ON public.brothers;
CREATE POLICY "Secretariat can insert brothers"
  ON public.brothers FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.can_manage_secretariat((SELECT auth.uid()))));

-- profiles (políticas quentes)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Agape recorders can read approved profiles" ON public.profiles;
CREATE POLICY "Agape recorders can read approved profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    AND (SELECT public.can_record_agape_consumption((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Temple sales managers can read approved profiles" ON public.profiles;
CREATE POLICY "Temple sales managers can read approved profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    AND (SELECT public.can_manage_temple_sales((SELECT auth.uid())))
  );

-- temple_sales
DROP POLICY IF EXISTS "Brothers can view own temple sales" ON public.temple_sales;
CREATE POLICY "Brothers can view own temple sales"
  ON public.temple_sales FOR SELECT
  TO authenticated
  USING (brother_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Temple sales managers can manage sales" ON public.temple_sales;
CREATE POLICY "Temple sales managers can manage sales"
  ON public.temple_sales FOR ALL
  TO authenticated
  USING ((SELECT public.can_manage_temple_sales((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.can_manage_temple_sales((SELECT auth.uid()))));

-- financial_accounts
DROP POLICY IF EXISTS "Temple sales managers can view financial accounts" ON public.financial_accounts;
CREATE POLICY "Temple sales managers can view financial accounts"
  ON public.financial_accounts FOR SELECT
  TO authenticated
  USING ((SELECT public.can_manage_temple_sales((SELECT auth.uid()))));

DROP POLICY IF EXISTS "Agape closing managers can view financial accounts" ON public.financial_accounts;
CREATE POLICY "Agape closing managers can view financial accounts"
  ON public.financial_accounts FOR SELECT
  TO authenticated
  USING ((SELECT public.can_manage_agape_closing((SELECT auth.uid()))));

-- financial_transactions (ágape + temple sales + admin/editor)
DROP POLICY IF EXISTS "Admins and Editors can view all transactions" ON public.financial_transactions;
CREATE POLICY "Admins and Editors can view all transactions"
  ON public.financial_transactions FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin_or_editor())
    OR (SELECT public.has_module_permission((SELECT auth.uid()), 'financial'))
  );

DROP POLICY IF EXISTS "Admins and Editors can update transactions" ON public.financial_transactions;
CREATE POLICY "Admins and Editors can update transactions"
  ON public.financial_transactions FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_admin_or_editor())
    OR (SELECT public.has_module_permission((SELECT auth.uid()), 'financial'))
  )
  WITH CHECK (
    (SELECT public.is_admin_or_editor())
    OR (SELECT public.has_module_permission((SELECT auth.uid()), 'financial'))
  );

DROP POLICY IF EXISTS "Admins and Editors can delete transactions" ON public.financial_transactions;
CREATE POLICY "Admins and Editors can delete transactions"
  ON public.financial_transactions FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_admin_or_editor())
    OR (SELECT public.has_module_permission((SELECT auth.uid()), 'financial'))
  );

DROP POLICY IF EXISTS "Admins and Editors can insert transactions" ON public.financial_transactions;
CREATE POLICY "Admins and Editors can insert transactions"
  ON public.financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin_or_editor())
    OR (SELECT public.has_module_permission((SELECT auth.uid()), 'financial'))
  );

DROP POLICY IF EXISTS "Agape closing managers can view agape transactions" ON public.financial_transactions;
CREATE POLICY "Agape closing managers can view agape transactions"
  ON public.financial_transactions FOR SELECT
  TO authenticated
  USING (
    (SELECT public.can_manage_agape_closing((SELECT auth.uid())))
    AND (
      category = 'Ágape'
      OR EXISTS (
        SELECT 1 FROM public.agape_brother_charges ac
        WHERE ac.transaction_id = financial_transactions.id
      )
    )
  );

DROP POLICY IF EXISTS "Agape closing managers can insert agape transactions" ON public.financial_transactions;
CREATE POLICY "Agape closing managers can insert agape transactions"
  ON public.financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.can_manage_agape_closing((SELECT auth.uid())))
    AND category = 'Ágape'
  );

DROP POLICY IF EXISTS "Agape closing managers can update agape transactions" ON public.financial_transactions;
CREATE POLICY "Agape closing managers can update agape transactions"
  ON public.financial_transactions FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.can_manage_agape_closing((SELECT auth.uid())))
    AND (
      category = 'Ágape'
      OR EXISTS (
        SELECT 1 FROM public.agape_brother_charges ac
        WHERE ac.transaction_id = financial_transactions.id
      )
    )
  )
  WITH CHECK (
    (SELECT public.can_manage_agape_closing((SELECT auth.uid())))
    AND category = 'Ágape'
  );

DROP POLICY IF EXISTS "Agape closing managers can delete agape transactions" ON public.financial_transactions;
CREATE POLICY "Agape closing managers can delete agape transactions"
  ON public.financial_transactions FOR DELETE
  TO authenticated
  USING (
    (SELECT public.can_manage_agape_closing((SELECT auth.uid())))
    AND (
      category = 'Ágape'
      OR EXISTS (
        SELECT 1 FROM public.agape_brother_charges ac
        WHERE ac.transaction_id = financial_transactions.id
      )
    )
  );

DROP POLICY IF EXISTS "Temple sales managers can view temple sale transactions" ON public.financial_transactions;
CREATE POLICY "Temple sales managers can view temple sale transactions"
  ON public.financial_transactions FOR SELECT
  TO authenticated
  USING (
    (SELECT public.can_manage_temple_sales((SELECT auth.uid())))
    AND (
      category = 'Venda do Templo'
      OR EXISTS (
        SELECT 1 FROM public.temple_sales ts
        WHERE ts.transaction_id = financial_transactions.id
      )
    )
  );

DROP POLICY IF EXISTS "Temple sales managers can insert temple sale transactions" ON public.financial_transactions;
CREATE POLICY "Temple sales managers can insert temple sale transactions"
  ON public.financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.can_manage_temple_sales((SELECT auth.uid())))
    AND category = 'Venda do Templo'
  );

DROP POLICY IF EXISTS "Temple sales managers can update temple sale transactions" ON public.financial_transactions;
CREATE POLICY "Temple sales managers can update temple sale transactions"
  ON public.financial_transactions FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.can_manage_temple_sales((SELECT auth.uid())))
    AND (
      category = 'Venda do Templo'
      OR EXISTS (
        SELECT 1 FROM public.temple_sales ts
        WHERE ts.transaction_id = financial_transactions.id
      )
    )
  )
  WITH CHECK (
    (SELECT public.can_manage_temple_sales((SELECT auth.uid())))
    AND category = 'Venda do Templo'
  );

DROP POLICY IF EXISTS "Temple sales managers can delete temple sale transactions" ON public.financial_transactions;
CREATE POLICY "Temple sales managers can delete temple sale transactions"
  ON public.financial_transactions FOR DELETE
  TO authenticated
  USING (
    (SELECT public.can_manage_temple_sales((SELECT auth.uid())))
    AND (
      category = 'Venda do Templo'
      OR EXISTS (
        SELECT 1 FROM public.temple_sales ts
        WHERE ts.transaction_id = financial_transactions.id
      )
    )
  );

-- lodge_documents
DROP POLICY IF EXISTS "Admins and Editors can view documents" ON public.lodge_documents;
DROP POLICY IF EXISTS "Authenticated can view documents" ON public.lodge_documents;
CREATE POLICY "Authenticated can view documents"
  ON public.lodge_documents FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins and Editors can insert documents" ON public.lodge_documents;
CREATE POLICY "Admins and Editors can insert documents"
  ON public.lodge_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins and Editors can update documents" ON public.lodge_documents;
CREATE POLICY "Admins and Editors can update documents"
  ON public.lodge_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins and Editors can delete documents" ON public.lodge_documents;
CREATE POLICY "Admins and Editors can delete documents"
  ON public.lodge_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'editor')
    )
  );
