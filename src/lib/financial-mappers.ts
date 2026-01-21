/**
 * Mappers para converter entre estruturas do banco de dados e interfaces TypeScript
 * do módulo financeiro
 */

import type {
  BankAccount,
  Category,
  Transaction,
  Budget,
  FinancialGoal,
  Contribution,
} from '@/lib/data'

// ========== BANK ACCOUNTS ==========
export interface BankAccountDB {
  id: string
  name: string
  type: 'Corrente' | 'Poupança' | 'Caixa' | 'Investimento'
  initial_balance: number
  color?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export function mapBankAccountFromDB(row: BankAccountDB): BankAccount {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    initialBalance: Number(row.initial_balance),
    color: row.color || undefined,
  }
}

export function mapBankAccountToDB(account: Partial<BankAccount>): Partial<BankAccountDB> {
  return {
    name: account.name,
    type: account.type,
    initial_balance: account.initialBalance,
    color: account.color || null,
  }
}

// ========== CATEGORIES ==========
export interface CategoryDB {
  id: string
  name: string
  type: 'Receita' | 'Despesa'
  description?: string | null
  color?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export function mapCategoryFromDB(row: CategoryDB): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
  }
}

export function mapCategoryToDB(category: Partial<Category>): Partial<CategoryDB> {
  return {
    name: category.name,
    type: category.type,
  }
}

// ========== TRANSACTIONS ==========
export interface TransactionDB {
  id: string
  date: string
  description: string
  category: string
  type: 'Receita' | 'Despesa'
  amount: number
  account_id?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export function mapTransactionFromDB(row: TransactionDB): Transaction {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    category: row.category,
    type: row.type,
    amount: Number(row.amount),
    accountId: row.account_id || undefined,
  }
}

export function mapTransactionToDB(transaction: Partial<Transaction>): Partial<TransactionDB> {
  return {
    date: transaction.date,
    description: transaction.description,
    category: transaction.category,
    type: transaction.type,
    amount: transaction.amount,
    account_id: transaction.accountId || null,
  }
}

// ========== BUDGETS ==========
export interface BudgetDB {
  id: string
  category: string
  amount: number
  period_start: string
  period_end: string
  description?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export function mapBudgetFromDB(row: BudgetDB): Budget {
  // Determinar o período baseado na diferença de datas
  const startDate = new Date(row.period_start)
  const endDate = new Date(row.period_end)
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  let period: 'Mensal' | 'Anual' | 'Personalizado' = 'Personalizado'
  if (diffDays >= 28 && diffDays <= 31) {
    period = 'Mensal'
  } else if (diffDays >= 365 && diffDays <= 366) {
    period = 'Anual'
  }

  return {
    id: row.id,
    name: row.category, // Usando category como name
    type: 'Despesa', // Budgets são sempre despesas no nosso sistema
    category: row.category,
    amount: Number(row.amount),
    period,
    startDate: row.period_start,
    endDate: row.period_end,
  }
}

export function mapBudgetToDB(budget: Partial<Budget>): Partial<BudgetDB> {
  // Converter período para datas
  let periodStart = budget.startDate
  let periodEnd = budget.endDate

  if (!periodStart || !periodEnd) {
    const now = new Date()
    if (budget.period === 'Mensal') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    } else if (budget.period === 'Anual') {
      periodStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      periodEnd = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
    } else {
      // Personalizado - usar datas fornecidas ou padrão
      periodStart = budget.startDate || new Date().toISOString().split('T')[0]
      periodEnd = budget.endDate || new Date().toISOString().split('T')[0]
    }
  }

  return {
    category: budget.category || budget.name || '',
    amount: budget.amount,
    period_start: periodStart!,
    period_end: periodEnd!,
    description: budget.category || null,
  }
}

// ========== FINANCIAL GOALS ==========
export interface FinancialGoalDB {
  id: string
  title: string
  description?: string | null
  target_amount: number
  current_amount: number
  deadline?: string | null
  status: 'Em Andamento' | 'Concluída' | 'Cancelada'
  created_by?: string | null
  created_at: string
  updated_at: string
}

export function mapFinancialGoalFromDB(row: FinancialGoalDB): FinancialGoal {
  return {
    id: row.id,
    name: row.title,
    targetAmount: Number(row.target_amount),
    linkedCategory: row.description || undefined,
    deadline: row.deadline || '',
  }
}

export function mapFinancialGoalToDB(goal: Partial<FinancialGoal>): Partial<FinancialGoalDB> {
  return {
    title: goal.name,
    description: goal.linkedCategory || null,
    target_amount: goal.targetAmount,
    deadline: goal.deadline || null,
  }
}

// ========== CONTRIBUTIONS ==========
// Nota: Contributions podem estar em uma tabela separada (contributions)
// ou podem ser transações do tipo 'Receita' com uma categoria específica
// Por enquanto, vamos mapear como transações especiais
export interface ContributionDB {
  id: string
  brother_id: string
  month: string
  year: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
  payment_date?: string | null
  created_at: string
  updated_at: string
}

export function mapContributionFromDB(row: ContributionDB): Contribution {
  return {
    id: row.id,
    brotherId: row.brother_id,
    month: row.month,
    year: row.year,
    amount: Number(row.amount),
    status: row.status,
    paymentDate: row.payment_date || undefined,
  }
}

export function mapContributionToDB(contribution: Partial<Contribution>): Partial<ContributionDB> {
  return {
    brother_id: contribution.brotherId,
    month: contribution.month,
    year: contribution.year,
    amount: contribution.amount,
    status: contribution.status,
    payment_date: contribution.paymentDate || null,
  }
}
