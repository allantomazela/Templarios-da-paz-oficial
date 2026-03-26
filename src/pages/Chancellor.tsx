import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChancellorOverview } from '@/components/chancellor/ChancellorOverview'
import { AttendanceManager } from '@/components/chancellor/AttendanceManager'
import { DegreeManager } from '@/components/chancellor/DegreeManager'
import { ChancellorReports } from '@/components/chancellor/ChancellorReports'
import { SolidsManager } from '@/components/chancellor/SolidsManager'
import { EventsManager } from '@/components/chancellor/EventsManager'
import { VisitorCertificate } from '@/components/chancellor/VisitorCertificate'

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

export default function Chancellor() {
  const [tab, setTab] = useState<ChancellorTabId>('overview')

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
          {tab === 'overview' && <ChancellorOverview />}
          {tab === 'attendance' && <AttendanceManager />}
          {tab === 'events' && <EventsManager />}
          {tab === 'solids' && <SolidsManager />}
          {tab === 'degrees' && <DegreeManager />}
          {tab === 'reports' && <ChancellorReports />}
          {tab === 'certificate' && <VisitorCertificate />}
        </div>
      </div>
    </div>
  )
}
