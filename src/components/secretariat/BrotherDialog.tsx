import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Brother } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import { Loader2 } from 'lucide-react'

const brotherSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  cpf: z.string().min(11, 'CPF inválido'),
  dob: z.string().min(1, 'Data de nascimento é obrigatória'),
  initiationDate: z.string().min(1, 'Data de iniciação é obrigatória'),
  address: z.string().optional(),
  degree: z.enum(['Aprendiz', 'Companheiro', 'Mestre']),
})

type BrotherFormValues = z.infer<typeof brotherSchema>

interface BrotherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brotherToEdit: Brother | null
  onSave: (data: BrotherFormValues) => void
}

export function BrotherDialog({
  open,
  onOpenChange,
  brotherToEdit,
  onSave,
}: BrotherDialogProps) {
  const form = useForm<BrotherFormValues>({
    resolver: zodResolver(brotherSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      dob: '',
      initiationDate: '',
      address: '',
      degree: 'Aprendiz',
    },
  })

  useEffect(() => {
    if (brotherToEdit) {
      form.reset({
        name: brotherToEdit.name,
        email: brotherToEdit.email,
        phone: brotherToEdit.phone,
        cpf: brotherToEdit.cpf || '',
        dob: brotherToEdit.dob || '',
        initiationDate: brotherToEdit.initiationDate,
        address: brotherToEdit.address || '',
        degree: brotherToEdit.degree,
      })
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        dob: '',
        initiationDate: '',
        address: '',
        degree: 'Aprendiz',
      })
    }
  }, [brotherToEdit, form, open])

  const handleSubmit = (data: BrotherFormValues) => {
    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {brotherToEdit ? 'Editar Irmão' : 'Adicionar Novo Irmão'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do irmão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initiationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Iniciação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grau</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grau" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                        <SelectItem value="Companheiro">Companheiro</SelectItem>
                        <SelectItem value="Mestre">Mestre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
