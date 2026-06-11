-- Ao aprovar conta criada pelo site (role member), cria cadastro em brothers para a Secretaria.

CREATE OR REPLACE FUNCTION public.normalize_profile_masonic_degree(deg TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF deg IS NULL OR trim(deg) = '' THEN
    RETURN 'Aprendiz';
  END IF;
  IF trim(deg) IN ('Aprendiz', 'Companheiro', 'Mestre') THEN
    RETURN trim(deg);
  END IF;
  RETURN 'Aprendiz';
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_brother_on_profile_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
  v_degree TEXT;
  v_existing_id UUID;
BEGIN
  IF NEW.status IS DISTINCT FROM 'approved'::public.user_status THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM 'approved'::public.user_status THEN
    RETURN NEW;
  END IF;

  -- Cadastro pelo site: perfil de membro
  IF NEW.role IS DISTINCT FROM 'member'::public.app_role THEN
    RETURN NEW;
  END IF;

  v_email := NULLIF(trim(COALESCE(NEW.email, '')), '');
  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  v_name := NULLIF(trim(COALESCE(NEW.full_name, '')), '');
  IF v_name IS NULL THEN
    v_name := split_part(v_email, '@', 1);
  END IF;

  SELECT b.id INTO v_existing_id
  FROM public.brothers b
  WHERE b.profile_id = NEW.id
     OR lower(trim(b.email)) = lower(v_email)
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.brothers
    SET
      profile_id = COALESCE(profile_id, NEW.id),
      degree = public.normalize_profile_masonic_degree(NEW.masonic_degree),
      updated_at = timezone('utc'::text, now())
    WHERE id = v_existing_id
      AND (profile_id IS NULL OR degree IS DISTINCT FROM public.normalize_profile_masonic_degree(NEW.masonic_degree));
    RETURN NEW;
  END IF;

  v_degree := public.normalize_profile_masonic_degree(NEW.masonic_degree);

  INSERT INTO public.brothers (
    name,
    email,
    phone,
    degree,
    role,
    status,
    initiation_date,
    photo_url,
    profile_id,
    notes
  ) VALUES (
    v_name,
    v_email,
    'Não informado',
    v_degree,
    'Irmão',
    'Ativo',
    CURRENT_DATE,
    CASE
      WHEN NEW.avatar_url IS NOT NULL
        AND trim(NEW.avatar_url) <> ''
        AND NEW.avatar_url NOT ILIKE '%usecurling.com%'
      THEN NEW.avatar_url
      ELSE NULL
    END,
    NEW.id,
    'Cadastro criado automaticamente após aprovação da conta no site.'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'sync_brother_on_profile_approval failed for profile %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_brother_on_profile_approval IS
  'Cria ou vincula registro em brothers quando um membro é aprovado no sistema';

DROP TRIGGER IF EXISTS on_profile_approved_sync_brother ON public.profiles;

CREATE TRIGGER on_profile_approved_sync_brother
  AFTER UPDATE OF status ON public.profiles
  FOR EACH ROW
  WHEN (
    NEW.status = 'approved'::public.user_status
    AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'approved'::public.user_status)
  )
  EXECUTE FUNCTION public.sync_brother_on_profile_approval();

-- Membros já aprovados antes desta migration
INSERT INTO public.brothers (
  name,
  email,
  phone,
  degree,
  role,
  status,
  initiation_date,
  photo_url,
  profile_id,
  notes
)
SELECT
  COALESCE(NULLIF(trim(p.full_name), ''), split_part(p.email, '@', 1)),
  trim(p.email),
  'Não informado',
  public.normalize_profile_masonic_degree(p.masonic_degree),
  'Irmão',
  'Ativo',
  COALESCE(p.created_at::date, CURRENT_DATE),
  CASE
    WHEN p.avatar_url IS NOT NULL
      AND trim(p.avatar_url) <> ''
      AND p.avatar_url NOT ILIKE '%usecurling.com%'
    THEN p.avatar_url
    ELSE NULL
  END,
  p.id,
  'Cadastro criado automaticamente (conta já aprovada antes da sincronização).'
FROM public.profiles p
WHERE p.status = 'approved'::public.user_status
  AND p.role = 'member'::public.app_role
  AND p.email IS NOT NULL
  AND trim(p.email) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.brothers b
    WHERE b.profile_id = p.id
       OR lower(trim(b.email)) = lower(trim(p.email))
  );
