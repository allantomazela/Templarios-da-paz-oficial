import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getMembershipAmountWarning } from '@/lib/membership-amount-check'

interface ContributionAmountWarningProps {
  amount: number
  expectedAmount: number | null
}

export function ContributionAmountWarning({
  amount,
  expectedAmount,
}: ContributionAmountWarningProps) {
  if (expectedAmount == null) return null

  const warning = getMembershipAmountWarning(Number(amount), expectedAmount)
  if (!warning) return null

  return (
    <Alert
      role="status"
      className="border-amber-200 bg-amber-50 text-amber-900"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-sm">{warning.title}</AlertTitle>
      <AlertDescription className="text-sm">{warning.message}</AlertDescription>
    </Alert>
  )
}
