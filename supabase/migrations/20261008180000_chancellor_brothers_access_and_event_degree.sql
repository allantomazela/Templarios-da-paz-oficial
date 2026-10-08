-- Chancelaria: leitura limitada do quadro, gravação de grau/datas e grau da sessão no evento.
-- A tabela brothers só é legível pela Secretaria (RLS); o Chanceler precisa da chamada
-- sem acessar CPF, telefone ou endereço, por isso as funções abaixo expõem só o necessário.

-- 1) Quadro de obreiros para a chamada/folha de presença
CREATE OR REPLACE FUNCTION public.get_chancellor_brothers()
RETURNS TABLE (
  id uuid,
  name text,
  profile_id uuid,
  degree text,
  role text,
  status text,
  email text,
  initiation_date date,
  elevation_date date,
  exaltation_date date,
  attendance_rate integer,
  membership_situation text,
  cim text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id, b.name, b.profile_id, b.degree, b.role, b.status, b.email,
    b.initiation_date, b.elevation_date, b.exaltation_date, b.attendance_rate,
    b.membership_situation, b.cim
  FROM public.brothers b
  WHERE (SELECT public.can_manage_chancellor_data((SELECT auth.uid())))
     OR (SELECT public.can_manage_secretariat((SELECT auth.uid())))
     OR public.is_own_brother_row(b)
  ORDER BY b.name;
$$;

COMMENT ON FUNCTION public.get_chancellor_brothers IS
  'Quadro de obreiros com campos mínimos para a Chancelaria; demais usuários veem só o próprio registro.';

REVOKE ALL ON FUNCTION public.get_chancellor_brothers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chancellor_brothers() TO authenticated;

-- 2) Grau e datas maçônicas pela Chancelaria (sincroniza profiles.masonic_degree)
CREATE OR REPLACE FUNCTION public.update_brother_degree_info(
  p_brother_id uuid,
  p_degree text,
  p_initiation_date date,
  p_elevation_date date,
  p_exaltation_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  IF NOT (
    public.can_manage_chancellor_data(auth.uid())
    OR public.can_manage_secretariat(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Sem permissão para alterar o grau dos irmãos.'
      USING ERRCODE = '42501';
  END IF;

  IF p_degree IS NULL OR p_degree NOT IN ('Aprendiz', 'Companheiro', 'Mestre') THEN
    RAISE EXCEPTION 'Grau inválido.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.brothers
  SET
    degree = p_degree,
    initiation_date = COALESCE(p_initiation_date, initiation_date),
    elevation_date = p_elevation_date,
    exaltation_date = p_exaltation_date
  WHERE id = p_brother_id
  RETURNING profile_id INTO v_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Irmão não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF v_profile_id IS NOT NULL THEN
    UPDATE public.profiles SET masonic_degree = p_degree WHERE id = v_profile_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.update_brother_degree_info IS
  'Atualiza apenas grau e datas de iniciação/elevação/exaltação (Chancelaria ou Secretaria).';

REVOKE ALL ON FUNCTION public.update_brother_degree_info(uuid, text, date, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_brother_degree_info(uuid, text, date, date, date) TO authenticated;

-- 3) Grau da sessão (opcional; nulo = não informado)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS degree text
  CHECK (degree IS NULL OR degree IN ('Aprendiz', 'Companheiro', 'Mestre'));

COMMENT ON COLUMN public.events.degree IS
  'Grau em que a sessão é aberta (Aprendiz, Companheiro ou Mestre); usado na folha de presença.';
