import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  FINANCIAL_CUSTOM_REPORT_DISPLAY_LABELS,
  type FinancialCustomReportDisplayOptions,
} from '@/lib/financial-custom-report-display'

interface FinancialCustomReportContentOptionsProps {
  options: FinancialCustomReportDisplayOptions
  onChange: (options: FinancialCustomReportDisplayOptions) => void
}

const OPTION_KEYS = Object.keys(
  FINANCIAL_CUSTOM_REPORT_DISPLAY_LABELS,
) as (keyof FinancialCustomReportDisplayOptions)[]

export function FinancialCustomReportContentOptions({
  options,
  onChange,
}: FinancialCustomReportContentOptionsProps) {
  const toggleOption = (
    key: keyof FinancialCustomReportDisplayOptions,
    checked: boolean,
  ) => {
    onChange({ ...options, [key]: checked })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Conteúdo do relatório</CardTitle>
        <CardDescription>
          Escolha o que entra na pré-visualização, impressão e PDF.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {OPTION_KEYS.map((key) => {
            const inputId = `financial-custom-report-${key}`

            return (
              <div key={key} className="flex items-start gap-2">
                <Checkbox
                  id={inputId}
                  checked={options[key]}
                  onCheckedChange={(checked) => toggleOption(key, checked === true)}
                />
                <Label htmlFor={inputId} className="font-normal leading-snug">
                  {FINANCIAL_CUSTOM_REPORT_DISPLAY_LABELS[key]}
                </Label>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
