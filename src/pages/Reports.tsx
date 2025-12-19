import { GOBAttendanceReport } from '@/components/reports/GOBAttendanceReport'
import { CustomReportBuilder } from '@/components/reports/CustomReportBuilder'
import { ReportHistory } from '@/components/reports/ReportHistory'
import { AnalyticsDashboard } from '@/components/reports/AnalyticsDashboard'
import { ReportScheduler } from '@/components/reports/ReportScheduler'
import { ReportAccessControl } from '@/components/reports/ReportAccessControl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  BarChart3,
  Settings,
  History,
  CalendarClock,
  Shield,
} from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import useReportStore from '@/stores/useReportStore'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Lock } from 'lucide-react'

export default function Reports() {
  const { user } = useAuthStore()
  const { permissions } = useReportStore()

  // Ensure role is valid, fallback to member
  const role = user?.role || 'member'

  // Get permissions for current user role
  const userPermission = permissions.find((p) => p.role === role) || {
    role: role,
    canViewReports: false,
    canViewAnalytics: false,
    canManageSchedules: false,
    canConfigureAccess: false,
  }

  // If user has no access at all
  if (!userPermission.canViewReports && !userPermission.canViewAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Alert variant="destructive" className="max-w-md">
          <Lock className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Seu perfil de usuário ({role}) não possui permissão para acessar o
            módulo de relatórios. Contate o administrador do sistema.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h2 className="text-3xl font-bold tracking-tight">
          Central de Relatórios
        </h2>
        <p className="text-muted-foreground">
          Geração de relatórios oficiais, análise de dados e automação.
        </p>
      </div>

      <Tabs
        defaultValue={userPermission.canViewReports ? 'gob' : 'stats'}
        className="space-y-4"
      >
        <div className="no-print overflow-x-auto">
          <TabsList>
            {userPermission.canViewReports && (
              <>
                <TabsTrigger value="gob">
                  <FileText className="mr-2 h-4 w-4" /> Relatórios GOB
                </TabsTrigger>
                <TabsTrigger value="custom">
                  <Settings className="mr-2 h-4 w-4" /> Personalizado
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="mr-2 h-4 w-4" /> Histórico
                </TabsTrigger>
              </>
            )}

            {userPermission.canViewAnalytics && (
              <TabsTrigger value="stats">
                <BarChart3 className="mr-2 h-4 w-4" /> Análise e KPIs
              </TabsTrigger>
            )}

            {userPermission.canManageSchedules && (
              <TabsTrigger value="scheduler">
                <CalendarClock className="mr-2 h-4 w-4" /> Agendamentos
              </TabsTrigger>
            )}

            {userPermission.canConfigureAccess && (
              <TabsTrigger value="access">
                <Shield className="mr-2 h-4 w-4" /> Controle de Acesso
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {userPermission.canViewReports && (
          <>
            <TabsContent value="gob">
              <GOBAttendanceReport />
            </TabsContent>

            <TabsContent value="custom">
              <CustomReportBuilder />
            </TabsContent>

            <TabsContent value="history">
              <ReportHistory />
            </TabsContent>
          </>
        )}

        {userPermission.canViewAnalytics && (
          <TabsContent value="stats">
            <AnalyticsDashboard />
          </TabsContent>
        )}

        {userPermission.canManageSchedules && (
          <TabsContent value="scheduler">
            <ReportScheduler />
          </TabsContent>
        )}

        {userPermission.canConfigureAccess && (
          <TabsContent value="access">
            <ReportAccessControl />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
