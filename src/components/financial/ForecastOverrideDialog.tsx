import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { ForecastComparisonRow } from '@/lib/forecast-types'

const overrideSchema = z.object({
  expectedAmountOverride: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  notes: z.string().optional(),
})

type OverrideFormValues = z.infer<typeof overrideSchema>

interface ForecastOverrideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: ForecastComparisonRow | null
  onSave: (values: OverrideFormValues) => Promise<void>
}

export function ForecastOverrideDialog({
  open,
  onOpenChange,
  row,
  onSave,
}: ForecastOverrideDialogProps) {
  const form = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      expectedAmountOverride: 0,
      notes: '',
    },
  })

  useEffect(() => {
    if (row && open) {
      form.reset({
        expectedAmountOverride: row.expectedAmount,
        notes: '',
      })
    }
  }, [row, open, form])

  const handleSubmit = async (values: OverrideFormValues) => {
    await onSave(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar previsto do mês</DialogTitle>
        </DialogHeader>
        {row ? (
          <p className="text-sm text-muted-foreground">
            {row.description} — {row.month}/{row.year}
          </p>
        ) : null}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="expectedAmountOverride"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor previsto</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar ajuste</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
