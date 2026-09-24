import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import { composeActiveMembershipAmount } from '@/lib/brother-membership-situation'
import type { MembershipFeeSettings } from '@/lib/contribution-payments'

const schema = z.object({
  baseAmount: z.coerce
    .number()
    .min(0.01, 'Valor inválido')
    .max(999999, 'Valor muito alto'),
  sessionPackageAmount: z.coerce
    .number()
    .min(0, 'Valor inválido')
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
    defaultValues: {
      baseAmount: settings.baseAmount,
      sessionPackageAmount: settings.sessionPackageAmount,
    },
  })

  const watchedBase = useWatch({ control: form.control, name: 'baseAmount' })
  const watchedPackage = useWatch({
    control: form.control,
    name: 'sessionPackageAmount',
  })
  const composedTotal = composeActiveMembershipAmount(
    Number(watchedBase) || 0,
    Number(watchedPackage) || 0,
  )

  useEffect(() => {
    const key = `${settings.baseAmount}|${settings.sessionPackageAmount}`
    if (prevRef.current !== key) {
      prevRef.current = key
      form.reset({
        baseAmount: settings.baseAmount,
        sessionPackageAmount: settings.sessionPackageAmount,
      })
    }
  }, [settings.baseAmount, settings.sessionPackageAmount, form])

  const saveOperation = useAsyncOperation(
    async (data: FormValues) => {
      const defaultAmount = composeActiveMembershipAmount(
        data.baseAmount,
        data.sessionPackageAmount,
      )
      await onSave({
        ...settings,
        baseAmount: data.baseAmount,
        sessionPackageAmount: data.sessionPackageAmount,
        defaultAmount,
      })
      setExpanded(false)
    },
    {
      successMessage: 'Valores de mensalidade atualizados.',
      errorMessage: 'Não foi possível salvar os valores.',
    },
  )

  if (compact) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Settings2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            Regular:{' '}
            <strong className="text-foreground">
              {formatCurrencyBRL(settings.defaultAmount)}
            </strong>
            {' · '}
            Afastado:{' '}
            <strong className="text-foreground">
              {formatCurrencyBRL(settings.baseAmount)}
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
              className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
              <FormField
                control={form.control}
                name="baseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Base (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sessionPackageAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Pacote sessão (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="sm" disabled={saveOperation.loading}>
                {saveOperation.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Salvar (${formatCurrencyBRL(composedTotal)})`
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
