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
import {
  createCandidate,
  deleteCandidate,
  ensurePhaseProgressForCandidate,
  fetchCandidates,
  fetchPhaseDefinitions,
  fetchPhaseProgress,
  updateCandidate,
  updateCandidateStatus,
  type CandidateSaveInput,
} from '@/lib/candidates-api'
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

  const loadCandidates = useAsyncOperation(
    async () => {
      const rows = await fetchCandidates()
      setCandidates(rows)
      return null
    },
    { showSuccessToast: false, errorMessage: 'Falha ao carregar candidatos.' },
  )

  const loadPhaseDefinitions = useAsyncOperation(
    async () => {
      const rows = await fetchPhaseDefinitions()
      setPhaseDefinitions(rows)
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
      try {
        const progressList = await fetchPhaseProgress(candidateId)
        setPhaseProgress(progressList)
      } catch {
        setPhaseProgress([])
      }
      return null
    },
    { showSuccessToast: false, showErrorToast: false },
  )

  const ensurePhaseProgress = useAsyncOperation(
    async (candidateId: string) => {
      try {
        await ensurePhaseProgressForCandidate(candidateId, phaseDefinitions)
        if (phaseDefinitions.length > 0) {
          loadPhaseProgress.execute(candidateId)
        }
      } catch {
        // Não bloqueia visualização do detalhe do candidato
      }
      return null
    },
    { showSuccessToast: false, showErrorToast: false },
  )

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadCandidates.execute()
      loadPhaseDefinitions.execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedCandidate && detailDialog.open) {
      loadPhaseProgress.execute(selectedCandidate.id).then(() => {
        ensurePhaseProgress.execute(selectedCandidate.id)
      })
    }
  }, [selectedCandidate, detailDialog.open, loadPhaseProgress, ensurePhaseProgress])

  const saveOperation = useAsyncOperation(
    async (data: CandidateSaveInput) => {
      if (selectedCandidate) {
        const updated = await updateCandidate(selectedCandidate.id, data)
        setCandidates((prev) =>
          prev.map((c) => (c.id === selectedCandidate.id ? updated : c)),
        )
        return 'Candidato atualizado.'
      }

      const newCandidate = await createCandidate(data, phaseDefinitions)
      setCandidates((prev) => [newCandidate, ...prev])
      return 'Candidato cadastrado. Fases da sindicância criadas.'
    },
    {
      successMessage: 'Salvo com sucesso!',
      errorMessage: 'Falha ao salvar.',
      showErrorToast: false,
      onError: (error) => {
        if (isAuthError(error)) {
          useAuthStore.getState().clearSessionAndRedirectToLogin()
          return
        }
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: getSaveErrorMessage(error),
        })
      },
    },
  )

  const handleSave = async (data: CandidateSaveInput) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
      loadCandidates.execute()
    }
  }

  const updateStatusInList = async (
    candidateId: string,
    newStatus: InitiationCandidateStatus,
  ) => {
    setUpdatingStatusId(candidateId)
    try {
      await updateCandidateStatus(candidateId, newStatus)
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
      await deleteCandidate(deleteTargetId)
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
                        onValueChange={(v) =>
                          updateStatusInList(c.id, v as InitiationCandidateStatus)
                        }
                        disabled={updatingStatusId === c.id}
                      >
                        <SelectTrigger
                          className="w-[160px] h-8"
                          aria-label={`Alterar status de ${c.name}`}
                        >
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABELS) as InitiationCandidateStatus[]).map(
                            (s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ),
                          )}
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
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          aria-label="Ações do candidato"
                        >
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
                            {(Object.keys(STATUS_LABELS) as InitiationCandidateStatus[]).map(
                              (s) => (
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
                              ),
                            )}
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
