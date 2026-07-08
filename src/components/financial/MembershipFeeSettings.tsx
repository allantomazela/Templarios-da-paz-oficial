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
    },
  })

  useEffect(() => {
    const key = `${membershipFee.defaultAmount}`
    if (prevRef.current !== key) {
      prevRef.current = key
      form.reset({
        defaultAmount: membershipFee.defaultAmount,
      })
    }
  }, [membershipFee.defaultAmount, form])

  const { execute: handleSave, loading } = useAsyncOperation(
    async (data: FormValues) => {
      await updateMembershipFeeSettings({
        defaultAmount: data.defaultAmount,
      })
      toast({
        title: 'Configurações salvas',
        description: 'Valor padrão das mensalidades foi atualizado.',
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
          Valor padrão usado em novos lançamentos e na geração em lote. A
          mensalidade pode ser paga em qualquer dia do mês de referência; só
          passa a constar em atraso após o fechamento do mês.
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
