import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  manualSpeechValidationError,
  type ManualSessionSpeechInput,
} from '@/lib/session-speech-manual'

const EMPTY_FORM: ManualSessionSpeechInput = {
  date: '',
  speech: '',
  name: '',
  note: '',
}

type SessionSpeechManualFormProps = {
  defaultDate: string
  disabled: boolean
  saving: boolean
  onSubmit: (input: ManualSessionSpeechInput) => Promise<boolean>
}

export function SessionSpeechManualForm({
  defaultDate,
  disabled,
  saving,
  onSubmit,
}: SessionSpeechManualFormProps) {
  const [form, setForm] = useState<ManualSessionSpeechInput>({
    ...EMPTY_FORM,
    date: defaultDate,
  })
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const validationError = manualSpeechValidationError(form)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    const saved = await onSubmit({
      date: form.date,
      speech: form.speech.trim(),
      name: form.name.trim(),
      note: form.note.trim(),
    })
    if (saved) {
      setForm({ ...EMPTY_FORM, date: form.date })
    }
  }

  return (
    <div className="space-y-3 rounded-md border bg-card p-4">
      <div>
        <h4 className="text-sm font-semibold">Registrar fala manual</h4>
        <p className="text-sm text-muted-foreground">
          Use quando a fala não vem do cadastro: homenagem, comunicado ou outro
          nome que precise ser citado na sessão.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="manual-speech-date">Data</Label>
          <Input
            id="manual-speech-date"
            type="date"
            value={form.date}
            disabled={disabled || saving}
            onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manual-speech-kind">Fala</Label>
          <Input
            id="manual-speech-kind"
            value={form.speech}
            maxLength={120}
            disabled={disabled || saving}
            placeholder="Homenagem, comunicado..."
            onChange={(event) => setForm((current) => ({ ...current, speech: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manual-speech-name">Nome</Label>
          <Input
            id="manual-speech-name"
            value={form.name}
            maxLength={160}
            disabled={disabled || saving}
            placeholder="Quem será citado"
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="manual-speech-note">Observação</Label>
        <Textarea
          id="manual-speech-note"
          value={form.note}
          maxLength={400}
          disabled={disabled || saving}
          placeholder="Opcional. Aparece na lista impressa."
          onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="button" onClick={() => void handleSubmit()} disabled={disabled || saving}>
          Incluir na lista
        </Button>
      </div>
    </div>
  )
}
