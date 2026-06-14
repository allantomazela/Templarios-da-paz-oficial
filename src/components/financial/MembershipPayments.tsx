import { useState, useEffect, useMemo } from 'react'
import { Contribution } from '@/lib/data'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  User,
  Wallet,
  History,
  CalendarPlus,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ContributionDialog } from './ContributionDialog'
import { BrotherSearchCombobox } from './BrotherSearchCombobox'
import { MembershipFeeQuickSettings } from './MembershipFeeQuickSettings'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { formatDateBR } from '@/lib/format-utils'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  buildBrotherSummaries,
  deleteContribution,
  fetchApprovedBrothers,
  fetchContributionsWithProfiles,
  filterContributionsByBrother,
  fetchMembershipFeeSettings,
  generatePendingContributionsForMonth,
  CONTRIBUTION_MONTHS,
  saveContribution,
  type BrotherContributionSummary,
  type ContributionFormData,
} from '@/lib/contribution-payments'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import { MembershipOverduePanel } from '@/components/financial/MembershipOverduePanel'
import { MembershipScheduleTable } from '@/components/financial/MembershipScheduleTable'
import { BrotherAccessInfoPanel } from '@/components/financial/BrotherAccessInfoPanel'
import { FinancialAccessOverview } from '@/components/financial/FinancialAccessOverview'
import { MembershipScheduleDialog } from '@/components/financial/MembershipScheduleDialog'
import {
  buildAllMembershipSchedules,
  buildMembershipScheduleForBrother,
  buildOverdueBrotherAlerts,
  isMembershipHistoricalPeriod,
} from '@/lib/membership-schedule'
import type { ApprovedBrotherOption } from '@/lib/contribution-payments'

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

function currentStatusLabel(status: BrotherContributionSummary['currentStatus']) {
  switch (status) {
    case 'paid':
      return { label: 'Em dia', className: 'text-green-600' }
    case 'upcoming':
      return { label: 'À vencer', className: 'text-sky-600' }
    case 'pending':
      return { label: 'Pendente', className: 'text-amber-600' }
    case 'overdue':
      return { label: 'Em atraso', className: 'text-destructive' }
    default:
      return { label: 'Sem registro', className: 'text-muted-foreground' }
  }
}

function ContributionsTable({
  rows,
  brotherNames,
  onEdit,
  onDelete,
  emptyMessage,
}: {
  rows: Contribution[]
  brotherNames: Record<string, string>
  onEdit: (c: Contribution) => void
  onDelete: (c: Contribution) => void
  emptyMessage: string
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-card py-10 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Irmão</TableHead>
            <TableHead>Referência</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data pagto.</TableHead>
            <TableHead>Tesouraria</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((contribution) => (
            <TableRow key={contribution.id}>
              <TableCell className="font-medium">
                {brotherNames[contribution.brotherId] ||
                  contribution.brotherName ||
                  'Desconhecido'}
              </TableCell>
              <TableCell>
                {contribution.month}/{contribution.year}
              </TableCell>
              <TableCell className="font-mono">
                {formatCurrencyBRL(contribution.amount)}
              </TableCell>
              <TableCell>{statusBadge(contribution.status)}</TableCell>
              <TableCell>
                {contribution.paymentDate
                  ? formatDateBR(contribution.paymentDate)
                  : '—'}
              </TableCell>
              <TableCell>
                {(() => {
                  const monthIndex = CONTRIBUTION_MONTHS.indexOf(
                    contribution.month as (typeof CONTRIBUTION_MONTHS)[number],
                  )
                  const monthNum = monthIndex >= 0 ? monthIndex + 1 : 0
                  const historical =
                    monthNum > 0 &&
                    isMembershipHistoricalPeriod(contribution.year, monthNum)

                  if (contribution.transactionId) {
                    return (
                      <Badge variant="outline" className="text-green-700">
                        Receita lançada
                      </Badge>
                    )
                  }
                  if (contribution.status === 'Pago' && historical) {
                    return (
                      <Badge variant="outline" className="text-amber-800">
                        Só controle
                      </Badge>
                    )
                  }
                  if (contribution.status === 'Pago') {
                    return <Badge variant="outline">Sem vínculo</Badge>
                  }
                  return '—'
                })()}
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(contribution)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(contribution)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function MembershipPayments() {
  const updateMembershipFeeSettings = useSiteSettingsStore(
    (s) => s.updateMembershipFeeSettings,
  )
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [brotherNames, setBrotherNames] = useState<Record<string, string>>({})
  const [approvedBrothers, setApprovedBrothers] = useState<
    ApprovedBrotherOption[]
  >([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrotherId, setSelectedBrotherId] = useState('')
  const [viewTab, setViewTab] = useState('by-member')
  const [feeSettings, setFeeSettings] = useState({ defaultAmount: 150, dueDay: 10 })
  const [generateOpen, setGenerateOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [scheduleDialogBrotherId, setScheduleDialogBrotherId] = useState('')
  const [contributionLaunch, setContributionLaunch] = useState<{
    brotherId: string
    brotherName: string
    month?: string
    year?: number
  } | null>(null)
  const [generateMonth, setGenerateMonth] = useState(
    CONTRIBUTION_MONTHS[new Date().getMonth()],
  )
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear())
  const dialog = useDialog()
  const [selectedContribution, setSelectedContribution] =
    useState<Contribution | null>(null)

  const loadData = useAsyncOperation(
    async () => {
      setLoading(true)
      const [contribResult, brothers] = await Promise.all([
        fetchContributionsWithProfiles(),
        fetchApprovedBrothers(),
      ])
      setContributions(contribResult.contributions)
      setBrotherNames(contribResult.brotherNames)
      setApprovedBrothers(brothers)
      if (!selectedBrotherId && brothers.length > 0) {
        setSelectedBrotherId(brothers[0].id)
      }
      setLoading(false)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar mensalidades.',
    },
  )

  useEffect(() => {
    loadData.execute()
    fetchMembershipFeeSettings()
      .then(setFeeSettings)
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summaries = useMemo(
    () =>
      buildBrotherSummaries(
        contributions,
        brotherNames,
        approvedBrothers,
        feeSettings.dueDay,
      ),
    [contributions, brotherNames, approvedBrothers, feeSettings.dueDay],
  )

  const allSchedules = useMemo(
    () =>
      buildAllMembershipSchedules(
        contributions,
        approvedBrothers,
        brotherNames,
        feeSettings,
      ),
    [contributions, approvedBrothers, brotherNames, feeSettings],
  )

  const overdueAlerts = useMemo(
    () => buildOverdueBrotherAlerts(allSchedules),
    [allSchedules],
  )

  const selectedSchedule = useMemo(() => {
    if (!selectedBrotherId) return null
    const brother = approvedBrothers.find((b) => b.id === selectedBrotherId)
    const name =
      brotherNames[selectedBrotherId] || brother?.full_name || 'Sem nome'
    return buildMembershipScheduleForBrother(
      selectedBrotherId,
      name,
      contributions,
      feeSettings,
      brother?.created_at,
    )
  }, [
    selectedBrotherId,
    approvedBrothers,
    brotherNames,
    contributions,
    feeSettings,
  ])

  const selectedSummary = summaries.find((s) => s.brotherId === selectedBrotherId)
  const brotherHistory = useMemo(
    () => filterContributionsByBrother(contributions, selectedBrotherId),
    [contributions, selectedBrotherId],
  )

  const treasuryPaidTotal = useMemo(() => {
    return brotherHistory
      .filter((c) => {
        const monthIndex = CONTRIBUTION_MONTHS.indexOf(
          c.month as (typeof CONTRIBUTION_MONTHS)[number],
        )
        const monthNum = monthIndex >= 0 ? monthIndex + 1 : 0
        return (
          c.status === 'Pago' &&
          monthNum > 0 &&
          !isMembershipHistoricalPeriod(c.year, monthNum)
        )
      })
      .reduce((sum, c) => sum + c.amount, 0)
  }, [brotherHistory])

  const filteredAll = contributions.filter((c) => {
    const q = searchTerm.toLowerCase()
    const name = (brotherNames[c.brotherId] || c.brotherName || '').toLowerCase()
    return (
      name.includes(q) ||
      c.month.toLowerCase().includes(q) ||
      String(c.year).includes(q) ||
      c.status.toLowerCase().includes(q)
    )
  })

  const saveOperation = useAsyncOperation(
    async (data: ContributionFormData) => {
      const brotherName =
        data.brotherName ||
        brotherNames[data.brotherId] ||
        approvedBrothers.find((b) => b.id === data.brotherId)?.full_name ||
        ''

      await saveContribution(
        { ...data, brotherName },
        selectedContribution
          ? {
              contributionId: selectedContribution.id,
              existingTransactionId: selectedContribution.transactionId,
            }
          : undefined,
      )

      await loadData.execute()
      notifyFinancialDataChanged()
      return selectedContribution
        ? 'Mensalidade atualizada com sucesso.'
        : 'Mensalidade registrada com sucesso.'
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar a mensalidade.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (contribution: Contribution) => {
      await deleteContribution(contribution)
      await loadData.execute()
      notifyFinancialDataChanged()
      return 'Mensalidade removida.'
    },
    {
      successMessage: 'Mensalidade removida com sucesso!',
      errorMessage: 'Falha ao remover a mensalidade.',
    },
  )

  const generateOperation = useAsyncOperation(
    async () => {
      const monthIndex = CONTRIBUTION_MONTHS.indexOf(
        generateMonth as (typeof CONTRIBUTION_MONTHS)[number],
      )
      const month = monthIndex + 1
      const result = await generatePendingContributionsForMonth(
        month,
        generateYear,
        feeSettings.defaultAmount,
      )
      await loadData.execute()
      notifyFinancialDataChanged()
      setGenerateOpen(false)
      return `${result.created} mensalidade(s) criada(s). ${result.skipped} irmão(s) já tinham lançamento para ${generateMonth}/${generateYear}.`
    },
    {
      successMessage: 'Geração concluída',
      errorMessage: 'Falha ao gerar mensalidades do mês.',
    },
  )

  const resolveBrotherName = (brotherId: string) => {
    if (!brotherId) return ''
    return (
      brotherNames[brotherId]?.trim() ||
      approvedBrothers.find((b) => b.id === brotherId)?.full_name?.trim() ||
      ''
    )
  }

  const openSchedule = (brotherId: string) => {
    setSelectedBrotherId(brotherId)
    setScheduleDialogBrotherId(brotherId)
    setViewTab('by-member')
    setScheduleDialogOpen(true)
  }

  const openNew = (
    brotherId?: string,
    prefill?: { brotherName?: string; month: string; year: number },
  ) => {
    const id = brotherId ?? selectedBrotherId
    setSelectedContribution(null)
    setContributionLaunch({
      brotherId: id,
      brotherName:
        prefill?.brotherName?.trim() || resolveBrotherName(id),
      month: prefill?.month,
      year: prefill?.year,
    })
    if (brotherId) setSelectedBrotherId(brotherId)
    dialog.openDialog()
  }

  const openEdit = (contribution: Contribution) => {
    setContributionLaunch({
      brotherId: contribution.brotherId,
      brotherName:
        contribution.brotherName?.trim() ||
        resolveBrotherName(contribution.brotherId),
    })
    setSelectedContribution(contribution)
    setSelectedBrotherId(contribution.brotherId)
    dialog.openDialog()
  }

  const handleUpdateFeeSettings = async (next: {
    defaultAmount: number
    dueDay: number
  }) => {
    await updateMembershipFeeSettings(next)
    setFeeSettings(next)
  }

  const handleSave = async (data: ContributionFormData) => {
    const result = await saveOperation.execute(data)
    if (result) dialog.closeDialog()
  }

  if (loading && contributions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const current = selectedSummary
    ? currentStatusLabel(selectedSummary.currentStatus)
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Registre pagamentos a partir de jun/2026 — entram na tesouraria quando
          marcados como <strong>Pago</strong> com conta bancária. Meses anteriores
          (jan–mai/2026) são ajustados pelo cronograma, apenas para controle.
        </p>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button onClick={() => openNew(selectedBrotherId)} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar pagamento
          </Button>
          <Button
            variant="outline"
            onClick={() => setGenerateOpen(true)}
            disabled={loading}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Gerar do mês
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              selectedBrotherId
                ? openSchedule(selectedBrotherId)
                : undefined
            }
            disabled={loading || !selectedBrotherId}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Ver cronograma
          </Button>
        </div>
      </div>

      <MembershipFeeQuickSettings
        compact
        settings={feeSettings}
        onSave={handleUpdateFeeSettings}
      />

      <MembershipOverduePanel
        alerts={overdueAlerts}
        onSelectBrother={openSchedule}
      />

      <FinancialAccessOverview
        onSelectBrother={(profileId) => {
          setSelectedBrotherId(profileId)
          setViewTab('by-member')
        }}
      />

      <Tabs value={viewTab} onValueChange={setViewTab} className="space-y-4">
        <TabsList>
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
        </TabsList>

        <TabsContent value="by-member" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 max-w-md space-y-2">
              <label className="text-sm font-medium">Selecionar irmão</label>
              <BrotherSearchCombobox
                brothers={approvedBrothers}
                value={selectedBrotherId}
                onChange={setSelectedBrotherId}
                placeholder="Buscar irmão por nome..."
              />
            </div>
            <Button
              onClick={() => openNew(selectedBrotherId)}
              disabled={!selectedBrotherId}
              className="shrink-0 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-md disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:ring-0"
            >
              <User className="mr-2 h-4 w-4" />
              Lançar para este irmão
            </Button>
          </div>

          {selectedBrotherId ? (
            <BrotherAccessInfoPanel profileId={selectedBrotherId} />
          ) : null}

          {selectedSummary && current && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Situação atual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-lg font-semibold ${current.className}`}>
                    {current.label}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total na tesouraria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrencyBRL(treasuryPaidTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Jun/2026 em diante · controle:{' '}
                    {formatCurrencyBRL(selectedSummary.totalPaid)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pendências
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-amber-600">
                    {formatCurrencyBRL(selectedSummary.totalPending)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSummary.pendingCount + selectedSummary.overdueCount}{' '}
                    em aberto
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Em atraso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-destructive">
                    {formatCurrencyBRL(selectedSchedule?.totalOverdue ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSchedule?.overdueMonthCount ?? 0} mês(es)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Último pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    {selectedSummary.lastPaymentDate
                      ? formatDateBR(selectedSummary.lastPaymentDate)
                      : '—'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedSchedule ? (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="h-4 w-4" />
                  Cronograma de mensalidades
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openSchedule(selectedBrotherId)}
                >
                  Gerenciar cronograma
                </Button>
              </div>
              <MembershipScheduleTable entries={selectedSchedule.entries} />
            </div>
          ) : null}

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Wallet className="h-4 w-4" />
              Histórico de mensalidades
            </h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ContributionsTable
                rows={brotherHistory}
                brotherNames={brotherNames}
                onEdit={openEdit}
                onDelete={(c) => deleteOperation.execute(c)}
                emptyMessage="Nenhuma mensalidade registrada para este irmão."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <MembershipOverduePanel
            alerts={overdueAlerts}
            onSelectBrother={openSchedule}
          />
          {overdueAlerts.length > 0 ? (
            <div className="rounded-md border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Irmão</TableHead>
                    <TableHead>Meses em atraso</TableHead>
                    <TableHead>Valor em aberto</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueAlerts.map((alert) => (
                    <TableRow key={alert.brotherId}>
                      <TableCell className="font-medium">
                        {alert.brotherName}
                      </TableCell>
                      <TableCell>{alert.overdueLabels.join(', ')}</TableCell>
                      <TableCell className="font-mono text-destructive">
                        {formatCurrencyBRL(alert.overdueAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSchedule(alert.brotherId)}
                        >
                          Ver cronograma
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por irmão, mês, ano ou status..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ContributionsTable
              rows={filteredAll}
              brotherNames={brotherNames}
              onEdit={openEdit}
              onDelete={(c) => deleteOperation.execute(c)}
              emptyMessage="Nenhuma mensalidade encontrada."
            />
          )}
        </TabsContent>
      </Tabs>

      <ContributionDialog
        open={dialog.open}
        onOpenChange={(next) => {
          if (!next) setContributionLaunch(null)
          dialog.onOpenChange(next)
        }}
        contributionToEdit={selectedContribution}
        defaultBrotherId={
          contributionLaunch?.brotherId || selectedBrotherId
        }
        defaultBrotherName={contributionLaunch?.brotherName}
        defaultMonth={contributionLaunch?.month}
        defaultYear={contributionLaunch?.year}
        defaultAmount={feeSettings.defaultAmount}
        brothers={approvedBrothers}
        feeSettings={feeSettings}
        onUpdateFeeSettings={handleUpdateFeeSettings}
        onSave={handleSave}
        saving={saveOperation.loading}
      />

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar mensalidades pendentes</DialogTitle>
            <DialogDescription>
              Cria um lançamento <strong>Pendente</strong> para cada irmão com
              conta aprovada que ainda não possui registro no mês escolhido.
              Valor padrão: {formatCurrencyBRL(feeSettings.defaultAmount)}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês</label>
              <Select value={generateMonth} onValueChange={setGenerateMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRIBUTION_MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <Input
                type="number"
                value={generateYear}
                onChange={(e) => setGenerateYear(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => generateOperation.execute()}
              disabled={generateOperation.loading}
            >
              {generateOperation.loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MembershipScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        brotherId={scheduleDialogBrotherId || selectedBrotherId || null}
        brothers={approvedBrothers}
        contributions={contributions}
        feeSettings={feeSettings}
        onSaved={async () => {
          await loadData.execute()
          notifyFinancialDataChanged()
        }}
        onRegisterPayment={({ brotherId, brotherName, month, year }) => {
          setScheduleDialogOpen(false)
          openNew(brotherId, { brotherName, month, year })
        }}
        onEditContribution={(contribution) => {
          setScheduleDialogOpen(false)
          openEdit(contribution)
        }}
      />
    </div>
  )
}
