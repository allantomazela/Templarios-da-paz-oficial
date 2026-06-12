import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { FormHeader } from '@/components/ui/form-header'
import { Pencil, Loader2 } from 'lucide-react'
import { useAgapeStore, type AgapeConsumption } from '@/stores/useAgapeStore'
import { useToast } from '@/hooks/use-toast'
import { getSaveErrorMessage } from '@/lib/auth-utils'

const schema = z.object({
  quantity: z.coerce.number().int().min(1, 'Informe pelo menos 1 unidade'),
})

type FormValues = z.infer<typeof schema>

interface ConsumptionEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  consumption: AgapeConsumption | null
  onSaved?: () => void
}

export function ConsumptionEditDialog({
  open,
  onOpenChange,
  consumption,
  onSaved,
}: ConsumptionEditDialogProps) {
  const { updateConsumption, loading } = useAgapeStore()
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  })

  useEffect(() => {
    if (consumption) {
      form.reset({ quantity: consumption.quantity })
    }
  }, [consumption, form])

  const onSubmit = async (data: FormValues) => {
    if (!consumption) return

    const unitPrice = Number(consumption.unit_price)
    const { error } = await updateConsumption(consumption.id, {
      quantity: data.quantity,
      total_amount: unitPrice * data.quantity,
    })

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar',
        description: getSaveErrorMessage(error),
      })
      return
    }

    toast({ title: 'Consumo atualizado' })
    onSaved?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="sr-only">Editar consumo</DialogTitle>
        <FormHeader
          title="Editar consumo"
          description={
            consumption
              ? `${consumption.brother?.full_name || 'Irmão'} — ${consumption.menu_item?.name || 'Item'}`
              : 'Ajuste a quantidade do lançamento.'
          }
          icon={<Pencil className="h-5 w-5" />}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step={1} {...field} />
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
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
