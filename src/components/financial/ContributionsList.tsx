import { useState } from 'react'
import { Contribution, mockBrothers } from '@/lib/data'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { ContributionDialog } from './ContributionDialog'
import { format } from 'date-fns'
import useFinancialStore from '@/stores/useFinancialStore'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'

export function ContributionsList() {
  const {
    contributions,
    addContribution,
    updateContribution,
    deleteContribution,
  } = useFinancialStore()
  const [searchTerm, setSearchTerm] = useState('')
  const dialog = useDialog()
  const [selectedContribution, setSelectedContribution] =
    useState<Contribution | null>(null)

  const getBrotherName = (id: string) =>
    mockBrothers.find((b) => b.id === id)?.name || 'Desconhecido'

  const filteredContributions = contributions.filter((c) => {
    const brotherName = getBrotherName(c.brotherId).toLowerCase()
    return brotherName.includes(searchTerm.toLowerCase())
  })

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedContribution) {
        updateContribution({ ...selectedContribution, ...data })
        return 'Contribuição atualizada com sucesso.'
      } else {
        const newContribution: Contribution = {
          id: crypto.randomUUID(),
          ...data,
        }
        addContribution(newContribution)
        return 'Contribuição registrada com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar a contribuição.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      deleteContribution(id)
      return 'Contribuição removida.'
    },
    {
      successMessage: 'Contribuição removida com sucesso!',
      errorMessage: 'Falha ao remover a contribuição.',
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
    setSelectedContribution(null)
    dialog.openDialog()
  }

  const openEdit = (contribution: Contribution) => {
    setSelectedContribution(contribution)
    dialog.openDialog()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por irmão..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Registrar Contribuição
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Irmão</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Pagto.</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContributions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Nenhuma contribuição encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredContributions.map((contribution) => (
                <TableRow key={contribution.id}>
                  <TableCell className="font-medium">
                    {getBrotherName(contribution.brotherId)}
                  </TableCell>
                  <TableCell>
                    {contribution.month}/{contribution.year}
                  </TableCell>
                  <TableCell className="font-mono">
                    R$ {contribution.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contribution.status === 'Pago'
                          ? 'default'
                          : contribution.status === 'Pendente'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className={
                        contribution.status === 'Pago'
                          ? 'bg-green-600 hover:bg-green-700'
                          : ''
                      }
                    >
                      {contribution.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contribution.paymentDate
                      ? format(new Date(contribution.paymentDate), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(contribution)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(contribution.id)}
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

      <ContributionDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        contributionToEdit={selectedContribution}
        onSave={handleSave}
      />
    </div>
  )
}
