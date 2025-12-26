import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import useChancellorStore from '@/stores/useChancellorStore'
import { Solid, mockBrothers } from '@/lib/data'
import { SolidDialog } from './SolidDialog'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'

export function SolidsManager() {
  const { solids, addSolid, updateSolid, deleteSolid } = useChancellorStore()
  const [searchTerm, setSearchTerm] = useState('')
  const dialog = useDialog()
  const [selectedSolid, setSelectedSolid] = useState<Solid | null>(null)

  const filteredSolids = solids.filter((solid) =>
    solid.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedSolid) {
        updateSolid({ ...selectedSolid, ...data })
        return 'Sólido atualizado com sucesso.'
      } else {
        addSolid({ id: crypto.randomUUID(), ...data })
        return 'Sólido registrado com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar o sólido.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      deleteSolid(id)
      return 'Sólido removido.'
    },
    {
      successMessage: 'Sólido removido com sucesso!',
      errorMessage: 'Falha ao remover o sólido.',
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
    setSelectedSolid(null)
    dialog.openDialog()
  }

  const openEdit = (solid: Solid) => {
    setSelectedSolid(solid)
    dialog.openDialog()
  }

  const getBrotherName = (id?: string) => {
    if (!id) return 'Anônimo'
    const brother = mockBrothers.find((b) => b.id === id)
    return brother ? brother.name : 'Desconhecido'
  }

  // Calculate totals by category
  const totals = solids.reduce(
    (acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar sólidos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Registrar Sólido
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(totals).map(([cat, amount]) => (
          <div key={cat} className="border rounded-md p-3 bg-secondary/10">
            <span className="text-xs text-muted-foreground block">{cat}</span>
            <span className="text-lg font-bold text-primary">
              R$ {amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Irmão</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSolids.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredSolids.map((solid) => (
                <TableRow key={solid.id}>
                  <TableCell>
                    {format(new Date(solid.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {solid.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{solid.category}</Badge>
                  </TableCell>
                  <TableCell>{getBrotherName(solid.brotherId)}</TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    R$ {solid.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(solid)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(solid.id)}
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

      <SolidDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        solidToEdit={selectedSolid}
        onSave={handleSave}
      />
    </div>
  )
}
