-- Ágape: registro de quem lançou consumo + permissões (Mestre de Banquete e diretoria)

ALTER TYPE public.lodge_position_type ADD VALUE IF NOT EXISTS 'mestre_banquete';

-- Quem registrou o consumo (irmão atendido em brother_id)
ALTER TABLE public.agape_consumptions
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agape_consumptions_recorded_by
  ON public.agape_consumptions(recorded_by);

-- Diretoria com mandato ativo (exceto mestre de banquete, tratado à parte)
CREATE OR REPLACE FUNCTION public.is_directorate_active(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.lodge_positions
    WHERE user_id = p_user_id
      AND position_type IN (
        'veneravel_mestre',
        'secretario',
        'chanceler',
        'tesoureiro',
        'orador'
      )
      AND CURRENT_DATE BETWEEN start_date AND end_date
  );
END;
$$;

-- Controle total do módulo (sessões, cardápio, relatórios)
CREATE OR REPLACE FUNCTION public.can_manage_agape(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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
    WHERE id = p_user_id AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN public.has_active_position(p_user_id, 'mestre_banquete')
    OR public.has_active_position(p_user_id, 'veneravel_mestre');
END;
$$;

-- Pode lançar consumo de irmãos (Mestre de Banquete + diretoria)
CREATE OR REPLACE FUNCTION public.can_record_agape_consumption(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN public.can_manage_agape(p_user_id)
    OR public.is_directorate_active(p_user_id)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_user_id AND role = 'editor'
    );
END;
$$;

-- Atualiza has_module_permission (inclui mestre_banquete)
CREATE OR REPLACE FUNCTION public.has_module_permission(
  p_user_id UUID,
  p_module TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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
      RETURN p_module IN ('secretariat', 'agenda', 'library', 'agape');
    WHEN 'chanceler' THEN
      RETURN p_module IN ('chancellor', 'agenda', 'agape');
    WHEN 'tesoureiro' THEN
      RETURN p_module IN ('financial', 'agape');
    WHEN 'orador' THEN
      RETURN p_module IN ('reports', 'agape');
    WHEN 'mestre_banquete' THEN
      RETURN p_module IN ('agenda', 'events', 'agape');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- Preenche recorded_by automaticamente
CREATE OR REPLACE FUNCTION public.set_agape_consumption_recorded_by()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.recorded_by IS NULL THEN
    NEW.recorded_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_agape_consumption_recorded_by_trigger ON public.agape_consumptions;
CREATE TRIGGER set_agape_consumption_recorded_by_trigger
  BEFORE INSERT ON public.agape_consumptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agape_consumption_recorded_by();

-- Irmão comum: registrar e editar apenas o próprio consumo em sessão aberta
DROP POLICY IF EXISTS "Brothers can create own consumptions" ON public.agape_consumptions;
CREATE POLICY "Brothers can create own consumptions"
  ON public.agape_consumptions FOR INSERT
  TO authenticated
  WITH CHECK (
    brother_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.agape_sessions
      WHERE id = session_id AND status = 'open'
    )
  );

DROP POLICY IF EXISTS "Brothers can update own consumptions" ON public.agape_consumptions;
CREATE POLICY "Brothers can update own consumptions"
  ON public.agape_consumptions FOR UPDATE
  TO authenticated
  USING (
    brother_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.agape_sessions
      WHERE id = session_id AND status = 'open'
    )
  )
  WITH CHECK (
    brother_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.agape_sessions
      WHERE id = session_id AND status = 'open'
    )
  );

DROP POLICY IF EXISTS "Mestre de Banquete can manage all consumptions" ON public.agape_consumptions;

CREATE POLICY "Agape managers can manage all consumptions"
  ON public.agape_consumptions FOR ALL
  TO authenticated
  USING (
    public.can_manage_agape(auth.uid()) OR public.is_admin()
  )
  WITH CHECK (
    public.can_manage_agape(auth.uid()) OR public.is_admin()
  );

CREATE POLICY "Directorate can record consumptions on open sessions"
  ON public.agape_consumptions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_record_agape_consumption(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.agape_sessions
      WHERE id = session_id AND status = 'open'
    )
  );

CREATE POLICY "Directorate can update consumptions on open sessions"
  ON public.agape_consumptions FOR UPDATE
  TO authenticated
  USING (
    public.can_record_agape_consumption(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.agape_sessions
      WHERE id = session_id AND status = 'open'
    )
  )
  WITH CHECK (
    public.can_record_agape_consumption(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.agape_sessions
      WHERE id = session_id AND status = 'open'
    )
  );

CREATE POLICY "Directorate can delete consumptions on open sessions"
  ON public.agape_consumptions FOR DELETE
  TO authenticated
  USING (
    public.can_record_agape_consumption(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.agape_sessions
      WHERE id = session_id AND status = 'open'
    )
  );

-- Sessões e cardápio: apenas quem gerencia o ágape
DROP POLICY IF EXISTS "Mestre de Banquete can manage sessions" ON public.agape_sessions;
CREATE POLICY "Agape managers can manage sessions"
  ON public.agape_sessions FOR ALL
  TO authenticated
  USING (public.can_manage_agape(auth.uid()) OR public.is_admin())
  WITH CHECK (public.can_manage_agape(auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Mestre de Banquete can manage menu" ON public.agape_menu_items;
CREATE POLICY "Agape managers can manage menu"
  ON public.agape_menu_items FOR ALL
  TO authenticated
  USING (public.can_manage_agape(auth.uid()) OR public.is_admin())
  WITH CHECK (public.can_manage_agape(auth.uid()) OR public.is_admin());
