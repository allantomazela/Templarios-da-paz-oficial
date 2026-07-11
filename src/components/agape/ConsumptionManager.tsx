import { useCallback, useEffect, useMemo, useState } from 'react'
import { logError } from '@/lib/logger'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Loader2, Trash2, Pencil, UserRound, ArrowRight } from 'lucide-react'
import { useAgapeStore, type AgapeConsumption } from '@/stores/useAgapeStore'
import { useToast } from '@/hooks/use-toast'
import { useAgapePermissions } from '@/hooks/use-agape-permissions'
import { ConsumptionEditDialog } from './ConsumptionEditDialog'
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
import { getSaveErrorMessage } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ConsumptionManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
}

export function ConsumptionManager({
  open,
  onOpenChange,
  sessionId,
}: ConsumptionManagerProps) {
  const {
    consumptions,
    menuItems,
    sessions,
    fetchMenuItems,
    fetchConsumptions,
    createConsumption,
    deleteConsumption,
    getSessionTotal,
  } = useAgapeStore()
  const { isAgapeController } = useAgapePermissions()
  const { toast } = useToast()
  const [editTarget, setEditTarget] = useState<AgapeConsumption | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [brothers, setBrothers] = useState<Array<{ id: string; full_name: string | null }>>([])
  const [selectedBrother, setSelectedBrother] = useState<string>('')
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [consumptionsLoading, setConsumptionsLoading] = useState(false)
  const [sessionTotal, setSessionTotal] = useState<{
    total_brothers: number
    total_items: number
    total_amount: number
  } | null>(null)

  const session = sessions.find((s) => s.id === sessionId)
  const sessionConsumptions = consumptions.filter((c) => c.session_id === sessionId)
  const activeMenuItems = menuItems.filter((m) => m.is_active)

  const brothersWithConsumptions = useMemo(
    () => new Set(sessionConsumptions.map((consumption) => consumption.brother_id)),
    [sessionConsumptions],
  )

  const selectedBrotherConsumptions = useMemo(
    () =>
      selectedBrother
        ? sessionConsumptions.filter(
            (consumption) => consumption.brother_id === selectedBrother,
          )
        : [],
    [selectedBrother, sessionConsumptions],
  )

  const selectedBrotherName = useMemo(() => {
    if (!selectedBrother) return ''
    return (
      brothers.find((brother) => brother.id === selectedBrother)?.full_name ||
      selectedBrotherConsumptions[0]?.brother?.full_name ||
      'Sem nome'
    )
  }, [brothers, selectedBrother, selectedBrotherConsumptions])

  const groupedSessionConsumptions = useMemo(() => {
    const groups = new Map<string, AgapeConsumption[]>()
    for (const consumption of sessionConsumptions) {
      const list = groups.get(consumption.brother_id) ?? []
      list.push(consumption)
      groups.set(consumption.brother_id, list)
    }
    return Array.from(groups.entries())
      .map(([brotherId, items]) => ({
        brotherId,
        brotherName: items[0]?.brother?.full_name || 'Sem nome',
        items,
        totalAmount: items.reduce((sum, item) => sum + item.total_amount, 0),
      }))
      .sort((left, right) =>
        left.brotherName.localeCompare(right.brotherName, 'pt-BR'),
      )
  }, [sessionConsumptions])

  const loadBrothers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('status', 'approved')
        .order('full_name')

      if (error) throw error
      setBrothers(data || [])
    } catch (error) {
      logError('Error loading brothers', error)
    }
  }, [])

  const loadSessionTotal = useCallback(async () => {
    try {
      const total = await getSessionTotal(sessionId)
      if (total) {
        setSessionTotal(total)
      }
    } catch (error) {
      logError('Error loading session total', error)
    }
  }, [getSessionTotal, sessionId])

  useEffect(() => {
    if (!open || !sessionId) return

    void loadBrothers()
    void loadSessionTotal()
    void fetchMenuItems()

    setConsumptionsLoading(true)
    void fetchConsumptions(sessionId).finally(() => setConsumptionsLoading(false))
  }, [open, sessionId, fetchMenuItems, fetchConsumptions, loadBrothers, loadSessionTotal])

  useEffect(() => {
    if (!open) {
      setSelectedBrother('')
      setSelectedMenuItem('')
      setQuantity(1)
    }
  }, [open])

  const handleNextBrother = () => {
    setSelectedBrother('')
    setSelectedMenuItem('')
    setQuantity(1)
    toast({
      title: 'Próximo irmão',
      description: 'Selecione outro irmão para continuar os lançamentos.',
    })
  }

  const handleAddConsumption = async () => {
    // Proteção contra cliques duplos
    if (isSubmitting) return

    if (!selectedBrother || !selectedMenuItem) {
      toast({
        title: 'Erro',
        description: 'Selecione um irmão e um item do cardápio.',
        variant: 'destructive',
      })
      return
    }

    const menuItem = activeMenuItems.find((m) => m.id === selectedMenuItem)
    if (!menuItem) return

    setIsSubmitting(true)

    try {
      const { error } = await createConsumption({
        session_id: sessionId,
        brother_id: selectedBrother,
        menu_item_id: selectedMenuItem,
        quantity,
        unit_price: menuItem.price,
        total_amount: menuItem.price * quantity,
        notes: null,
      })

      if (error) {
        // Se for erro 409 ou constraint única, não mostrar erro, pois será tratado automaticamente
        if (
          error.code === '23505' ||
          error.status === 409 ||
          error.message?.includes('unique') ||
          error.message?.includes('duplicate')
        ) {
          // O store já tratou isso, apenas recarregar
          toast({
            title: 'Sucesso',
            description: 'Item adicionado. Se já existia, a quantidade foi atualizada.',
          })
        } else {
          let errorMessage = 'Não foi possível adicionar o consumo.'
          if (error.message) {
            errorMessage = error.message
          }
          toast({
            title: 'Erro',
            description: errorMessage,
            variant: 'destructive',
          })
        }
      } else {
        toast({
          title: 'Sucesso',
          description: 'Consumo adicionado com sucesso.',
        })
      }

      // Mantém o irmão selecionado para lançar vários itens seguidos
      if (!error || error.code === '23505' || error.status === 409) {
        setSelectedMenuItem('')
        setQuantity(1)
        loadSessionTotal()
      }
    } catch (_err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado ao adicionar o consumo.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canManageConsumptions =
    isAgapeController || session?.status === 'open'

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return
    setIsDeleting(true)
    try {
      const { error } = await deleteConsumption(deleteTargetId)
      if (error) {
        toast({
          title: 'Erro',
          description: getSaveErrorMessage(error),
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Consumo excluído' })
      setDeleteTargetId(null)
      await loadSessionTotal()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!sessionId) {
    return null
  }

  const handleDialogInteractOutside = (event: Event) => {
    const target = event.target as HTMLElement | null
    if (
      target?.closest('[data-radix-select-content]') ||
      target?.closest('[role="listbox"]')
    ) {
      event.preventDefault()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={handleDialogInteractOutside}
      >
        <DialogHeader>
          <DialogTitle>
            Gerenciar Consumos - {session ? formatDateBR(session.date) : 'Sessão'}
          </DialogTitle>
          <DialogDescription>
            Selecione o irmão, lance todos os itens consumidos por ele e use
            &quot;Próximo irmão&quot; para passar ao seguinte.
          </DialogDescription>
        </DialogHeader>

        {session?.status !== 'open' && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              Esta sessão está {session?.status === 'closed' ? 'fechada' : 'finalizada'}. 
              Não é possível adicionar novos consumos.
            </p>
          </div>
        )}

        {session?.status === 'open' && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-semibold">Lançar consumos por irmão</h4>
              {selectedBrother ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNextBrother}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Próximo irmão
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">1. Selecione o irmão</label>
              <Select value={selectedBrother} onValueChange={setSelectedBrother}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o irmão" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {brothers.map((brother) => (
                    <SelectItem key={brother.id} value={brother.id}>
                      {(brother.full_name || 'Sem nome') +
                        (brothersWithConsumptions.has(brother.id) ? ' (lançado)' : '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBrother ? (
              <div className="rounded-md border bg-muted/40 p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <UserRound className="h-4 w-4" />
                  <span>{selectedBrotherName}</span>
                  <span className="text-muted-foreground font-normal">
                    — {selectedBrotherConsumptions.length} item(ns) nesta sessão
                  </span>
                </div>

                {selectedBrotherConsumptions.length > 0 ? (
                  <div className="rounded-md border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Qtd.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBrotherConsumptions.map((consumption) => (
                          <TableRow key={consumption.id}>
                            <TableCell>
                              {consumption.menu_item?.name || 'Item removido'}
                            </TableCell>
                            <TableCell className="text-center">
                              {consumption.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrencyBRL(consumption.total_amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum item lançado para este irmão ainda.
                  </p>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    2. Adicione os itens consumidos
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_auto]">
                    <Select
                      value={selectedMenuItem}
                      onValueChange={setSelectedMenuItem}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o item" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {activeMenuItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} - {formatCurrencyBRL(item.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      placeholder="Qtd."
                    />

                    <Button
                      onClick={handleAddConsumption}
                      disabled={
                        !selectedMenuItem ||
                        isSubmitting ||
                        activeMenuItems.length === 0
                      }
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Escolha um irmão para começar a lançar os consumos dele.
              </p>
            )}
          </div>
        )}

        {sessionTotal && (
          <div className="rounded-lg border bg-muted p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Irmãos</p>
                <p className="text-2xl font-bold">{sessionTotal.total_brothers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Itens</p>
                <p className="text-2xl font-bold">{sessionTotal.total_items}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrencyBRL(sessionTotal.total_amount)}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeMenuItems.length === 0 && session?.status === 'open' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Não há itens ativos no cardápio. Cadastre itens na aba{' '}
            <strong>Cardápio</strong> antes de lançar consumos.
          </div>
        )}

        {consumptionsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {groupedSessionConsumptions.length === 0 ? (
              <div className="rounded-md border p-6 text-center text-muted-foreground">
                Nenhum consumo registrado ainda.
              </div>
            ) : (
              groupedSessionConsumptions.map((group) => (
                <div key={group.brotherId} className="rounded-md border">
                  <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
                    <span className="font-medium">{group.brotherName}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrencyBRL(group.totalAmount)}
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Registrado por</TableHead>
                        {canManageConsumptions && (
                          <TableHead className="text-right">Ações</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((consumption) => (
                        <TableRow key={consumption.id}>
                          <TableCell>
                            {consumption.menu_item?.name || 'Item removido'}
                          </TableCell>
                          <TableCell>{consumption.quantity}</TableCell>
                          <TableCell>
                            {formatCurrencyBRL(consumption.unit_price)}
                          </TableCell>
                          <TableCell>
                            {formatCurrencyBRL(consumption.total_amount)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {consumption.recorded_by_profile?.full_name || '—'}
                          </TableCell>
                          {canManageConsumptions && (
                            <TableCell className="text-right space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                title="Editar quantidade"
                                onClick={() => setEditTarget(consumption)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                className="text-destructive hover:text-destructive"
                                title="Excluir consumo"
                                onClick={() => setDeleteTargetId(consumption.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>

      <ConsumptionEditDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        consumption={editTarget}
        onSaved={() => void loadSessionTotal()}
      />

      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && !isDeleting && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir consumo?</AlertDialogTitle>
            <AlertDialogDescription>
              O lançamento será removido desta sessão. Se o fechamento financeiro do mês
              já foi importado, atualize o Fechamento Ágape em seguida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteConfirm()
              }}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
