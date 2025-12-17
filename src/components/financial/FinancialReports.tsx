import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Pie, PieChart } from 'recharts'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useFinancialStore from '@/stores/useFinancialStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export function FinancialReports() {
  const { toast } = useToast()
  const { transactions } = useFinancialStore()
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportFields, setExportFields] = useState({
    id: true,
    date: true,
    description: true,
    category: true,
    amount: true,
    type: true,
    timestamp: false,
    statusHistory: false,
  })

  const handleExportClick = () => {
    setIsExportDialogOpen(true)
  }

  const confirmExport = () => {
    const selected = Object.keys(exportFields).filter(
      (k) => exportFields[k as keyof typeof exportFields],
    )
    console.log('Exporting with fields:', selected)
    toast({
      title: 'Relatório Gerado',
      description: `Relatório exportado com ${selected.length} campos selecionados.`,
    })
    setIsExportDialogOpen(false)
  }

  // Aggregate Data for Charts
  const incomeByCategory = transactions
    .filter((t) => t.type === 'Receita')
    .reduce(
      (acc, curr) => {
        const found = acc.find((i) => i.category === curr.category)
        if (found) found.amount += curr.amount
        else acc.push({ category: curr.category, amount: curr.amount })
        return acc
      },
      [] as { category: string; amount: number; fill?: string }[],
    )
    .map((i, index) => ({
      ...i,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }))

  const expenseByCategory = transactions
    .filter((t) => t.type === 'Despesa')
    .reduce(
      (acc, curr) => {
        const found = acc.find((i) => i.category === curr.category)
        if (found) found.amount += curr.amount
        else acc.push({ category: curr.category, amount: curr.amount })
        return acc
      },
      [] as { category: string; amount: number; fill?: string }[],
    )
    .map((i, index) => ({
      ...i,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }))

  const pieConfig = {
    amount: { label: 'Valor' },
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Relatórios Financeiros</h3>
        <Button onClick={handleExportClick} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Exportar Relatório Detalhado
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receitas por Categoria</CardTitle>
            <CardDescription>
              Distribuição das entradas no período atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={pieConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={incomeByCategory}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={60}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>
              Distribuição das saídas no período atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={pieConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={expenseByCategory}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={60}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opções de Exportação</DialogTitle>
            <DialogDescription>
              Selecione os campos detalhados para incluir no relatório.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-id"
                checked={exportFields.id}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, id: !!c })
                }
              />
              <Label htmlFor="field-id">ID da Transação</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-date"
                checked={exportFields.date}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, date: !!c })
                }
              />
              <Label htmlFor="field-date">Data</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-desc"
                checked={exportFields.description}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, description: !!c })
                }
              />
              <Label htmlFor="field-desc">Descrição</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-cat"
                checked={exportFields.category}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, category: !!c })
                }
              />
              <Label htmlFor="field-cat">Categoria</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-amt"
                checked={exportFields.amount}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, amount: !!c })
                }
              />
              <Label htmlFor="field-amt">Valor</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-ts"
                checked={exportFields.timestamp}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, timestamp: !!c })
                }
              />
              <Label htmlFor="field-ts">Timestamp (Criação)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-hist"
                checked={exportFields.statusHistory}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, statusHistory: !!c })
                }
              />
              <Label htmlFor="field-hist">Histórico de Status</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={confirmExport}>Exportar PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
