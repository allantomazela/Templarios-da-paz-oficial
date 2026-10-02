import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  fetchApprovedBrothers,
  fetchContributionsWithProfiles,
  fetchMembershipFeeSettings,
} from '@/lib/contribution-payments'
import {
  buildAllMembershipSchedules,
  buildMembershipScheduleForBrother,
  type MembershipFeeScheduleSettings,
} from '@/lib/membership-schedule'
import {
  buildMembershipBrotherStatementData,
  buildMembershipOverdueReportData,
} from '@/lib/membership-report'
import { fetchMemberPayments } from '@/lib/member-payments'
import { MembershipOpenReportPanel } from '@/components/financial/MembershipOpenReportPanel'
import { MembershipPaidByBrotherReportPanel } from '@/components/financial/MembershipPaidByBrotherReportPanel'
import { MembershipOverdueReportSection } from './MembershipOverdueReportSection'
import { MembershipBrotherStatementSection } from './MembershipBrotherStatementSection'

export function MembershipReports() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('em-aberto')
  const [selectedBrotherId, setSelectedBrotherId] = useState('')
  const [brothers, setBrothers] = useState<
    Awaited<ReturnType<typeof fetchApprovedBrothers>>
  >([])
  const [brotherNames, setBrotherNames] = useState<Record<string, string>>({})
  const [schedules, setSchedules] = useState<ReturnType<typeof buildAllMembershipSchedules>>([])
  const [contributions, setContributions] = useState<
    Awaited<ReturnType<typeof fetchContributionsWithProfiles>>['contributions']
  >([])
  const [feeSettings, setFeeSettings] = useState<MembershipFeeScheduleSettings | null>(null)
  const [brotherMemberPayments, setBrotherMemberPayments] = useState<
    Awaited<ReturnType<typeof fetchMemberPayments>>
  >([])
  const [loadingBrotherPayments, setLoadingBrotherPayments] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setLoading(true)
      try {
        const [contribResult, approvedBrothers, loadedFeeSettings] = await Promise.all([
          fetchContributionsWithProfiles(),
          fetchApprovedBrothers(),
          fetchMembershipFeeSettings(),
        ])

        const membershipSchedules = buildAllMembershipSchedules(
          contribResult.contributions,
          approvedBrothers,
          contribResult.brotherNames,
          loadedFeeSettings,
        )

        if (!isMounted) return

        setBrothers(approvedBrothers)
        setBrotherNames(contribResult.brotherNames)
        setContributions(contribResult.contributions)
        setSchedules(membershipSchedules)
        setFeeSettings(loadedFeeSettings)
      } catch (error) {
        console.error('Error loading membership reports:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados de mensalidades.',
          variant: 'destructive',
        })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [toast])

  useEffect(() => {
    if (!selectedBrotherId) {
      setBrotherMemberPayments([])
      return
    }

    let isMounted = true
    setLoadingBrotherPayments(true)

    void fetchMemberPayments(selectedBrotherId)
      .then((payments) => {
        if (isMounted) setBrotherMemberPayments(payments)
      })
      .catch((error) => {
        console.error('Error loading brother payments:', error)
        if (isMounted) {
          setBrotherMemberPayments([])
          toast({
            title: 'Aviso',
            description:
              'Não foi possível carregar taxas de grau, ágape e tronco deste irmão.',
            variant: 'destructive',
          })
        }
      })
      .finally(() => {
        if (isMounted) setLoadingBrotherPayments(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedBrotherId, toast])

  const overdueReport = useMemo(
    () => buildMembershipOverdueReportData(schedules),
    [schedules],
  )

  const brotherStatement = useMemo(() => {
    if (!selectedBrotherId || !feeSettings) return null

    const brother = brothers.find((item) => item.id === selectedBrotherId)
    const brotherName =
      brotherNames[selectedBrotherId] ?? brother?.full_name ?? 'Irmão'

    const schedule = buildMembershipScheduleForBrother(
      selectedBrotherId,
      brotherName,
      contributions,
      feeSettings,
      brother?.created_at,
      brother?.membershipSituation,
    )

    return buildMembershipBrotherStatementData(
      selectedBrotherId,
      brotherName,
      schedule,
      contributions,
      brotherMemberPayments,
    )
  }, [
    selectedBrotherId,
    brothers,
    brotherNames,
    contributions,
    feeSettings,
    brotherMemberPayments,
  ])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando relatórios de mensalidades...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Relatórios de Mensalidades</h3>
        <p className="text-sm text-muted-foreground">
          Mensalidades em aberto, pagamentos por irmão, atrasos e extrato completo
          para conferência da tesouraria.
        </p>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="em-aberto">Em aberto</TabsTrigger>
          <TabsTrigger value="pagas">Pagas por irmão</TabsTrigger>
          <TabsTrigger value="atrasos">Irmãos em atraso</TabsTrigger>
          <TabsTrigger value="extrato">Extrato por irmão</TabsTrigger>
        </TabsList>

        <TabsContent value="em-aberto" className="space-y-4">
          <MembershipOpenReportPanel schedules={schedules} />
        </TabsContent>

        <TabsContent value="pagas" className="space-y-4">
          <MembershipPaidByBrotherReportPanel
            schedules={schedules}
            brothers={brothers}
          />
        </TabsContent>

        <TabsContent value="atrasos" className="space-y-4">
          <MembershipOverdueReportSection overdueReport={overdueReport} />
        </TabsContent>

        <TabsContent value="extrato" className="space-y-4">
          <MembershipBrotherStatementSection
            brothers={brothers}
            selectedBrotherId={selectedBrotherId}
            onBrotherChange={setSelectedBrotherId}
            brotherStatement={brotherStatement}
            loadingBrotherPayments={loadingBrotherPayments}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
