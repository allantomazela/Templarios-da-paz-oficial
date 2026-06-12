import { useEffect, useState } from 'react'
import { Brother } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { ptBR } from 'date-fns/locale'
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Wallet,
} from 'lucide-react'
import {
  fetchContributionsForProfile,
  fetchMembershipFeeSettings,
  resolveProfileIdByEmail,
} from '@/lib/contribution-payments'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { formatCalendarDate } from '@/lib/format-utils'
import type { Contribution } from '@/lib/data'

interface BrotherMembershipPanelProps {
  brother: Brother
  open: boolean
}

function statusBadge(status: Contribution['status']) {
  if (status === 'Pago') {
    return (
      <Badge className="bg-green-600 hover:bg-green-700">{status}</Badge>
    )
  }
  if (status === 'Atrasado') {
    return <Badge variant="destructive">{status}</Badge>
  }
  return <Badge variant="secondary">{status}</Badge>
}

export function BrotherMembershipPanel({
  brother,
  open,
}: BrotherMembershipPanelProps) {
  const [loading, setLoading] = useState(false)
  const [profileLinked, setProfileLinked] = useState<boolean | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [dueDay, setDueDay] = useState(10)

  useEffect(() => {
    if (!open || !brother) {
      setContributions([])
      setProfileLinked(null)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const settings = await fetchMembershipFeeSettings()
        if (cancelled) return
        setDueDay(settings.dueDay)

        let profileId = brother.profileId ?? null
        if (!profileId) {
          profileId = await resolveProfileIdByEmail(brother.email)
        }

        if (!profileId) {
          setProfileLinked(false)
          setContributions([])
          return
        }

        setProfileLinked(true)
        const rows = await fetchContributionsForProfile(profileId)
        if (!cancelled) setContributions(rows)
      } catch (error) {
        console.error('Erro ao carregar mensalidades do irmão:', error)
        if (!cancelled) {
          setProfileLinked(false)
          setContributions([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [brother.profileId, brother.email, open])

  const pending = contributions.filter((c) => c.status !== 'Pago')
  const paid = contributions.filter((c) => c.status === 'Pago')
  const totalPaid = paid.reduce((s, c) => s + c.amount, 0)
  const totalPending = pending.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1 flex items-center gap-2">
        <Wallet className="h-4 w-4" />
        Mensalidades
      </h4>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : profileLinked === false ? (
        <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
          Nenhuma conta vinculada. Edite o cadastro do irmão e selecione a{' '}
          <strong>conta no sistema</strong>, ou use o mesmo e-mail de um usuário
          aprovado ({brother.email || 'sem e-mail'}).
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Total pago</p>
              <p className="font-semibold text-green-600">
                {formatCurrencyBRL(totalPaid)}
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Em aberto</p>
              <p className="font-semibold text-amber-600">
                {formatCurrencyBRL(totalPending)}
              </p>
            </div>
          </div>

          {pending.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Nenhuma mensalidade pendente.
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 text-sm mb-1">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {pending.length} pendência(s) — vencimento dia {dueDay}
            </div>
          )}

          {contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum lançamento de mensalidade registrado.
            </p>
          ) : (
            <div className="rounded-md border max-h-56 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Ref.</th>
                    <th className="text-left p-2 font-medium">Valor</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Pagto.</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-2">
                        {c.month}/{c.year}
                      </td>
                      <td className="p-2 font-mono">
                        {formatCurrencyBRL(c.amount)}
                      </td>
                      <td className="p-2">{statusBadge(c.status)}</td>
                      <td className="p-2 text-muted-foreground">
                        {c.paymentDate
                          ? formatCalendarDate(c.paymentDate, 'dd/MM/yy', {
                              locale: ptBR,
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
