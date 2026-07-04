import { Filter } from 'lucide-react'
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
  FINANCIAL_REPORT_PERIOD_LABELS,
  validateFinancialReportPeriodConfig,
  type FinancialReportPeriodConfig,
} from '@/lib/financial-report-period'

interface FinancialReportPeriodSelectorProps {
  value: FinancialReportPeriodConfig
  onChange: (value: FinancialReportPeriodConfig) => void
  className?: string
  showLabel?: boolean
}

export function FinancialReportPeriodSelector({
  value,
  onChange,
  className,
  showLabel = false,
}: FinancialReportPeriodSelectorProps) {
  const validationError = validateFinancialReportPeriodConfig(value)

  return (
    <div className={className}>
      {showLabel ? (
        <Label className="mb-2 block text-sm font-medium">Período</Label>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          value={value.period}
          onValueChange={(period) =>
            onChange({
              ...value,
              period: period as FinancialReportPeriodConfig['period'],
            })
          }
        >
          <SelectTrigger>
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FINANCIAL_REPORT_PERIOD_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {value.period === 'custom' ? (
          <>
            <div className="space-y-1">
              <Label htmlFor="financial-report-start" className="text-xs text-muted-foreground">
                Data inicial
              </Label>
              <Input
                id="financial-report-start"
                type="date"
                value={value.customStart ?? ''}
                onChange={(event) =>
                  onChange({ ...value, customStart: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="financial-report-end" className="text-xs text-muted-foreground">
                Data final
              </Label>
              <Input
                id="financial-report-end"
                type="date"
                value={value.customEnd ?? ''}
                onChange={(event) =>
                  onChange({ ...value, customEnd: event.target.value })
                }
              />
            </div>
          </>
        ) : null}
      </div>
      {validationError ? (
        <p className="mt-2 text-xs text-destructive">{validationError}</p>
      ) : null}
    </div>
  )
}
