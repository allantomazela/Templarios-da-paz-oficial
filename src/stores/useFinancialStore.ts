import { create } from 'zustand'
import {
  Transaction,
  Category,
  mockTransactions,
  mockCategories,
} from '@/lib/data'

interface FinancialState {
  transactions: Transaction[]
  categories: Category[]
  addTransaction: (t: Transaction) => void
  updateTransaction: (t: Transaction) => void
  deleteTransaction: (id: string) => void
  addCategory: (c: Category) => void
  updateCategory: (c: Category) => void
  deleteCategory: (id: string) => void
}

export const useFinancialStore = create<FinancialState>((set) => ({
  transactions: mockTransactions,
  categories: mockCategories,
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
}))

export default useFinancialStore
