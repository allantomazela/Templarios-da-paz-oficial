import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormHeader } from '@/components/ui/form-header'
import { useAgapeStore, AgapeMenuItem } from '@/stores/useAgapeStore'
import { useToast } from '@/hooks/use-toast'
import { UtensilsCrossed } from 'lucide-react'

const menuItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a zero'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  is_active: z.boolean().default(true),
})

type MenuItemFormValues = z.infer<typeof menuItemSchema>

interface MenuItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: AgapeMenuItem | null
}

const CATEGORIES = [
  'Bebida',
  'Comida',
  'Sobremesa',
  'Acompanhamento',
  'Outros',
]

export function MenuItemDialog({ open, onOpenChange, item }: MenuItemDialogProps) {
  const { createMenuItem, updateMenuItem, loading } = useAgapeStore()
  const { toast } = useToast()

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: 'Comida',
      is_active: true,
    },
  })

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.category,
        is_active: item.is_active,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        price: 0,
        category: 'Comida',
        is_active: true,
      })
    }
  }, [item, form])

  const onSubmit = async (data: MenuItemFormValues) => {
    if (item) {
      const { error } = await updateMenuItem(item.id, data)
      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o item.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: 'Item atualizado com sucesso.',
        })
        onOpenChange(false)
      }
    } else {
      const { error } = await createMenuItem(data)
      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível criar o item.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: 'Item criado com sucesso.',
        })
        form.reset()
        onOpenChange(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <FormHeader
          title={item ? 'Editar Item do Cardápio' : 'Novo Item do Cardápio'}
          description={
            item
              ? 'Atualize as informações do item do cardápio.'
              : 'Adicione um novo item ao cardápio de ágape.'
          }
          icon={<UtensilsCrossed className="h-5 w-5" />}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Refrigerante" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do item..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {item ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
