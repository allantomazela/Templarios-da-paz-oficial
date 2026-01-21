import { create } from 'zustand'
import {
  Transaction,
  Category,
  Contribution,
  Budget,
  FinancialGoal,
  ReminderSettings,
  ReminderLog,
  BankAccount,
} from '@/lib/data'
import { supabase } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'
import {
  mapBankAccountFromDB,
  mapBankAccountToDB,
  mapCategoryFromDB,
  mapCategoryToDB,
  mapTransactionFromDB,
  mapTransactionToDB,
  mapBudgetFromDB,
  mapBudgetToDB,
  mapFinancialGoalFromDB,
  mapFinancialGoalToDB,
  mapContributionFromDB,
  mapContributionToDB,
} from '@/lib/financial-mappers'

interface FinancialState {
  transactions: Transaction[]
  categories: Category[]
  contributions: Contribution[]
  budgets: Budget[]
  goals: FinancialGoal[]
  accounts: BankAccount[]
  reminderSettings: ReminderSettings
  reminderLogs: ReminderLog[]
  loading: boolean

  // Fetch methods
  fetchTransactions: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchContributions: () => Promise<void>
  fetchBudgets: () => Promise<void>
  fetchGoals: () => Promise<void>
  fetchAccounts: () => Promise<void>
  fetchAll: () => Promise<void>

  // Transaction methods
  addTransaction: (t: Transaction) => Promise<void>
  updateTransaction: (t: Transaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>

  // Category methods
  addCategory: (c: Category) => Promise<void>
  updateCategory: (c: Category) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  // Contribution methods
  addContribution: (c: Contribution) => Promise<void>
  updateContribution: (c: Contribution) => Promise<void>
  deleteContribution: (id: string) => Promise<void>

  // Budget methods
  addBudget: (b: Budget) => Promise<void>
  updateBudget: (b: Budget) => Promise<void>
  deleteBudget: (id: string) => Promise<void>

  // Goal methods
  addGoal: (g: FinancialGoal) => Promise<void>
  updateGoal: (g: FinancialGoal) => Promise<void>
  deleteGoal: (id: string) => Promise<void>

  // Account methods
  addAccount: (a: BankAccount) => Promise<void>
  updateAccount: (a: BankAccount) => Promise<void>
  deleteAccount: (id: string) => Promise<void>

  // Reminder methods (still local for now)
  updateReminderSettings: (s: ReminderSettings) => void
  addReminderLog: (l: ReminderLog) => void
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  transactions: [],
  categories: [],
  contributions: [],
  budgets: [],
  goals: [],
  accounts: [],
  reminderSettings: {
    enabled: false,
    frequency: 'before',
    days: 3,
  },
  reminderLogs: [],
  loading: false,

  // ========== FETCH METHODS ==========
  fetchTransactions: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      if (data) {
        set({ transactions: data.map(mapTransactionFromDB) })
      }
    } catch (error) {
      logError('Error fetching transactions:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchCategories: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      if (data) {
        set({ categories: data.map(mapCategoryFromDB) })
      }
    } catch (error) {
      logError('Error fetching categories:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchContributions: async () => {
    set({ loading: true })
    try {
      // Verificar se a tabela contributions existe
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (error) {
        // Se a tabela não existir, não é um erro crítico
        if (error.code === 'PGRST116' || error.code === '42P01') {
          logError('Contributions table does not exist yet', error)
          set({ contributions: [] })
          return
        }
        throw error
      }

      if (data) {
        set({ contributions: data.map(mapContributionFromDB) })
      }
    } catch (error) {
      logError('Error fetching contributions:', error)
      set({ contributions: [] })
    } finally {
      set({ loading: false })
    }
  },

  fetchBudgets: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('financial_budgets')
        .select('*')
        .order('period_start', { ascending: false })

      if (error) throw error

      if (data) {
        set({ budgets: data.map(mapBudgetFromDB) })
      }
    } catch (error) {
      logError('Error fetching budgets:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchGoals: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .order('deadline', { ascending: true })

      if (error) throw error

      if (data) {
        set({ goals: data.map(mapFinancialGoalFromDB) })
      }
    } catch (error) {
      logError('Error fetching goals:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchAccounts: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('financial_accounts')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      if (data) {
        set({ accounts: data.map(mapBankAccountFromDB) })
      }
    } catch (error) {
      logError('Error fetching accounts:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchAll: async () => {
    set({ loading: true })
    try {
      await Promise.all([
        get().fetchTransactions(),
        get().fetchCategories(),
        get().fetchContributions(),
        get().fetchBudgets(),
        get().fetchGoals(),
        get().fetchAccounts(),
      ])
    } catch (error) {
      logError('Error fetching all financial data:', error)
    } finally {
      set({ loading: false })
    }
  },

  // ========== TRANSACTION METHODS ==========
  addTransaction: async (t) => {
    try {
      const dbData = mapTransactionToDB(t)
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const mapped = mapTransactionFromDB(data)
        set((state) => ({ transactions: [mapped, ...state.transactions] }))
      }
    } catch (error) {
      logError('Error adding transaction:', error)
      throw error
    }
  },

  updateTransaction: async (t) => {
    try {
      const dbData = mapTransactionToDB(t)
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(dbData)
        .eq('id', t.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const mapped = mapTransactionFromDB(data)
        set((state) => ({
          transactions: state.transactions.map((tr) =>
            tr.id === t.id ? mapped : tr,
          ),
        }))
      }
    } catch (error) {
      logError('Error updating transaction:', error)
      throw error
    }
  },

  deleteTransaction: async (id) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }))
    } catch (error) {
      logError('Error deleting transaction:', error)
      throw error
    }
  },

  // ========== CATEGORY METHODS ==========
  addCategory: async (c) => {
    try {
      const dbData = mapCategoryToDB(c)
      const { data, error } = await supabase
        .from('financial_categories')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const mapped = mapCategoryFromDB(data)
        set((state) => ({ categories: [...state.categories, mapped] }))
      }
    } catch (error) {
      logError('Error adding category:', error)
      throw error
    }
  },

  updateCategory: async (c) => {
    try {
      const dbData = mapCategoryToDB(c)
      const { data, error } = await supabase
        .from('financial_categories')
        .update(dbData)
        .eq('id', c.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const mapped = mapCategoryFromDB(data)
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === c.id ? mapped : cat,
          ),
        }))
      }
    } catch (error) {
      logError('Error updating category:', error)
      throw error
    }
  },

  deleteCategory: async (id) => {
    try {
      const { error } = await supabase
        .from('financial_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }))
    } catch (error) {
      logError('Error deleting category:', error)
      throw error
    }
  },

  // ========== CONTRIBUTION METHODS ==========
  addContribution: async (c) => {
    try {
      const dbData = mapContributionToDB(c)
      const { data, error } = await supabase
        .from('contributions')
        .insert(dbData)
        .select()
        .single()

      if (error) {
        // Se a tabela não existir, não é um erro crítico
        if (error.code === 'PGRST116' || error.code === '42P01') {
          logError('Contributions table does not exist yet', error)
          // Ainda atualiza o estado local para não quebrar a UI
          set((state) => ({ contributions: [...state.contributions, c] }))
          return
        }
        throw error
      }

      if (data) {
        const mapped = mapContributionFromDB(data)
        set((state) => ({ contributions: [...state.contributions, mapped] }))
      }
    } catch (error) {
      logError('Error adding contribution:', error)
      throw error
    }
  },

  updateContribution: async (c) => {
    try {
      const dbData = mapContributionToDB(c)
      const { data, error } = await supabase
        .from('contributions')
        .update(dbData)
        .eq('id', c.id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          logError('Contributions table does not exist yet', error)
          set((state) => ({
            contributions: state.contributions.map((con) =>
              con.id === c.id ? c : con,
            ),
          }))
          return
        }
        throw error
      }

      if (data) {
        const mapped = mapContributionFromDB(data)
        set((state) => ({
          contributions: state.contributions.map((con) =>
            con.id === c.id ? mapped : con,
          ),
        }))
      }
    } catch (error) {
      logError('Error updating contribution:', error)
      throw error
    }
  },

  deleteContribution: async (id) => {
    try {
      const { error } = await supabase
        .from('contributions')
        .delete()
        .eq('id', id)

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          logError('Contributions table does not exist yet', error)
          set((state) => ({
            contributions: state.contributions.filter((c) => c.id !== id),
          }))
          return
        }
        throw error
      }

      set((state) => ({
        contributions: state.contributions.filter((c) => c.id !== id),
      }))
    } catch (error) {
      logError('Error deleting contribution:', error)
      throw error
    }
  },

  // ========== BUDGET METHODS ==========
  addBudget: async (b) => {
    try {
      const dbData = mapBudgetToDB(b)
      const { data, error } = await supabase
        .from('financial_budgets')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const mapped = mapBudgetFromDB(data)
        set((state) => ({ budgets: [...state.budgets, mapped] }))
      }
    } catch (error) {
      logError('Error adding budget:', error)
      throw error
    }
  },

  updateBudget: async (b) => {
    try {
      const dbData = mapBudgetToDB(b)
      const { data, error } = await supabase
        .from('financial_budgets')
        .update(dbData)
        .eq('id', b.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const mapped = mapBudgetFromDB(data)
        set((state) => ({
          budgets: state.budgets.map((bg) => (bg.id === b.id ? mapped : bg)),
        }))
      }
    } catch (error) {
      logError('Error updating budget:', error)
      throw error
    }
  },

  deleteBudget: async (id) => {
    try {
      const { error } = await supabase
        .from('financial_budgets')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        budgets: state.budgets.filter((b) => b.id !== id),
      }))
    } catch (error) {
      logError('Error deleting budget:', error)
      throw error
    }
  },

  // ========== GOAL METHODS ==========
  addGoal: async (g) => {
    try {
      const dbData = mapFinancialGoalToDB(g)
      const { data, error } = await supabase
        .from('financial_goals')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const mapped = mapFinancialGoalFromDB(data)
        set((state) => ({ goals: [...state.goals, mapped] }))
      }
    } catch (error) {
      logError('Error adding goal:', error)
      throw error
    }
  },

  updateGoal: async (g) => {
    try {
      const dbData = mapFinancialGoalToDB(g)
      const { data, error } = await supabase
        .from('financial_goals')
        .update(dbData)
        .eq('id', g.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const mapped = mapFinancialGoalFromDB(data)
        set((state) => ({
          goals: state.goals.map((gl) => (gl.id === g.id ? mapped : gl)),
        }))
      }
    } catch (error) {
      logError('Error updating goal:', error)
      throw error
    }
  },

  deleteGoal: async (id) => {
    try {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }))
    } catch (error) {
      logError('Error deleting goal:', error)
      throw error
    }
  },

  // ========== ACCOUNT METHODS ==========
  addAccount: async (a) => {
    try {
      const dbData = mapBankAccountToDB(a)
      const { data, error } = await supabase
        .from('financial_accounts')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const mapped = mapBankAccountFromDB(data)
        set((state) => ({ accounts: [...state.accounts, mapped] }))
      }
    } catch (error) {
      logError('Error adding account:', error)
      throw error
    }
  },

  updateAccount: async (a) => {
    try {
      const dbData = mapBankAccountToDB(a)
      const { data, error } = await supabase
        .from('financial_accounts')
        .update(dbData)
        .eq('id', a.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const mapped = mapBankAccountFromDB(data)
        set((state) => ({
          accounts: state.accounts.map((acc) => (acc.id === a.id ? mapped : acc)),
        }))
      }
    } catch (error) {
      logError('Error updating account:', error)
      throw error
    }
  },

  deleteAccount: async (id) => {
    try {
      const { error } = await supabase
        .from('financial_accounts')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id),
      }))
    } catch (error) {
      logError('Error deleting account:', error)
      throw error
    }
  },

  // ========== REMINDER METHODS (still local) ==========
  updateReminderSettings: (s) => set(() => ({ reminderSettings: s })),
  addReminderLog: (l) =>
    set((state) => ({ reminderLogs: [l, ...state.reminderLogs] })),
}))

export default useFinancialStore
