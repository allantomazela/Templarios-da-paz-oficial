import { useState, useEffect } from 'react'
import type {
  InitiationCandidate,
  CandidatePhaseProgress,
  SindicanciaPhaseDefinition,
  CandidatePhaseStatus,
  InitiationCandidateStatus,
} from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, User, Calendar, UserCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { isAuthError, getSaveErrorMessage } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'
import { useToast } from '@/hooks/use-toast'

const PHASE_STATUS_LABELS: Record<CandidatePhaseStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  rejected: 'Reprovada',
}

const CANDIDATE_STATUS_LABELS: Record<InitiationCandidateStatus, string> = {
  indicado: 'Indicado',
  em_sindicancia: 'Em sindicância',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  iniciado: 'Iniciado',
}

interface CandidateDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: InitiationCandidate | null
  phaseProgress: CandidatePhaseProgress[]
  phaseDefinitions: SindicanciaPhaseDefinition[]
  onUpdated: () => void
}

export function CandidateDetail({
  open,
  onOpenChange,
  candidate,
  phaseProgress,
  phaseDefinitions,
  onUpdated,
}: CandidateDetailProps) {
  const { toast } = useToast()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingCandidateStatus, setUpdatingCandidateStatus] = useState(false)
  const [localCandidateStatus, setLocalCandidateStatus] = useState<InitiationCandidateStatus>(
    candidate?.status ?? 'em_sindicancia',
  )
  const [notesEdit, setNotesEdit] = useState<Record<string, string>>({})
  const supabaseAny = supabase as any

  useEffect(() => {
    if (candidate) setLocalCandidateStatus(candidate.status)
  }, [candidate?.id, candidate?.status])

  useEffect(() => {
    if (!open || !phaseProgress.length) return
    const initial: Record<string, string> = {}
    phaseProgress.forEach((p) => {
      initial[p.id] = p.notes ?? ''
    })
    setNotesEdit(initial)
  }, [open, phaseProgress])

  const updatePhaseProgress = async (
    progressId: string,
    updates: { status?: CandidatePhaseStatus; notes?: string },
  ) => {
    setUpdatingId(progressId)
    try {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        ...(updates.notes !== undefined && { notes: updates.notes || null }),
      }
      if (updates.status) {
        payload.status = updates.status
        if (updates.status === 'in_progress') {
          payload.started_at = new Date().toISOString()
        }
        if (updates.status === 'completed' || updates.status === 'rejected') {
          payload.completed_at = new Date().toISOString()
        }
      }

      const { error } = await supabaseAny
        .from('candidate_phase_progress')
        .update(payload)
        .eq('id', progressId)

      if (error) throw error
      toast({ title: 'Fase atualizada', description: 'Andamento salvo.' })
      onUpdated()
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const saveNotes = (progressId: string) => {
    const notes = notesEdit[progressId] ?? ''
    updatePhaseProgress(progressId, { notes })
  }

  const updateCandidateStatus = async (newStatus: InitiationCandidateStatus) => {
    if (!candidate) return
    setUpdatingCandidateStatus(true)
    try {
      const { error } = await supabaseAny
        .from('initiation_candidates')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', candidate.id)
      if (error) throw error
      setLocalCandidateStatus(newStatus)
      toast({ title: 'Status atualizado', description: 'Status geral do candidato alterado.' })
      onUpdated()
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setUpdatingCandidateStatus(false)
    }
  }

  if (!candidate) return null

  const progressByPhase = phaseDefinitions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((phase) => {
      const progress = phaseProgress.find((p) => p.phaseDefinitionId === phase.id)
      return {
        phase,
        progress: progress ?? null,
      }
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {candidate.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {candidate.email && (
              <div>
                <span className="text-muted-foreground">E-mail:</span>{' '}
                <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">
                  {candidate.email}
                </a>
              </div>
            )}
            {candidate.phone && (
              <div>
                <span className="text-muted-foreground">Telefone:</span> {candidate.phone}
              </div>
            )}
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Indicado por:</span> {candidate.indicatedBy}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Data da indicação:</span>{' '}
              {format(new Date(candidate.indicationDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground">Status geral</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={localCandidateStatus}
                  onValueChange={(v) => updateCandidateStatus(v as InitiationCandidateStatus)}
                  disabled={updatingCandidateStatus}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CANDIDATE_STATUS_LABELS) as InitiationCandidateStatus[]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {CANDIDATE_STATUS_LABELS[s]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                {updatingCandidateStatus && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          </div>
          {candidate.notes && (
            <div>
              <Label className="text-muted-foreground">Observações gerais</Label>
              <p className="mt-1 text-sm">{candidate.notes}</p>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-3">Fases da sindicância</h4>
            <div className="space-y-4">
              {progressByPhase.map(({ phase, progress }) => {
                const prog = progress
                const status = (prog?.status ?? 'pending') as CandidatePhaseStatus
                const isUpdating = updatingId === prog?.id

                return (
                  <div
                    key={phase.id}
                    className="rounded-lg border p-4 space-y-2 bg-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{phase.name}</p>
                        {phase.description && (
                          <p className="text-xs text-muted-foreground">{phase.description}</p>
                        )}
                      </div>
                      {prog ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={status}
                            onValueChange={(v) =>
                              updatePhaseProgress(prog.id, {
                                status: v as CandidatePhaseStatus,
                              })
                            }
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="w-[160px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(PHASE_STATUS_LABELS) as CandidatePhaseStatus[]).map(
                                (s) => (
                                  <SelectItem key={s} value={s}>
                                    {PHASE_STATUS_LABELS[s]}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                      ) : (
                        <Badge variant="outline">Não iniciado</Badge>
                      )}
                    </div>
                    {prog?.startedAt && (
                      <p className="text-xs text-muted-foreground">
                        Iniciado em:{' '}
                        {format(new Date(prog.startedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                    {prog?.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        Concluído em:{' '}
                        {format(new Date(prog.completedAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    )}
                    {prog && (
                      <div className="pt-2">
                        <Label className="text-xs">Observações desta fase</Label>
                        <div className="flex gap-2 mt-1">
                          <Textarea
                            className="min-h-[60px]"
                            placeholder="Anotações sobre esta fase..."
                            value={notesEdit[prog.id] ?? ''}
                            onChange={(e) =>
                              setNotesEdit((prev) => ({ ...prev, [prog.id]: e.target.value }))
                            }
                            disabled={isUpdating}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => saveNotes(prog.id)}
                            disabled={isUpdating}
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
