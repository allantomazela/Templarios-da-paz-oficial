-- Tokens únicos para QR Code de check-in (geofencing + validação por token)
-- Coordenadas padrão do Templo: -22.8812604, -48.4554303 | raio 50m

CREATE TABLE IF NOT EXISTS public.checkin_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_record_id UUID NOT NULL REFERENCES public.session_records(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkin_tokens_token ON public.checkin_tokens(token);
CREATE INDEX IF NOT EXISTS idx_checkin_tokens_session_record_id ON public.checkin_tokens(session_record_id);
CREATE INDEX IF NOT EXISTS idx_checkin_tokens_expires_at ON public.checkin_tokens(expires_at);

ALTER TABLE public.checkin_tokens ENABLE ROW LEVEL SECURITY;

-- Apenas admin/editor podem ver e criar tokens
DROP POLICY IF EXISTS "Admins and Editors can manage checkin_tokens" ON public.checkin_tokens;
CREATE POLICY "Admins and Editors can manage checkin_tokens"
  ON public.checkin_tokens FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- RPC para obter ou criar token da sessão (usado pelo Chanceler ao exibir QR)
CREATE OR REPLACE FUNCTION public.get_or_create_checkin_token(p_session_record_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT token, expires_at INTO v_token, v_expires_at
  FROM public.checkin_tokens
  WHERE session_record_id = p_session_record_id
    AND expires_at > timezone('utc'::text, now())
  LIMIT 1;

  IF v_token IS NOT NULL THEN
    RETURN v_token;
  END IF;

  -- Expira no fim do dia da sessão + 1 dia
  SELECT sr.date + INTERVAL '2 days' INTO v_expires_at
  FROM public.session_records sr
  WHERE sr.id = p_session_record_id;

  IF v_expires_at IS NULL THEN
    v_expires_at := timezone('utc'::text, now()) + INTERVAL '24 hours';
  END IF;

  INSERT INTO public.checkin_tokens (session_record_id, token, expires_at)
  VALUES (p_session_record_id, encode(gen_random_bytes(16), 'hex'), v_expires_at)
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

COMMENT ON TABLE public.checkin_tokens IS 'Tokens únicos para QR Code de presença; validados no check-in com geolocalização';
COMMENT ON FUNCTION public.get_or_create_checkin_token(UUID) IS 'Retorna token ativo da sessão ou cria um novo (admin/editor).';

GRANT EXECUTE ON FUNCTION public.get_or_create_checkin_token(UUID) TO authenticated;
