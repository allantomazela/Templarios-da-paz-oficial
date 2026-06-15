import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, Wallet } from 'lucide-react'
import {
  fetchBrotherAccessInfo,
  formatLodgePositionLabel,
  formatSystemRoleLabel,
  type BrotherAccessInfo,
} from '@/lib/brother-profile-access'
import { resolveProfileIdByEmail } from '@/lib/contribution-payments'

interface BrotherAccessInfoPanelProps {
  profileId?: string | null
  email?: string | null
  compact?: boolean
}

export function BrotherAccessInfoPanel({
  profileId,
  email,
  compact = false,
}: BrotherAccessInfoPanelProps) {
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<BrotherAccessInfo | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        let resolvedId = profileId ?? null
        if (!resolvedId && email) {
          resolvedId = await resolveProfileIdByEmail(email)
        }
        if (!resolvedId) {
          if (!cancelled) setInfo(null)
          return
        }

        const data = await fetchBrotherAccessInfo(resolvedId)
        if (!cancelled) setInfo(data)
      } catch (error) {
        console.error('Erro ao carregar papéis do irmão:', error)
        if (!cancelled) setInfo(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [profileId, email])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando papéis no sistema...
      </div>
    )
  }

  if (!info) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem conta vinculada no sistema — papéis administrativos não disponíveis.
      </p>
    )
  }

  const hasRoles =
    info.isFinancialStaff ||
    info.lodgePositions.length > 0 ||
    info.systemRole === 'member'

  if (!hasRoles && compact) return null

  return (
    <div className="space-y-2">
      {!compact && (
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Papéis no sistema
        </h4>
      )}

      <div className="flex flex-wrap gap-2">
        {info.systemRole && (
          <Badge variant={info.isSystemAdmin ? 'default' : 'secondary'}>
            {formatSystemRoleLabel(info.systemRole)}
          </Badge>
        )}
        {info.isTreasurer && (
          <Badge className="bg-emerald-700 hover:bg-emerald-800">
            <Wallet className="mr-1 h-3 w-3" />
            Tesoureiro da loja
          </Badge>
        )}
        {info.lodgePositions
          .filter((p) => p !== 'tesoureiro')
          .map((position) => (
            <Badge key={position} variant="outline">
              {formatLodgePositionLabel(position)}
            </Badge>
          ))}
      </div>

      {info.isFinancialStaff && (
        <p className="text-xs text-muted-foreground">
          Este irmão possui acesso à tesouraria ou gestão financeira do sistema.
        </p>
      )}
    </div>
  )
}
