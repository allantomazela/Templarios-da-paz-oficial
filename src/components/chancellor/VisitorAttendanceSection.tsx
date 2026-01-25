import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Trash2, UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { VisitorAttendance } from '@/lib/data'
import {
  DEGREE_OPTIONS,
  OBEDIENCE_OPTIONS,
  normalizeVisitorAttendanceInput,
  validateVisitorAttendanceInput,
} from '@/lib/visitor-attendance'

export function VisitorAttendanceSection({
  visitors,
  sessionRecordId,
  onAddVisitor,
  onRemoveVisitor,
  onPrintCertificate,
}: VisitorAttendanceSectionProps) {
  const { toast } = useToast()
  const [draft, setDraft] = useState<VisitorAttendance>({
    id: 'draft',
    sessionRecordId: sessionRecordId || 'pending',
    name: '',
    degree: 'Mestre',
    lodge: '',
    lodgeNumber: '',
    obedience: 'GOB',
    masonicNumber: '',
  })

  const handleAdd = () => {
    const normalized = normalizeVisitorAttendanceInput(draft)
    const errors = validateVisitorAttendanceInput(normalized)

    if (errors.length > 0) {
      toast({
        title: 'Dados do visitante invalidos',
        description: errors[0],
        variant: 'destructive',
      })
      return
    }

    const newVisitor: VisitorAttendance = {
      ...normalized,
      id: crypto.randomUUID(),
      sessionRecordId: sessionRecordId || 'pending',
    }

    onAddVisitor(newVisitor)
    setDraft((prev) => ({
      ...prev,
      name: '',
      lodge: '',
      lodgeNumber: '',
      masonicNumber: '',
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">
            Visitantes de Outras Lojas
          </Label>
          <p className="text-sm text-muted-foreground">
            Adicione visitantes para contabilizar a presenca e gerar o
            certificado.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar Visitante
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="visitor-name">Nome Completo *</Label>
          <Input
            id="visitor-name"
            placeholder="Nome do visitante"
            value={draft.name}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitor-degree">Grau *</Label>
          <Select
            value={draft.degree}
            onValueChange={(value) =>
              setDraft((prev) => ({ ...prev, degree: value as DegreeOption }))
            }
          >
            <SelectTrigger id="visitor-degree">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEGREE_OPTIONS.map((degree) => (
                <SelectItem key={degree} value={degree}>
                  {degree}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitor-lodge">Loja de Origem *</Label>
          <Input
            id="visitor-lodge"
            placeholder="Nome da loja"
            value={draft.lodge}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, lodge: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitor-lodge-number">Numero da Loja *</Label>
          <Input
            id="visitor-lodge-number"
            placeholder="Ex: 123"
            value={draft.lodgeNumber}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, lodgeNumber: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitor-obedience">Obediencia *</Label>
          <Select
            value={draft.obedience}
            onValueChange={(value) =>
              setDraft((prev) => ({ ...prev, obedience: value }))
            }
          >
            <SelectTrigger id="visitor-obedience">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OBEDIENCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitor-masonic">
            Registro Maconico (Opcional)
          </Label>
          <Input
            id="visitor-masonic"
            placeholder="Numero de registro"
            value={draft.masonicNumber}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, masonicNumber: event.target.value }))
            }
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitante</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead>Obediencia</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Nenhum visitante adicionado.
                </TableCell>
              </TableRow>
            ) : (
              visitors.map((visitor) => (
                <TableRow key={visitor.id}>
                  <TableCell>
                    <div className="font-medium">{visitor.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {visitor.degree}
                    </div>
                  </TableCell>
                  <TableCell>
                    {visitor.lodge} Nº {visitor.lodgeNumber}
                  </TableCell>
                  <TableCell>{visitor.obedience}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => onPrintCertificate(visitor)}
                        title="Gerar certificado de presenca"
                      >
                        <FileText className="h-4 w-4" />
                        Certificado
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => onRemoveVisitor(visitor.id)}
                        title="Remover visitante"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

interface VisitorAttendanceSectionProps {
  visitors: VisitorAttendance[]
  sessionRecordId?: string
  onAddVisitor: (visitor: VisitorAttendance) => void
  onRemoveVisitor: (visitorId: string) => void
  onPrintCertificate: (visitor: VisitorAttendance) => void
}

type DegreeOption = (typeof DEGREE_OPTIONS)[number]
