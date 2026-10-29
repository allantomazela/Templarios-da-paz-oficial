import type { SessionSpeechRow } from '@/lib/session-speech-list'
import { sortSessionSpeechRows } from '@/lib/session-speech-list'

export interface ManualSessionSpeechInput {
  date: string
  speech: string
  name: string
  note: string
}

export interface SessionSpeechNote extends ManualSessionSpeechInput {
  id: string
}

const MANUAL_SPEECH_LIMITS = {
  speech: 120,
  name: 160,
  note: 400,
} as const

export function manualSpeechValidationError(
  input: ManualSessionSpeechInput,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return 'Informe a data da fala.'
  }
  const speech = input.speech.trim()
  const name = input.name.trim()
  const note = input.note.trim()
  if (!speech) return 'Escreva o que será falado.'
  if (speech.length > MANUAL_SPEECH_LIMITS.speech) {
    return `A fala pode ter no máximo ${MANUAL_SPEECH_LIMITS.speech} caracteres.`
  }
  if (!name) return 'Escreva o nome de quem será citado.'
  if (name.length > MANUAL_SPEECH_LIMITS.name) {
    return `O nome pode ter no máximo ${MANUAL_SPEECH_LIMITS.name} caracteres.`
  }
  if (note.length > MANUAL_SPEECH_LIMITS.note) {
    return `A observação pode ter no máximo ${MANUAL_SPEECH_LIMITS.note} caracteres.`
  }
  return null
}

/** Junta as falas calculadas do cadastro com as digitadas pelo Chanceler no período. */
export function mergeManualSpeechRows(
  generated: SessionSpeechRow[],
  notes: SessionSpeechNote[],
  start: string,
  end: string,
): SessionSpeechRow[] {
  const manual = notes
    .filter((note) => note.date >= start && note.date <= end)
    .map((note) => ({
      id: `manual-${note.id}`,
      date: note.date,
      speech: note.speech.trim(),
      name: note.name.trim(),
      link: note.note.trim() || 'Registro manual do Chanceler',
    }))

  return sortSessionSpeechRows([...generated, ...manual])
}
