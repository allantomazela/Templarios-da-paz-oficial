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
  Upload,
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
import { fetchFinancialAccountsAndTransactions } from '@/lib/financial-balances'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import useFinancialStore from '@/stores/useFinancialStore'
import { cn } from '@/lib/utils'
import { MensalidadeBalanceHintPanel } from '@/components/financial/MensalidadeBalanceHintPanel'
import { buildMensalidadeBalanceHints } from '@/lib/account-reconciliation-mensalidade-hints'
import { CashReconciliationSummaryCard } from '@/components/financial/CashReconciliationSummary'
import { BankStatementImportDialog } from '@/components/financial/BankStatementImportDialog'
import { DifferenceCausesPanel } from '@/components/financial/DifferenceCausesPanel'
import { buildCashReconciliationSummary } from '@/lib/account-reconciliation-difference-causes'
import type { BankStatementLine } from '@/lib/bank-statement-csv-import'
import { Badge } from '@/components/ui/badge'

const BALANCE_TOLERANCE = 0.01
const REAL_BALANCE_STORAGE_KEY = 'cash-reconciliation-real-balances'

function loadStoredRealBalances(): Record<string, string> {
  try {
    const raw = localStorage.getItem(REAL_BALANCE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function persistRealBalances(balances: Record<string, string>) {
  try {
    localStorage.setItem(REAL_BALANCE_STORAGE_KEY, JSON.stringify(balances))
  } catch {
    // ignore quota errors
  }
}

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
  const [realBalances, setRealBalances] = useState<Record<string, string>>(
    () => loadStoredRealBalances(),
  )
  const [importedLinesByAccount, setImportedLinesByAccount] = useState<
    Record<string, BankStatementLine[]>
  >({})
  const [importOpen, setImportOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dataRevision = useFinancialStore((state) => state.dataRevision)
  const { toast } = useToast()
  const supabaseAny = supabase as any

  useEffect(() => {
    persistRealBalances(realBalances)
  }, [realBalances])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      try {
        const [financialData, mensalidadeIds, linkContext] = await Promise.all([
          fetchFinancialAccountsAndTransactions(),
          fetchLinkedMensalidadeTransactionIds(),
          fetchMensalidadeLinkContext(),
        ])
        if (!isMounted) return
        setAccounts(financialData.accounts)
        setTransactions(financialData.transactions)
        setLinkedIds(mensalidadeIds)
        setMensalidadeLinkContext(linkContext)
      } catch (error) {
        console.error('Error loading reconciliation data:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao carregar conferência de caixa.',
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

  const cashSummary = useMemo(
    () => buildCashReconciliationSummary(enrichedDetails),
    [enrichedDetails],
  )

  const audit = useMemo(
    () =>
      buildReconciliationAudit(
        transactions,
        linkedIds,
        mensalidadeLinkContext ?? undefined,
      ),
    [transactions, linkedIds, mensalidadeLinkContext],
  )

  const mensalidadeHints = useMemo(
    () =>
      buildMensalidadeBalanceHints(
        accounts.map((account) => ({
          accountId: account.id,
          accountName: account.name,
        })),
        transactions,
        linkedIds,
        enrichedDetails,
      ),
    [accounts, transactions, linkedIds, enrichedDetails],
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

  const handleImportApply = (params: {
    accountId: string
    closingBalance: number
    lines: BankStatementLine[]
  }) => {
    setRealBalances((current) => ({
      ...current,
      [params.accountId]: String(params.closingBalance),
    }))
    setImportedLinesByAccount((current) => ({
      ...current,
      [params.accountId]: params.lines,
    }))
    toast({
      title: 'Extrato importado',
      description: `Saldo de ${formatCurrencyBRL(params.closingBalance)} aplicado à conta.`,
    })
  }

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
      <CashReconciliationSummaryCard summary={cashSummary} />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Contas e extrato</CardTitle>
              <CardDescription>
                Informe o saldo do extrato manualmente ou importe um CSV. O sistema
                compara com os lançamentos e mostra o que pode explicar divergências.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar extrato CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {cashSummary.accountsWithExtrato > 0 && !cashSummary.allInformedMatched && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Divergência entre sistema e extrato</AlertTitle>
              <AlertDescription>
                Corrija lançamentos abaixo ou ajuste o saldo inicial sugerido. O
                objetivo é o saldo do sistema bater com o extrato bancário.
              </AlertDescription>
            </Alert>
          )}

          {cashSummary.allInformedMatched && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Caixa conferido</AlertTitle>
              <AlertDescription>
                Todas as contas com extrato informado estão alinhadas ao sistema.
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
                  <TableHead>Status</TableHead>
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
                    hasImportedStatement={Boolean(
                      importedLinesByAccount[detail.accountId]?.length,
                    )}
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

      <MensalidadeBalanceHintPanel hints={mensalidadeHints} />

      <DifferenceCausesPanel
        audit={audit}
        enrichedDetails={enrichedDetails}
        accountNameById={accountNameById}
        linkedMensalidadeIds={linkedIds}
        onResolved={() => useFinancialStore.getState().notifyFinancialDataChanged()}
      />

      <BankStatementImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        accounts={accounts}
        transactions={transactions}
        onApply={handleImportApply}
      />
    </div>
  )
}

interface ReconciliationRowProps {
  detail: AccountReconciliationWithReal
  realBalanceInput: string
  hasImportedStatement: boolean
  onRealBalanceChange: (value: string) => void
  onApply: () => void
  applying: boolean
}

function ReconciliationRow({
  detail,
  realBalanceInput,
  hasImportedStatement,
  onRealBalanceChange,
  onApply,
  applying,
}: ReconciliationRowProps) {
  const hasDifference =
    detail.difference !== null && Math.abs(detail.difference) >= BALANCE_TOLERANCE
  const isMatched =
    detail.realBalance !== null && !hasDifference
  const suggestedNegative =
    detail.suggestedInitialBalance !== null && detail.suggestedInitialBalance < 0

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex flex-col gap-1">
          <span>{detail.accountName}</span>
          {hasImportedStatement ? (
            <span className="text-xs text-muted-foreground">CSV importado</span>
          ) : null}
        </div>
      </TableCell>
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
          isMatched && 'text-green-600',
        )}
      >
        {detail.difference === null ? '—' : formatCurrencyBRL(detail.difference)}
      </TableCell>
      <TableCell>
        {detail.realBalance === null ? (
          <Badge variant="secondary">Pendente</Badge>
        ) : isMatched ? (
          <Badge className="bg-green-600 hover:bg-green-700">Conferida</Badge>
        ) : (
          <Badge variant="destructive">Divergente</Badge>
        )}
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
