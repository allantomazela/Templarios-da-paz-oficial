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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import useChancellorStore from '@/stores/useChancellorStore'
import { format } from 'date-fns'
import { Pencil, Search } from 'lucide-react'
import { Brother } from '@/lib/data'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'

export function DegreeManager() {
  const { brothers, updateBrotherDegree } = useChancellorStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingBrother, setEditingBrother] = useState<Brother | null>(null)
  const dialog = useDialog()

  // Form State
  const [formData, setFormData] = useState({
    degree: '',
    initiationDate: '',
    elevationDate: '',
    exaltationDate: '',
  })

  const filteredBrothers = brothers.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (brother: Brother) => {
    setEditingBrother(brother)
    setFormData({
      degree: brother.degree,
      initiationDate: brother.initiationDate || '',
      elevationDate: brother.elevationDate || '',
      exaltationDate: brother.exaltationDate || '',
    })
    dialog.openDialog()
  }

  const saveOperation = useAsyncOperation(
    async () => {
      if (editingBrother) {
        updateBrotherDegree(editingBrother.id, {
          degree: formData.degree as any,
          initiationDate: formData.initiationDate,
          elevationDate: formData.elevationDate,
          exaltationDate: formData.exaltationDate,
        })
        return `Registro do Ir. ${editingBrother.name} atualizado com sucesso.`
      }
      return null
    },
    {
      successMessage: 'Dados atualizados com sucesso!',
      errorMessage: 'Falha ao atualizar os dados.',
    },
  )

  const handleSave = async () => {
    const result = await saveOperation.execute()
    if (result) {
      dialog.closeDialog()
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy')
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar irmão..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Irmão</TableHead>
              <TableHead>Grau Atual</TableHead>
              <TableHead>Iniciação</TableHead>
              <TableHead>Elevação</TableHead>
              <TableHead>Exaltação</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrothers.map((brother) => (
              <TableRow key={brother.id}>
                <TableCell className="font-medium">{brother.name}</TableCell>
                <TableCell>{brother.degree}</TableCell>
                <TableCell>{formatDate(brother.initiationDate)}</TableCell>
                <TableCell>{formatDate(brother.elevationDate)}</TableCell>
                <TableCell>{formatDate(brother.exaltationDate)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(brother)}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog.open} onOpenChange={dialog.onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Grau e Datas</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Grau</Label>
              <Select
                value={formData.degree}
                onValueChange={(val) =>
                  setFormData({ ...formData, degree: val })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                  <SelectItem value="Companheiro">Companheiro</SelectItem>
                  <SelectItem value="Mestre">Mestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Iniciação</Label>
              <Input
                type="date"
                className="col-span-3"
                value={formData.initiationDate}
                onChange={(e) =>
                  setFormData({ ...formData, initiationDate: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Elevação</Label>
              <Input
                type="date"
                className="col-span-3"
                value={formData.elevationDate}
                onChange={(e) =>
                  setFormData({ ...formData, elevationDate: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Exaltação</Label>
              <Input
                type="date"
                className="col-span-3"
                value={formData.exaltationDate}
                onChange={(e) =>
                  setFormData({ ...formData, exaltationDate: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dialog.closeDialog()}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
