import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { Brother } from '@/lib/data'
import { Search, Plus, Loader2 } from 'lucide-react'
import { BrotherDialog } from './BrotherDialog'
import { BrotherDetails } from './BrotherDetails'
import { BrothersDegreeSummary } from './BrothersDegreeSummary'
import { BrothersRosterViews } from './BrothersRosterViews'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  toBrotherSaveInput,
  type BrotherFormValues,
} from '@/lib/brother-form-schema'
import {
  createBrother,
  deleteBrother,
  fetchBrothers,
  setBrotherMembershipSituation,
  updateBrother,
  type BrotherSaveInput,
} from '@/lib/brothers-api'
import {
  inferMembershipSituation,
  isBrotherOnActiveSecretariatRoster,
  MEMBERSHIP_SITUATION_LABELS,
  type MembershipSituation,
} from '@/lib/brother-membership-situation'
import type { BrothersRosterTab } from './brothers-roster-tab'
import { isAuthError, getSaveErrorMessage } from '@/lib/auth-utils'
import { isMasterAdminEmail } from '@/config/master-admin'
import useAuthStore from '@/stores/useAuthStore'
import { useToast } from '@/hooks/use-toast'
import { useModuleActivation } from '@/hooks/use-module-activation'

export function BrothersList() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [rosterTab, setRosterTab] = useState<BrothersRosterTab>('ativos')
  const [situationFilter, setSituationFilter] = useState('all')
  const [degreeFilter, setDegreeFilter] = useState('all')
  const [brothers, setBrothers] = useState<Brother[]>([])
  const dialog = useDialog()
  const detailsDialog = useDialog()
  const [selectedBrother, setSelectedBrother] = useState<Brother | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Brother | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingBrother, setIsSavingBrother] = useState(false)
  const editingBrotherRef = useRef<Brother | null>(null)

  useEffect(() => {
    editingBrotherRef.current = selectedBrother
  }, [selectedBrother])

  const loadBrothers = useAsyncOperation(
    async () => {
      const mappedBrothers = await fetchBrothers()
      setBrothers(mappedBrothers)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar irmãos.',
    },
  )

  const { execute: loadBrothersExecute, loading: loadBrothersLoading } = loadBrothers

  useModuleActivation(
    '/dashboard/secretariat',
    () => {
      void loadBrothersExecute()
    },
    { refreshOnVisible: true },
  )

  const rosterCounts = useMemo(() => {
    let ativos = 0
    let desligados = 0
    let inMemoriam = 0
    for (const brother of brothers) {
      const situation = inferMembershipSituation(brother)
      if (situation === 'desligado') desligados += 1
      else if (situation === 'in_memoriam') inMemoriam += 1
      else ativos += 1
    }
    return { ativos, desligados, inMemoriam }
  }, [brothers])

  const rosterBrothers = useMemo(() => {
    return brothers.filter((brother) => {
      const situation = inferMembershipSituation(brother)
      if (rosterTab === 'ativos') return isBrotherOnActiveSecretariatRoster(brother)
      if (rosterTab === 'desligados') return situation === 'desligado'
      return situation === 'in_memoriam'
    })
  }, [brothers, rosterTab])

  const filteredBrothers = rosterBrothers.filter((brother) => {
    const situation = inferMembershipSituation(brother)
    const matchesSearch =
      brother.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brother.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSituation =
      rosterTab !== 'ativos' ||
      situationFilter === 'all' ||
      situation === situationFilter
    const matchesDegree = degreeFilter === 'all' || brother.degree === degreeFilter
    return matchesSearch && matchesSituation && matchesDegree
  })

  const saveOperation = useAsyncOperation(
    async (data: BrotherSaveInput, brotherToUpdate: Brother | null) => {
      if (brotherToUpdate) {
        const updatedBrother = await updateBrother(brotherToUpdate.id, data, {
          role: brotherToUpdate.role,
          status: brotherToUpdate.status,
          attendanceRate: brotherToUpdate.attendanceRate,
        })
        setBrothers((prev) =>
          prev.map((b) => (b.id === brotherToUpdate.id ? updatedBrother : b)),
        )
        return 'Irmão atualizado com sucesso.'
      }

      const newBrother = await createBrother(data)
      setBrothers((prev) => [newBrother, ...prev])
      return 'Irmão adicionado com sucesso.'
    },
    {
      showSuccessToast: true,
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar o registro.',
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

  const situationOperation = useAsyncOperation(
    async (brother: Brother, situation: MembershipSituation) => {
      const updatedBrother = await setBrotherMembershipSituation(brother, situation)
      setBrothers((prev) =>
        prev.map((b) => (b.id === brother.id ? updatedBrother : b)),
      )
      return `${brother.name}: ${MEMBERSHIP_SITUATION_LABELS[situation]}.`
    },
    {
      successMessage: 'Situação atualizada com sucesso!',
      errorMessage: 'Falha ao alterar a situação do irmão.',
    },
  )

  const handleSave = useCallback(
    async (data: BrotherFormValues) => {
      const brotherToUpdate = editingBrotherRef.current ?? selectedBrother
      const payload = toBrotherSaveInput(data) as BrotherSaveInput

      setIsSavingBrother(true)
      try {
        const result = await saveOperation.execute(payload, brotherToUpdate)
        if (result !== null) {
          dialog.closeDialog()
          setSelectedBrother(null)
          editingBrotherRef.current = null
          await loadBrothersExecute()
        }
      } finally {
        setIsSavingBrother(false)
      }
    },
    [dialog, loadBrothersExecute, saveOperation, selectedBrother],
  )

  const setSituation = (brother: Brother, situation: MembershipSituation) => {
    situationOperation.execute(brother, situation)
  }

  const canDeleteBrother = (brother: Brother) => !isMasterAdminEmail(brother.email)

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteBrother(deleteTarget.id, deleteTarget.photoUrl)
      setBrothers((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      if (selectedBrother?.id === deleteTarget.id) {
        setSelectedBrother(null)
        detailsDialog.closeDialog()
      }
      const deletedName = deleteTarget.name
      const hadAccount = !!deleteTarget.profileId
      setDeleteTarget(null)
      toast({
        title: 'Irmão excluído',
        description: hadAccount
          ? `${deletedName} foi removido da secretaria e o acesso ao sistema foi encerrado.`
          : `${deletedName} foi removido da secretaria.`,
      })
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description:
          error instanceof Error ? error.message : getSaveErrorMessage(error),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openEdit = (brother: Brother) => {
    editingBrotherRef.current = brother
    setSelectedBrother(brother)
    dialog.openDialog()
  }

  const openNew = () => {
    editingBrotherRef.current = null
    setSelectedBrother(null)
    dialog.openDialog()
  }

  const openDetails = (brother: Brother) => {
    setSelectedBrother(brother)
    detailsDialog.openDialog()
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={rosterTab}
        onValueChange={(value) => setRosterTab(value as BrothersRosterTab)}
      >
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
          <TabsTrigger value="ativos">Ativos ({rosterCounts.ativos})</TabsTrigger>
          <TabsTrigger value="desligados">
            Desligados ({rosterCounts.desligados})
          </TabsTrigger>
          <TabsTrigger value="in_memoriam">
            In Memoriam ({rosterCounts.inMemoriam})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={degreeFilter} onValueChange={setDegreeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Grau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Graus</SelectItem>
                <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                <SelectItem value="Companheiro">Companheiro</SelectItem>
                <SelectItem value="Mestre">Mestre</SelectItem>
              </SelectContent>
            </Select>
            {rosterTab === 'ativos' ? (
              <Select value={situationFilter} onValueChange={setSituationFilter}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas situações</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="afastado">Afastado (saúde)</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>
        {rosterTab === 'ativos' ? (
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />{' '}
            <span className="hidden sm:inline">Adicionar</span> Irmão
          </Button>
        ) : null}
      </div>

      {rosterTab === 'ativos' ? (
        <BrothersDegreeSummary
          brothers={brothers}
          loading={loadBrothersLoading}
        />
      ) : null}

      <BrothersRosterViews
        brothers={filteredBrothers}
        loading={loadBrothersLoading}
        rosterTab={rosterTab}
        canDeleteBrother={canDeleteBrother}
        onDetails={openDetails}
        onEdit={openEdit}
        onSetSituation={setSituation}
        onDelete={setDeleteTarget}
      />

      <BrotherDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        brotherToEdit={selectedBrother}
        onSave={handleSave}
        isSaving={saveOperation.loading || isSavingBrother}
      />

      <BrotherDetails
        open={detailsDialog.open}
        onOpenChange={detailsDialog.onOpenChange}
        brother={selectedBrother}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir irmão permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Você está prestes a excluir o cadastro de{' '}
                  <strong>{deleteTarget.name}</strong>. Todos os dados pessoais e
                  maçônicos deste registro serão removidos.
                  {deleteTarget.profileId ? (
                    <>
                      {' '}
                      O login no sistema será encerrado imediatamente e a conta
                      vinculada na gestão de usuários também será excluída.
                    </>
                  ) : (
                    <>
                      {' '}
                      Se existir conta vinculada pelo e-mail, ela também será
                      removida.
                    </>
                  )}{' '}
                  Esta ação não pode ser desfeita.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteConfirm()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
