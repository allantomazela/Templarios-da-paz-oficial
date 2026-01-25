import { useState, useEffect, useRef } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { Loader2, Save, CreditCard, QrCode } from 'lucide-react'
import { useAsyncOperation } from '@/hooks/use-async-operation'

const paymentSettingsSchema = z.object({
  pixKey: z.string().min(1, 'A chave PIX é obrigatória'),
  pixName: z.string().min(1, 'O nome do beneficiário é obrigatório'),
  paymentType: z.enum(['monthly', 'per_session'], {
    required_error: 'Selecione o tipo de pagamento',
  }),
})

type PaymentSettingsFormValues = z.infer<typeof paymentSettingsSchema>

export function AgapePaymentSettings() {
  const { agapePix, updateAgapePaymentSettings, fetchSettings } = useSiteSettingsStore()
  const { toast } = useToast()
  const prevValuesRef = useRef<string>('')

  const form = useForm<PaymentSettingsFormValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      pixKey: agapePix.pixKey || '',
      pixName: agapePix.pixName || '',
      paymentType: agapePix.paymentType || 'monthly',
    },
  })

  useEffect(() => {
    const currentValues = `${agapePix.pixKey}|${agapePix.pixName}|${agapePix.paymentType}`
    
    // Só resetar se os valores realmente mudaram
    if (prevValuesRef.current !== currentValues) {
      prevValuesRef.current = currentValues
      form.reset({
        pixKey: agapePix.pixKey || '',
        pixName: agapePix.pixName || '',
        paymentType: agapePix.paymentType || 'monthly',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agapePix.pixKey, agapePix.pixName, agapePix.paymentType])

  const { execute: handleSave, loading } = useAsyncOperation(
    async (data: PaymentSettingsFormValues) => {
      await updateAgapePaymentSettings({
        pixKey: data.pixKey,
        pixName: data.pixName,
        paymentType: data.paymentType,
      })
      toast({
        title: 'Configurações salvas',
        description: 'As configurações de pagamento do ágape foram atualizadas com sucesso.',
      })
    },
    {
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as configurações.',
        })
      },
    },
  )

  const onSubmit = (data: PaymentSettingsFormValues) => {
    handleSave(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Configurações de Pagamento - Ágape
        </CardTitle>
        <CardDescription>
          Configure a chave PIX e o tipo de pagamento para os relatórios de ágape.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="pixKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave PIX</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Digite a chave PIX que será usada para pagamento do ágape.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pixName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Beneficiário</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome que aparecerá no QR Code"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nome que aparecerá no QR Code PIX para identificação.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Pagamento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de pagamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">
                        Mensal (Soma de todos os ágapes do mês)
                      </SelectItem>
                      <SelectItem value="per_session">
                        Por Ágape (Valor de cada sessão separadamente)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define como o pagamento será calculado nos relatórios.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    Salvar Configurações
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
