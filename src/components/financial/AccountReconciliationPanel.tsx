import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import {
  buildAccountReconciliationDetails,
  buildReconciliationAudit,
  enrichWithRealBalance,
  type AccountReconciliationWithReal,
} from '@/lib/account-reconciliation'
import { fetchLinkedMensalidadeTransactionIds } from '@/lib/account-reconciliation-api'
import { fetchFinancialAccountsAndTransactions } from '@/lib/financial-balances'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import useFinancialStore from '@/stores/useFinancialStore'
import { cn } from '@/lib/utils'

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
        const [financialData, mensalidadeIds] = await Promise.all([
          fetchFinancialAccountsAndTransactions(),
          fetchLinkedMensalidadeTransactionIds(),
        ])
        if (!isMounted) return
        setAccounts(financialData.accounts)
        setTransactions(financialData.transactions)
        setLinkedIds(mensalidadeIds)
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
  }, [dataRevision, toast])

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
    () => buildReconciliationAudit(transactions, linkedIds),
    [transactions, linkedIds],
  )

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

      <ReconciliationAlerts audit={audit} accountNameById={accountNameById} />
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

interface ReconciliationAlertsProps {
  audit: ReturnType<typeof buildReconciliationAudit>
  accountNameById: Record<string, string>
}

function ReconciliationAlerts({ audit, accountNameById }: ReconciliationAlertsProps) {
  const hasAlerts =
    audit.orphanTransactions.length > 0 ||
    audit.duplicateGroups.length > 0 ||
    audit.unlinkedMensalidade.length > 0

  if (!hasAlerts) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          Alertas de auditoria
        </CardTitle>
        <CardDescription>
          Possíveis causas de divergência entre o sistema e o extrato bancário.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {audit.unlinkedMensalidade.length > 0 && (
          <AlertSection
            title="Mensalidades sem vínculo"
            description="Receitas de Mensalidade que não estão ligadas a um pagamento registrado. Podem ser lançamentos manuais duplicados."
          >
            {audit.unlinkedMensalidade.slice(0, 10).map((item) => (
              <AlertItem
                key={item.transaction.id}
                transaction={item.transaction}
                accountName={accountNameById[item.transaction.accountId ?? '']}
                badge={
                  item.reason === 'sem_vinculo_mensalidade'
                    ? 'Sem vínculo'
                    : 'Possível duplicata'
                }
              />
            ))}
            {audit.unlinkedMensalidade.length > 10 && (
              <p className="text-xs text-muted-foreground">
                + {audit.unlinkedMensalidade.length - 10} itens
              </p>
            )}
          </AlertSection>
        )}

        {audit.duplicateGroups.length > 0 && (
          <AlertSection
            title="Lançamentos duplicados"
            description="Mesma conta, data, tipo e valor — revise se há entradas repetidas."
          >
            {audit.duplicateGroups.slice(0, 5).map((group) => (
              <div key={group.key} className="rounded-md border p-3 space-y-2">
                <p className="text-sm font-medium">
                  {accountNameById[group.accountId ?? ''] ?? 'Sem conta'} ·{' '}
                  {formatDateBR(group.date)} · {group.type} ·{' '}
                  {formatCurrencyBRL(group.amount)}
                </p>
                <ul className="space-y-1">
                  {group.transactions.map((transaction) => (
                    <li key={transaction.id} className="text-sm text-muted-foreground">
                      {transaction.description}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </AlertSection>
        )}

        {audit.orphanTransactions.length > 0 && (
          <AlertSection
            title="Transações sem conta"
            description="Não entram no saldo de nenhuma conta até serem vinculadas."
          >
            {audit.orphanTransactions.slice(0, 5).map((transaction) => (
              <AlertItem key={transaction.id} transaction={transaction} />
            ))}
          </AlertSection>
        )}
      </CardContent>
    </Card>
  )
}

interface AlertSectionProps {
  title: string
  description: string
  children: ReactNode
}

function AlertSection({ title, description, children }: AlertSectionProps) {
  return (
    <div className="space-y-2">
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

interface AlertItemProps {
  transaction: Transaction
  accountName?: string
  badge?: string
}

function AlertItem({ transaction, accountName, badge }: AlertItemProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <span>{formatDateBR(transaction.date)}</span>
      <span className="text-muted-foreground">·</span>
      <span>{transaction.description}</span>
      <span className="text-muted-foreground">·</span>
      <span>{formatCurrencyBRL(transaction.amount)}</span>
      {accountName && (
        <>
          <span className="text-muted-foreground">·</span>
          <span>{accountName}</span>
        </>
      )}
      {badge && (
        <Badge variant="outline" className="text-amber-700 border-amber-300">
          {badge}
        </Badge>
      )}
    </div>
  )
}
