import { useState, useEffect } from 'react'
import { Contribution } from '@/lib/data'
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
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { supabase } from '@/lib/supabase/client'

interface ContributionFromDB {
  id: string
  brother_id: string
  month: number
  year: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
  payment_date: string | null
  profiles?: {
    id: string
    full_name: string | null
  }
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function ContributionsList() {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [brotherNames, setBrotherNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const dialog = useDialog()
  const [selectedContribution, setSelectedContribution] =
    useState<Contribution | null>(null)
  const supabaseAny = supabase as any

  const loadContributions = useAsyncOperation(
    async () => {
      setLoading(true)
      const { data, error } = await supabaseAny
        .from('contributions')
        .select(`
          *,
          profiles!contributions_brother_id_fkey (
            id,
            full_name
          )
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (error) {
        throw new Error('Falha ao carregar contribuições.')
      }

      const mapped: Contribution[] = (data || []).map((c: ContributionFromDB) => ({
        id: c.id,
        brotherId: c.brother_id,
        month: MONTHS[c.month - 1] || `${c.month}`,
        year: c.year,
        amount: parseFloat(c.amount.toString()),
        status: c.status,
        paymentDate: c.payment_date || undefined,
      }))

      // Criar mapa de nomes dos irmãos
      const namesMap: Record<string, string> = {}
      ;(data || []).forEach((c: ContributionFromDB) => {
        if (c.profiles?.full_name) {
          namesMap[c.brother_id] = c.profiles.full_name
        }
      })
      setBrotherNames(namesMap)

      setContributions(mapped)
      setLoading(false)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar contribuições.',
    },
  )

  useEffect(() => {
    loadContributions.execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredContributions = contributions.filter((c) => {
    const searchLower = searchTerm.toLowerCase()
    const brotherName = (brotherNames[c.brotherId] || '').toLowerCase()
    return (
      brotherName.includes(searchLower) ||
      c.month.toLowerCase().includes(searchLower) ||
      c.year.toString().includes(searchLower) ||
      c.status.toLowerCase().includes(searchLower)
    )
  })

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      const monthNumber = MONTHS.indexOf(data.month) + 1

      if (selectedContribution) {
        // Atualizar
        const { error } = await supabaseAny
          .from('contributions')
          .update({
            month: monthNumber,
            year: data.year,
            amount: data.amount,
            status: data.status,
            payment_date: data.paymentDate || null,
          })
          .eq('id', selectedContribution.id)

        if (error) throw error

        await loadContributions.execute()
        return 'Contribuição atualizada com sucesso.'
      } else {
        // Criar
        const { error } = await supabaseAny.from('contributions').insert({
          brother_id: data.brotherId,
          month: monthNumber,
          year: data.year,
          amount: data.amount,
          status: data.status,
          payment_date: data.paymentDate || null,
        })

        if (error) throw error

        await loadContributions.execute()
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
      const { error } = await supabaseAny
        .from('contributions')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadContributions.execute()
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

  if (loading && contributions.length === 0) {
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
            placeholder="Buscar por irmão, mês, ano ou status..."
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
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
                      {brotherNames[contribution.brotherId] || 'Desconhecido'}
                    </TableCell>
                    <TableCell>
                      {contribution.month}/{contribution.year}
                    </TableCell>
                    <TableCell className="font-mono">
                      R$ {contribution.amount.toFixed(2).replace('.', ',')}
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
        )}
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
