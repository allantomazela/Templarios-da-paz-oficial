import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MASONIC_DEGREE_OPTIONS, type MasonicDegree } from '@/lib/masonic-degree'

interface SessionDegreeSelectProps {
  id: string
  value: MasonicDegree | null
  onChange: (value: MasonicDegree | null) => void
  disabled?: boolean
}

export function SessionDegreeSelect({
  id,
  value,
  onChange,
  disabled,
}: SessionDegreeSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Grau da sessão</Label>
      <Select
        value={value ?? NO_DEGREE}
        onValueChange={(next) =>
          onChange(next === NO_DEGREE ? null : (next as MasonicDegree))
        }
        disabled={disabled}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_DEGREE}>Não informado</SelectItem>
          {MASONIC_DEGREE_OPTIONS.map((degree) => (
            <SelectItem key={degree} value={degree}>
              {degree}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const NO_DEGREE = 'none'
