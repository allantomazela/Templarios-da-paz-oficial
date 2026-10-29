import { useEffect, useMemo, useRef, useState } from 'react'
import { Printer, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePrintReport } from '@/hooks/use-print-report'
import useChancellorStore from '@/stores/useChancellorStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { formatDateBR } from '@/lib/format-utils'
import { A4_REPORT_PRINT_STYLE } from '@/lib/report-print-style'
import {
  buildSessionSpeechRows,
  defaultSpeechDay,
  defaultSpeechMonth,
  EMPTY_SESSION_SPEECH_FILTERS,
  resolveSessionSpeechRange,
  SESSION_SPEECH_CATEGORY_OPTIONS,
  type SessionSpeechCategoryId,
  type SessionSpeechFilters,
  type SessionSpeechPeriod,
} from '@/lib/session-speech-list'
import {
  mergeManualSpeechRows,
  type SessionSpeechNote,
} from '@/lib/session-speech-manual'
import {
  createSessionSpeechNote,
  deleteSessionSpeechNote,
  listSessionSpeechNotes,
} from '@/lib/session-speech-notes-api'
import { SessionSpeechManualForm } from './SessionSpeechManualForm'
import { SessionSpeechSheet } from './SessionSpeechSheet'

const PERIOD_LABELS: Record<SessionSpeechPeriod, string> = {
  day: 'Dia da sessão',
  month: 'Mês',
  range: 'Intervalo',
}

export function SessionSpeechPanel() {
  const brothers = useChancellorStore((state) => state.brothers)
  const fetchSettings = useSiteSettingsStore((state) => state.fetchSettings)
  const [period, setPeriod] = useState<SessionSpeechPeriod>('day')
  const [day, setDay] = useState(defaultSpeechDay)
  const [month, setMonth] = useState(defaultSpeechMonth)
  const [from, setFrom] = useState(defaultSpeechDay)
  const [to, setTo] = useState(defaultSpeechDay)
  const [filters, setFilters] = useState<SessionSpeechFilters>(EMPTY_SESSION_SPEECH_FILTERS)
  const [notes, setNotes] = useState<SessionSpeechNote[]>([])
  const [notesReady, setNotesReady] = useState(false)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [savingNote, setSavingNote] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    let active = true
    void listSessionSpeechNotes()
      .then((loaded) => {
        if (!active) return
        setNotes(loaded)
        setNotesError(null)
        setNotesReady(true)
      })
      .catch(() => {
        if (!active) return
        setNotesError(
          'O registro manual ainda não pôde ser carregado. As falas calculadas do cadastro continuam disponíveis.',
        )
        setNotesReady(false)
      })
    return () => {
      active = false
    }
  }, [])

  const range = useMemo(
    () => resolveSessionSpeechRange({ period, day, month, from, to }),
    [period, day, month, from, to],
  )

  const rows = useMemo(() => {
    if (!range) return []
    const generated = buildSessionSpeechRows(brothers, filters, range.start, range.end)
    return mergeManualSpeechRows(generated, notes, range.start, range.end)
  }, [brothers, filters, notes, range])

  const manualInRange = useMemo(() => {
    if (!range) return []
    return notes.filter((note) => note.date >= range.start && note.date <= range.end)
  }, [notes, range])

  const handlePrint = usePrintReport({
    contentRef: sheetRef,
    documentTitle: range ? `Falas_Sessao_${range.start}` : 'Falas_Sessao',
    pageStyle: A4_REPORT_PRINT_STYLE,
    successTitle: 'Lista de falas enviada à impressão',
    successDescription: 'Imprima em A4 para usar na sessão.',
    errorDescription: 'Não foi possível gerar a lista de falas. Tente novamente.',
  })

  function toggleFilter(id: SessionSpeechCategoryId, checked: boolean) {
    setFilters((current) => ({ ...current, [id]: checked }))
  }

  async function handleCreateNote(input: Parameters<typeof createSessionSpeechNote>[0]) {
    setSavingNote(true)
    try {
      const created = await createSessionSpeechNote(input)
      setNotes((current) => [...current, created])
      setNotesError(null)
      return true
    } catch (error) {
      setNotesError(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a fala manual.',
      )
      return false
    } finally {
      setSavingNote(false)
    }
  }

  async function handleDeleteNote(id: string) {
    const previous = notes
    setNotes((current) => current.filter((note) => note.id !== id))
    try {
      await deleteSessionSpeechNote(id)
    } catch (error) {
      setNotes(previous)
      setNotesError(
        error instanceof Error ? error.message : 'Não foi possível remover a fala manual.',
      )
    }
  }

  const periodLabel = range
    ? range.start === range.end
      ? formatDateBR(range.start)
      : `${formatDateBR(range.start)} a ${formatDateBR(range.end)}`
    : 'Período inválido'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Falas da sessão</CardTitle>
          <CardDescription>
            Marque só o que vai ser falado. Aniversários, cunha, sobrinhos e datas
            maçônicas aparecem quando o cadastro do irmão tem a data. Datas da
            sociedade não dependem de profissão. O registro manual entra na mesma
            lista e na impressão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="speech-period">Período</Label>
              <Select
                value={period}
                onValueChange={(value) => setPeriod(value as SessionSpeechPeriod)}
              >
                <SelectTrigger id="speech-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERIOD_LABELS) as SessionSpeechPeriod[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {PERIOD_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {period === 'day' ? (
              <div className="space-y-2">
                <Label htmlFor="speech-day">Data</Label>
                <Input
                  id="speech-day"
                  type="date"
                  value={day}
                  onChange={(event) => setDay(event.target.value)}
                />
              </div>
            ) : null}
            {period === 'month' ? (
              <div className="space-y-2">
                <Label htmlFor="speech-month">Mês</Label>
                <Input
                  id="speech-month"
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                />
              </div>
            ) : null}
            {period === 'range' ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="speech-from">De</Label>
                  <Input
                    id="speech-from"
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speech-to">Até</Label>
                  <Input
                    id="speech-to"
                    type="date"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SESSION_SPEECH_CATEGORY_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={filters[option.id]}
                  onCheckedChange={(value) => toggleFilter(option.id, value === true)}
                />
                {option.label}
              </label>
            ))}
          </div>

          <SessionSpeechManualForm
            defaultDate={period === 'day' ? day : defaultSpeechDay()}
            disabled={!notesReady}
            saving={savingNote}
            onSubmit={handleCreateNote}
          />
          {notesError ? <p className="text-sm text-destructive">{notesError}</p> : null}
          {manualInRange.length > 0 ? (
            <ul className="space-y-2">
              {manualInRange.map((note) => (
                <li
                  key={note.id}
                  className="flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{formatDateBR(note.date)}</span>
                    {' · '}
                    {note.speech}
                    {' · '}
                    {note.name}
                    {note.note ? ` · ${note.note}` : ''}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover fala de ${note.name}`}
                    onClick={() => void handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="text-sm text-muted-foreground">
            {range
              ? `${rows.length} fala${rows.length === 1 ? '' : 's'} em ${periodLabel}.`
              : 'Informe um período válido. No intervalo, a data inicial precisa ser anterior ou igual à final.'}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => handlePrint()} disabled={!range || rows.length === 0}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir A4
        </Button>
      </div>

      <div className="overflow-auto rounded-md border bg-muted/30 p-3">
        <SessionSpeechSheet ref={sheetRef} periodLabel={periodLabel} rows={rows} />
      </div>
    </div>
  )
}
