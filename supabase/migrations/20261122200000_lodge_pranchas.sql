-- Pranchas para o saco de propostas:
-- qualquer irmão autenticado cria/imprime as próprias;
-- somente Venerável Mestre em exercício e o admin geral (e-mail master) veem todas.

CREATE TABLE IF NOT EXISTS public.lodge_pranchas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  session_date DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'read', 'archived')),
  submitted_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lodge_pranchas_author_id
  ON public.lodge_pranchas(author_id);
CREATE INDEX IF NOT EXISTS idx_lodge_pranchas_status_submitted
  ON public.lodge_pranchas(status, submitted_at DESC);

COMMENT ON TABLE public.lodge_pranchas IS
  'Pranchas do saco de propostas: autor vê as próprias; VM e admin geral veem todas.';

CREATE OR REPLACE FUNCTION public.is_master_admin_email()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') = 'allantomazela@gmail.com';
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_lodge_pranchas()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF public.is_master_admin_email() THEN
    RETURN TRUE;
  END IF;
  RETURN public.has_active_position(auth.uid(), 'veneravel_mestre');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_lodge_pranchas_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lodge_pranchas_updated_at ON public.lodge_pranchas;
CREATE TRIGGER trg_lodge_pranchas_updated_at
  BEFORE UPDATE ON public.lodge_pranchas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lodge_pranchas_updated_at();

ALTER TABLE public.lodge_pranchas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lodge_pranchas_select" ON public.lodge_pranchas;
CREATE POLICY "lodge_pranchas_select"
  ON public.lodge_pranchas
  FOR SELECT
  TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR public.can_manage_lodge_pranchas()
  );

DROP POLICY IF EXISTS "lodge_pranchas_insert" ON public.lodge_pranchas;
CREATE POLICY "lodge_pranchas_insert"
  ON public.lodge_pranchas
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "lodge_pranchas_update" ON public.lodge_pranchas;
CREATE POLICY "lodge_pranchas_update"
  ON public.lodge_pranchas
  FOR UPDATE
  TO authenticated
  USING (
    (author_id = (SELECT auth.uid()) AND status = 'draft')
    OR public.can_manage_lodge_pranchas()
  )
  WITH CHECK (
    (author_id = (SELECT auth.uid()) AND status IN ('draft', 'submitted'))
    OR public.can_manage_lodge_pranchas()
  );

DROP POLICY IF EXISTS "lodge_pranchas_delete" ON public.lodge_pranchas;
CREATE POLICY "lodge_pranchas_delete"
  ON public.lodge_pranchas
  FOR DELETE
  TO authenticated
  USING (
    author_id = (SELECT auth.uid()) AND status = 'draft'
  );

-- Envia a prancha ao VM (e notifica admin geral). SECURITY DEFINER para gravar notifications.
CREATE OR REPLACE FUNCTION public.submit_lodge_prancha(p_prancha_id UUID)
RETURNS public.lodge_pranchas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.lodge_pranchas;
  v_vm_id UUID;
  v_vm_name TEXT;
  v_sender_name TEXT;
BEGIN
  SELECT * INTO v_row
  FROM public.lodge_pranchas
  WHERE id = p_prancha_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prancha não encontrada.';
  END IF;

  IF v_row.author_id IS DISTINCT FROM auth.uid()
     AND NOT public.can_manage_lodge_pranchas() THEN
    RAISE EXCEPTION 'Sem permissão para enviar esta prancha.';
  END IF;

  IF v_row.status = 'archived' THEN
    RAISE EXCEPTION 'Prancha arquivada não pode ser reenviada.';
  END IF;

  UPDATE public.lodge_pranchas
  SET
    status = 'submitted',
    submitted_at = COALESCE(submitted_at, NOW())
  WHERE id = p_prancha_id
  RETURNING * INTO v_row;

  v_sender_name := v_row.author_name;

  SELECT lp.user_id, COALESCE(p.full_name, 'Venerável Mestre')
  INTO v_vm_id, v_vm_name
  FROM public.lodge_positions lp
  LEFT JOIN public.profiles p ON p.id = lp.user_id
  WHERE lp.position_type = 'veneravel_mestre'
    AND CURRENT_DATE BETWEEN lp.start_date AND lp.end_date
  LIMIT 1;

  IF v_vm_id IS NOT NULL THEN
    INSERT INTO public.internal_messages (
      sender_id,
      sender_name,
      recipient_id,
      recipient_name,
      subject,
      content
    ) VALUES (
      v_row.author_id,
      v_sender_name,
      v_vm_id,
      v_vm_name,
      'Prancha: ' || left(v_row.subject, 120),
      'Irmão ' || v_sender_name || ' enviou uma prancha para o saco de propostas.'
        || E'\n\nAssunto: ' || v_row.subject
        || E'\n\n' || v_row.body
        || E'\n\nAbra a caixa de pranchas: /dashboard/prancha'
    );

    INSERT INTO public.notifications (profile_id, title, message, link)
    VALUES (
      v_vm_id,
      'Nova prancha recebida',
      v_sender_name || ' — ' || left(v_row.subject, 80),
      '/dashboard/prancha'
    );
  END IF;

  -- Cópia de alerta ao admin geral (se não for o próprio autor nem o VM)
  INSERT INTO public.notifications (profile_id, title, message, link)
  SELECT p.id,
         'Nova prancha recebida',
         v_sender_name || ' — ' || left(v_row.subject, 80),
         '/dashboard/prancha'
  FROM public.profiles p
  WHERE p.email = 'allantomazela@gmail.com'
    AND p.id IS DISTINCT FROM v_row.author_id
    AND (v_vm_id IS NULL OR p.id IS DISTINCT FROM v_vm_id);

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_lodge_prancha(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_lodge_prancha(UUID) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lodge_pranchas TO authenticated;
