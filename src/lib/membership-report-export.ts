import { downloadCsvFile } from '@/lib/export-utils'
import { formatDateBR } from '@/lib/format-utils'
import {
  formatOverdueLabels,
  getOverdueEntriesForBrother,
  membershipContributionStatusLabel,
  membershipStatusLabel,
  type MembershipBrotherStatementData,
  type MembershipOverdueReportData,
} from '@/lib/membership-report'

export function exportMembershipOverdueReportCsv(
  data: MembershipOverdueReportData,
): void {
  const rows = data.alerts.map((alert) => [
    alert.brotherName,
    String(alert.overdueCount),
    formatOverdueLabels(alert.overdueLabels),
    alert.overdueAmount.toFixed(2),
    alert.oldestOverdueDueDate ? formatDateBR(alert.oldestOverdueDueDate) : '',
    alert.requiresEscalation ? 'Sim' : 'Não',
  ])

  downloadCsvFile(
    [
      'Irmão',
      'Meses em atraso',
      'Períodos',
      'Valor em aberto (R$)',
      'Vencimento mais antigo',
      'Prioridade tesouraria',
    ],
    rows,
    'relatorio-mensalidades-em-atraso',
  )
}

export function exportMembershipBrotherStatementScheduleCsv(
  statement: MembershipBrotherStatementData,
): void {
  const slug = statement.brotherName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  const rows = statement.schedule.entries.map((entry) => [
    entry.periodLabel,
    entry.dueDate,
    entry.expectedAmount.toFixed(2),
    entry.paidAmount.toFixed(2),
    entry.remainingAmount.toFixed(2),
    membershipStatusLabel(entry.status),
  ])

  downloadCsvFile(
    [
      'Referência',
      'Vencimento',
      'Previsto (R$)',
      'Pago (R$)',
      'Em aberto (R$)',
      'Status',
    ],
    rows,
    `extrato-mensalidade-${slug || statement.brotherId}`,
  )
}

export function exportMembershipBrotherStatementPaymentsCsv(
  statement: MembershipBrotherStatementData,
): void {
  const slug = statement.brotherName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  const rows = statement.contributions.map((contribution) => [
    `${contribution.month}/${contribution.year}`,
    contribution.paymentDate ?? '',
    contribution.amount.toFixed(2),
    membershipContributionStatusLabel(contribution.status),
    contribution.transactionId ? 'Sim' : 'Não',
    contribution.notes?.trim() ?? '',
  ])

  if (rows.length === 0) {
    throw new Error('Nenhum lançamento de mensalidade para exportar.')
  }

  downloadCsvFile(
    [
      'Referência',
      'Data pagamento',
      'Valor (R$)',
      'Status',
      'No caixa',
      'Observações',
    ],
    rows,
    `lancamentos-mensalidade-${slug || statement.brotherId}`,
  )
}

export function exportMembershipOverdueDetailCsv(
  data: MembershipOverdueReportData,
): void {
  const rows: string[][] = []

  for (const alert of data.alerts) {
    const entries = getOverdueEntriesForBrother(data, alert.brotherId)
    for (const entry of entries) {
      rows.push([
        alert.brotherName,
        entry.periodLabel,
        entry.dueDate,
        entry.expectedAmount.toFixed(2),
        entry.paidAmount.toFixed(2),
        entry.remainingAmount.toFixed(2),
        membershipStatusLabel(entry.status),
      ])
    }
  }

  if (rows.length === 0) {
    throw new Error('Nenhum mês em atraso para exportar.')
  }

  downloadCsvFile(
    [
      'Irmão',
      'Referência',
      'Vencimento',
      'Previsto (R$)',
      'Pago (R$)',
      'Em aberto (R$)',
      'Status',
    ],
    rows,
    'relatorio-mensalidades-atraso-detalhado',
  )
}
