import { create } from 'zustand'
import {
  Transaction,
  Category,
  Contribution,
  Budget,
  FinancialGoal,
  ReminderSettings,
  ReminderLog,
  mockTransactions,
  mockCategories,
  mockContributions,
  mockBudgets,
  mockGoals,
  mockReminderLogs,
} from '@/lib/data'

interface FinancialState {
  transactions: Transaction[]
  categories: Category[]
  contributions: Contribution[]
  budgets: Budget[]
  goals: FinancialGoal[]
  reminderSettings: ReminderSettings
  reminderLogs: ReminderLog[]

  addTransaction: (t: Transaction) => void
  updateTransaction: (t: Transaction) => void
  deleteTransaction: (id: string) => void

  addCategory: (c: Category) => void
  updateCategory: (c: Category) => void
  deleteCategory: (id: string) => void

  addContribution: (c: Contribution) => void
  updateContribution: (c: Contribution) => void
  deleteContribution: (id: string) => void

  addBudget: (b: Budget) => void
  updateBudget: (b: Budget) => void
  deleteBudget: (id: string) => void

  addGoal: (g: FinancialGoal) => void
  updateGoal: (g: FinancialGoal) => void
  deleteGoal: (id: string) => void

  updateReminderSettings: (s: ReminderSettings) => void
  addReminderLog: (l: ReminderLog) => void
}

export const useFinancialStore = create<FinancialState>((set) => ({
  transactions: mockTransactions,
  categories: mockCategories,
  contributions: mockContributions,
  budgets: mockBudgets,
  goals: mockGoals,
  reminderSettings: {
    enabled: false,
    frequency: 'before',
    days: 3,
  },
  reminderLogs: mockReminderLogs,

  addTransaction: (t) =>
    set((state) => ({ transactions: [...state.transactions, t] })),
  updateTransaction: (t) =>
    set((state) => ({
      transactions: state.transactions.map((tr) => (tr.id === t.id ? t : tr)),
    })),
  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),

  addCategory: (c) =>
    set((state) => ({ categories: [...state.categories, c] })),
  updateCategory: (c) =>
    set((state) => ({
      categories: state.categories.map((cat) => (cat.id === c.id ? c : cat)),
    })),
  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),

  addContribution: (c) =>
    set((state) => ({ contributions: [...state.contributions, c] })),
  updateContribution: (c) =>
    set((state) => ({
      contributions: state.contributions.map((con) =>
        con.id === c.id ? c : con,
      ),
    })),
  deleteContribution: (id) =>
    set((state) => ({
      contributions: state.contributions.filter((c) => c.id !== id),
    })),

  addBudget: (b) => set((state) => ({ budgets: [...state.budgets, b] })),
  updateBudget: (b) =>
    set((state) => ({
      budgets: state.budgets.map((bg) => (bg.id === b.id ? b : bg)),
    })),
  deleteBudget: (id) =>
    set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) })),

  addGoal: (g) => set((state) => ({ goals: [...state.goals, g] })),
  updateGoal: (g) =>
    set((state) => ({
      goals: state.goals.map((gl) => (gl.id === g.id ? g : gl)),
    })),
  deleteGoal: (id) =>
    set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),

  updateReminderSettings: (s) => set(() => ({ reminderSettings: s })),
  addReminderLog: (l) =>
    set((state) => ({ reminderLogs: [l, ...state.reminderLogs] })),
}))

export default useFinancialStore
