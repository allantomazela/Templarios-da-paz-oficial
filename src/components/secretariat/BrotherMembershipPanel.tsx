import { useEffect, useMemo, useState } from 'react'
import { Brother } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import {
  buildMembershipScheduleForBrother,
  type MembershipFeeScheduleSettings,
} from '@/lib/membership-schedule'
import { MEMBERSHIP_LABELS } from '@/lib/membership-labels'
import { MembershipScheduleTable } from '@/components/financial/MembershipScheduleTable'
import { supabase } from '@/lib/supabase/client'
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
  const [profileId, setProfileId] = useState<string | null>(null)
  const [memberSince, setMemberSince] = useState<string | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [feeSettings, setFeeSettings] = useState<MembershipFeeScheduleSettings>({
    defaultAmount: 0,
    dueDay: 10,
  })

  useEffect(() => {
    if (!open || !brother) {
      setContributions([])
      setProfileLinked(null)
      setProfileId(null)
      setMemberSince(null)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const settings = await fetchMembershipFeeSettings()
        if (cancelled) return
        setFeeSettings(settings)

        let resolvedProfileId = brother.profileId ?? null
        if (!resolvedProfileId) {
          resolvedProfileId = await resolveProfileIdByEmail(brother.email)
        }

        if (!resolvedProfileId) {
          setProfileLinked(false)
          setProfileId(null)
          setContributions([])
          setMemberSince(null)
          return
        }

        const supabaseAny = supabase as any
        const [{ data: profileRow }, rows] = await Promise.all([
          supabaseAny
            .from('profiles')
            .select('created_at')
            .eq('id', resolvedProfileId)
            .maybeSingle(),
          fetchContributionsForProfile(resolvedProfileId),
        ])

        if (cancelled) return

        setProfileLinked(true)
        setProfileId(resolvedProfileId)
        setMemberSince(profileRow?.created_at ?? null)
        setContributions(rows)
      } catch (error) {
        console.error('Erro ao carregar mensalidades do irmão:', error)
        if (!cancelled) {
          setProfileLinked(false)
          setProfileId(null)
          setContributions([])
          setMemberSince(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [brother, open])

  const schedule = useMemo(() => {
    if (!profileId || profileLinked !== true) return null
    return buildMembershipScheduleForBrother(
      profileId,
      brother.name,
      contributions,
      feeSettings,
      memberSince,
    )
  }, [
    profileId,
    profileLinked,
    brother.name,
    contributions,
    feeSettings,
    memberSince,
  ])

  const pending = contributions.filter((c) => c.status !== 'Pago')
  const paid = contributions.filter((c) => c.status === 'Pago')
  const totalPaid = schedule?.totalPaid ?? paid.reduce((s, c) => s + c.amount, 0)
  const totalPending = schedule?.totalOpen ?? pending.reduce((s, c) => s + c.amount, 0)
  const overdueCount = schedule?.overdueMonthCount ?? 0

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
          {overdueCount > 0 ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Mensalidades em atraso</AlertTitle>
              <AlertDescription>
                {overdueCount} mês(es) em atraso — total{' '}
                {formatCurrencyBRL(schedule?.totalOverdue ?? 0)}. Meses fechados
                sem pagamento.
              </AlertDescription>
            </Alert>
          ) : schedule && schedule.entries.length > 0 ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Cronograma em dia — mensalidade do mês pode ser paga a qualquer dia.
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Total pago</p>
              <p className="font-semibold text-green-600">
                {formatCurrencyBRL(totalPaid)}
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{MEMBERSHIP_LABELS.upcoming}</p>
              <p className="font-semibold text-amber-600">
                {formatCurrencyBRL(totalPending)}
              </p>
            </div>
          </div>

          {schedule && schedule.entries.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Cronograma
              </p>
              <MembershipScheduleTable
                entries={schedule.entries}
                emptyMessage="Nenhum período no cronograma."
              />
            </div>
          )}

          {contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum lançamento de mensalidade registrado.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Lançamentos
              </p>
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
            </div>
          )}
        </>
      )}
    </div>
  )
}
