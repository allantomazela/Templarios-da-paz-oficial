import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
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

const schema = z.object({
  defaultAmount: z.coerce
    .number()
    .min(0.01, 'Informe um valor maior que zero')
    .max(999999, 'Valor muito alto'),
  dueDay: z.coerce
    .number()
    .int()
    .min(1, 'Mínimo dia 1')
    .max(28, 'Máximo dia 28'),
})

type FormValues = z.infer<typeof schema>

export function MembershipFeeSettings() {
  const { membershipFee, updateMembershipFeeSettings } = useSiteSettingsStore()
  const { toast } = useToast()
  const prevRef = useRef('')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      defaultAmount: membershipFee.defaultAmount,
      dueDay: membershipFee.dueDay,
    },
  })

  useEffect(() => {
    const key = `${membershipFee.defaultAmount}|${membershipFee.dueDay}`
    if (prevRef.current !== key) {
      prevRef.current = key
      form.reset({
        defaultAmount: membershipFee.defaultAmount,
        dueDay: membershipFee.dueDay,
      })
    }
  }, [membershipFee.defaultAmount, membershipFee.dueDay, form])

  const { execute: handleSave, loading } = useAsyncOperation(
    async (data: FormValues) => {
      await updateMembershipFeeSettings({
        defaultAmount: data.defaultAmount,
        dueDay: data.dueDay,
      })
      toast({
        title: 'Configurações salvas',
        description:
          'Valor padrão e vencimento das mensalidades foram atualizados.',
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
          Valor padrão usado em novos lançamentos e na geração em lote. O dia de
          vencimento define quando uma mensalidade pendente passa a ser
          considerada em atraso.
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
                name="defaultAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor padrão (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Aplicado ao registrar ou gerar mensalidades do mês.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de vencimento</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={28} {...field} />
                    </FormControl>
                    <FormDescription>
                      Dia do mês (1 a 28) para controle de atraso.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
