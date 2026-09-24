import { useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { Loader2, Save, Wallet } from 'lucide-react'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { composeActiveMembershipAmount } from '@/lib/brother-membership-situation'

const schema = z.object({
  baseAmount: z.coerce
    .number()
    .min(0.01, 'Informe um valor maior que zero')
    .max(999999, 'Valor muito alto'),
  sessionPackageAmount: z.coerce
    .number()
    .min(0, 'Informe zero ou mais')
    .max(999999, 'Valor muito alto'),
})

type FormValues = z.infer<typeof schema>

export function MembershipFeeSettings() {
  const { membershipFee, updateMembershipFeeSettings } = useSiteSettingsStore()
  const { toast } = useToast()
  const prevRef = useRef('')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      baseAmount: membershipFee.baseAmount,
      sessionPackageAmount: membershipFee.sessionPackageAmount,
    },
  })

  const baseAmount = useWatch({ control: form.control, name: 'baseAmount' })
  const sessionPackageAmount = useWatch({
    control: form.control,
    name: 'sessionPackageAmount',
  })
  const composedTotal = composeActiveMembershipAmount(
    Number(baseAmount) || 0,
    Number(sessionPackageAmount) || 0,
  )

  useEffect(() => {
    const key = `${membershipFee.baseAmount}|${membershipFee.sessionPackageAmount}`
    if (prevRef.current !== key) {
      prevRef.current = key
      form.reset({
        baseAmount: membershipFee.baseAmount,
        sessionPackageAmount: membershipFee.sessionPackageAmount,
      })
    }
  }, [membershipFee.baseAmount, membershipFee.sessionPackageAmount, form])

  const { execute: handleSave, loading } = useAsyncOperation(
    async (data: FormValues) => {
      const defaultAmount = composeActiveMembershipAmount(
        data.baseAmount,
        data.sessionPackageAmount,
      )
      await updateMembershipFeeSettings({
        baseAmount: data.baseAmount,
        sessionPackageAmount: data.sessionPackageAmount,
        defaultAmount,
      })
      toast({
        title: 'Configurações salvas',
        description:
          'Valores de mensalidade (base + pacote de sessão) atualizados.',
      })
    },
    {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as configurações de mensalidade.',
        })
      },
    },
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Mensalidades da Loja
        </CardTitle>
        <CardDescription>
          Regular paga base + pacote de sessão ({formatCurrencyBRL(composedTotal)}).
          Afastado (saúde) paga só a base. Desligado não gera cobrança.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => handleSave(data))}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="baseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensalidade base (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Valor cobrado também de irmãos afastados por saúde.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sessionPackageAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pacote de sessão (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Jantares + tronco embutidos (ex.: 80 + 10 = 90).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Total do irmão regular:{' '}
              <strong className="text-foreground">
                {formatCurrencyBRL(composedTotal)}
              </strong>
            </p>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
