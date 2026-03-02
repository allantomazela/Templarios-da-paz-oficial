import { useState, useEffect, useRef } from 'react'
import type {
  InitiationCandidate,
  SindicanciaPhaseDefinition,
  CandidatePhaseProgress,
  InitiationCandidateStatus,
} from '@/lib/data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Loader2, RefreshCw } from 'lucide-react'
import { CandidateDialog } from './CandidateDialog'
import { CandidateDetail } from './CandidateDetail'
import { PhaseDefinitionsManager } from './PhaseDefinitionsManager'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { isAuthError, getSaveErrorMessage } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'
import { useToast } from '@/hooks/use-toast'

const STATUS_LABELS: Record<InitiationCandidateStatus, string> = {
  indicado: 'Indicado',
  em_sindicancia: 'Em sindicância',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  iniciado: 'Iniciado',
}

function mapRowToCandidate(row: {
  id: string
  name: string
  email: string | null
  phone: string | null
  indicated_by: string
  indication_date: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}): InitiationCandidate {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    indicatedBy: row.indicated_by,
    indicationDate: row.indication_date,
    status: row.status as InitiationCandidateStatus,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function CandidatesList() {
  const [candidates, setCandidates] = useState<InitiationCandidate[]>([])
  const [phaseDefinitions, setPhaseDefinitions] = useState<SindicanciaPhaseDefinition[]>([])
  const [phaseProgress, setPhaseProgress] = useState<CandidatePhaseProgress[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCandidate, setSelectedCandidate] = useState<InitiationCandidate | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const dialog = useDialog()
  const detailDialog = useDialog()
  const hasLoadedRef = useRef(false)
  const { toast } = useToast()
  const supabaseAny = supabase as any

  const loadCandidates = useAsyncOperation(
    async () => {
      const { data: rows, error } = await supabaseAny
        .from('initiation_candidates')
        .select('*')
        .order('indication_date', { ascending: false })

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') {
          setCandidates([])
          return null
        }
        throw error
      }
      setCandidates((rows || []).map(mapRowToCandidate))
      return null
    },
    { showSuccessToast: false, errorMessage: 'Falha ao carregar candidatos.' },
  )

  const loadPhaseDefinitions = useAsyncOperation(
    async () => {
      const { data: rows, error } = await supabaseAny
        .from('sindicancia_phase_definitions')
        .select('*')
        .order('order', { ascending: true })

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') {
          setPhaseDefinitions([])
          return null
        }
        throw error
      }
      setPhaseDefinitions(
        (rows || []).map((r: { id: string; name: string; order: number; description: string | null; created_at?: string }) => ({
          id: r.id,
          name: r.name,
          order: r.order,
          description: r.description,
          createdAt: r.created_at,
        })),
      )
      return null
    },
    { showSuccessToast: false, errorMessage: 'Falha ao carregar fases.' },
  )

  const loadPhaseProgress = useAsyncOperation(
    async (candidateId: string | null) => {
      if (!candidateId) {
        setPhaseProgress([])
        return null
      }
      const { data: rows, error } = await supabaseAny
        .from('candidate_phase_progress')
        .select('*')
        .eq('candidate_id', candidateId)

      if (error) {
        setPhaseProgress([])
        return null
      }
      const progressList = (rows || []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        candidateId: r.candidate_id as string,
        phaseDefinitionId: r.phase_definition_id as string,
        status: r.status as CandidatePhaseProgress['status'],
        startedAt: (r.started_at as string) ?? null,
        completedAt: (r.completed_at as string) ?? null,
        scheduledCheckDate: (r.scheduled_check_date as string) ?? null,
        notes: (r.notes as string) ?? null,
        createdAt: r.created_at as string,
        updatedAt: r.updated_at as string,
      }))

      setPhaseProgress(progressList)
      return null
    },
    { showSuccessToast: false },
  )

  const ensurePhaseProgressForCandidate = useAsyncOperation(
    async (candidateId: string) => {
      const { data: existing } = await supabaseAny
        .from('candidate_phase_progress')
        .select('phase_definition_id')
        .eq('candidate_id', candidateId)
      const existingIds = new Set((existing || []).map((r: { phase_definition_id: string }) => r.phase_definition_id))
      const toInsert = phaseDefinitions.filter((p) => !existingIds.has(p.id))
      for (const phase of toInsert) {
        await supabaseAny.from('candidate_phase_progress').insert({
          candidate_id: candidateId,
          phase_definition_id: phase.id,
          status: 'pending',
        })
      }
      if (toInsert.length > 0) loadPhaseProgress.execute(candidateId)
      return null
    },
    { showSuccessToast: false },
  )

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadCandidates.execute()
      loadPhaseDefinitions.execute()
    }
  }, [])

  useEffect(() => {
    if (selectedCandidate && detailDialog.open) {
      loadPhaseProgress.execute(selectedCandidate.id).then(() => {
        ensurePhaseProgressForCandidate.execute(selectedCandidate.id)
      })
    }
  }, [selectedCandidate?.id, detailDialog.open])

  const saveOperation = useAsyncOperation(
    async (data: {
      name: string
      email?: string
      phone?: string
      indicatedBy: string
      indicationDate: string
      status: InitiationCandidateStatus
      notes?: string
    }) => {
      if (selectedCandidate) {
        const { data: updated, error } = await supabaseAny
          .from('initiation_candidates')
          .update({
            name: data.name,
            email: data.email ?? null,
            phone: data.phone ?? null,
            indicated_by: data.indicatedBy,
            indication_date: data.indicationDate,
            status: data.status,
            notes: data.notes ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedCandidate.id)
          .select('*')
          .single()

        if (error) throw error
        setCandidates((prev) =>
          prev.map((c) => (c.id === selectedCandidate.id ? mapRowToCandidate(updated) : c)),
        )
        return 'Candidato atualizado.'
      } else {
        const { data: created, error } = await supabaseAny
          .from('initiation_candidates')
          .insert({
            name: data.name,
            email: data.email ?? null,
            phone: data.phone ?? null,
            indicated_by: data.indicatedBy,
            indication_date: data.indicationDate,
            status: data.status,
            notes: data.notes ?? null,
          })
          .select('*')
          .single()

        if (error) throw error
        const newCandidate = mapRowToCandidate(created)
        setCandidates((prev) => [newCandidate, ...prev])

        for (const phase of phaseDefinitions) {
          await supabaseAny.from('candidate_phase_progress').insert({
            candidate_id: newCandidate.id,
            phase_definition_id: phase.id,
            status: 'pending',
          })
        }
        return 'Candidato cadastrado. Fases da sindicância criadas.'
      }
    },
    {
      successMessage: 'Salvo com sucesso!',
      errorMessage: 'Falha ao salvar.',
    },
  )

  const handleSave = async (data: Parameters<typeof saveOperation.execute>[0]) => {
    try {
      const result = await saveOperation.execute(data)
      if (result) {
        dialog.closeDialog()
        loadCandidates.execute()
      }
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: getSaveErrorMessage(error),
      })
    }
  }

  const updateStatusInList = async (candidateId: string, newStatus: InitiationCandidateStatus) => {
    setUpdatingStatusId(candidateId)
    try {
      const { error } = await supabaseAny
        .from('initiation_candidates')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', candidateId)
      if (error) throw error
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c)),
      )
      toast({ title: 'Status atualizado', description: 'Alteração salva.' })
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
      setUpdatingStatusId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return
    setIsDeleting(true)
    try {
      const { error } = await supabaseAny
        .from('initiation_candidates')
        .delete()
        .eq('id', deleteTargetId)
      if (error) throw error
      setCandidates((prev) => prev.filter((c) => c.id !== deleteTargetId))
      setDeleteTargetId(null)
      toast({ title: 'Candidato excluído', description: 'O registro foi removido.' })
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openEdit = (c: InitiationCandidate) => {
    setSelectedCandidate(c)
    dialog.openDialog()
  }

  const openNew = () => {
    setSelectedCandidate(null)
    dialog.openDialog()
  }

  const openDetail = (c: InitiationCandidate) => {
    setSelectedCandidate(c)
    detailDialog.openDialog()
  }

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.indicatedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const refreshAfterDetail = () => {
    loadCandidates.execute()
    if (selectedCandidate) loadPhaseProgress.execute(selectedCandidate.id)
  }

  return (
    <div className="space-y-4">
      <PhaseDefinitionsManager
        phases={phaseDefinitions}
        onUpdated={() => loadPhaseDefinitions.execute()}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, e-mail ou indicante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos os status</option>
          {(Object.keys(STATUS_LABELS) as InitiationCandidateStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo candidato
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Indicado por</TableHead>
              <TableHead>Data indicação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadCandidates.loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum candidato encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    {c.email && (
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    )}
                  </TableCell>
                  <TableCell>{c.indicatedBy}</TableCell>
                  <TableCell>
                    {format(new Date(c.indicationDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={c.status}
                        onValueChange={(v) => updateStatusInList(c.id, v as InitiationCandidateStatus)}
                        disabled={updatingStatusId === c.id}
                      >
                        <SelectTrigger className="w-[160px] h-8" aria-label={`Alterar status de ${c.name}`}>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABELS) as InitiationCandidateStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {updatingStatusId === c.id && (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Ações do candidato">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetail(c)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes / Fases
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Alterar status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(Object.keys(STATUS_LABELS) as InitiationCandidateStatus[]).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => updateStatusInList(c.id, s)}
                                disabled={updatingStatusId === c.id}
                              >
                                {c.status === s ? (
                                  <span className="font-medium">{STATUS_LABELS[s]} ✓</span>
                                ) : (
                                  STATUS_LABELS[s]
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTargetId(c.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CandidateDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        candidateToEdit={selectedCandidate}
        onSave={handleSave}
        isSaving={saveOperation.loading}
      />

      <CandidateDetail
        open={detailDialog.open}
        onOpenChange={detailDialog.onOpenChange}
        candidate={selectedCandidate}
        phaseProgress={phaseProgress}
        phaseDefinitions={phaseDefinitions}
        onUpdated={refreshAfterDetail}
      />

      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir candidato</AlertDialogTitle>
            <AlertDialogDescription>
              O candidato e todo o histórico de fases da sindicância serão removidos. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
