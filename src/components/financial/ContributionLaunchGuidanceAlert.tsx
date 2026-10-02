import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  resolveContributionDialogGuidance,
  type ContributionDialogGuidanceInput,
} from '@/lib/membership-payment-guidance'
import { cn } from '@/lib/utils'

export function ContributionLaunchGuidanceAlert(props: ContributionDialogGuidanceInput) {
  const guidance = resolveContributionDialogGuidance(props)
  if (!guidance) return null

  return (
    <Alert
      className={cn(
        guidance.variant === 'warning'
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-sky-200 bg-sky-50 text-sky-900',
      )}
    >
      <Info className="h-4 w-4" />
      <AlertTitle className="text-sm">{guidance.title}</AlertTitle>
      <AlertDescription className="text-sm">{guidance.message}</AlertDescription>
    </Alert>
  )
}
