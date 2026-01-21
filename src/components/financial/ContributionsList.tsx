import { useState, useEffect } from 'react'
import { Contribution, Brother } from '@/lib/data'
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
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react'
import { ContributionDialog } from './ContributionDialog'
import { format } from 'date-fns'
import useFinancialStore from '@/stores/useFinancialStore'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { supabase } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'

export function ContributionsList() {
  const {
    contributions,
    loading,
    fetchContributions,
    addContribution,
    updateContribution,
    deleteContribution,
  } = useFinancialStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [brothers, setBrothers] = useState<Brother[]>([])
  const [loadingBrothers, setLoadingBrothers] = useState(false)
  const dialog = useDialog()
  const [selectedContribution, setSelectedContribution] =
    useState<Contribution | null>(null)

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchContributions()
    loadBrothers()
  }, [fetchContributions])

  const loadBrothers = async () => {
    setLoadingBrothers(true)
    try {
      const supabaseAny = supabase as any
      const { data, error } = await supabaseAny
        .from('brothers')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error

      if (data) {
        setBrothers(data.map((row: any) => ({ id: row.id, name: row.name } as Brother)))
      }
    } catch (error) {
      logError('Error loading brothers:', error)
    } finally {
      setLoadingBrothers(false)
    }
  }

  const getBrotherName = (id: string) =>
    brothers.find((b) => b.id === id)?.name || 'Desconhecido'

  const filteredContributions = contributions.filter((c) => {
    const brotherName = getBrotherName(c.brotherId).toLowerCase()
    return brotherName.includes(searchTerm.toLowerCase())
  })

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedContribution) {
        await updateContribution({ ...selectedContribution, ...data })
        return 'Contribuição atualizada com sucesso.'
      } else {
        const newContribution: Contribution = {
          id: crypto.randomUUID(),
          ...data,
        }
        await addContribution(newContribution)
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
      await deleteContribution(id)
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

  if ((loading || loadingBrothers) && contributions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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
        <Button onClick={openNew} disabled={loading}>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredContributions.length === 0 ? (
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
