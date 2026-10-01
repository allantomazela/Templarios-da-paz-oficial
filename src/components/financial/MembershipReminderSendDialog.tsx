import { useEffect, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatCurrencyBRL } from '@/lib/format-utils'
import {
  previewMembershipReminders,
  sendMembershipRemindersNow,
  type MembershipReminderRecipient,
} from '@/lib/membership-reminder-settings'

interface MembershipReminderSendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSent: () => void
}

export function MembershipReminderSendDialog({
  open,
  onOpenChange,
  onSent,
}: MembershipReminderSendDialogProps) {
  const { toast } = useToast()
  const [recipients, setRecipients] = useState<MembershipReminderRecipient[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    setLoading(true)
    setLoadError(null)
    setRecipients([])
    previewMembershipReminders().then((result) => {
      if (cancelled) return
      if (result.ok) setRecipients(result.recipients)
      else setLoadError(result.error || 'Não foi possível montar a lista.')
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [open])

  const toSendCount = recipients.filter(isDeliverable).length

  const handleSend = async () => {
    setSending(true)
    const result = await sendMembershipRemindersNow()
    setSending(false)

    if (!result.ok) {
      toast({
        title: 'Falha ao enviar lembretes',
        description: result.error || 'Tente novamente em instantes.',
        variant: 'destructive',
      })
      return
    }

    toast({ title: 'Lembretes enviados', description: result.message })
    onSent()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !sending && onOpenChange(next)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar lembretes de mensalidade agora</DialogTitle>
          <DialogDescription>
            Confira quem receberá o e-mail. São listados os irmãos com
            mensalidade em atraso; quem já recebeu lembrete neste mês não
            recebe de novo.
          </DialogDescription>
        </DialogHeader>

        <RecipientsContent
          loading={loading}
          error={loadError}
          recipients={recipients}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || sending || toSendCount === 0}
          >
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {toSendCount === 0
              ? 'Ninguém para avisar'
              : `Enviar para ${toSendCount} irmão(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RecipientsContent({
  loading,
  error,
  recipients,
}: {
  loading: boolean
  error: string | null
  recipients: MembershipReminderRecipient[]
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Montando a lista...
      </div>
    )
  }

  if (error) {
    return (
      <p role="alert" className="py-6 text-center text-sm text-destructive">
        {error}
      </p>
    )
  }

  if (recipients.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhum irmão com mensalidade em atraso.
      </p>
    )
  }

  return (
    <div className="max-h-[50vh] overflow-y-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Irmão</TableHead>
            <TableHead>Meses</TableHead>
            <TableHead className="text-right">Em aberto</TableHead>
            <TableHead className="text-right">Situação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipients.map((recipient) => (
            <TableRow key={recipient.brotherId}>
              <TableCell className="font-medium">{recipient.brotherName}</TableCell>
              <TableCell className="text-sm">
                {recipient.overdueLabels.join(', ')}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrencyBRL(recipient.overdueAmount)}
              </TableCell>
              <TableCell className="text-right">
                <RecipientStatusBadge recipient={recipient} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function RecipientStatusBadge({
  recipient,
}: {
  recipient: MembershipReminderRecipient
}) {
  if (recipient.alreadyRemindedThisMonth) {
    return <Badge variant="secondary">Já avisado no mês</Badge>
  }
  if (!recipient.email) {
    return <Badge variant="destructive">Sem e-mail</Badge>
  }
  return (
    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
      Será avisado
    </Badge>
  )
}

function isDeliverable(recipient: MembershipReminderRecipient): boolean {
  return !recipient.alreadyRemindedThisMonth && Boolean(recipient.email)
}
