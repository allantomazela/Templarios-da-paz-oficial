import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type DegreeFormData = {
  degree: string
  initiationDate: string
  elevationDate: string
  exaltationDate: string
}

type DegreeEditDialogProps = {
  open: boolean
  brotherName: string
  formData: DegreeFormData
  saving: boolean
  onOpenChange: (open: boolean) => void
  onChange: (data: DegreeFormData) => void
  onCancel: () => void
  onSave: () => void
}

export function DegreeEditDialog({
  open,
  brotherName,
  formData,
  saving,
  onOpenChange,
  onChange,
  onCancel,
  onSave,
}: DegreeEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="degree-edit-description">
        <DialogHeader>
          <DialogTitle>Alterar grau e datas</DialogTitle>
        </DialogHeader>
        <p id="degree-edit-description" className="text-sm text-muted-foreground">
          Registro de {brotherName}. Estas datas são a iniciação, a elevação e a
          exaltação. Elevação ou exaltação em branco remove a data. A iniciação
          em branco mantém a data já gravada.
        </p>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="degree-current">
              Grau
            </Label>
            <Select
              value={formData.degree}
              onValueChange={(degree) => onChange({ ...formData, degree })}
            >
              <SelectTrigger id="degree-current" className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                <SelectItem value="Companheiro">Companheiro</SelectItem>
                <SelectItem value="Mestre">Mestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DateField
            id="degree-initiation"
            label="Iniciação"
            value={formData.initiationDate}
            onChange={(initiationDate) => onChange({ ...formData, initiationDate })}
          />
          <DateField
            id="degree-elevation"
            label="Elevação"
            value={formData.elevationDate}
            onChange={(elevationDate) => onChange({ ...formData, elevationDate })}
          />
          <DateField
            id="degree-exaltation"
            label="Exaltação"
            value={formData.exaltationDate}
            onChange={(exaltationDate) => onChange({ ...formData, exaltationDate })}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving}>
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right" htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        type="date"
        className="col-span-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
