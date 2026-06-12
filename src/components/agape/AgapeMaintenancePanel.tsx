import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { resetAgapeOperationalData } from '@/lib/agape-admin-api'
import { getSaveErrorMessage } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'
import { isMasterAdminEmail } from '@/config/master-admin'
import useAgapeStore from '@/stores/useAgapeStore'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'

export function AgapeMaintenancePanel() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const clearOperationalCache = useAgapeStore((s) => s.clearOperationalCache)
  const fetchSessions = useAgapeStore((s) => s.fetchSessions)
  const fetchMenuItems = useAgapeStore((s) => s.fetchMenuItems)
  const fetchConsumptions = useAgapeStore((s) => s.fetchConsumptions)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  const canResetAll =
    isMasterAdminEmail(user?.email) ||
    user?.role === 'admin' ||
    user?.role === 'editor'

  const handleReset = async () => {
    setResetting(true)
    try {
      const result = await resetAgapeOperationalData()
      clearOperationalCache()
      notifyFinancialDataChanged()
      await Promise.all([fetchSessions(), fetchMenuItems(), fetchConsumptions()])

      toast({
        title: 'Módulo Ágape zerado',
        description: `Removidos: ${result.consumptionsRemoved} consumo(s), ${result.sessionsRemoved} sessão(ões), ${result.chargesRemoved} cobrança(s), ${result.transactionsRemoved} receita(s) na tesouraria.`,
      })
      setConfirmOpen(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Reset não concluído',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setResetting(false)
    }
  }

  if (!canResetAll) {
    return (
      <Alert>
        <AlertTitle>Manutenção restrita</AlertTitle>
        <AlertDescription>
          Apenas a administração pode zerar todo o módulo. Para ajustes do dia a dia,
          use editar/excluir em sessões, consumos, cardápio e no Fechamento Ágape.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base">Zerar módulo Ágape</CardTitle>
          <CardDescription>
            Remove todas as sessões, consumos, cardápio, cobranças e receitas do Ágape
            na tesouraria. Use apenas quando precisar recomeçar do zero (equivalente ao
            script SQL de limpeza).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={resetting}
          >
            {resetting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Zerar todos os lançamentos do Ágape
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !resetting && setConfirmOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Zerar todo o módulo Ágape?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação apaga <strong>todos</strong> os consumos, sessões, itens do
              cardápio, fechamentos financeiros e receitas vinculadas ao Ágape. Não remove
              perfis de irmãos nem configurações do PIX. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={resetting}
              onClick={(e) => {
                e.preventDefault()
                void handleReset()
              }}
            >
              {resetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sim, zerar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
