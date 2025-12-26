import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { BankAccount } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const accountSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  type: z.enum(['Corrente', 'Poupança', 'Caixa', 'Investimento']),
  initialBalance: z.coerce
    .number()
    .min(0, 'Saldo inicial não pode ser negativo'),
})

type AccountFormValues = z.infer<typeof accountSchema>

interface BankAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountToEdit: BankAccount | null
  onSave: (data: AccountFormValues) => void
}

export function BankAccountDialog({
  open,
  onOpenChange,
  accountToEdit,
  onSave,
}: BankAccountDialogProps) {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'Corrente',
      initialBalance: 0,
    },
  })

  useEffect(() => {
    if (accountToEdit) {
      form.reset({
        name: accountToEdit.name,
        type: accountToEdit.type,
        initialBalance: accountToEdit.initialBalance,
      })
    } else {
      form.reset({
        name: '',
        type: 'Corrente',
        initialBalance: 0,
      })
    }
  }, [accountToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {accountToEdit ? 'Editar Conta' : 'Nova Conta Bancária'}
          </DialogTitle>
          <DialogDescription>
            {accountToEdit
              ? 'Atualize as informações da conta bancária.'
              : 'Adicione uma nova conta bancária ou caixa físico ao sistema.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Conta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Banco do Brasil" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Conta</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Corrente">Conta Corrente</SelectItem>
                      <SelectItem value="Poupança">Conta Poupança</SelectItem>
                      <SelectItem value="Caixa">Caixa Físico</SelectItem>
                      <SelectItem value="Investimento">Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
