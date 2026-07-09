import { MembershipFeeSettings } from '@/components/financial/MembershipFeeSettings'
import { ReminderSettings } from '@/components/financial/ReminderSettings'
import { PayableReminderSettings } from '@/components/financial/PayableReminderSettings'

export function FinancialSettingsPanel() {
  return (
    <div className="space-y-6">
      <MembershipFeeSettings />
      <ReminderSettings />
      <PayableReminderSettings />
    </div>
  )
}
