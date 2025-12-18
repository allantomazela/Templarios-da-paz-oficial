import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useSiteSettingsStore, { Venerable } from '@/stores/useSiteSettingsStore'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { VenerableDialog } from './VenerableDialog'
import { useToast } from '@/hooks/use-toast'

export function VenerablesManager() {
  const { venerables, addVenerable, updateVenerable, deleteVenerable } =
    useSiteSettingsStore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVenerable, setSelectedVenerable] = useState<Venerable | null>(
    null,
  )

  const handleSave = (data: any) => {
    if (selectedVenerable) {
      updateVenerable({ ...selectedVenerable, ...data })
      toast({ title: 'Sucesso', description: 'Registro atualizado.' })
    } else {
      addVenerable({ id: crypto.randomUUID(), ...data })
      toast({
        title: 'Sucesso',
        description: 'Venerável adicionado à galeria.',
      })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteVenerable(id)
    toast({ title: 'Removido', description: 'Venerável removido da galeria.' })
  }

  const openNew = () => {
    setSelectedVenerable(null)
    setIsDialogOpen(true)
  }

  const openEdit = (venerable: Venerable) => {
    setSelectedVenerable(venerable)
    setIsDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Galeria de Veneráveis</CardTitle>
          <CardDescription>
            Gerencie a lista de ex-veneráveis exibida no site.
          </CardDescription>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venerables.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum registro na galeria.
                </TableCell>
              </TableRow>
            ) : (
              venerables.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          v.imageUrl ||
                          `https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${v.id}`
                        }
                        alt={v.name}
                      />
                      <AvatarFallback>{v.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{v.period}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(v)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(v.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <VenerableDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        venerableToEdit={selectedVenerable}
        onSave={handleSave}
      />
    </Card>
  )
}
