-- Tabelas para o módulo Chanceler: eventos, atas de sessão e presença (check-in por QR e lista do Chanceler)
-- attendance.brother_id referencia profiles.id (usuário autenticado), alinhado ao resto do sistema

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

-- events: leitura/escrita para admin e editor
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

-- attendance: admin/editor podem tudo; usuário autenticado pode inserir apenas seu próprio registro (check-in por QR)
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

DROP POLICY IF EXISTS "Authenticated can insert own attendance for QR check-in" ON public.attendance;
CREATE POLICY "Authenticated can insert own attendance for QR check-in"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = brother_id);

-- Leitura própria: irmão pode ver suas presenças (para feedback após check-in)
DROP POLICY IF EXISTS "Users can read own attendance" ON public.attendance;
CREATE POLICY "Users can read own attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (auth.uid() = brother_id);

COMMENT ON TABLE public.events IS 'Eventos/sessões da loja (data e horário para validação de check-in)';
COMMENT ON TABLE public.session_records IS 'Atas de sessão vinculadas a um evento';
COMMENT ON TABLE public.attendance IS 'Presença por sessão; brother_id = profiles.id; source = chancellor ou qr_checkin';
