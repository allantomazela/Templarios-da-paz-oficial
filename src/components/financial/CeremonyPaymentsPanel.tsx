import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Plus, Wallet, Trash2 } from 'lucide-react'
import { BrotherSearchCombobox, type BrotherOption } from '@/components/financial/BrotherSearchCombobox'
import { CeremonyPaymentPlanDialog } from '@/components/financial/CeremonyPaymentPlanDialog'
import { CeremonyInstallmentDialog } from '@/components/financial/CeremonyInstallmentDialog'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { formatDateBR } from '@/lib/format-utils'
import {
  cancelCeremonyPaymentPlan,
  createCeremonyPaymentPlan,
  deleteCeremonyPaymentPlan,
  fetchCeremonyPaymentPlans,
  saveCeremonyInstallment,
} from '@/lib/ceremony-payments'
import {
  ceremonyPlanLabel,
  type CeremonyInstallmentFormData,
  type CeremonyPaymentInstallment,
  type CeremonyPaymentPlan,
  type CeremonyPlanFormData,
} from '@/lib/ceremony-payment-types'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import { useToast } from '@/hooks/use-toast'

function installmentStatusBadge(status: CeremonyPaymentInstallment['status']) {
  if (status === 'Pago') {
    return <Badge className="bg-green-600 hover:bg-green-700">{status}</Badge>
  }
  if (status === 'Atrasado') {
    return <Badge variant="destructive">{status}</Badge>
  }
  return <Badge variant="secondary">{status}</Badge>
}

function planStatusBadge(status: CeremonyPaymentPlan['status']) {
  if (status === 'paid') {
    return <Badge className="bg-green-600 hover:bg-green-700">Quitado</Badge>
  }
  return <Badge variant="outline">Em aberto</Badge>
}

interface CeremonyPaymentsPanelProps {
  brothers: BrotherOption[]
  selectedBrotherId: string
  onBrotherChange: (brotherId: string) => void
  openPlanDialog?: boolean
  onPlanDialogOpenChange?: (open: boolean) => void
}

export function CeremonyPaymentsPanel({
  brothers,
  selectedBrotherId,
  onBrotherChange,
  openPlanDialog,
  onPlanDialogOpenChange,
}: CeremonyPaymentsPanelProps) {
  const { toast } = useToast()
  const [plans, setPlans] = useState<CeremonyPaymentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false)
  const [savingInstallment, setSavingInstallment] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<CeremonyPaymentPlan | null>(null)
  const [selectedInstallment, setSelectedInstallment] =
    useState<CeremonyPaymentInstallment | null>(null)

  useEffect(() => {
    if (openPlanDialog) {
      setPlanDialogOpen(true)
      onPlanDialogOpenChange?.(false)
    }
  }, [openPlanDialog, onPlanDialogOpenChange])

  const loadPlans = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchCeremonyPaymentPlans(selectedBrotherId || null)
      setPlans(data)
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Falha ao carregar taxas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [selectedBrotherId, toast])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const filteredPlans = useMemo(() => {
    if (!selectedBrotherId) return plans
    return plans.filter((p) => p.brotherId === selectedBrotherId)
  }, [plans, selectedBrotherId])

  const openInstallment = (plan: CeremonyPaymentPlan, installment: CeremonyPaymentInstallment) => {
    setSelectedPlan(plan)
    setSelectedInstallment(installment)
    setInstallmentDialogOpen(true)
  }

  const handleCreatePlan = async (data: CeremonyPlanFormData) => {
    setSavingPlan(true)
    try {
      const created = await createCeremonyPaymentPlan(data)
      await loadPlans()
      notifyFinancialDataChanged()
      setPlanDialogOpen(false)
      if (data.registerPayment?.accountId) {
        toast({
          title: 'Plano criado',
          description: 'Receita da 1ª parcela registrada na tesouraria.',
        })
      } else {
        toast({
          title: 'Plano criado',
          description:
            'Registre cada parcela paga para gerar receita em Financeiro → Receitas.',
        })
        const firstInstallment = created.installments?.[0]
        if (firstInstallment) {
          openInstallment(created, firstInstallment)
        }
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao criar plano.',
        variant: 'destructive',
      })
    } finally {
      setSavingPlan(false)
    }
  }

  const handleSaveInstallment = async (data: CeremonyInstallmentFormData) => {
    if (!selectedPlan || !selectedInstallment) return
    setSavingInstallment(true)
    try {
      await saveCeremonyInstallment(data, {
        planId: selectedPlan.id,
        existingTransactionId: selectedInstallment.transactionId,
      })
      await loadPlans()
      notifyFinancialDataChanged()
      setInstallmentDialogOpen(false)
      toast({ title: 'Parcela salva', description: 'Lançamento atualizado na tesouraria.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao salvar parcela.',
        variant: 'destructive',
      })
    } finally {
      setSavingInstallment(false)
    }
  }

  const handleDeletePlan = async (plan: CeremonyPaymentPlan) => {
    const hasPaid = plan.paidInstallmentsCount > 0
    const message = hasPaid
      ? 'Este plano tem parcelas pagas. Prefira cancelar em vez de excluir. Deseja excluir mesmo assim?'
      : 'Excluir este plano e todas as parcelas?'
    if (!window.confirm(message)) return

    try {
      await deleteCeremonyPaymentPlan(plan.id)
      await loadPlans()
      notifyFinancialDataChanged()
      toast({ title: 'Plano removido' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao excluir.',
        variant: 'destructive',
      })
    }
  }

  const handleCancelPlan = async (plan: CeremonyPaymentPlan) => {
    if (!window.confirm('Cancelar este plano? Parcelas pendentes não serão cobradas.')) return
    try {
      await cancelCeremonyPaymentPlan(plan.id)
      await loadPlans()
      toast({ title: 'Plano cancelado' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao cancelar.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 max-w-md space-y-2">
          <label className="text-sm font-medium">Filtrar por irmão</label>
          <BrotherSearchCombobox
            brothers={brothers}
            value={selectedBrotherId}
            onChange={onBrotherChange}
            placeholder="Todos ou buscar irmão..."
          />
        </div>
        <Button onClick={() => setPlanDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova taxa parcelada
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Iniciação, Elevação, Exaltação e outros pagamentos com controle de parcelas.
        A receita só entra em <strong>Financeiro → Receitas</strong> quando a parcela
        é marcada como <strong>Pago</strong> com conta bancária (use a opção ao criar
        o plano ou o botão Registrar em cada parcela).
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma taxa cadastrada
            {selectedBrotherId ? ' para este irmão' : ''}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {ceremonyPlanLabel(plan)} — {plan.brotherName || 'Irmão'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total {formatCurrencyBRL(plan.totalAmount)} · Pago{' '}
                      {formatCurrencyBRL(plan.paidAmount)} · Em aberto{' '}
                      {formatCurrencyBRL(plan.remainingAmount)} · Parcelas{' '}
                      {plan.paidInstallmentsCount}/{plan.installmentsCount}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {planStatusBadge(plan.status)}
                    {plan.status === 'open' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelPlan(plan)}
                      >
                        Cancelar
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeletePlan(plan)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(plan.installments ?? []).map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell>
                          {installment.installmentNumber}/{plan.installmentsCount}
                        </TableCell>
                        <TableCell>
                          {installment.dueDate
                            ? formatDateBR(installment.dueDate)
                            : '—'}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrencyBRL(installment.amount)}
                        </TableCell>
                        <TableCell>{installmentStatusBadge(installment.status)}</TableCell>
                        <TableCell>
                          {installment.paymentDate
                            ? formatDateBR(installment.paymentDate)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openInstallment(plan, installment)}
                          >
                            <Wallet className="mr-1 h-3 w-3" />
                            {installment.status === 'Pago' ? 'Editar' : 'Registrar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CeremonyPaymentPlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        defaultBrotherId={selectedBrotherId}
        brothers={brothers}
        onSave={handleCreatePlan}
        saving={savingPlan}
      />

      <CeremonyInstallmentDialog
        open={installmentDialogOpen}
        onOpenChange={setInstallmentDialogOpen}
        plan={selectedPlan}
        installment={selectedInstallment}
        onSave={handleSaveInstallment}
        saving={savingInstallment}
      />
    </div>
  )
}
