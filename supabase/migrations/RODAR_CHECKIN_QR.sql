-- =============================================================================
-- CHECK-IN POR QR CODE - Migrations para rodar no SQL Editor do Supabase
-- Execute este arquivo inteiro no Dashboard > SQL Editor > New query
-- =============================================================================

-- 1) Configuração do templo (lat, lng, raio, minutos antes)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS temple_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS temple_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS checkin_radius_meters INTEGER,
  ADD COLUMN IF NOT EXISTS checkin_open_minutes_before INTEGER;

COMMENT ON COLUMN public.site_settings.temple_latitude IS 'Latitude do ponto do templo para validação de check-in por geolocalização';
COMMENT ON COLUMN public.site_settings.temple_longitude IS 'Longitude do ponto do templo para validação de check-in por geolocalização';
COMMENT ON COLUMN public.site_settings.checkin_radius_meters IS 'Raio em metros dentro do qual o check-in por QR é permitido';
COMMENT ON COLUMN public.site_settings.checkin_open_minutes_before IS 'Minutos antes do horário de início da sessão em que o check-in é liberado';

-- 2) Tabelas events, session_records e attendance
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT NOT NULL DEFAULT 'Sessão',
  location TEXT NOT NULL,
  location_id UUID,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.session_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  charity_collection NUMERIC(12, 2) DEFAULT 0,
  observations TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Finalizada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_record_id UUID NOT NULL REFERENCES public.session_records(id) ON DELETE CASCADE,
  brother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Presente' CHECK (status IN ('Presente', 'Ausente', 'Justificado')),
  justification TEXT,
  source TEXT DEFAULT 'chancellor' CHECK (source IN ('chancellor', 'qr_checkin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_record_id, brother_id)
);

CREATE INDEX IF NOT EXISTS idx_session_records_event_id ON public.session_records(event_id);
CREATE INDEX IF NOT EXISTS idx_session_records_date ON public.session_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_session_record_id ON public.attendance(session_record_id);
CREATE INDEX IF NOT EXISTS idx_attendance_brother_id ON public.attendance(brother_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- events: admin e editor
DROP POLICY IF EXISTS "Admins and Editors can manage events" ON public.events;
CREATE POLICY "Admins and Editors can manage events"
  ON public.events FOR ALL
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

-- session_records: admin e editor
DROP POLICY IF EXISTS "Admins and Editors can manage session_records" ON public.session_records;
CREATE POLICY "Admins and Editors can manage session_records"
  ON public.session_records FOR ALL
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

-- attendance: admin/editor
DROP POLICY IF EXISTS "Admins and Editors can manage attendance" ON public.attendance;
CREATE POLICY "Admins and Editors can manage attendance"
  ON public.attendance FOR ALL
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

-- attendance: irmão pode inserir só o próprio check-in (QR)
DROP POLICY IF EXISTS "Authenticated can insert own attendance for QR check-in" ON public.attendance;
CREATE POLICY "Authenticated can insert own attendance for QR check-in"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = brother_id);

-- attendance: irmão pode ler suas próprias presenças
DROP POLICY IF EXISTS "Users can read own attendance" ON public.attendance;
CREATE POLICY "Users can read own attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (auth.uid() = brother_id);

COMMENT ON TABLE public.events IS 'Eventos/sessões da loja (data e horário para validação de check-in)';
COMMENT ON TABLE public.session_records IS 'Atas de sessão vinculadas a um evento';
COMMENT ON TABLE public.attendance IS 'Presença por sessão; brother_id = profiles.id; source = chancellor ou qr_checkin';
