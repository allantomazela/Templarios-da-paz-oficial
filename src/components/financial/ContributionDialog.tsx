import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Contribution } from '@/lib/data'
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
import { supabase } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string | null
}

const contributionSchema = z.object({
  brotherId: z.string().min(1, 'Irmão é obrigatório'),
  month: z.string().min(1, 'Mês é obrigatório'),
  year: z.coerce.number().min(2000, 'Ano inválido'),
  amount: z.coerce.number().min(0.01, 'Valor inválido'),
  status: z.enum(['Pago', 'Pendente', 'Atrasado']),
  paymentDate: z.string().optional(),
})

type ContributionFormValues = z.infer<typeof contributionSchema>

interface ContributionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contributionToEdit: Contribution | null
  onSave: (data: ContributionFormValues) => void
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function ContributionDialog({
  open,
  onOpenChange,
  contributionToEdit,
  onSave,
}: ContributionDialogProps) {
  const [brothers, setBrothers] = useState<Profile[]>([])
  const [loadingBrothers, setLoadingBrothers] = useState(true)
  const supabaseAny = supabase as any

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      brotherId: '',
      month: MONTHS[new Date().getMonth()],
      year: new Date().getFullYear(),
      amount: 150.0,
      status: 'Pendente',
      paymentDate: '',
    },
  })

  useEffect(() => {
    if (open) {
      const loadBrothers = async () => {
        setLoadingBrothers(true)
        try {
          const { data, error } = await supabaseAny
            .from('profiles')
            .select('id, full_name')
            .eq('status', 'approved')
            .order('full_name', { ascending: true })

          if (error) throw error

          setBrothers(data || [])
        } catch (error) {
          console.error('Erro ao carregar irmãos:', error)
        } finally {
          setLoadingBrothers(false)
        }
      }

      loadBrothers()
    }
  }, [open, supabaseAny])

  useEffect(() => {
    if (contributionToEdit) {
      form.reset({
        brotherId: contributionToEdit.brotherId,
        month: contributionToEdit.month,
        year: contributionToEdit.year,
        amount: contributionToEdit.amount,
        status: contributionToEdit.status,
        paymentDate: contributionToEdit.paymentDate || '',
      })
    } else {
      form.reset({
        brotherId: '',
        month: MONTHS[new Date().getMonth()],
        year: new Date().getFullYear(),
        amount: 150.0,
        status: 'Pendente',
        paymentDate: '',
      })
    }
  }, [contributionToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {contributionToEdit ? 'Editar' : 'Nova'} Contribuição
          </DialogTitle>
          <DialogDescription>
            {contributionToEdit
              ? 'Atualize as informações da contribuição.'
              : 'Registre uma nova contribuição de um irmão.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="brotherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Irmão</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!contributionToEdit || loadingBrothers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingBrothers 
                            ? 'Carregando irmãos...' 
                            : 'Selecione o irmão'
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brothers.map((brother) => (
                        <SelectItem key={brother.id} value={brother.id}>
                          {brother.full_name || 'Sem nome'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pago">Pago</SelectItem>
                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.watch('status') === 'Pago' && (
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Pagamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
