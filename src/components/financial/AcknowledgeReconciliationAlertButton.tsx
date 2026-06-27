import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  acknowledgeReconciliationAlert,
  type ReconciliationAlertType,
} from '@/lib/account-reconciliation-acknowledgments'

interface AcknowledgeReconciliationAlertButtonProps {
  alertType: ReconciliationAlertType
  alertKey: string
  transactionIds: string[]
  onAcknowledged: () => void
  size?: 'sm' | 'default'
  label?: string
}

export function AcknowledgeReconciliationAlertButton({
  alertType,
  alertKey,
  transactionIds,
  onAcknowledged,
  size = 'sm',
  label = 'Marcar como verificado',
}: AcknowledgeReconciliationAlertButtonProps) {
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await acknowledgeReconciliationAlert({
        alertType,
        alertKey,
        transactionIds,
        note: note.trim() || undefined,
      })
      toast({
        title: 'Alerta verificado',
        description:
          'A verificação foi registrada. O alerta voltará se os lançamentos forem alterados.',
      })
      setConfirmOpen(false)
      setNote('')
      onAcknowledged()
    } catch (error) {
      toast({
        title: 'Erro ao registrar verificação',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        variant="outline"
        className="text-green-700 border-green-300 hover:bg-green-50"
        disabled={submitting}
        onClick={() => setConfirmOpen(true)}
      >
        {submitting ? (
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        )}
        {label}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar verificação do alerta?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Use esta opção quando tiver revisado os lançamentos e confirmado que
                  estão corretos (ex.: mensalidade em atraso paga junto com a corrente).
                </p>
                <p>
                  A verificação fica registrada com seu usuário e data. O alerta será
                  ocultado enquanto os mesmos lançamentos permanecerem inalterados.
                </p>
                <div className="space-y-2">
                  <Label htmlFor={`ack-note-${alertKey}`}>
                    Observação (opcional)
                  </Label>
                  <Textarea
                    id={`ack-note-${alertKey}`}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ex.: Conferido no extrato Stone — pagamento legítimo."
                    rows={3}
                    disabled={submitting}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(event) => {
                event.preventDefault()
                void handleConfirm()
              }}
            >
              {submitting ? 'Registrando...' : 'Confirmar verificação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
