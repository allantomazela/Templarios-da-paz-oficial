import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Scale,
  Wrench,
} from 'lucide-react'
import type { BankAccount, Transaction } from '@/lib/data'
import { formatCurrencyBRL } from '@/lib/format-utils'
import {
  buildAccountReconciliationDetails,
  buildReconciliationAudit,
  enrichWithRealBalance,
  type AccountReconciliationWithReal,
} from '@/lib/account-reconciliation'
import { fetchLinkedMensalidadeTransactionIds, fetchMensalidadeLinkContext } from '@/lib/account-reconciliation-api'
import {
  applyAcknowledgmentsToAudit,
  fetchReconciliationAlertAcknowledgments,
} from '@/lib/account-reconciliation-acknowledgments'
import { fetchFinancialAccountsAndTransactions } from '@/lib/financial-balances'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import useFinancialStore from '@/stores/useFinancialStore'
import { cn } from '@/lib/utils'
import { ReconciliationAuditAlerts } from '@/components/financial/ReconciliationAuditAlerts'

const BALANCE_TOLERANCE = 0.01

function parseRealBalanceInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function AccountReconciliationPanel() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set())
  const [mensalidadeLinkContext, setMensalidadeLinkContext] = useState<
    Awaited<ReturnType<typeof fetchMensalidadeLinkContext>> | null
  >(null)
  const [ackRevision, setAckRevision] = useState(0)
  const [acknowledgments, setAcknowledgments] = useState<
    Awaited<ReturnType<typeof fetchReconciliationAlertAcknowledgments>>
  >([])
  const [realBalances, setRealBalances] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const dataRevision = useFinancialStore((state) => state.dataRevision)
  const { toast } = useToast()
  const supabaseAny = supabase as any

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      try {
        const [financialData, mensalidadeIds, linkContext, ackRows] = await Promise.all([
          fetchFinancialAccountsAndTransactions(),
          fetchLinkedMensalidadeTransactionIds(),
          fetchMensalidadeLinkContext(),
          fetchReconciliationAlertAcknowledgments().catch(() => []),
        ])
        if (!isMounted) return
        setAccounts(financialData.accounts)
        setTransactions(financialData.transactions)
        setLinkedIds(mensalidadeIds)
        setMensalidadeLinkContext(linkContext)
        setAcknowledgments(ackRows)
      } catch (error) {
        console.error('Error loading reconciliation data:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados de conferência.',
          variant: 'destructive',
        })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadData()
    return () => {
      isMounted = false
    }
  }, [dataRevision, ackRevision, toast])

  const details = useMemo(
    () => buildAccountReconciliationDetails(accounts, transactions),
    [accounts, transactions],
  )

  const enrichedDetails = useMemo(
    () =>
      details.map((detail) =>
        enrichWithRealBalance(detail, parseRealBalanceInput(realBalances[detail.accountId] ?? '')),
      ),
    [details, realBalances],
  )

  const audit = useMemo(
    () =>
      applyAcknowledgmentsToAudit(
        buildReconciliationAudit(
          transactions,
          linkedIds,
          mensalidadeLinkContext ?? undefined,
        ),
        acknowledgments,
      ),
    [transactions, linkedIds, mensalidadeLinkContext, acknowledgments],
  )

  const handleAlertAcknowledged = () => {
    setAckRevision((current) => current + 1)
  }

  const accountNameById = useMemo(
    () => Object.fromEntries(accounts.map((account) => [account.id, account.name])),
    [accounts],
  )

  const applyInitialBalance = useAsyncOperation(
    async (accountId: string, newInitialBalance: number) => {
      const { error } = await supabaseAny
        .from('financial_accounts')
        .update({ initial_balance: newInitialBalance })
        .eq('id', accountId)

      if (error) throw error

      useFinancialStore.getState().notifyFinancialDataChanged()
      return 'Saldo inicial atualizado com sucesso.'
    },
    {
      successMessage: 'Saldo inicial aplicado.',
      errorMessage: 'Falha ao atualizar saldo inicial.',
    },
  )

  const totalDifference = enrichedDetails.reduce((sum, detail) => {
    if (detail.difference === null) return sum
    return sum + Math.abs(detail.difference)
  }, 0)

  const accountsWithRealBalance = enrichedDetails.filter(
    (detail) => detail.realBalance !== null,
  ).length

  const allMatched =
    accountsWithRealBalance > 0 &&
    enrichedDetails
      .filter((detail) => detail.realBalance !== null)
      .every((detail) => Math.abs(detail.difference ?? 0) < BALANCE_TOLERANCE)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando conferência...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Scale className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Conferência com extrato bancário</CardTitle>
              <CardDescription>
                Informe o saldo real de cada conta no extrato. O sistema calcula a diferença e
                sugere um saldo inicial para alinhar os valores.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {accountsWithRealBalance > 0 && (
            <Alert
              className={cn(
                allMatched
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800',
              )}
            >
              {allMatched ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {allMatched ? 'Contas conferidas' : 'Divergências encontradas'}
              </AlertTitle>
              <AlertDescription>
                {allMatched
                  ? 'Os saldos informados batem com o sistema em todas as contas preenchidas.'
                  : `Diferença acumulada de ${formatCurrencyBRL(totalDifference)} entre sistema e extrato nas contas informadas.`}
              </AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Sistema</TableHead>
                  <TableHead className="w-[140px]">Extrato (R$)</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead className="text-right">Saldo inicial</TableHead>
                  <TableHead className="text-right">Sugerido</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedDetails.map((detail) => (
                  <ReconciliationRow
                    key={detail.accountId}
                    detail={detail}
                    realBalanceInput={realBalances[detail.accountId] ?? ''}
                    onRealBalanceChange={(value) =>
                      setRealBalances((current) => ({
                        ...current,
                        [detail.accountId]: value,
                      }))
                    }
                    onApply={() => {
                      if (detail.suggestedInitialBalance === null) return
                      void applyInitialBalance.execute(
                        detail.accountId,
                        detail.suggestedInitialBalance,
                      )
                    }}
                    applying={applyInitialBalance.loading}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ReconciliationAuditAlerts
        audit={audit}
        accountNameById={accountNameById}
        linkedMensalidadeIds={linkedIds}
        onAlertAcknowledged={handleAlertAcknowledged}
      />
    </div>
  )
}

interface ReconciliationRowProps {
  detail: AccountReconciliationWithReal
  realBalanceInput: string
  onRealBalanceChange: (value: string) => void
  onApply: () => void
  applying: boolean
}

function ReconciliationRow({
  detail,
  realBalanceInput,
  onRealBalanceChange,
  onApply,
  applying,
}: ReconciliationRowProps) {
  const hasDifference =
    detail.difference !== null && Math.abs(detail.difference) >= BALANCE_TOLERANCE
  const suggestedNegative =
    detail.suggestedInitialBalance !== null && detail.suggestedInitialBalance < 0

  return (
    <TableRow>
      <TableCell className="font-medium">{detail.accountName}</TableCell>
      <TableCell className="text-right">{formatCurrencyBRL(detail.systemBalance)}</TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          placeholder="0,00"
          value={realBalanceInput}
          onChange={(event) => onRealBalanceChange(event.target.value)}
          className="h-8"
        />
      </TableCell>
      <TableCell
        className={cn(
          'text-right',
          hasDifference && 'text-amber-600 font-medium',
          detail.difference !== null &&
            Math.abs(detail.difference) < BALANCE_TOLERANCE &&
            'text-green-600',
        )}
      >
        {detail.difference === null ? '—' : formatCurrencyBRL(detail.difference)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatCurrencyBRL(detail.initialBalance)}
      </TableCell>
      <TableCell className="text-right">
        {detail.suggestedInitialBalance === null
          ? '—'
          : formatCurrencyBRL(detail.suggestedInitialBalance)}
      </TableCell>
      <TableCell className="text-right">
        {detail.canApplySuggestedInitial ? (
          <Button
            size="sm"
            variant="outline"
            disabled={applying}
            onClick={onApply}
          >
            <Wrench className="mr-1 h-3 w-3" />
            Aplicar
          </Button>
        ) : suggestedNegative && hasDifference ? (
          <span className="text-xs text-destructive">Corrija lançamentos</span>
        ) : null}
      </TableCell>
    </TableRow>
  )
}
