import { supabase } from '@/lib/supabase/client'
import {
  composeActiveMembershipAmount,
  DEFAULT_MEMBERSHIP_BASE_AMOUNT,
  DEFAULT_MEMBERSHIP_SESSION_PACKAGE_AMOUNT,
} from '@/lib/brother-membership-situation'

export interface MembershipFeeSettings {
  defaultAmount: number
  dueDay: number
  baseAmount: number
  sessionPackageAmount: number
}

export const DEFAULT_MEMBERSHIP_AMOUNT = 290
export const DEFAULT_MEMBERSHIP_DUE_DAY = 10

export async function fetchMembershipFeeSettings(): Promise<MembershipFeeSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select(
      'membership_fee_amount, membership_fee_due_day, membership_fee_base_amount, membership_fee_session_package_amount',
    )
    .eq('id', 1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error

  const baseAmount =
    Number(data?.membership_fee_base_amount) ||
    DEFAULT_MEMBERSHIP_BASE_AMOUNT
  const sessionPackageAmount =
    Number(data?.membership_fee_session_package_amount) ||
    DEFAULT_MEMBERSHIP_SESSION_PACKAGE_AMOUNT
  const composed = composeActiveMembershipAmount(baseAmount, sessionPackageAmount)

  return {
    baseAmount,
    sessionPackageAmount,
    defaultAmount:
      Number(data?.membership_fee_amount) || composed || DEFAULT_MEMBERSHIP_AMOUNT,
    dueDay: Number(data?.membership_fee_due_day) || DEFAULT_MEMBERSHIP_DUE_DAY,
  }
}
