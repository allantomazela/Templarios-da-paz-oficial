import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, CheckCircle2, Calendar } from 'lucide-react'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { useToast } from '@/hooks/use-toast'
import useAuthStore from '@/stores/useAuthStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AgapeConsumptionSimple() {
  const { user } = useAuthStore()
  const {
    sessions,
    menuItems,
    consumptions,
    loading,
    fetchSessions,
    fetchMenuItems,
    fetchConsumptions,
    createConsumption,
  } = useAgapeStore()
  const { toast } = useToast()

  const [selectedSession, setSelectedSession] = useState<string>('')
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchSessions()
    fetchMenuItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedSession) {
      fetchConsumptions(selectedSession)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession])

  const openSessions = sessions.filter((s) => s.status === 'open')
  const activeMenuItems = menuItems.filter((m) => m.is_active)
  const selectedSessionData = sessions.find((s) => s.id === selectedSession)
  const myConsumptions = consumptions.filter(
    (c) => c.session_id === selectedSession && c.brother_id === user?.id,
  )

  const handleAddConsumption = async () => {
    // Proteção contra cliques duplos
    if (isSubmitting) return

    if (!selectedSession || !selectedMenuItem || !user?.id) {
      toast({
        title: 'Erro',
        description: 'Selecione uma sessão e um item do cardápio.',
        variant: 'destructive',
      })
      return
    }

    const menuItem = activeMenuItems.find((m) => m.id === selectedMenuItem)
    if (!menuItem) {
      toast({
        title: 'Erro',
        description: 'Item do cardápio não encontrado.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    const totalAmount = menuItem.price * quantity

    try {
      const { error } = await createConsumption({
        session_id: selectedSession,
        brother_id: user.id,
        menu_item_id: selectedMenuItem,
        quantity,
        unit_price: menuItem.price,
        total_amount: totalAmount,
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
        setSelectedMenuItem('')
        setQuantity(1)
        fetchConsumptions(selectedSession)
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

  const totalMyConsumption = myConsumptions.reduce(
    (sum, c) => sum + c.total_amount,
    0,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (openSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ágape
          </CardTitle>
          <CardDescription>
            Não há sessões de ágape abertas no momento.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Registrar Consumo no Ágape
          </CardTitle>
          <CardDescription>
            Selecione a sessão de ágape e registre seus consumos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sessão de Ágape</label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma sessão" />
              </SelectTrigger>
              <SelectContent>
                {openSessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {format(new Date(session.date), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                    {session.description && ` - ${session.description}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSession && (
            <>
              {selectedSessionData && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {format(
                          new Date(selectedSessionData.date),
                          "dd 'de' MMMM 'de' yyyy",
                          { locale: ptBR },
                        )}
                      </p>
                      {selectedSessionData.description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedSessionData.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aberta
                    </Badge>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Item do Cardápio</label>
                  <Select
                    value={selectedMenuItem}
                    onValueChange={setSelectedMenuItem}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMenuItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - R$ {item.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleAddConsumption}
                    className="w-full"
                    disabled={!selectedMenuItem || quantity < 1 || isSubmitting || loading}
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

              {selectedMenuItem && (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Total: R${' '}
                    {(
                      activeMenuItems.find((m) => m.id === selectedMenuItem)
                        ?.price || 0
                    ) *
                      quantity}
                  </p>
                </div>
              )}

              {myConsumptions.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Meus Consumos</h3>
                    <Badge variant="secondary" className="text-lg">
                      Total: R$ {totalMyConsumption.toFixed(2)}
                    </Badge>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead className="text-right">Preço Unit.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myConsumptions.map((consumption) => (
                          <TableRow key={consumption.id}>
                            <TableCell>
                              {consumption.menu_item?.name || 'Item removido'}
                            </TableCell>
                            <TableCell>{consumption.quantity}</TableCell>
                            <TableCell className="text-right">
                              R$ {consumption.unit_price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {consumption.total_amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
