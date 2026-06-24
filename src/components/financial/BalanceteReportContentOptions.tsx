import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { BalanceteTypeFilter } from '@/lib/accounting-balancete'
import {
  BALANCETE_DISPLAY_OPTION_LABELS,
  type BalanceteReportDisplayOptions,
  isDisplayOptionAvailable,
} from '@/lib/balancete-report-display'

interface BalanceteReportContentOptionsProps {
  options: BalanceteReportDisplayOptions
  typeFilter: BalanceteTypeFilter
  onChange: (options: BalanceteReportDisplayOptions) => void
}

const OPTION_KEYS = Object.keys(
  BALANCETE_DISPLAY_OPTION_LABELS,
) as (keyof BalanceteReportDisplayOptions)[]

export function BalanceteReportContentOptions({
  options,
  typeFilter,
  onChange,
}: BalanceteReportContentOptionsProps) {
  const toggleOption = (key: keyof BalanceteReportDisplayOptions, checked: boolean) => {
    onChange({ ...options, [key]: checked })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Conteúdo do relatório</CardTitle>
        <CardDescription>
          Escolha o que aparece na pré-visualização, na impressão e no PDF. Os filtros de
          período, tipo e conta continuam valendo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OPTION_KEYS.map((key) => {
            const available = isDisplayOptionAvailable(key, typeFilter)
            const inputId = `balancete-display-${key}`

            return (
              <div key={key} className="flex items-start gap-2">
                <Checkbox
                  id={inputId}
                  checked={options[key]}
                  disabled={!available}
                  onCheckedChange={(checked) => toggleOption(key, checked === true)}
                />
                <Label
                  htmlFor={inputId}
                  className={available ? 'font-normal leading-snug' : 'font-normal text-muted-foreground'}
                >
                  {BALANCETE_DISPLAY_OPTION_LABELS[key]}
                </Label>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
