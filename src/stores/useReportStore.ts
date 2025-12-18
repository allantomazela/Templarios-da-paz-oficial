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

export interface ReportSchedule {
  id: string
  frequency: 'Diário' | 'Semanal' | 'Mensal'
  recipients: string[]
  templateId: string
  active: boolean
}

export interface ReportPermission {
  role: string
  canViewReports: boolean
  canViewAnalytics: boolean
  canManageSchedules: boolean
  canConfigureAccess: boolean
}

interface ReportState {
  templates: ReportTemplate[]
  history: ReportLog[]
  schedules: ReportSchedule[]
  permissions: ReportPermission[]
  addTemplate: (template: ReportTemplate) => void
  deleteTemplate: (id: string) => void
  addHistory: (log: ReportLog) => void
  clearHistory: () => void
  addSchedule: (schedule: ReportSchedule) => void
  updateSchedule: (schedule: ReportSchedule) => void
  deleteSchedule: (id: string) => void
  updatePermission: (permission: ReportPermission) => void
}

const defaultPermissions: ReportPermission[] = [
  {
    role: 'Administrador',
    canViewReports: true,
    canViewAnalytics: true,
    canManageSchedules: true,
    canConfigureAccess: true,
  },
  {
    role: 'Venerável Mestre',
    canViewReports: true,
    canViewAnalytics: true,
    canManageSchedules: true,
    canConfigureAccess: false,
  },
  {
    role: 'Secretário',
    canViewReports: true,
    canViewAnalytics: true,
    canManageSchedules: true,
    canConfigureAccess: false,
  },
  {
    role: 'Chanceler',
    canViewReports: true,
    canViewAnalytics: true,
    canManageSchedules: false,
    canConfigureAccess: false,
  },
  {
    role: 'Tesoureiro',
    canViewReports: false,
    canViewAnalytics: false,
    canManageSchedules: false,
    canConfigureAccess: false,
  },
  {
    role: 'Irmão',
    canViewReports: false,
    canViewAnalytics: false,
    canManageSchedules: false,
    canConfigureAccess: false,
  },
]

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
  schedules: [
    {
      id: '1',
      frequency: 'Mensal',
      recipients: ['secretaria@loja.com'],
      templateId: '1',
      active: true,
    },
  ],
  permissions: defaultPermissions,

  addTemplate: (template) =>
    set((state) => ({ templates: [...state.templates, template] })),
  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),
  addHistory: (log) => set((state) => ({ history: [log, ...state.history] })),
  clearHistory: () => set({ history: [] }),

  addSchedule: (schedule) =>
    set((state) => ({ schedules: [...state.schedules, schedule] })),
  updateSchedule: (schedule) =>
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === schedule.id ? schedule : s,
      ),
    })),
  deleteSchedule: (id) =>
    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== id),
    })),

  updatePermission: (permission) =>
    set((state) => ({
      permissions: state.permissions.map((p) =>
        p.role === permission.role ? permission : p,
      ),
    })),
}))

export default useReportStore
