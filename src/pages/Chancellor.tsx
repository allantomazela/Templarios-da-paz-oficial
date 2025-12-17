import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChancellorOverview } from '@/components/chancellor/ChancellorOverview'
import { AttendanceManager } from '@/components/chancellor/AttendanceManager'
import { DegreeManager } from '@/components/chancellor/DegreeManager'
import { ChancellorReports } from '@/components/chancellor/ChancellorReports'

export default function Chancellor() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chancelaria</h2>
        <p className="text-muted-foreground">
          Gestão de presença, histórico de graus e tronco de beneficência.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="attendance">Sessões e Presença</TabsTrigger>
          <TabsTrigger value="degrees">Controle de Graus</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ChancellorOverview />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceManager />
        </TabsContent>

        <TabsContent value="degrees">
          <DegreeManager />
        </TabsContent>

        <TabsContent value="reports">
          <ChancellorReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
