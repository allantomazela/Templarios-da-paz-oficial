-- Falas digitadas pelo Chanceler, além das calculadas a partir do cadastro.
-- Tabela nova: não altera presença, agenda nem grau.

CREATE TABLE IF NOT EXISTS public.session_speech_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speech_date date NOT NULL,
  speech text NOT NULL,
  person_name text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT session_speech_notes_speech_len CHECK (char_length(trim(speech)) BETWEEN 1 AND 120),
  CONSTRAINT session_speech_notes_name_len CHECK (char_length(trim(person_name)) BETWEEN 1 AND 160),
  CONSTRAINT session_speech_notes_note_len CHECK (char_length(note) <= 400)
);

CREATE INDEX IF NOT EXISTS session_speech_notes_speech_date_idx
  ON public.session_speech_notes (speech_date);

ALTER TABLE public.session_speech_notes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.session_speech_notes FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.session_speech_notes TO authenticated;

DROP POLICY IF EXISTS "Chancellor module can read session speech notes" ON public.session_speech_notes;
CREATE POLICY "Chancellor module can read session speech notes"
  ON public.session_speech_notes
  FOR SELECT
  TO authenticated
  USING (public.can_manage_chancellor_data(auth.uid()));

DROP POLICY IF EXISTS "Chancellor module can insert session speech notes" ON public.session_speech_notes;
CREATE POLICY "Chancellor module can insert session speech notes"
  ON public.session_speech_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_chancellor_data(auth.uid()));

DROP POLICY IF EXISTS "Chancellor module can update session speech notes" ON public.session_speech_notes;
CREATE POLICY "Chancellor module can update session speech notes"
  ON public.session_speech_notes
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_chancellor_data(auth.uid()))
  WITH CHECK (public.can_manage_chancellor_data(auth.uid()));

DROP POLICY IF EXISTS "Chancellor module can delete session speech notes" ON public.session_speech_notes;
CREATE POLICY "Chancellor module can delete session speech notes"
  ON public.session_speech_notes
  FOR DELETE
  TO authenticated
  USING (public.can_manage_chancellor_data(auth.uid()));

COMMENT ON TABLE public.session_speech_notes IS
  'Falas incluídas manualmente pelo Chanceler para a lista impressa da sessão.';
