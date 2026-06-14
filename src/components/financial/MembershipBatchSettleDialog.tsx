import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Wallet } from 'lucide-react'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { todayLocalISODate } from '@/lib/format-utils'
import { fetchBankAccounts } from '@/lib/contribution-payments'
import type { BatchSettlePeriod } from '@/lib/membership-batch-settle-types'

interface MembershipBatchSettleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brotherName: string
  periods: BatchSettlePeriod[]
  onConfirm: (params: {
    paymentDate: string
    accountId: string
    notes: string
  }) => Promise<void>
}

export function MembershipBatchSettleDialog({
  open,
  onOpenChange,
  brotherName,
  periods,
  onConfirm,
}: MembershipBatchSettleDialogProps) {
  const [paymentDate, setPaymentDate] = useState(todayLocalISODate())
  const [accountId, setAccountId] = useState('')
  const [notes, setNotes] = useState('')
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = periods.reduce((sum, p) => sum + p.amount, 0)

  useEffect(() => {
    if (!open) return
    setPaymentDate(todayLocalISODate())
    setNotes('')
    setError(null)
    setLoadingAccounts(true)
    fetchBankAccounts()
      .then(setAccounts)
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false))
  }, [open])

  async function handleConfirm() {
    if (!accountId) {
      setError('Selecione a conta bancária.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onConfirm({ paymentDate, accountId, notes })
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao quitar mensalidades.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Quitar {periods.length} mensalidade(s)
          </DialogTitle>
          <DialogDescription>
            Um único lançamento na tesouraria para{' '}
            <strong>{brotherName}</strong> referente a:{' '}
            {periods.map((p) => p.periodLabel).join(', ')}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="text-muted-foreground">Total do pagamento</p>
            <p className="text-xl font-semibold text-green-700">
              {formatCurrencyBRL(total)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch-payment-date">Data do pagamento</Label>
            <Input
              id="batch-payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Conta bancária (tesouraria)</Label>
            <Select
              value={accountId}
              onValueChange={setAccountId}
              disabled={loadingAccounts}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingAccounts ? 'Carregando...' : 'Onde entrou o valor'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch-notes">Observações (opcional)</Label>
            <Input
              id="batch-notes"
              placeholder="Ex.: PIX único referente a mar/abr"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={saving || periods.length === 0}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Quitando...
              </>
            ) : (
              'Confirmar quitação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
