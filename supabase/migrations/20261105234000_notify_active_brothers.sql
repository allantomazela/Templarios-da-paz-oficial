-- Aviso da Agenda para irmãos ativos com conta aprovada.
-- Função nova: não altera políticas, gatilhos nem a tabela notifications.

CREATE OR REPLACE FUNCTION public.notify_active_brothers(
  p_title text,
  p_message text,
  p_link text DEFAULT '/dashboard/agenda'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer;
  clean_title text;
  clean_message text;
  clean_link text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'É preciso estar autenticado para enviar o aviso.';
  END IF;

  IF NOT public.is_admin_or_editor() THEN
    RAISE EXCEPTION 'Só administração pode enviar aviso aos irmãos.';
  END IF;

  clean_title := left(btrim(coalesce(p_title, '')), 160);
  clean_message := left(btrim(coalesce(p_message, '')), 1000);
  clean_link := left(btrim(coalesce(p_link, '')), 200);

  IF clean_title = '' OR clean_message = '' THEN
    RAISE EXCEPTION 'Informe o assunto e a mensagem do aviso.';
  END IF;

  IF clean_link = '' THEN
    clean_link := '/dashboard/agenda';
  END IF;

  INSERT INTO public.notifications (profile_id, title, message, link)
  SELECT DISTINCT b.profile_id, clean_title, clean_message, clean_link
  FROM public.brothers b
  INNER JOIN public.profiles p ON p.id = b.profile_id
  WHERE b.status = 'Ativo'
    AND b.profile_id IS NOT NULL
    AND p.status = 'approved'::public.user_status
    AND b.profile_id <> auth.uid();

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_active_brothers(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_active_brothers(text, text, text) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
