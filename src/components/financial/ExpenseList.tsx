import { useState, useEffect, useRef } from 'react'
import { Transaction } from '@/lib/data'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
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
import { formatDateBR, formatCurrencyBRL } from '@/lib/format-utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import useFinancialStore, { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import { useFinancialAttachmentAccess } from '@/hooks/use-financial-attachment-access'
import {
  deleteFinancialTransaction,
  loadTransactionsByType,
  saveFinancialTransaction,
} from '@/lib/financial-transaction-api'

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Transaction[]>([])
  const [accountNames, setAccountNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const dialog = useDialog()
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(
    null,
  )
  const createIdempotencyKeyRef = useRef<string | null>(null)
  const dataRevision = useFinancialStore((s) => s.dataRevision)
  const canManageAttachments = useFinancialAttachmentAccess()

  // Load expenses from Supabase
  const loadExpenses = useAsyncOperation(
    async () => {
      setLoading(true)
      const { transactions, accountNames: namesById } = await loadTransactionsByType(
        'Despesa',
        { includeAttachmentCounts: canManageAttachments },
      )

      setAccountNames(namesById)
      setExpenses(transactions)
      setLoading(false)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar despesas.',
    },
  )

  useEffect(() => {
    loadExpenses.execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRevision])

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const refreshExpenses = async () => {
    await loadExpenses.execute()
    notifyFinancialDataChanged()
  }

  const saveOperation = useAsyncOperation(
    async (data: TransactionFormValues): Promise<string | null> => {
      const transactionId = await saveFinancialTransaction({
        type: 'Despesa',
        data,
        existingId: selectedExpense?.id,
        idempotencyKeyRef: createIdempotencyKeyRef,
      })

      await refreshExpenses()
      return transactionId
    },
    {
      successMessage: 'Despesa salva com sucesso!',
      errorMessage: 'Falha ao salvar a despesa.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      await deleteFinancialTransaction(id)
      await refreshExpenses()
      return 'Despesa removida.'
    },
    {
      successMessage: 'Despesa removida com sucesso!',
      errorMessage: 'Falha ao remover a despesa.',
    },
  )

  const handleSave = async (data: TransactionFormValues) => {
    return saveOperation.execute(data)
  }

  const handleDelete = (id: string) => {
    deleteOperation.execute(id)
  }

  const openNew = () => {
    setSelectedExpense(null)
    dialog.openDialog()
  }

  const openEdit = (expense: Transaction) => {
    setSelectedExpense(expense)
    dialog.openDialog()
  }

  const getAccountName = (id?: string) => {
    if (!id) return 'N/A'
    return accountNames[id] || 'N/A'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar despesas..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openNew} variant="destructive">
          <Plus className="mr-2 h-4 w-4" /> Nova Despesa
        </Button>
      </div>

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
                    Carregando despesas...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {searchTerm
                    ? 'Nenhuma despesa encontrada com o termo buscado.'
                    : 'Nenhuma despesa cadastrada.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {formatDateBR(expense.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{expense.description}</span>
                      <TransactionAttachmentIndicator
                        transaction={expense}
                        visible={canManageAttachments}
                        showMissingReceiptWarning
                      />
                    </div>
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-normal text-muted-foreground"
                    >
                      {getAccountName(expense.accountId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-destructive">
                    {formatCurrencyBRL(expense.amount)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(expense)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(expense.id)}
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
            Carregando despesas...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            {searchTerm
              ? 'Nenhuma despesa encontrada com o termo buscado.'
              : 'Nenhuma despesa cadastrada.'}
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-medium">{expense.description}</h4>
                    <TransactionAttachmentIndicator
                      transaction={expense}
                      visible={canManageAttachments}
                      showMissingReceiptWarning
                    />
                    <span className="text-lg font-bold text-destructive">
                      {formatCurrencyBRL(expense.amount)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(expense)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateBR(expense.date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    {expense.category}
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <Wallet className="h-3 w-3" />
                    {getAccountName(expense.accountId)}
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
        transactionToEdit={selectedExpense}
        onSave={handleSave}
        defaultType="Despesa"
      />
    </div>
  )
}
