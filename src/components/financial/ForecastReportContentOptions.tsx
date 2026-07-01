import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  FORECAST_REPORT_DISPLAY_OPTION_LABELS,
  type ForecastReportDisplayOptions,
} from '@/lib/forecast-report-display'

interface ForecastReportContentOptionsProps {
  options: ForecastReportDisplayOptions
  onChange: (options: ForecastReportDisplayOptions) => void
}

const OPTION_KEYS = Object.keys(
  FORECAST_REPORT_DISPLAY_OPTION_LABELS,
) as (keyof ForecastReportDisplayOptions)[]

export function ForecastReportContentOptions({
  options,
  onChange,
}: ForecastReportContentOptionsProps) {
  const toggleOption = (key: keyof ForecastReportDisplayOptions, checked: boolean) => {
    onChange({ ...options, [key]: checked })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Conteúdo do relatório</CardTitle>
        <CardDescription>
          Escolha o que aparece na pré-visualização, na impressão e no PDF. A
          personalização da loja (logo, nome e endereço) vem das configurações do
          site, como nos demais relatórios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {OPTION_KEYS.map((key) => {
            const inputId = `forecast-report-display-${key}`

            return (
              <div key={key} className="flex items-start gap-2">
                <Checkbox
                  id={inputId}
                  checked={options[key]}
                  onCheckedChange={(checked) => toggleOption(key, checked === true)}
                />
                <Label htmlFor={inputId} className="font-normal leading-snug">
                  {FORECAST_REPORT_DISPLAY_OPTION_LABELS[key]}
                </Label>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
