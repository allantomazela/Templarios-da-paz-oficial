import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Brother } from '@/lib/data'
import {
  Flower2,
  HeartPulse,
  MoreHorizontal,
  Search,
  Plus,
  Eye,
  Pencil,
  UserCheck,
  UserX,
  Trash2,
  Loader2,
} from 'lucide-react'
import { BrotherDialog } from './BrotherDialog'
import { BrotherDetails } from './BrotherDetails'
import { BrothersDegreeSummary } from './BrothersDegreeSummary'
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
import { Card, CardContent } from '@/components/ui/card'
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

type BrothersRosterTab = 'ativos' | 'desligados' | 'in_memoriam'
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
    const matchesDegree =
      degreeFilter === 'all' || brother.degree === degreeFilter
    return matchesSearch && matchesSituation && matchesDegree
  })

  const saveOperation = useAsyncOperation(
    async (data: BrotherSaveInput, brotherToUpdate: Brother | null) => {
      if (brotherToUpdate) {
        const updatedBrother = await updateBrother(
          brotherToUpdate.id,
          data,
          {
            role: brotherToUpdate.role,
            status: brotherToUpdate.status,
            attendanceRate: brotherToUpdate.attendanceRate,
          },
        )
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
      const updatedBrother = await setBrotherMembershipSituation(
        brother,
        situation,
      )
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
      const brotherToUpdate =
        editingBrotherRef.current ?? selectedBrother
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

  const situationBadgeClass = (situation: MembershipSituation) => {
    if (situation === 'desligado') return ''
    if (situation === 'in_memoriam') {
      return 'bg-slate-600 hover:bg-slate-700 text-white'
    }
    if (situation === 'afastado') {
      return 'bg-amber-600 hover:bg-amber-700 text-white'
    }
    return 'bg-green-600 hover:bg-green-700'
  }

  const situationBadgeVariant = (situation: MembershipSituation) => {
    if (situation === 'desligado') return 'destructive' as const
    return 'default' as const
  }

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
          error instanceof Error
            ? error.message
            : getSaveErrorMessage(error),
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
          <TabsTrigger value="ativos">
            Ativos ({rosterCounts.ativos})
          </TabsTrigger>
          <TabsTrigger value="desligados">
            Desligados ({rosterCounts.desligados})
          </TabsTrigger>
          <TabsTrigger value="in_memoriam">
            In Memoriam ({rosterCounts.inMemoriam})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
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

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Grau</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadBrothersLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando irmãos...
                </TableCell>
              </TableRow>
            ) : filteredBrothers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {rosterTab === 'ativos'
                    ? 'Nenhum irmão ativo encontrado.'
                    : rosterTab === 'desligados'
                      ? 'Nenhum irmão desligado.'
                      : 'Nenhum irmão In Memoriam.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredBrothers.map((brother) => {
                const situation = inferMembershipSituation(brother)
                return (
                <TableRow key={brother.id}>
                  <TableCell className="font-medium">{brother.name}</TableCell>
                  <TableCell>{brother.degree}</TableCell>
                  <TableCell>{brother.role}</TableCell>
                  <TableCell>
                    <Badge
                      variant={situationBadgeVariant(situation)}
                      className={situationBadgeClass(situation)}
                    >
                      {MEMBERSHIP_SITUATION_LABELS[situation]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openDetails(brother)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(brother)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        {situation !== 'afastado' &&
                          situation !== 'desligado' &&
                          situation !== 'in_memoriam' && (
                          <DropdownMenuItem
                            onClick={() => setSituation(brother, 'afastado')}
                          >
                            <HeartPulse className="mr-2 h-4 w-4" />
                            Afastamento (saúde)
                          </DropdownMenuItem>
                        )}
                        {situation !== 'desligado' &&
                          situation !== 'in_memoriam' && (
                          <DropdownMenuItem
                            onClick={() => setSituation(brother, 'desligado')}
                            className="text-destructive"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Registrar desligamento
                          </DropdownMenuItem>
                        )}
                        {situation !== 'in_memoriam' && (
                          <DropdownMenuItem
                            onClick={() => setSituation(brother, 'in_memoriam')}
                          >
                            <Flower2 className="mr-2 h-4 w-4" />
                            Marcar In Memoriam
                          </DropdownMenuItem>
                        )}
                        {situation !== 'regular' && (
                          <DropdownMenuItem
                            onClick={() => setSituation(brother, 'regular')}
                            className="text-green-600"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Reativar (regular)
                          </DropdownMenuItem>
                        )}
                        {canDeleteBrother(brother) && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTarget(brother)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loadBrothersLoading ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            Carregando irmãos...
          </div>
        ) : filteredBrothers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            {rosterTab === 'ativos'
              ? 'Nenhum irmão ativo encontrado.'
              : rosterTab === 'desligados'
                ? 'Nenhum irmão desligado.'
                : 'Nenhum irmão In Memoriam.'}
          </div>
        ) : (
          filteredBrothers.map((brother) => {
            const situation = inferMembershipSituation(brother)
            return (
            <Card key={brother.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{brother.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {brother.role}
                    </p>
                  </div>
                  <Badge
                    variant={situationBadgeVariant(situation)}
                    className={`${situationBadgeClass(situation)} text-[10px]`}
                  >
                    {MEMBERSHIP_SITUATION_LABELS[situation]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="outline" className="text-xs">
                    {brother.degree}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetails(brother)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(brother)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {situation !== 'desligado' &&
                      situation !== 'in_memoriam' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setSituation(brother, 'desligado')}
                        aria-label={`Desligar ${brother.name}`}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                    {situation !== 'in_memoriam' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSituation(brother, 'in_memoriam')}
                        aria-label={`In Memoriam ${brother.name}`}
                      >
                        <Flower2 className="h-4 w-4" />
                      </Button>
                    )}
                    {situation !== 'regular' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => setSituation(brother, 'regular')}
                        aria-label={`Reativar ${brother.name}`}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteBrother(brother) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(brother)}
                        aria-label={`Excluir ${brother.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })
        )}
      </div>

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
