import type { BankAccount, Transaction } from '@/lib/data'
import type { FinancialDocumentType } from '@/lib/financial-document-types'
import { getFinancialDocumentTypeLabel } from '@/lib/financial-document-types'
import {
  buildCashFlowReport,
  filterTransactionsInPeriod,
  type CashFlowPeriod,
} from '@/lib/cash-flow'
import { getCalendarDateTimestamp } from '@/lib/format-utils'

export interface BalanceteAttachmentInput {
  documentType: FinancialDocumentType
  fileName: string
}

export interface BalanceteLedgerEntry {
  id: string
  date: string
  description: string
  category: string
  type: Transaction['type']
  amount: number
  credit: number
  debit: number
  accountName: string
  attachmentNotes?: string
  attachments: BalanceteAttachmentInfo[]
}

export interface BalanceteAttachmentInfo {
  documentTypeLabel: string
  fileName: string
}

export interface BalanceteAccountSection {
  accountId: string
  accountName: string
  accountType: string
  openingBalance: number
  totalCredits: number
  totalDebits: number
  closingBalance: number
  entries: BalanceteLedgerEntry[]
}

export interface BalanceteTotalsRow {
  accountName: string
  openingBalance: number
  totalCredits: number
  totalDebits: number
  closingBalance: number
}

export interface AccountingBalanceteData {
  accountSections: BalanceteAccountSection[]
  unassignedEntries: BalanceteLedgerEntry[]
  totalsRow: BalanceteTotalsRow
  incomeByCategory: Record<string, number>
  expenseByCategory: Record<string, number>
  periodTransactionCount: number
}

function mapToLedgerEntry(
  transaction: Transaction,
  accountName: string,
  attachments: BalanceteAttachmentInput[],
): BalanceteLedgerEntry {
  return {
    id: transaction.id,
    date: transaction.date,
    description: transaction.description,
    category: transaction.category,
    type: transaction.type,
    amount: transaction.amount,
    credit: transaction.type === 'Receita' ? transaction.amount : 0,
    debit: transaction.type === 'Despesa' ? transaction.amount : 0,
    accountName,
    attachmentNotes: transaction.attachmentNotes,
    attachments: attachments.map((attachment) => ({
      documentTypeLabel: getFinancialDocumentTypeLabel(attachment.documentType),
      fileName: attachment.fileName,
    })),
  }
}

function sortTransactionsByDate(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (left, right) =>
      getCalendarDateTimestamp(left.date) - getCalendarDateTimestamp(right.date),
  )
}

export function buildAccountingBalancete(
  accounts: BankAccount[],
  transactions: Transaction[],
  attachmentsByTransactionId: Record<string, BalanceteAttachmentInput[]>,
  period: CashFlowPeriod,
  accountFilter: string = 'all',
): AccountingBalanceteData {
  const cashFlow = buildCashFlowReport(accounts, transactions, period, accountFilter)
  const periodTransactions = filterTransactionsInPeriod(
    transactions,
    period,
    accountFilter === 'all' ? null : accountFilter,
  )

  const accountSections: BalanceteAccountSection[] = cashFlow.accountSummaries.map(
    (summary) => ({
      accountId: summary.accountId,
      accountName: summary.accountName,
      accountType: summary.accountType,
      openingBalance: summary.openingBalance,
      totalCredits: summary.periodIncome,
      totalDebits: summary.periodExpense,
      closingBalance: summary.closingBalance,
      entries: sortTransactionsByDate(
        periodTransactions.filter(
          (transaction) => transaction.accountId === summary.accountId,
        ),
      ).map((transaction) =>
        mapToLedgerEntry(
          transaction,
          summary.accountName,
          attachmentsByTransactionId[transaction.id] ?? [],
        ),
      ),
    }),
  )

  const unassignedEntries = sortTransactionsByDate(
    periodTransactions.filter((transaction) => !transaction.accountId),
  ).map((transaction) =>
    mapToLedgerEntry(
      transaction,
      'Sem conta',
      attachmentsByTransactionId[transaction.id] ?? [],
    ),
  )

  return {
    accountSections,
    unassignedEntries,
    totalsRow: {
      accountName: cashFlow.totalsRow.accountName,
      openingBalance: cashFlow.totalsRow.openingBalance,
      totalCredits: cashFlow.totalsRow.periodIncome,
      totalDebits: cashFlow.totalsRow.periodExpense,
      closingBalance: cashFlow.totalsRow.closingBalance,
    },
    incomeByCategory: cashFlow.incomeByCategory,
    expenseByCategory: cashFlow.expenseByCategory,
    periodTransactionCount: periodTransactions.length,
  }
}

export function filterTransactionsForBalancetePeriod(
  transactions: Transaction[],
  period: CashFlowPeriod | null,
  accountFilter: string,
): Transaction[] {
  if (!period) {
    if (accountFilter === 'all') return transactions
    return transactions.filter((transaction) => transaction.accountId === accountFilter)
  }

  return filterTransactionsInPeriod(
    transactions,
    period,
    accountFilter === 'all' ? null : accountFilter,
  )
}

export function buildAccountingBalanceteAllPeriods(
  accounts: BankAccount[],
  transactions: Transaction[],
  attachmentsByTransactionId: Record<string, BalanceteAttachmentInput[]>,
  accountFilter: string = 'all',
): AccountingBalanceteData {
  const filteredAccounts =
    accountFilter === 'all'
      ? accounts
      : accounts.filter((account) => account.id === accountFilter)

  const filteredTransactions =
    accountFilter === 'all'
      ? transactions
      : transactions.filter((transaction) => transaction.accountId === accountFilter)

  const accountSections: BalanceteAccountSection[] = filteredAccounts.map((account) => {
    const accountTransactions = filteredTransactions.filter(
      (transaction) => transaction.accountId === account.id,
    )
    const totalCredits = accountTransactions
      .filter((transaction) => transaction.type === 'Receita')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    const totalDebits = accountTransactions
      .filter((transaction) => transaction.type === 'Despesa')
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    return {
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      openingBalance: account.initialBalance,
      totalCredits,
      totalDebits,
      closingBalance: account.initialBalance + totalCredits - totalDebits,
      entries: sortTransactionsByDate(accountTransactions).map((transaction) =>
        mapToLedgerEntry(
          transaction,
          account.name,
          attachmentsByTransactionId[transaction.id] ?? [],
        ),
      ),
    }
  })

  const unassignedEntries = sortTransactionsByDate(
    filteredTransactions.filter((transaction) => !transaction.accountId),
  ).map((transaction) =>
    mapToLedgerEntry(
      transaction,
      'Sem conta',
      attachmentsByTransactionId[transaction.id] ?? [],
    ),
  )

  const totalsRow = accountSections.reduce<BalanceteTotalsRow>(
    (accumulator, section) => ({
      accountName: 'TOTAL GERAL',
      openingBalance: accumulator.openingBalance + section.openingBalance,
      totalCredits: accumulator.totalCredits + section.totalCredits,
      totalDebits: accumulator.totalDebits + section.totalDebits,
      closingBalance: accumulator.closingBalance + section.closingBalance,
    }),
    {
      accountName: 'TOTAL GERAL',
      openingBalance: 0,
      totalCredits: 0,
      totalDebits: 0,
      closingBalance: 0,
    },
  )

  const incomeByCategory = filteredTransactions
    .filter((transaction) => transaction.type === 'Receita')
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.category] =
        (accumulator[transaction.category] || 0) + transaction.amount
      return accumulator
    }, {})

  const expenseByCategory = filteredTransactions
    .filter((transaction) => transaction.type === 'Despesa')
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.category] =
        (accumulator[transaction.category] || 0) + transaction.amount
      return accumulator
    }, {})

  return {
    accountSections,
    unassignedEntries,
    totalsRow,
    incomeByCategory,
    expenseByCategory,
    periodTransactionCount: filteredTransactions.length,
  }
}
