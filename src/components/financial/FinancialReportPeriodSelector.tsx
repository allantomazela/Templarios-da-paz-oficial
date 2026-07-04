import type { ReactNode } from 'react'
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
import { cn } from '@/lib/utils'

interface FinancialReportPeriodSelectorProps {
  value: FinancialReportPeriodConfig
  onChange: (value: FinancialReportPeriodConfig) => void
  className?: string
  showLabel?: boolean
}

interface PeriodFieldProps {
  label: string
  htmlFor: string
  className?: string
  children: ReactNode
}

function PeriodField({ label, htmlFor, className, children }: PeriodFieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function FinancialReportPeriodSelector({
  value,
  onChange,
  className,
  showLabel = false,
}: FinancialReportPeriodSelectorProps) {
  const validationError = validateFinancialReportPeriodConfig(value)
  const isCustom = value.period === 'custom'

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel ? (
        <p className="text-sm font-medium">Período do relatório</p>
      ) : null}

      <div
        className={cn(
          'grid w-full gap-3',
          isCustom ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'max-w-sm',
        )}
      >
        <PeriodField label="Período" htmlFor="financial-report-period">
          <Select
            value={value.period}
            onValueChange={(period) =>
              onChange({
                ...value,
                period: period as FinancialReportPeriodConfig['period'],
              })
            }
          >
            <SelectTrigger id="financial-report-period" className="w-full">
              <Filter className="mr-2 h-4 w-4 shrink-0" />
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
        </PeriodField>

        {isCustom ? (
          <>
            <PeriodField label="Data inicial" htmlFor="financial-report-start">
              <Input
                id="financial-report-start"
                type="date"
                className="w-full"
                value={value.customStart ?? ''}
                onChange={(event) =>
                  onChange({ ...value, customStart: event.target.value })
                }
              />
            </PeriodField>
            <PeriodField label="Data final" htmlFor="financial-report-end">
              <Input
                id="financial-report-end"
                type="date"
                className="w-full"
                value={value.customEnd ?? ''}
                onChange={(event) =>
                  onChange({ ...value, customEnd: event.target.value })
                }
              />
            </PeriodField>
          </>
        ) : null}
      </div>

      {validationError ? (
        <p className="text-xs text-destructive">{validationError}</p>
      ) : null}
    </div>
  )
}
