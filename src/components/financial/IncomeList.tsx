import { useState } from 'react'
import { Transaction, mockTransactions } from '@/lib/data'
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
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TransactionDialog } from './TransactionDialog'
import { format } from 'date-fns'

export function IncomeList() {
  const [incomes, setIncomes] = useState<Transaction[]>(
    mockTransactions.filter((t) => t.type === 'Receita'),
  )
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
      setIncomes(
        incomes.map((i) =>
          i.id === selectedIncome.id ? { ...i, ...data } : i,
        ),
      )
      toast({ title: 'Sucesso', description: 'Receita atualizada.' })
    } else {
      const newIncome: Transaction = {
        id: String(Math.random()),
        ...data,
      }
      setIncomes([...incomes, newIncome])
      toast({ title: 'Sucesso', description: 'Receita registrada.' })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setIncomes(incomes.filter((i) => i.id !== id))
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

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIncomes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
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
