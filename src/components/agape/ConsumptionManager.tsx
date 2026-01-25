import { useEffect, useState } from 'react'
import { logError } from '@/lib/logger'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { useToast } from '@/hooks/use-toast'
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
    loading,
    fetchConsumptions,
    createConsumption,
    deleteConsumption,
    getSessionTotal,
  } = useAgapeStore()
  const { toast } = useToast()
  const [brothers, setBrothers] = useState<Array<{ id: string; full_name: string | null }>>([])
  const [selectedBrother, setSelectedBrother] = useState<string>('')
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionTotal, setSessionTotal] = useState<{
    total_brothers: number
    total_items: number
    total_amount: number
  } | null>(null)

  const session = sessions.find((s) => s.id === sessionId)
  const sessionConsumptions = consumptions.filter((c) => c.session_id === sessionId)
  const activeMenuItems = menuItems.filter((m) => m.is_active)

  useEffect(() => {
    if (open && sessionId) {
      fetchConsumptions(sessionId)
      loadBrothers()
      loadSessionTotal()
    }
  }, [open, sessionId])

  const loadBrothers = async () => {
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
  }

  const loadSessionTotal = async () => {
    const total = await getSessionTotal(sessionId)
    if (total) {
      setSessionTotal(total)
    }
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

      // Limpar campos apenas se não houver erro crítico
      if (!error || error.code === '23505' || error.status === 409) {
        setSelectedBrother('')
        setSelectedMenuItem('')
        setQuantity(1)
        loadSessionTotal()
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado ao adicionar o consumo.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConsumption = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este consumo?')) {
      return
    }

    const { error } = await deleteConsumption(id)
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o consumo.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Consumo excluído com sucesso.',
      })
      loadSessionTotal()
    }
  }

  if (!sessionId) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Gerenciar Consumos - {session ? new Date(session.date).toLocaleDateString('pt-BR') : 'Sessão'}
          </DialogTitle>
          <DialogDescription>
            Adicione e gerencie os consumos dos irmãos nesta sessão de ágape.
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
            <h4 className="font-semibold">Adicionar Consumo</h4>
            <div className="grid grid-cols-4 gap-4">
              <Select value={selectedBrother} onValueChange={setSelectedBrother}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o irmão" />
                </SelectTrigger>
                <SelectContent>
                  {brothers.map((brother) => (
                    <SelectItem key={brother.id} value={brother.id}>
                      {brother.full_name || 'Sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o item" />
                </SelectTrigger>
                <SelectContent>
                  {activeMenuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                placeholder="Quantidade"
              />

              <Button
                onClick={handleAddConsumption}
                disabled={!selectedBrother || !selectedMenuItem || isSubmitting || loading}
              >
                {isSubmitting || loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isSubmitting || loading ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
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
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(sessionTotal.total_amount)}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Irmão</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  {session?.status === 'open' && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionConsumptions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={session?.status === 'open' ? 6 : 5}
                      className="text-center text-muted-foreground"
                    >
                      Nenhum consumo registrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessionConsumptions.map((consumption) => (
                    <TableRow key={consumption.id}>
                      <TableCell>
                        {consumption.brother?.full_name || 'Sem nome'}
                      </TableCell>
                      <TableCell>
                        {consumption.menu_item?.name || 'Item removido'}
                      </TableCell>
                      <TableCell>{consumption.quantity}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(consumption.unit_price)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(consumption.total_amount)}
                      </TableCell>
                      {session?.status === 'open' && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => handleDeleteConsumption(consumption.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
