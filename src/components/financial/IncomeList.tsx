import { useState, useEffect, useRef, useMemo } from 'react'
import { Transaction, BankAccount } from '@/lib/data'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pencil,
  Trash2,
  Calendar,
  Folder,
  Wallet,
  Loader2,
} from 'lucide-react'
import {
  TransactionDialog,
  type TransactionFormValues,
} from './TransactionDialog'
import { TransactionAttachmentIndicator } from './TransactionAttachmentIndicator'
import { TransactionListToolbar } from './TransactionListToolbar'
import { FinancialCashSummaryBar } from './FinancialCashSummaryBar'
import { formatDateBR } from '@/lib/format-utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { formatCurrencyBRL } from '@/lib/format-utils'
import useFinancialStore, { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import { useFinancialAttachmentAccess } from '@/hooks/use-financial-attachment-access'
import {
  deleteFinancialTransaction,
  loadTransactionsByType,
  saveFinancialTransaction,
} from '@/lib/financial-transaction-api'
import { fetchFinancialAccountsAndTransactions } from '@/lib/financial-balances'
import {
  computeCashAvailability,
  sumTransactionAmounts,
} from '@/lib/financial-balance-math'

export function IncomeList() {
  const [incomes, setIncomes] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [accountNames, setAccountNames] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const dialog = useDialog()
  const [selectedIncome, setSelectedIncome] = useState<Transaction | null>(null)
  const createIdempotencyKeyRef = useRef<string | null>(null)
  const dataRevision = useFinancialStore((s) => s.dataRevision)
  const canManageAttachments = useFinancialAttachmentAccess()

  // Load incomes from Supabase
  const loadIncomes = useAsyncOperation(
    async () => {
      const [{ transactions, accountNames: namesById }, cashData] = await Promise.all([
        loadTransactionsByType('Receita', { includeAttachmentCounts: canManageAttachments }),
        fetchFinancialAccountsAndTransactions(),
      ])

      setAccountNames(namesById)
      setIncomes(transactions)
      setAccounts(cashData.accounts)
      setAllTransactions(cashData.transactions)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar receitas.',
    },
  )

  const loading = loadIncomes.loading

  useEffect(() => {
    void loadIncomes.execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRevision, canManageAttachments])

  const filteredIncomes = incomes.filter(
    (income) =>
      income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      income.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredTotal = useMemo(
    () => sumTransactionAmounts(filteredIncomes),
    [filteredIncomes],
  )

  const cashSummary = useMemo(
    () => computeCashAvailability(accounts, allTransactions),
    [accounts, allTransactions],
  )

  const refreshIncomes = () => {
    notifyFinancialDataChanged()
  }

  const saveOperation = useAsyncOperation(
    async (data: TransactionFormValues): Promise<string | null> => {
      const transactionId = await saveFinancialTransaction({
        type: 'Receita',
        data,
        existingId: selectedIncome?.id,
        idempotencyKeyRef: createIdempotencyKeyRef,
      })

      await refreshIncomes()
      return transactionId
    },
    {
      successMessage: 'Receita salva com sucesso!',
      errorMessage: 'Falha ao salvar a receita.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      await deleteFinancialTransaction(id)
      await refreshIncomes()
      return 'Receita removida.'
    },
    {
      successMessage: 'Receita removida com sucesso!',
      errorMessage: 'Falha ao remover a receita.',
    },
  )

  const handleSave = async (data: TransactionFormValues) => {
    return saveOperation.execute(data)
  }

  const handleDelete = (id: string) => {
    deleteOperation.execute(id)
  }

  const openNew = () => {
    setSelectedIncome(null)
    dialog.openDialog()
  }

  const openEdit = (income: Transaction) => {
    setSelectedIncome(income)
    dialog.openDialog()
  }

  const getAccountName = (id?: string) => {
    if (!id) return 'N/A'
    return accountNames[id] || 'N/A'
  }

  return (
    <div className="space-y-4">
      <TransactionListToolbar
        searchPlaceholder="Buscar receitas..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        listTotalLabel={searchTerm ? 'Total filtrado' : 'Total de receitas'}
        listTotal={filteredTotal}
        listTotalClassName="text-green-600"
        actionLabel="Nova Receita"
        onAction={openNew}
        actionClassName="bg-green-600 hover:bg-green-700"
      />

      {!loading ? <FinancialCashSummaryBar summary={cashSummary} highlight="income" /> : null}

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando receitas...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredIncomes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {searchTerm
                    ? 'Nenhuma receita encontrada com o termo buscado.'
                    : 'Nenhuma receita cadastrada.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredIncomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell>
                    {formatDateBR(income.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{income.description}</span>
                      <TransactionAttachmentIndicator
                        transaction={income}
                        visible={canManageAttachments}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{income.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-normal text-muted-foreground"
                    >
                      {getAccountName(income.accountId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatCurrencyBRL(income.amount)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(income)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(income.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando receitas...
          </div>
        ) : filteredIncomes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            {searchTerm
              ? 'Nenhuma receita encontrada com o termo buscado.'
              : 'Nenhuma receita cadastrada.'}
          </div>
        ) : (
          filteredIncomes.map((income) => (
            <Card key={income.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-medium">{income.description}</h4>
                    <TransactionAttachmentIndicator
                      transaction={income}
                      visible={canManageAttachments}
                    />
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrencyBRL(income.amount)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(income)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(income.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateBR(income.date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    {income.category}
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <Wallet className="h-3 w-3" />
                    {getAccountName(income.accountId)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <TransactionDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        transactionToEdit={selectedIncome}
        onSave={handleSave}
        defaultType="Receita"
      />
    </div>
  )
}
