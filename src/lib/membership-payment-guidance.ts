import { MEMBERSHIP_OVERDUE_ESCALATION_MONTHS } from '@/lib/membership-schedule'

export interface MembershipLaunchGuidanceInput {
  /** Meses em aberto no cronograma (incluindo o mês sendo lançado, se aplicável). */
  openMonthsCount: number
  /** Lançamento de um único mês de referência. */
  isSingleMonthLaunch: boolean
}

export interface MembershipLaunchGuidance {
  title: string
  message: string
  variant: 'info' | 'warning'
  suggestBatchSettlement: boolean
}

/** Orientação ao tesoureiro: pagamento individual vs quitação em lote. */
export function getMembershipLaunchGuidance(
  input: MembershipLaunchGuidanceInput,
): MembershipLaunchGuidance | null {
  if (!input.isSingleMonthLaunch || input.openMonthsCount <= 0) return null

  if (input.openMonthsCount === 1) {
    return {
      title: 'Pagamento de um mês',
      message:
        'Use este formulário quando o irmão pagou apenas esta referência (ex.: Renan quitando jul/2026). Gera uma receita na conta escolhida.',
      variant: 'info',
      suggestBatchSettlement: false,
    }
  }

  const others = input.openMonthsCount - 1
  return {
    title: 'Este irmão tem outros meses em aberto',
    message: `Há mais ${others} mês(es) em aberto no cronograma. Se o PIX cobriu vários meses de uma vez, feche o formulário e use "Quitar selecionados" no cronograma. Se pagou só esta referência, continue aqui.`,
    variant: 'warning',
    suggestBatchSettlement: true,
  }
}

export function requiresMembershipEscalation(overdueCount: number): boolean {
  return overdueCount >= MEMBERSHIP_OVERDUE_ESCALATION_MONTHS
}

export function splitOverdueAlertsByEscalation<T extends { overdueCount: number }>(
  alerts: T[],
): { escalation: T[]; regular: T[] } {
  const escalation: T[] = []
  const regular: T[] = []

  for (const alert of alerts) {
    if (requiresMembershipEscalation(alert.overdueCount)) {
      escalation.push(alert)
    } else {
      regular.push(alert)
    }
  }

  return { escalation, regular }
}
