import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2, Settings2 } from 'lucide-react'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { formatCurrencyBRL } from '@/lib/member-payments'
import type { MembershipFeeSettings } from '@/lib/contribution-payments'

const schema = z.object({
  defaultAmount: z.coerce
    .number()
    .min(0.01, 'Valor inválido')
    .max(999999, 'Valor muito alto'),
})

type FormValues = z.infer<typeof schema>

interface MembershipFeeQuickSettingsProps {
  settings: MembershipFeeSettings
  onSave: (settings: MembershipFeeSettings) => Promise<void>
  compact?: boolean
}

export function MembershipFeeQuickSettings({
  settings,
  onSave,
  compact = false,
}: MembershipFeeQuickSettingsProps) {
  const [expanded, setExpanded] = useState(false)
  const prevRef = useRef('')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { defaultAmount: settings.defaultAmount },
  })

  useEffect(() => {
    const key = String(settings.defaultAmount)
    if (prevRef.current !== key) {
      prevRef.current = key
      form.reset({ defaultAmount: settings.defaultAmount })
    }
  }, [settings.defaultAmount, form])

  const saveOperation = useAsyncOperation(
    async (data: FormValues) => {
      await onSave({ ...settings, defaultAmount: data.defaultAmount })
      setExpanded(false)
    },
    {
      successMessage: 'Valor padrão atualizado.',
      errorMessage: 'Não foi possível salvar o valor padrão.',
    },
  )

  if (compact) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Settings2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            Valor padrão:{' '}
            <strong className="text-foreground">
              {formatCurrencyBRL(settings.defaultAmount)}
            </strong>
          </span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-primary"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Fechar' : 'Ajustar'}
          </Button>
        </div>
        {expanded && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => saveOperation.execute(data))}
              className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <FormField
                control={form.control}
                name="defaultAmount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">Novo valor padrão (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="sm" disabled={saveOperation.loading}>
                {saveOperation.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    )
  }

  return null
}
