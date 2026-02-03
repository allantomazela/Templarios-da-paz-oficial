-- Garantir que o master admin seja sempre reconhecido como admin mesmo se o profile estiver desatualizado
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Fallback: reconhecer master admin pelo email no JWT (evita bloqueio se profile estiver desatualizado)
  IF (auth.jwt() ->> 'email') = 'allantomazela@gmail.com' THEN
    RETURN TRUE;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Fallback: master admin é sempre admin
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
