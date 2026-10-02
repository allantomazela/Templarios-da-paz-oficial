import { useState } from 'react'
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { ScrollableTabsList } from '@/components/ui/scrollable-tabs-list'
import {
  Loader2,
  User,
  Wallet,
  History,
  AlertTriangle,
  GraduationCap,
  FileText,
} from 'lucide-react'
import { ContributionDialog } from './ContributionDialog'
import { MembershipFeeQuickSettings } from './MembershipFeeQuickSettings'
import { useMembershipPaymentsData } from '@/hooks/use-membership-payments-data'
import { useMembershipContributionLaunch } from '@/hooks/use-membership-contribution-launch'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import { MembershipOverduePanel } from '@/components/financial/MembershipOverduePanel'
import { FinancialAccessOverview } from '@/components/financial/FinancialAccessOverview'
import { MembershipScheduleDialog } from '@/components/financial/MembershipScheduleDialog'
import { CeremonyPaymentsPanel } from '@/components/financial/CeremonyPaymentsPanel'
import { MembershipStatusReportPanel } from '@/components/financial/MembershipStatusReportPanel'
import { MembershipOverdueTable } from './MembershipOverdueTable'
import { MembershipGenerateDialog } from './MembershipGenerateDialog'
import { MembershipPaymentsToolbar } from './MembershipPaymentsToolbar'
import { MembershipBrotherTab } from './MembershipBrotherTab'
import { MembershipAllContributionsTab } from './MembershipAllContributionsTab'

export function MembershipPayments() {
  const data = useMembershipPaymentsData()
  const {
    contributions,
    approvedBrothers,
    brotherNames,
    loading,
    feeSettings,
    selectedBrotherId,
    setSelectedBrotherId,
    overdueAlerts,
    allSchedules,
    refreshContributions,
    handleUpdateFeeSettings,
    deleteOperation,
  } = data
  const launch = useMembershipContributionLaunch(data)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewTab, setViewTab] = useState('by-member')
  const [mainSection, setMainSection] = useState<'membership' | 'ceremony'>('membership')
  const [openCeremonyPlan, setOpenCeremonyPlan] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [scheduleDialogBrotherId, setScheduleDialogBrotherId] = useState('')

  const openSchedule = (brotherId: string) => {
    setSelectedBrotherId(brotherId)
    setScheduleDialogBrotherId(brotherId)
    setViewTab('by-member')
    setScheduleDialogOpen(true)
  }

  const handleContributionsChanged = async () => {
    await refreshContributions()
    notifyFinancialDataChanged()
  }

  if (loading && contributions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={mainSection}
        onValueChange={(value) => setMainSection(value as 'membership' | 'ceremony')}
        className="space-y-4"
      >
        <ScrollableTabsList>
          <TabsTrigger value="membership">
            <Wallet className="mr-2 h-4 w-4" />
            Mensalidades
          </TabsTrigger>
          <TabsTrigger value="ceremony">
            <GraduationCap className="mr-2 h-4 w-4" />
            Iniciação, Elevação e Outros
          </TabsTrigger>
        </ScrollableTabsList>

        <TabsContent value="ceremony">
          <CeremonyPaymentsPanel
            brothers={approvedBrothers}
            selectedBrotherId={selectedBrotherId}
            onBrotherChange={setSelectedBrotherId}
            openPlanDialog={openCeremonyPlan}
            onPlanDialogOpenChange={setOpenCeremonyPlan}
          />
        </TabsContent>

        <TabsContent value="membership" className="space-y-4">
          <MembershipPaymentsToolbar
            loading={loading}
            hasSelectedBrother={Boolean(selectedBrotherId)}
            onNewContribution={() => launch.openNew(selectedBrotherId)}
            onNewCeremony={() => {
              setMainSection('ceremony')
              setOpenCeremonyPlan(true)
            }}
            onGenerate={() => setGenerateOpen(true)}
            onOpenSchedule={() =>
              selectedBrotherId ? openSchedule(selectedBrotherId) : undefined
            }
          />

          <MembershipFeeQuickSettings
            compact
            settings={feeSettings}
            onSave={handleUpdateFeeSettings}
          />

          <MembershipOverduePanel alerts={overdueAlerts} onSelectBrother={openSchedule} />

          <FinancialAccessOverview
            onSelectBrother={(profileId) => {
              setSelectedBrotherId(profileId)
              setViewTab('by-member')
            }}
          />

          <Tabs value={viewTab} onValueChange={setViewTab} className="space-y-4">
            <ScrollableTabsList>
              <TabsTrigger value="by-member">
                <User className="mr-2 h-4 w-4" />
                Por irmão
              </TabsTrigger>
              <TabsTrigger value="overdue">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Atrasos ({overdueAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                <History className="mr-2 h-4 w-4" />
                Todos os lançamentos
              </TabsTrigger>
              <TabsTrigger value="report">
                <FileText className="mr-2 h-4 w-4" />
                Relatório
              </TabsTrigger>
            </ScrollableTabsList>

            <TabsContent value="by-member" className="space-y-4">
              <MembershipBrotherTab
                brothers={approvedBrothers}
                selectedBrotherId={selectedBrotherId}
                onBrotherChange={setSelectedBrotherId}
                onNewContribution={() => launch.openNew(selectedBrotherId)}
                onOpenSchedule={() => openSchedule(selectedBrotherId)}
                summary={data.selectedSummary}
                schedule={data.selectedSchedule}
                treasuryPaidTotal={data.treasuryPaidTotal}
                history={data.brotherHistory}
                brotherNames={brotherNames}
                loading={loading}
                onEdit={launch.openEdit}
                onDelete={(c) => deleteOperation.execute(c)}
              />
            </TabsContent>

            <TabsContent value="overdue" className="space-y-4">
              <MembershipOverduePanel alerts={overdueAlerts} onSelectBrother={openSchedule} />
              <MembershipOverdueTable alerts={overdueAlerts} onSelectBrother={openSchedule} />
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <MembershipAllContributionsTab
                contributions={contributions}
                brotherNames={brotherNames}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                loading={loading}
                onEdit={launch.openEdit}
                onDelete={(c) => deleteOperation.execute(c)}
              />
            </TabsContent>

            <TabsContent value="report" className="space-y-4">
              <MembershipStatusReportPanel schedules={allSchedules} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <ContributionDialog
        open={launch.dialogOpen}
        onOpenChange={launch.handleDialogOpenChange}
        contributionToEdit={launch.selectedContribution}
        defaultBrotherId={launch.contributionLaunch?.brotherId || selectedBrotherId}
        defaultBrotherName={launch.contributionLaunch?.brotherName}
        defaultMonth={launch.contributionLaunch?.month}
        defaultYear={launch.contributionLaunch?.year}
        defaultAmount={feeSettings.defaultAmount}
        brothers={approvedBrothers}
        feeSettings={feeSettings}
        onUpdateFeeSettings={handleUpdateFeeSettings}
        onSave={launch.handleSave}
        saving={launch.saving}
        openMonthsCount={launch.launchOpenMonthsCount}
        launchFromSchedule={Boolean(launch.contributionLaunch?.month)}
      />

      <MembershipGenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        feeSettings={feeSettings}
        onGenerated={handleContributionsChanged}
      />

      <MembershipScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        brotherId={scheduleDialogBrotherId || selectedBrotherId || null}
        brothers={approvedBrothers}
        contributions={contributions}
        feeSettings={feeSettings}
        onSaved={handleContributionsChanged}
        onRegisterPayment={({ brotherId, brotherName, month, year }) => {
          setScheduleDialogOpen(false)
          launch.openNew(brotherId, { brotherName, month, year })
        }}
        onEditContribution={(contribution) => {
          setScheduleDialogOpen(false)
          launch.openEdit(contribution)
        }}
      />
    </div>
  )
}
