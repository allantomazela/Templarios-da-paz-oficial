import { create } from 'zustand'

export interface ReportTemplate {
  id: string
  name: string
  columns: {
    name: boolean
    degree: boolean
    presences: boolean
    percentage: boolean
    status: boolean
    role: boolean
  }
  filterDegree: string
}

export interface ReportLog {
  id: string
  title: string
  date: string
  templateName: string
  type: 'GOB' | 'Personalizado'
}

interface ReportState {
  templates: ReportTemplate[]
  history: ReportLog[]
  addTemplate: (template: ReportTemplate) => void
  deleteTemplate: (id: string) => void
  addHistory: (log: ReportLog) => void
  clearHistory: () => void
}

export const useReportStore = create<ReportState>((set) => ({
  templates: [
    {
      id: '1',
      name: 'Padrão Completo',
      columns: {
        name: true,
        degree: true,
        presences: true,
        percentage: true,
        status: true,
        role: true,
      },
      filterDegree: 'all',
    },
    {
      id: '2',
      name: 'Resumo de Frequência',
      columns: {
        name: true,
        degree: false,
        presences: false,
        percentage: true,
        status: false,
        role: false,
      },
      filterDegree: 'all',
    },
  ],
  history: [
    {
      id: '1',
      title: 'Relatório de Presença - Sessão Magna',
      date: new Date(Date.now() - 86400000).toISOString(),
      templateName: 'Modelo GOB',
      type: 'GOB',
    },
  ],
  addTemplate: (template) =>
    set((state) => ({ templates: [...state.templates, template] })),
  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),
  addHistory: (log) => set((state) => ({ history: [log, ...state.history] })),
  clearHistory: () => set({ history: [] }),
}))

export default useReportStore
