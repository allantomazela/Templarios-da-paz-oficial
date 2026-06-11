import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { InitiationCandidate, InitiationCandidateStatus } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea'
import { FormHeader } from '@/components/ui/form-header'
import { Loader2 } from 'lucide-react'
import type { CandidateSaveInput } from '@/lib/candidates-api'

const candidateSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  indicatedBy: z.string().min(2, 'Indicado por é obrigatório'),
  indicationDate: z.string().min(1, 'Data da indicação é obrigatória'),
  status: z.enum(['indicado', 'em_sindicancia', 'aprovado', 'reprovado', 'iniciado']),
  notes: z.string().optional(),
})

type CandidateFormValues = z.infer<typeof candidateSchema>

const STATUS_LABELS: Record<InitiationCandidateStatus, string> = {
  indicado: 'Indicado',
  em_sindicancia: 'Em sindicância',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  iniciado: 'Iniciado',
}

interface CandidateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateToEdit: InitiationCandidate | null
  onSave: (data: CandidateSaveInput) => void | Promise<void>
  isSaving?: boolean
}

export function CandidateDialog({
  open,
  onOpenChange,
  candidateToEdit,
  onSave,
  isSaving = false,
}: CandidateDialogProps) {
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      indicatedBy: '',
      indicationDate: new Date().toISOString().slice(0, 10),
      status: 'em_sindicancia',
      notes: '',
    },
  })

  useEffect(() => {
    if (candidateToEdit) {
      form.reset({
        name: candidateToEdit.name,
        email: candidateToEdit.email ?? '',
        phone: candidateToEdit.phone ?? '',
        indicatedBy: candidateToEdit.indicatedBy,
        indicationDate: candidateToEdit.indicationDate.slice(0, 10),
        status: candidateToEdit.status,
        notes: candidateToEdit.notes ?? '',
      })
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        indicatedBy: '',
        indicationDate: new Date().toISOString().slice(0, 10),
        status: 'em_sindicancia',
        notes: '',
      })
    }
  }, [candidateToEdit, form, open])

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave({
      ...data,
      email: data.email || undefined,
      notes: data.notes || undefined,
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
        <DialogTitle className="sr-only">
          {candidateToEdit ? 'Editar candidato' : 'Novo candidato à iniciação'}
        </DialogTitle>
        <FormHeader
          title={candidateToEdit ? 'Editar candidato' : 'Novo candidato à iniciação'}
          description={
            candidateToEdit
              ? 'Altere os dados do candidato indicado.'
              : 'Registre um novo candidato para acompanhamento da sindicância.'
          }
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Form {...form}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do candidato" {...field} disabled={isSaving} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} disabled={isSaving} />
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
                      <Input placeholder="(11) 99999-9999" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="indicatedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indicado por</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do irmão indicante" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="indicationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da indicação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as InitiationCandidateStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações gerais sobre o candidato"
                      rows={3}
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Salvando...' : candidateToEdit ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
