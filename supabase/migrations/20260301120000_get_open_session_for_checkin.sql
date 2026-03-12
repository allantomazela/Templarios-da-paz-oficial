-- Função para descobrir automaticamente a sessão aberta para check-in
-- Usada pelo QR fixo do Templo (sem token), combinada com geofencing na Edge Function.
-- Regra: encontra a sessão cujo horário de evento está dentro de uma janela em torno de "agora".
-- Abertura: site_settings.checkin_open_minutes_before (já existente, default 30 minutos antes)
-- Fechamento: 4 horas após o horário da sessão (janela segura para sessões longas)

CREATE OR REPLACE FUNCTION public.get_open_session_for_checkin()
RETURNS TABLE (
  session_record_id UUID,
  event_id UUID,
  event_date DATE,
  event_time TIME WITHOUT TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_open_minutes INTEGER;
  v_close_minutes_after INTEGER := 240; -- 4 horas após o horário da sessão
BEGIN
  -- Usamos o horário atual em UTC para comparação consistente
  v_now := timezone('utc'::text, now());

  -- Tempo de abertura antes da sessão, vindo de site_settings (padrão 30 minutos)
  SELECT COALESCE(checkin_open_minutes_before, 30)
  INTO v_open_minutes
  FROM public.site_settings
  WHERE id = 1;

  IF v_open_minutes IS NULL THEN
    v_open_minutes := 30;
  END IF;

  RETURN QUERY
  SELECT
    sr.id AS session_record_id,
    e.id AS event_id,
    e.date AS event_date,
    e.time AS event_time
  FROM public.session_records sr
  JOIN public.events e ON e.id = sr.event_id
  WHERE
    -- Construímos o horário da sessão combinando date + time
    -- e abrimos a janela v_open_minutes antes e v_close_minutes_after depois
    v_now BETWEEN
      (timezone('utc'::text, (e.date + e.time))) - (v_open_minutes || ' minutes')::interval
      AND
      (timezone('utc'::text, (e.date + e.time))) + (v_close_minutes_after || ' minutes')::interval
  ORDER BY
    -- Em caso de múltiplas sessões na janela, priorizamos a mais próxima de agora
    ABS(EXTRACT(EPOCH FROM (timezone('utc'::text, (e.date + e.time)) - v_now)))
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_open_session_for_checkin() IS
'Retorna a sessão (session_record) atualmente aberta para check-in, baseada em site_settings.checkin_open_minutes_before e em uma janela de 4h após o horário do evento.';

GRANT EXECUTE ON FUNCTION public.get_open_session_for_checkin() TO authenticated;

