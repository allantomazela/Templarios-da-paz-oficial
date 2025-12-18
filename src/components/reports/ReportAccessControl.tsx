import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import useReportStore from '@/stores/useReportStore'
import { ShieldAlert } from 'lucide-react'

export function ReportAccessControl() {
  const { permissions, updatePermission } = useReportStore()

  const handleToggle = (
    role: string,
    field: keyof (typeof permissions)[0],
    value: boolean,
  ) => {
    const permission = permissions.find((p) => p.role === role)
    if (permission) {
      updatePermission({ ...permission, [field]: value })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
        <ShieldAlert className="h-5 w-5 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-semibold text-sm">Zona de Segurança</h4>
          <p className="text-sm">
            Alterações aqui afetam imediatamente quem pode visualizar dados
            sensíveis da loja. Certifique-se de conceder acesso apenas a quem
            realmente necessita.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controle de Acesso por Função</CardTitle>
          <CardDescription>
            Defina quais módulos do sistema de relatórios cada cargo pode
            acessar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo / Função</TableHead>
                <TableHead className="text-center">
                  Visualizar Relatórios
                </TableHead>
                <TableHead className="text-center">Painel Analítico</TableHead>
                <TableHead className="text-center">Gerenciar Envios</TableHead>
                <TableHead className="text-center">Configurar Acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((p) => (
                <TableRow key={p.role}>
                  <TableCell className="font-medium">{p.role}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={p.canViewReports}
                        onCheckedChange={(c) =>
                          handleToggle(p.role, 'canViewReports', c)
                        }
                        disabled={p.role === 'Administrador'} // Admin always has access
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={p.canViewAnalytics}
                        onCheckedChange={(c) =>
                          handleToggle(p.role, 'canViewAnalytics', c)
                        }
                        disabled={p.role === 'Administrador'}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={p.canManageSchedules}
                        onCheckedChange={(c) =>
                          handleToggle(p.role, 'canManageSchedules', c)
                        }
                        disabled={p.role === 'Administrador'}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={p.canConfigureAccess}
                        onCheckedChange={(c) =>
                          handleToggle(p.role, 'canConfigureAccess', c)
                        }
                        disabled={p.role === 'Administrador'}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
