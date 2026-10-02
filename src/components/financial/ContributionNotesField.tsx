import type { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  CONTRIBUTION_PAYMENT_METHODS,
  getPaymentMethodFromNotes,
  setPaymentMethodInNotes,
} from '@/lib/contribution-payment-methods'
import type { ContributionFormValues } from '@/lib/contribution-form-schema'
import { cn } from '@/lib/utils'

interface ContributionNotesFieldProps {
  form: UseFormReturn<ContributionFormValues>
}

/** Observações + atalhos de forma de pagamento (gravada no texto das observações). */
export function ContributionNotesField({ form }: ContributionNotesFieldProps) {
  const selectedPaymentMethod = getPaymentMethodFromNotes(form.watch('notes'))

  const handlePaymentMethodSelect = (
    method: (typeof CONTRIBUTION_PAYMENT_METHODS)[number],
  ) => {
    form.setValue('notes', setPaymentMethodInNotes(form.getValues('notes'), method), {
      shouldDirty: true,
    })
  }

  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Observações (opcional)</FormLabel>
          <FormControl>
            <Textarea
              rows={2}
              placeholder="Complementos: comprovante, acordo, observações..."
              {...field}
            />
          </FormControl>
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-muted-foreground">Forma de pagamento</p>
            <div className="flex flex-wrap gap-2">
              {CONTRIBUTION_PAYMENT_METHODS.map((method) => (
                <Button
                  key={method}
                  type="button"
                  size="sm"
                  variant={selectedPaymentMethod === method ? 'default' : 'outline'}
                  className={cn(
                    'h-8 text-xs',
                    selectedPaymentMethod === method && 'ring-2 ring-primary ring-offset-1',
                  )}
                  onClick={() => handlePaymentMethodSelect(method)}
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
