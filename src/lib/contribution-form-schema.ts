import * as z from 'zod'
import type { Contribution } from '@/lib/data'
import {
  CONTRIBUTION_MONTHS,
  type ContributionTreasuryMode,
} from '@/lib/contribution-payments'
import { isMembershipHistoricalPeriod } from '@/lib/membership-contribution-rules'
import {
  detectTreasuryModeFromContribution,
  stripControlOnlyNote,
} from '@/lib/membership-control-only'
import { toLocalISODate } from '@/lib/format-utils'

export function contributionMonthNameToNumber(month: string): number {
  return (
    CONTRIBUTION_MONTHS.indexOf(month as (typeof CONTRIBUTION_MONTHS)[number]) + 1
  )
}

export const contributionSchema = z
  .object({
    brotherId: z.string().min(1, 'Irmão é obrigatório'),
    month: z.string().min(1, 'Mês é obrigatório'),
    year: z.coerce.number<number>().min(2000, 'Ano inválido'),
    amount: z.coerce.number<number>().min(0.01, 'Valor inválido'),
    status: z.enum(['Pago', 'Pendente', 'Atrasado']),
    paymentDate: z.string().optional(),
    accountId: z.string().optional(),
    notes: z.string().optional(),
    treasuryMode: z
      .enum(['standard', 'control_only', 'link_existing'])
      .optional(),
    linkedTransactionId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== 'Pago') return

    const monthNum = contributionMonthNameToNumber(data.month)
    const isProduction = !isMembershipHistoricalPeriod(data.year, monthNum)
    const mode = data.treasuryMode ?? 'standard'

    if (mode === 'standard' && !data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conta bancária é obrigatória para pagamento confirmado',
        path: ['accountId'],
      })
    }

    if (isProduction && mode === 'link_existing' && !data.linkedTransactionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione a receita existente para vincular',
        path: ['linkedTransactionId'],
      })
    }
  })

export type ContributionFormValues = z.infer<typeof contributionSchema>

export interface ContributionFormDefaults {
  brotherId?: string
  month?: string
  year?: number
  amount: number
  treasuryMode: ContributionTreasuryMode
}

/** Valores do formulário: edição carrega o lançamento; novo usa os padrões da tela. */
export function buildContributionFormValues(
  contributionToEdit: Contribution | null,
  defaults: ContributionFormDefaults,
  now: Date = new Date(),
): ContributionFormValues {
  const today = toLocalISODate(now)

  if (contributionToEdit) {
    return {
      brotherId: contributionToEdit.brotherId,
      month: contributionToEdit.month,
      year: contributionToEdit.year,
      amount: contributionToEdit.amount,
      status: contributionToEdit.status,
      paymentDate: contributionToEdit.paymentDate || today,
      accountId: contributionToEdit.accountId || '',
      notes: stripControlOnlyNote(contributionToEdit.notes),
      treasuryMode: detectTreasuryModeFromContribution(contributionToEdit),
      linkedTransactionId: contributionToEdit.transactionId || '',
    }
  }

  return {
    brotherId: defaults.brotherId || '',
    month: defaults.month || CONTRIBUTION_MONTHS[now.getMonth()],
    year: defaults.year ?? now.getFullYear(),
    amount: defaults.amount,
    status: 'Pago',
    paymentDate: today,
    accountId: '',
    notes: '',
    treasuryMode: defaults.treasuryMode,
    linkedTransactionId: '',
  }
}
