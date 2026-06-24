import type { BankAccount, Transaction } from '@/lib/data'
import type { FinancialDocumentType } from '@/lib/financial-document-types'
import { getFinancialDocumentTypeLabel } from '@/lib/financial-document-types'
import {
  buildCashFlowReport,
  filterTransactionsInPeriod,
  type CashFlowPeriod,
} from '@/lib/cash-flow'
import { getCalendarDateTimestamp } from '@/lib/format-utils'

export type BalanceteTypeFilter = 'all' | 'Receita' | 'Despesa'

export const BALANCETE_TYPE_FILTER_LABELS: Record<BalanceteTypeFilter, string> = {
  all: 'Receitas e Despesas',
  Receita: 'Somente Receitas',
  Despesa: 'Somente Despesas',
}

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
  typeFilter: BalanceteTypeFilter
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

function filterTransactionsByType(
  transactions: Transaction[],
  typeFilter: BalanceteTypeFilter,
): Transaction[] {
  if (typeFilter === 'all') return transactions
  return transactions.filter((transaction) => transaction.type === typeFilter)
}

function sumEntriesByType(
  entries: BalanceteLedgerEntry[],
  type: 'Receita' | 'Despesa',
): number {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((sum, entry) => sum + entry.amount, 0)
}

function buildTotalsRow(sections: BalanceteAccountSection[]): BalanceteTotalsRow {
  return sections.reduce<BalanceteTotalsRow>(
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
}

function buildCategoryTotals(
  transactions: Transaction[],
  type: 'Receita' | 'Despesa',
): Record<string, number> {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.category] =
        (accumulator[transaction.category] || 0) + transaction.amount
      return accumulator
    }, {})
}

function mapAccountSection(
  summary: {
    accountId: string
    accountName: string
    accountType: string
    openingBalance: number
    periodIncome: number
    periodExpense: number
    closingBalance: number
  },
  periodTransactions: Transaction[],
  attachmentsByTransactionId: Record<string, BalanceteAttachmentInput[]>,
  typeFilter: BalanceteTypeFilter,
): BalanceteAccountSection {
  const accountTransactions = filterTransactionsByType(
    periodTransactions.filter((transaction) => transaction.accountId === summary.accountId),
    typeFilter,
  )
  const entries = sortTransactionsByDate(accountTransactions).map((transaction) =>
    mapToLedgerEntry(
      transaction,
      summary.accountName,
      attachmentsByTransactionId[transaction.id] ?? [],
    ),
  )

  if (typeFilter === 'all') {
    return {
      accountId: summary.accountId,
      accountName: summary.accountName,
      accountType: summary.accountType,
      openingBalance: summary.openingBalance,
      totalCredits: summary.periodIncome,
      totalDebits: summary.periodExpense,
      closingBalance: summary.closingBalance,
      entries,
    }
  }

  const totalCredits = sumEntriesByType(entries, 'Receita')
  const totalDebits = sumEntriesByType(entries, 'Despesa')
  const movementTotal = typeFilter === 'Receita' ? totalCredits : totalDebits

  return {
    accountId: summary.accountId,
    accountName: summary.accountName,
    accountType: summary.accountType,
    openingBalance: 0,
    totalCredits,
    totalDebits,
    closingBalance: movementTotal,
    entries,
  }
}

function sortTransactionsByDate(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (left, right) =>
      getCalendarDateTimestamp(left.date) - getCalendarDateTimestamp(right.date),
  )
}

function buildUnassignedEntries(
  periodTransactions: Transaction[],
  attachmentsByTransactionId: Record<string, BalanceteAttachmentInput[]>,
  typeFilter: BalanceteTypeFilter,
): BalanceteLedgerEntry[] {
  return sortTransactionsByDate(
    filterTransactionsByType(
      periodTransactions.filter((transaction) => !transaction.accountId),
      typeFilter,
    ),
  ).map((transaction) =>
    mapToLedgerEntry(
      transaction,
      'Sem conta',
      attachmentsByTransactionId[transaction.id] ?? [],
    ),
  )
}

function finalizeBalanceteData(
  accountSections: BalanceteAccountSection[],
  unassignedEntries: BalanceteLedgerEntry[],
  periodTransactions: Transaction[],
  typeFilter: BalanceteTypeFilter,
): AccountingBalanceteData {
  const filteredPeriodTransactions = filterTransactionsByType(periodTransactions, typeFilter)
  const visibleSections =
    typeFilter === 'all'
      ? accountSections
      : accountSections.filter((section) => section.entries.length > 0)

  return {
    accountSections: visibleSections,
    unassignedEntries,
    totalsRow:
      typeFilter === 'all'
        ? buildTotalsRow(accountSections)
        : buildTotalsRow(visibleSections),
    incomeByCategory: buildCategoryTotals(filteredPeriodTransactions, 'Receita'),
    expenseByCategory: buildCategoryTotals(filteredPeriodTransactions, 'Despesa'),
    periodTransactionCount: filteredPeriodTransactions.length,
    typeFilter,
  }
}

export function buildAccountingBalancete(
  accounts: BankAccount[],
  transactions: Transaction[],
  attachmentsByTransactionId: Record<string, BalanceteAttachmentInput[]>,
  period: CashFlowPeriod,
  accountFilter: string = 'all',
  typeFilter: BalanceteTypeFilter = 'all',
): AccountingBalanceteData {
  const cashFlow = buildCashFlowReport(accounts, transactions, period, accountFilter)
  const periodTransactions = filterTransactionsInPeriod(
    transactions,
    period,
    accountFilter === 'all' ? null : accountFilter,
  )

  const accountSections = cashFlow.accountSummaries.map((summary) =>
    mapAccountSection(
      summary,
      periodTransactions,
      attachmentsByTransactionId,
      typeFilter,
    ),
  )

  const unassignedEntries = buildUnassignedEntries(
    periodTransactions,
    attachmentsByTransactionId,
    typeFilter,
  )

  return finalizeBalanceteData(
    accountSections,
    unassignedEntries,
    periodTransactions,
    typeFilter,
  )
}

export function filterTransactionsForBalancetePeriod(
  transactions: Transaction[],
  period: CashFlowPeriod | null,
  accountFilter: string,
  typeFilter: BalanceteTypeFilter = 'all',
): Transaction[] {
  let filtered: Transaction[]

  if (!period) {
    filtered =
      accountFilter === 'all'
        ? transactions
        : transactions.filter((transaction) => transaction.accountId === accountFilter)
  } else {
    filtered = filterTransactionsInPeriod(
      transactions,
      period,
      accountFilter === 'all' ? null : accountFilter,
    )
  }

  return filterTransactionsByType(filtered, typeFilter)
}

export function buildAccountingBalanceteAllPeriods(
  accounts: BankAccount[],
  transactions: Transaction[],
  attachmentsByTransactionId: Record<string, BalanceteAttachmentInput[]>,
  accountFilter: string = 'all',
  typeFilter: BalanceteTypeFilter = 'all',
): AccountingBalanceteData {
  const filteredAccounts =
    accountFilter === 'all'
      ? accounts
      : accounts.filter((account) => account.id === accountFilter)

  const filteredTransactions =
    accountFilter === 'all'
      ? transactions
      : transactions.filter((transaction) => transaction.accountId === accountFilter)

  const accountSections = filteredAccounts.map((account) => {
    const summary = {
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      openingBalance: account.initialBalance,
      periodIncome: filteredTransactions
        .filter(
          (transaction) =>
            transaction.accountId === account.id && transaction.type === 'Receita',
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      periodExpense: filteredTransactions
        .filter(
          (transaction) =>
            transaction.accountId === account.id && transaction.type === 'Despesa',
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      closingBalance: 0,
    }
    summary.closingBalance =
      summary.openingBalance + summary.periodIncome - summary.periodExpense

    return mapAccountSection(
      summary,
      filteredTransactions,
      attachmentsByTransactionId,
      typeFilter,
    )
  })

  const unassignedEntries = buildUnassignedEntries(
    filteredTransactions,
    attachmentsByTransactionId,
    typeFilter,
  )

  return finalizeBalanceteData(
    accountSections,
    unassignedEntries,
    filteredTransactions,
    typeFilter,
  )
}
