import { useState } from 'react'
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
} from 'lucide-react'
import { TransactionDialog } from './TransactionDialog'
import { format } from 'date-fns'
import useFinancialStore from '@/stores/useFinancialStore'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'

export function ExpenseList() {
  const {
    transactions,
    accounts,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinancialStore()
  const expenses = transactions.filter((t) => t.type === 'Despesa')
  const [searchTerm, setSearchTerm] = useState('')
  const dialog = useDialog()
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(
    null,
  )

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedExpense) {
        updateTransaction({ ...selectedExpense, ...data })
        return 'Despesa atualizada com sucesso.'
      } else {
        addTransaction({
          id: crypto.randomUUID(),
          ...data,
        })
        return 'Despesa registrada com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar a despesa.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      deleteTransaction(id)
      return 'Despesa removida.'
    },
    {
      successMessage: 'Despesa removida com sucesso!',
      errorMessage: 'Falha ao remover a despesa.',
    },
  )

  const handleSave = async (data: any) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
    }
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
    const acc = accounts.find((a) => a.id === id)
    return acc ? acc.name : 'N/A'
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
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Nenhuma despesa encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {format(new Date(expense.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {expense.description}
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
                    R$ {expense.amount.toFixed(2)}
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
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            Nenhuma despesa encontrada.
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-medium">{expense.description}</h4>
                    <span className="text-lg font-bold text-destructive">
                      R$ {expense.amount.toFixed(2)}
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
                    {format(new Date(expense.date), 'dd/MM/yyyy')}
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
