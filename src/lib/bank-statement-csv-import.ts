export interface BankStatementLine {
  date: string
  description: string
  amount: number
  balance: number | null
  rawAmount: string
}

export interface ParsedBankStatement {
  lines: BankStatementLine[]
  closingBalance: number | null
  delimiter: ',' | ';'
}

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function detectDelimiter(headerLine: string): ',' | ';' {
  const semicolons = (headerLine.match(/;/g) ?? []).length
  const commas = (headerLine.match(/,/g) ?? []).length
  return semicolons >= commas ? ';' : ','
}

function parseCsvRow(line: string, delimiter: ',' | ';'): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }

  cells.push(current.trim())
  return cells
}

/** Converte valor brasileiro (1.234,56 ou -1.234,56) para número. */
export function parseBrazilianMoney(value: string): number | null {
  const trimmed = value.trim().replace(/"/g, '')
  if (!trimmed || trimmed === '-') return null

  const negative = trimmed.startsWith('-') || trimmed.includes('(')
  const digits = trimmed.replace(/[^\d,.-]/g, '')
  if (!digits) return null

  let normalized = digits
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.')
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  return negative && parsed > 0 ? -parsed : parsed
}

function parseStatementDate(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`

  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
  }

  return null
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader)
  for (const candidate of candidates) {
    const index = normalized.findIndex(
      (header) => header === candidate || header.includes(candidate),
    )
    if (index >= 0) return index
  }
  return -1
}

export function parseBankStatementCsv(content: string): ParsedBankStatement {
  const normalizedContent = content.replace(/^\uFEFF/, '').trim()
  if (!normalizedContent) {
    return { lines: [], closingBalance: null, delimiter: ';' }
  }

  const rawLines = normalizedContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (rawLines.length === 0) {
    return { lines: [], closingBalance: null, delimiter: ';' }
  }

  const delimiter = detectDelimiter(rawLines[0])
  const headerCells = parseCsvRow(rawLines[0], delimiter)

  const dateIndex = findColumnIndex(headerCells, [
    'data',
    'date',
    'data lancamento',
    'data do lancamento',
  ])
  const descriptionIndex = findColumnIndex(headerCells, [
    'descricao',
    'description',
    'historico',
    'histórico',
    'lancamento',
  ])
  const amountIndex = findColumnIndex(headerCells, [
    'valor',
    'amount',
    'value',
    'credito',
    'debito',
  ])
  const balanceIndex = findColumnIndex(headerCells, ['saldo', 'balance'])

  const hasHeader =
    dateIndex >= 0 || descriptionIndex >= 0 || amountIndex >= 0 || balanceIndex >= 0

  const dataRows = hasHeader ? rawLines.slice(1) : rawLines
  const lines: BankStatementLine[] = []

  for (const row of dataRows) {
    const cells = parseCsvRow(row, delimiter)
    if (cells.length === 0) continue

    const dateValue =
      dateIndex >= 0 ? cells[dateIndex] : cells[0]
    const descriptionValue =
      descriptionIndex >= 0 ? cells[descriptionIndex] : cells[1] ?? ''
    const amountValue =
      amountIndex >= 0 ? cells[amountIndex] : cells[2] ?? cells[1] ?? ''
    const balanceValue = balanceIndex >= 0 ? cells[balanceIndex] : cells[3]

    const date = parseStatementDate(dateValue)
    const amount = parseBrazilianMoney(amountValue)
    if (!date || amount === null) continue

    const balance = balanceValue ? parseBrazilianMoney(balanceValue) : null

    lines.push({
      date,
      description: descriptionValue.replace(/"/g, '').trim() || 'Sem descrição',
      amount,
      balance,
      rawAmount: amountValue,
    })
  }

  const closingBalance =
    [...lines].reverse().find((line) => line.balance !== null)?.balance ??
    null

  return { lines, closingBalance, delimiter }
}

export interface StatementSystemMatch {
  statementLine: BankStatementLine
  transactionId: string | null
  matched: boolean
}

/** Cruza linhas do extrato com lançamentos do sistema (mesma conta, data e valor). */
export function matchStatementLinesToTransactions(
  statementLines: BankStatementLine[],
  transactions: Array<{
    id: string
    date: string
    amount: number
    type: 'Receita' | 'Despesa'
    accountId?: string
  }>,
  accountId: string,
): StatementSystemMatch[] {
  const accountTransactions = transactions.filter(
    (transaction) => transaction.accountId === accountId,
  )

  const usedIds = new Set<string>()

  return statementLines.map((statementLine) => {
    const signedAmount =
      statementLine.amount >= 0
        ? { type: 'Receita' as const, amount: statementLine.amount }
        : { type: 'Despesa' as const, amount: Math.abs(statementLine.amount) }

    const match = accountTransactions.find((transaction) => {
      if (usedIds.has(transaction.id)) return false
      if (transaction.date !== statementLine.date) return false
      if (transaction.type !== signedAmount.type) return false
      return Math.abs(transaction.amount - signedAmount.amount) < 0.01
    })

    if (match) usedIds.add(match.id)

    return {
      statementLine,
      transactionId: match?.id ?? null,
      matched: Boolean(match),
    }
  })
}
