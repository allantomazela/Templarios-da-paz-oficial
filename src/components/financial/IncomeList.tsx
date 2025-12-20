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
import { useToast } from '@/hooks/use-toast'
import { TransactionDialog } from './TransactionDialog'
import { format } from 'date-fns'
import useFinancialStore from '@/stores/useFinancialStore'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export function IncomeList() {
  const {
    transactions,
    accounts,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinancialStore()
  const incomes = transactions.filter((t) => t.type === 'Receita')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedIncome, setSelectedIncome] = useState<Transaction | null>(null)
  const { toast } = useToast()

  const filteredIncomes = incomes.filter(
    (income) =>
      income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      income.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSave = (data: any) => {
    if (selectedIncome) {
      updateTransaction({ ...selectedIncome, ...data })
      toast({ title: 'Sucesso', description: 'Receita atualizada.' })
    } else {
      addTransaction({
        id: crypto.randomUUID(),
        ...data,
      })
      toast({ title: 'Sucesso', description: 'Receita registrada.' })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteTransaction(id)
    toast({ title: 'Removido', description: 'Receita removida.' })
  }

  const openNew = () => {
    setSelectedIncome(null)
    setIsDialogOpen(true)
  }

  const openEdit = (income: Transaction) => {
    setSelectedIncome(income)
    setIsDialogOpen(true)
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
            placeholder="Buscar receitas..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openNew} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Nova Receita
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
            {filteredIncomes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Nenhuma receita encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredIncomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell>
                    {format(new Date(income.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {income.description}
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
                    R$ {income.amount.toFixed(2)}
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
        {filteredIncomes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            Nenhuma receita encontrada.
          </div>
        ) : (
          filteredIncomes.map((income) => (
            <Card key={income.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-medium">{income.description}</h4>
                    <span className="text-lg font-bold text-green-600">
                      R$ {income.amount.toFixed(2)}
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
                    {format(new Date(income.date), 'dd/MM/yyyy')}
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
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        transactionToEdit={selectedIncome}
        onSave={handleSave}
        defaultType="Receita"
      />
    </div>
  )
}
