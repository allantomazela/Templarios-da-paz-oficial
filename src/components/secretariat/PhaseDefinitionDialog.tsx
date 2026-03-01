import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { SindicanciaPhaseDefinition } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea'
import { FormHeader } from '@/components/ui/form-header'

const phaseSchema = z.object({
  name: z.string().min(2, 'Nome da fase é obrigatório'),
  description: z.string().optional(),
  order: z.coerce.number().int().min(1, 'Ordem deve ser pelo menos 1'),
})

type PhaseFormValues = z.infer<typeof phaseSchema>

interface PhaseDefinitionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phaseToEdit: SindicanciaPhaseDefinition | null
  maxOrder: number
  onSave: (data: PhaseFormValues) => void
  isSaving?: boolean
}

export function PhaseDefinitionDialog({
  open,
  onOpenChange,
  phaseToEdit,
  maxOrder,
  onSave,
  isSaving = false,
}: PhaseDefinitionDialogProps) {
  const form = useForm<PhaseFormValues>({
    resolver: zodResolver(phaseSchema),
    defaultValues: { name: '', description: '', order: 1 },
  })

  useEffect(() => {
    if (phaseToEdit) {
      form.reset({
        name: phaseToEdit.name,
        description: phaseToEdit.description ?? '',
        order: phaseToEdit.order,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        order: maxOrder + 1,
      })
    }
  }, [phaseToEdit, maxOrder, form, open])

  const handleSubmit = form.handleSubmit((data) => {
    onSave({
      name: data.name,
      description: data.description || undefined,
      order: data.order,
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <FormHeader
          title={phaseToEdit ? 'Editar fase' : 'Nova fase da sindicância'}
          description={
            phaseToEdit
              ? 'Altere o nome, a descrição ou a ordem desta fase.'
              : 'Adicione uma fase ao processo (ex.: Leitura em loja, Escrutínio).'
          }
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Form {...form}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da fase</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex.: Leitura em loja, Escrutínio"
                      {...field}
                      disabled={isSaving}
                    />
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
                      placeholder="Breve descrição do que ocorre nesta fase"
                      rows={2}
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} disabled={isSaving} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : phaseToEdit ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
