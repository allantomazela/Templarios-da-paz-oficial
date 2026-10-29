import { supabase } from '@/lib/supabase/client'
import {
  manualSpeechValidationError,
  type ManualSessionSpeechInput,
  type SessionSpeechNote,
} from '@/lib/session-speech-manual'

type SessionSpeechNoteRow = {
  id: string
  speech_date: string
  speech: string
  person_name: string
  note: string | null
}

function mapNote(row: SessionSpeechNoteRow): SessionSpeechNote {
  return {
    id: row.id,
    date: String(row.speech_date).slice(0, 10),
    speech: row.speech,
    name: row.person_name,
    note: row.note ?? '',
  }
}

export async function listSessionSpeechNotes(): Promise<SessionSpeechNote[]> {
  const { data, error } = await supabase
    .from('session_speech_notes')
    .select('id, speech_date, speech, person_name, note')
    .order('speech_date', { ascending: true })

  if (error) {
    throw new Error(error.message || 'Não foi possível carregar as falas manuais.')
  }

  return (data ?? []).map((row) => mapNote(row))
}

export async function createSessionSpeechNote(
  input: ManualSessionSpeechInput,
): Promise<SessionSpeechNote> {
  const validationError = manualSpeechValidationError(input)
  if (validationError) throw new Error(validationError)

  const { data: authData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('session_speech_notes')
    .insert({
      speech_date: input.date,
      speech: input.speech.trim(),
      person_name: input.name.trim(),
      note: input.note.trim(),
      created_by: authData.user?.id ?? null,
    })
    .select('id, speech_date, speech, person_name, note')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Não foi possível registrar a fala manual.')
  }

  return mapNote(data)
}

export async function deleteSessionSpeechNote(id: string): Promise<void> {
  const { error } = await supabase.from('session_speech_notes').delete().eq('id', id)
  if (error) {
    throw new Error(error.message || 'Não foi possível remover a fala manual.')
  }
}
