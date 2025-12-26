import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Profile } from '@/stores/useAuthStore'
import {
  User,
  Mail,
  Shield,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'

interface AccountInfoProps {
  profile: Profile
  createdAt?: string
  updatedAt?: string
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  member: 'Membro',
}

const statusLabels: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  blocked: 'Bloqueado',
}

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  blocked: 'bg-red-100 text-red-800 border-red-200',
}

const statusIcons: Record<string, typeof CheckCircle2> = {
  approved: CheckCircle2,
  pending: Clock,
  blocked: XCircle,
}

export function AccountInfo({
  profile,
  createdAt,
  updatedAt,
}: AccountInfoProps) {
  const StatusIcon = statusIcons[profile.status] || Clock

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Conta</CardTitle>
        <CardDescription>
          Informações sobre sua conta. Alguns dados não podem ser alterados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Shield className="h-4 w-4" />
              Função
            </div>
            <Badge variant="outline" className="text-sm">
              {roleLabels[profile.role] || profile.role}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <StatusIcon className="h-4 w-4" />
              Status
            </div>
            <Badge
              variant="outline"
              className={`text-sm ${statusColors[profile.status] || ''}`}
            >
              {statusLabels[profile.status] || profile.status}
            </Badge>
          </div>

          {createdAt && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Data de Criação
              </div>
              <p className="text-sm">
                {format(new Date(createdAt), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          )}

          {updatedAt && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Última Atualização
              </div>
              <p className="text-sm">
                {format(new Date(updatedAt), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          )}
        </div>

        {profile.status === 'pending' && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-900">
                  Conta Pendente de Aprovação
                </h4>
                <p className="text-sm text-yellow-800 mt-1">
                  Sua conta está aguardando aprovação de um administrador. Você
                  terá acesso completo após a aprovação.
                </p>
              </div>
            </div>
          </div>
        )}

        {profile.status === 'blocked' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900">
                  Conta Bloqueada
                </h4>
                <p className="text-sm text-red-800 mt-1">
                  Sua conta foi bloqueada. Entre em contato com um administrador
                  para mais informações.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

