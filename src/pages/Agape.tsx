import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { useModuleActivation } from '@/hooks/use-module-activation'
import { AgapeOverview } from '@/components/agape/AgapeOverview'
import { AgapeSessionsList } from '@/components/agape/AgapeSessionsList'
import { MenuItemsList } from '@/components/agape/MenuItemsList'
import { MonthlyReports } from '@/components/agape/MonthlyReports'
import { AgapeConsumptionSimple } from '@/components/agape/AgapeConsumptionSimple'
import { AgapeRecordPanel } from '@/components/agape/AgapeRecordPanel'
import { AgapeMaintenancePanel } from '@/components/agape/AgapeMaintenancePanel'
import { useAgapePermissions } from '@/hooks/use-agape-permissions'

type AgapeTab =
  | 'overview'
  | 'sessions'
  | 'menu'
  | 'record'
  | 'reports'
  | 'maintenance'

export default function Agape() {
  const hydrateModule = useAgapeStore((s) => s.hydrateModule)
  const { isAgapeController, canRecordConsumption } = useAgapePermissions()
  const [activeTab, setActiveTab] = useState<AgapeTab>('overview')

  useModuleActivation(
    '/dashboard/agape',
    () => {
      void hydrateModule()
    },
    { refreshOnVisible: true },
  )

  if (isAgapeController) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ágape</h2>
          <p className="text-muted-foreground">
            Controle do ágape pelo Mestre de Banquete: sessões, cardápio,
            lançamento de consumos e relatórios. Cada lançamento registra quem
            realizou a inserção.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as AgapeTab)}
          className="space-y-4"
        >
          <div className="flex items-center overflow-x-auto">
            <TabsList className="w-full justify-start md:w-auto">
              <TabsTrigger value="overview">Dashboard</TabsTrigger>
              <TabsTrigger value="sessions">Sessões</TabsTrigger>
              <TabsTrigger value="menu">Cardápio</TabsTrigger>
              <TabsTrigger value="record">Registrar consumos</TabsTrigger>
              <TabsTrigger value="reports">Relatórios Mensais</TabsTrigger>
              <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            {activeTab === 'overview' ? <AgapeOverview /> : null}
          </TabsContent>

          <TabsContent value="sessions">
            {activeTab === 'sessions' ? <AgapeSessionsList /> : null}
          </TabsContent>

          <TabsContent value="menu">
            {activeTab === 'menu' ? <MenuItemsList /> : null}
          </TabsContent>

          <TabsContent value="record">
            {activeTab === 'record' ? <AgapeRecordPanel /> : null}
          </TabsContent>

          <TabsContent value="reports">
            {activeTab === 'reports' ? <MonthlyReports /> : null}
          </TabsContent>

          <TabsContent value="maintenance">
            {activeTab === 'maintenance' ? <AgapeMaintenancePanel /> : null}
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  if (canRecordConsumption) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ágape</h2>
          <p className="text-muted-foreground">
            Registre os consumos dos irmãos nas sessões abertas. O controle das
            sessões e do cardápio é do Mestre de Banquete.
          </p>
        </div>
        <AgapeRecordPanel />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ágape</h2>
        <p className="text-muted-foreground">
          Registre seus consumos nas sessões abertas. A diretoria e o Mestre de
          Banquete também podem lançar em seu nome.
        </p>
      </div>
      <AgapeConsumptionSimple />
    </div>
  )
}
