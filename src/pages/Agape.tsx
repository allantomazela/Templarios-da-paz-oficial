import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { AgapeOverview } from '@/components/agape/AgapeOverview'
import { AgapeSessionsList } from '@/components/agape/AgapeSessionsList'
import { MenuItemsList } from '@/components/agape/MenuItemsList'
import { MonthlyReports } from '@/components/agape/MonthlyReports'
import { AgapeConsumptionSimple } from '@/components/agape/AgapeConsumptionSimple'
import { useAgapePermissions } from '@/hooks/use-agape-permissions'

export default function Agape() {
  const { fetchSessions, fetchMenuItems, fetchConsumptions } = useAgapeStore()
  const { isAgapeAdmin } = useAgapePermissions()

  useEffect(() => {
    fetchSessions()
    fetchMenuItems()
    fetchConsumptions()
  }, [fetchSessions, fetchMenuItems, fetchConsumptions])

  // Se não for admin, mostrar apenas a interface simplificada para inserir consumos
  if (!isAgapeAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ágape</h2>
          <p className="text-muted-foreground">
            Registre seus consumos nas sessões de ágape abertas.
          </p>
        </div>
        <AgapeConsumptionSimple />
      </div>
    )
  }

  // Interface completa para administradores
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ágape</h2>
        <p className="text-muted-foreground">
          Gestão de sessões de ágape, cardápio e consumo dos irmãos.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center overflow-x-auto">
          <TabsList className="w-full justify-start md:w-auto">
            <TabsTrigger value="overview">Dashboard</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="menu">Cardápio</TabsTrigger>
            <TabsTrigger value="reports">Relatórios Mensais</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <AgapeOverview />
        </TabsContent>

        <TabsContent value="sessions">
          <AgapeSessionsList />
        </TabsContent>

        <TabsContent value="menu">
          <MenuItemsList />
        </TabsContent>

        <TabsContent value="reports">
          <MonthlyReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
