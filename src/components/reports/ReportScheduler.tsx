import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Pencil, Mail } from 'lucide-react'
import useReportStore, { ReportSchedule } from '@/stores/useReportStore'
import { useToast } from '@/hooks/use-toast'

export function ReportScheduler() {
  const { schedules, templates, addSchedule, updateSchedule, deleteSchedule } =
    useReportStore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(
    null,
  )
  const [formData, setFormData] = useState<{
    frequency: string
    recipients: string
    templateId: string
    active: boolean
  }>({
    frequency: 'Mensal',
    recipients: '',
    templateId: '',
    active: true,
  })

  const openNew = () => {
    setEditingSchedule(null)
    setFormData({
      frequency: 'Mensal',
      recipients: '',
      templateId: templates[0]?.id || '',
      active: true,
    })
    setIsDialogOpen(true)
  }

  const openEdit = (schedule: ReportSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      frequency: schedule.frequency,
      recipients: schedule.recipients.join(', '),
      templateId: schedule.templateId,
      active: schedule.active,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.recipients || !formData.templateId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    const recipientsList = formData.recipients
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0)

    const scheduleData = {
      frequency: formData.frequency as any,
      recipients: recipientsList,
      templateId: formData.templateId,
      active: formData.active,
    }

    if (editingSchedule) {
      updateSchedule({ ...editingSchedule, ...scheduleData })
      toast({
        title: 'Agendamento Atualizado',
        description: 'As alterações foram salvas.',
      })
    } else {
      addSchedule({
        id: crypto.randomUUID(),
        ...scheduleData,
      })
      toast({
        title: 'Agendamento Criado',
        description: 'Novo envio automático configurado.',
      })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteSchedule(id)
    toast({
      title: 'Removido',
      description: 'Agendamento excluído com sucesso.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Agendamento de Envios</h3>
          <p className="text-sm text-muted-foreground">
            Automatize o envio de relatórios por email.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modelo</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead>Destinatários</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum agendamento configurado.
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => {
                const templateName =
                  templates.find((t) => t.id === schedule.templateId)?.name ||
                  'Modelo Desconhecido'
                return (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {templateName}
                    </TableCell>
                    <TableCell>{schedule.frequency}</TableCell>
                    <TableCell
                      className="max-w-[200px] truncate"
                      title={schedule.recipients.join(', ')}
                    >
                      {schedule.recipients.length} emails (
                      {schedule.recipients[0]}...)
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={schedule.active ? 'default' : 'secondary'}
                      >
                        {schedule.active ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(schedule)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription>
              Configure o envio automático de relatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Modelo de Relatório</Label>
              <Select
                value={formData.templateId}
                onValueChange={(val) =>
                  setFormData({ ...formData, templateId: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequência de Envio</Label>
              <Select
                value={formData.frequency}
                onValueChange={(val) =>
                  setFormData({ ...formData, frequency: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diário">Diário (08:00)</SelectItem>
                  <SelectItem value="Semanal">
                    Semanal (Segunda-feira)
                  </SelectItem>
                  <SelectItem value="Mensal">Mensal (Dia 1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destinatários (separados por vírgula)</Label>
              <Input
                value={formData.recipients}
                onChange={(e) =>
                  setFormData({ ...formData, recipients: e.target.value })
                }
                placeholder="email1@exemplo.com, email2@exemplo.com"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="active-mode"
                checked={formData.active}
                onCheckedChange={(c) => setFormData({ ...formData, active: c })}
              />
              <Label htmlFor="active-mode">Agendamento Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
