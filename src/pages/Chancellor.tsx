import { lazy, Suspense, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useModuleActivation } from '@/hooks/use-module-activation'
import useChancellorStore from '@/stores/useChancellorStore'
import { DashboardModuleLoader } from '@/components/DashboardModuleLoader'

const ChancellorOverview = lazy(() =>
  import('@/components/chancellor/ChancellorOverview').then((m) => ({
    default: m.ChancellorOverview,
  })),
)
const AttendanceManager = lazy(() =>
  import('@/components/chancellor/AttendanceManager').then((m) => ({
    default: m.AttendanceManager,
  })),
)
const DegreeManager = lazy(() =>
  import('@/components/chancellor/DegreeManager').then((m) => ({
    default: m.DegreeManager,
  })),
)
const ChancellorReports = lazy(() =>
  import('@/components/chancellor/ChancellorReports').then((m) => ({
    default: m.ChancellorReports,
  })),
)
const SolidsManager = lazy(() =>
  import('@/components/chancellor/SolidsManager').then((m) => ({
    default: m.SolidsManager,
  })),
)
const EventsManager = lazy(() =>
  import('@/components/chancellor/EventsManager').then((m) => ({
    default: m.EventsManager,
  })),
)
const VisitorCertificate = lazy(() =>
  import('@/components/chancellor/VisitorCertificate').then((m) => ({
    default: m.VisitorCertificate,
  })),
)

type ChancellorTabId =
  | 'overview'
  | 'attendance'
  | 'events'
  | 'solids'
  | 'degrees'
  | 'reports'
  | 'certificate'

const CHANCELLOR_TABS: { id: ChancellorTabId; label: string }[] = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'attendance', label: 'Presença' },
  { id: 'events', label: 'Agenda da Loja' },
  { id: 'solids', label: 'Sólidos' },
  { id: 'degrees', label: 'Controle de Graus' },
  { id: 'reports', label: 'Relatórios' },
  { id: 'certificate', label: 'Certificado de Visitante' },
]

function ChancellorTabPanel({
  active,
  children,
}: {
  active: boolean
  children: ReactNode
}) {
  if (!active) return null
  return <Suspense fallback={<DashboardModuleLoader />}>{children}</Suspense>
}

export default function Chancellor() {
  const [tab, setTab] = useState<ChancellorTabId>('overview')
  const fetchChancellorData = useChancellorStore((s) => s.fetchChancellorData)

  useModuleActivation(
    '/dashboard/chancellor',
    () => {
      void fetchChancellorData()
    },
    { refreshOnVisible: true },
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chancelaria</h2>
        <p className="text-muted-foreground">
          Gestão de presença, histórico de graus e tronco de beneficência.
        </p>
      </div>

      <div className="space-y-4">
        <div
          role="tablist"
          aria-label="Seções da chancelaria"
          className="inline-flex h-auto min-h-10 w-full flex-wrap items-center justify-start gap-1 rounded-md bg-muted p-1 text-muted-foreground sm:flex-nowrap sm:overflow-x-auto"
        >
          {CHANCELLOR_TABS.map(({ id, label }) => {
            const selected = tab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`chancellor-tab-${id}`}
                aria-controls={`chancellor-panel-${id}`}
                className={cn(
                  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  selected
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/60',
                )}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          id={`chancellor-panel-${tab}`}
          aria-labelledby={`chancellor-tab-${tab}`}
          className="mt-2 ring-offset-background focus-visible:outline-none"
        >
          <ChancellorTabPanel active={tab === 'overview'}>
            <ChancellorOverview />
          </ChancellorTabPanel>
          <ChancellorTabPanel active={tab === 'attendance'}>
            <AttendanceManager />
          </ChancellorTabPanel>
          <ChancellorTabPanel active={tab === 'events'}>
            <EventsManager />
          </ChancellorTabPanel>
          <ChancellorTabPanel active={tab === 'solids'}>
            <SolidsManager />
          </ChancellorTabPanel>
          <ChancellorTabPanel active={tab === 'degrees'}>
            <DegreeManager />
          </ChancellorTabPanel>
          <ChancellorTabPanel active={tab === 'reports'}>
            <ChancellorReports />
          </ChancellorTabPanel>
          <ChancellorTabPanel active={tab === 'certificate'}>
            <VisitorCertificate />
          </ChancellorTabPanel>
        </div>
      </div>
    </div>
  )
}
