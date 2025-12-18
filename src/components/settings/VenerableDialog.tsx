import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Venerable } from '@/stores/useSiteSettingsStore'
import { Loader2 } from 'lucide-react'

const venerableSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  period: z.string().min(1, 'Período é obrigatório'),
  imageUrl: z.string().optional(),
})

type VenerableFormValues = z.infer<typeof venerableSchema>

interface VenerableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venerableToEdit: Venerable | null
  onSave: (data: VenerableFormValues) => Promise<void>
}

export function VenerableDialog({
  open,
  onOpenChange,
  venerableToEdit,
  onSave,
}: VenerableDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<VenerableFormValues>({
    resolver: zodResolver(venerableSchema),
    defaultValues: {
      name: '',
      period: '',
      imageUrl: '',
    },
  })

  useEffect(() => {
    if (venerableToEdit) {
      form.reset({
        name: venerableToEdit.name,
        period: venerableToEdit.period,
        imageUrl: venerableToEdit.imageUrl || '',
      })
    } else {
      form.reset({
        name: '',
        period: '',
        imageUrl: '',
      })
    }
  }, [venerableToEdit, form, open])

  const handleSubmit = async (data: VenerableFormValues) => {
    setIsSubmitting(true)
    await onSave(data)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {venerableToEdit ? 'Editar Venerável' : 'Adicionar Venerável'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do Venerável" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período de Mandato</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 2022 - 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Foto (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
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
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
