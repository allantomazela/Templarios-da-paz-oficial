import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Solid, mockBrothers } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'

const solidSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  category: z.enum(['Hospitalaria', 'Manutenção', 'Eventos', 'Outros']),
  description: z.string().min(3, 'Descrição é obrigatória'),
  brotherId: z.string().optional(),
})

type SolidFormValues = z.infer<typeof solidSchema>

interface SolidDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  solidToEdit: Solid | null
  onSave: (data: SolidFormValues) => void
}

export function SolidDialog({
  open,
  onOpenChange,
  solidToEdit,
  onSave,
}: SolidDialogProps) {
  const form = useForm<SolidFormValues>({
    resolver: zodResolver(solidSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      category: 'Hospitalaria',
      description: '',
      brotherId: 'none',
    },
  })

  useEffect(() => {
    if (solidToEdit) {
      form.reset({
        date: solidToEdit.date,
        amount: solidToEdit.amount,
        category: solidToEdit.category,
        description: solidToEdit.description,
        brotherId: solidToEdit.brotherId || 'none',
      })
    } else {
      form.reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: 0,
        category: 'Hospitalaria',
        description: '',
        brotherId: 'none',
      })
    }
  }, [solidToEdit, form, open])

  const handleSubmit = (data: SolidFormValues) => {
    const formattedData = {
      ...data,
      brotherId: data.brotherId === 'none' ? undefined : data.brotherId,
    }
    onSave(formattedData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {solidToEdit ? 'Editar Sólido' : 'Registrar Sólido'}
          </DialogTitle>
          <DialogDescription>
            {solidToEdit
              ? 'Atualize as informações do sólido de beneficência.'
              : 'Registre um novo sólido de beneficência para a loja.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Hospitalaria">Hospitalaria</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                      <SelectItem value="Eventos">Eventos</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brotherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Irmão (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o irmão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Anônimo / Nenhum</SelectItem>
                      {mockBrothers.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Doação extra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
