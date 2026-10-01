export type MembershipMonthStatus =
  | 'paid'
  | 'partial'
  | 'upcoming'
  | 'overdue'

export interface MembershipFeeScheduleSettings {
  defaultAmount: number
  dueDay: number
  /** Mensalidade pura (afastados). Se omitido, usa defaultAmount. */
  baseAmount?: number
  /** Pacote de sessão (jantares + tronco). */
  sessionPackageAmount?: number
}

export interface MembershipScheduleEntry {
  month: number
  year: number
  periodLabel: string
  dueDate: string
  expectedAmount: number
  paidAmount: number
  pendingAmount: number
  remainingAmount: number
  status: MembershipMonthStatus
  paymentsCount: number
}

export interface BrotherMembershipSchedule {
  brotherId: string
  brotherName: string
  entries: MembershipScheduleEntry[]
  overdueEntries: MembershipScheduleEntry[]
  openEntries: MembershipScheduleEntry[]
  paidEntries: MembershipScheduleEntry[]
  totalPaid: number
  totalOverdue: number
  totalOpen: number
  overdueMonthCount: number
  isUpToDate: boolean
}

export interface OverdueBrotherAlert {
  brotherId: string
  brotherName: string
  overdueCount: number
  overdueAmount: number
  overdueLabels: string[]
  oldestOverdueDueDate: string | null
  /** Três ou mais meses em atraso — prioridade de cobrança pela tesouraria. */
  requiresEscalation: boolean
}

export interface MembershipBackfillPeriod {
  month: number
  year: number
  periodLabel: string
  expectedAmount: number
  paid: boolean
  hasLaunch: boolean
}
