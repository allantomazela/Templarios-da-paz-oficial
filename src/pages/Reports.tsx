import { GOBAttendanceReport } from '@/components/reports/GOBAttendanceReport'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, BarChart3 } from 'lucide-react'

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="no-print">
        <h2 className="text-3xl font-bold tracking-tight">
          Central de Relatórios
        </h2>
        <p className="text-muted-foreground">
          Geração de relatórios oficiais e estatísticas da loja.
        </p>
      </div>

      <Tabs defaultValue="gob" className="space-y-4">
        <div className="no-print overflow-x-auto">
          <TabsList>
            <TabsTrigger value="gob">
              <FileText className="mr-2 h-4 w-4" /> Relatórios GOB
            </TabsTrigger>
            <TabsTrigger value="stats" disabled>
              <BarChart3 className="mr-2 h-4 w-4" /> Estatísticas (Em breve)
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="gob">
          <GOBAttendanceReport />
        </TabsContent>

        <TabsContent value="stats">
          {/* Placeholder for future expansion */}
          <div className="flex items-center justify-center h-48 border rounded-md bg-muted/10">
            <p className="text-muted-foreground">
              Módulo de estatísticas em desenvolvimento.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
