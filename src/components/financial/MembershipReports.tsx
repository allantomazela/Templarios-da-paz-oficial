import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { useReactToPrint } from 'react-to-print'
import { Download, FileSpreadsheet, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { formatCurrencyBRL } from '@/lib/format-utils'
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
import {
  exportMembershipBrotherStatementPaymentsCsv,
  exportMembershipBrotherStatementScheduleCsv,
  exportMembershipOverdueDetailCsv,
  exportMembershipOverdueReportCsv,
  exportUnifiedBrotherStatementCsv,
} from '@/lib/membership-report-export'
import { fetchMemberPayments } from '@/lib/member-payments'
import { BrotherSearchCombobox } from '@/components/financial/BrotherSearchCombobox'
import { MembershipOverdueReportDocument } from '@/components/financial/MembershipOverdueReportDocument'
import { MembershipBrotherStatementDocument } from '@/components/financial/MembershipBrotherStatementDocument'

const MEMBERSHIP_PRINT_STYLE = `
  @page { size: A4; margin: 12mm; }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`

export function MembershipReports() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('atrasos')
  const [selectedBrotherId, setSelectedBrotherId] = useState('')
  const [brothers, setBrothers] = useState<
    { id: string; full_name: string | null; created_at?: string | null }[]
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

  const overduePrintRef = useRef<HTMLDivElement>(null)
  const statementPrintRef = useRef<HTMLDivElement>(null)

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

  const handlePrintOverdue = useReactToPrint({
    contentRef: overduePrintRef,
    documentTitle: `Mensalidades_Atraso_${format(new Date(), 'yyyy-MM-dd')}`,
    pageStyle: MEMBERSHIP_PRINT_STYLE,
    onAfterPrint: () => {
      toast({
        title: 'Relatório enviado à impressão',
        description: 'Use "Salvar como PDF" na janela de impressão.',
      })
    },
  })

  const handlePrintStatement = useReactToPrint({
    contentRef: statementPrintRef,
    documentTitle: `Extrato_Mensalidade_${selectedBrotherId}`,
    pageStyle: MEMBERSHIP_PRINT_STYLE,
    onAfterPrint: () => {
      toast({
        title: 'Extrato enviado à impressão',
        description: 'Use "Salvar como PDF" na janela de impressão.',
      })
    },
  })

  const handleExportOverdueCsv = () => {
    try {
      exportMembershipOverdueReportCsv(overdueReport)
      toast({ title: 'CSV exportado', description: 'Resumo por irmão baixado.' })
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: error instanceof Error ? error.message : 'Falha na exportação.',
        variant: 'destructive',
      })
    }
  }

  const handleExportOverdueDetailCsv = () => {
    try {
      exportMembershipOverdueDetailCsv(overdueReport)
      toast({ title: 'CSV exportado', description: 'Detalhamento por mês baixado.' })
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: error instanceof Error ? error.message : 'Falha na exportação.',
        variant: 'destructive',
      })
    }
  }

  const handleExportStatementSchedule = () => {
    if (!brotherStatement) return
    try {
      exportMembershipBrotherStatementScheduleCsv(brotherStatement)
      toast({ title: 'CSV exportado', description: 'Cronograma do irmão baixado.' })
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: error instanceof Error ? error.message : 'Falha na exportação.',
        variant: 'destructive',
      })
    }
  }

  const handleExportUnifiedStatement = () => {
    if (!brotherStatement) return
    try {
      exportUnifiedBrotherStatementCsv(brotherStatement)
      toast({ title: 'CSV exportado', description: 'Extrato completo baixado.' })
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: error instanceof Error ? error.message : 'Falha na exportação.',
        variant: 'destructive',
      })
    }
  }

  const handleExportStatementPayments = () => {
    if (!brotherStatement) return
    try {
      exportMembershipBrotherStatementPaymentsCsv(brotherStatement)
      toast({ title: 'CSV exportado', description: 'Lançamentos do irmão baixados.' })
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: error instanceof Error ? error.message : 'Falha na exportação.',
        variant: 'destructive',
      })
    }
  }

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
          Verificação de atrasos para a tesouraria e extrato completo do irmão
          (mensalidades, taxas de grau, ágape e tronco) para conferência.
        </p>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-4">
        <TabsList>
          <TabsTrigger value="atrasos">Irmãos em atraso</TabsTrigger>
          <TabsTrigger value="extrato">Extrato por irmão</TabsTrigger>
        </TabsList>

        <TabsContent value="atrasos" className="space-y-4">
          <div className="no-print grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Irmãos em atraso</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overdueReport.summary.brotherCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor em aberto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrencyBRL(overdueReport.summary.totalOverdueAmount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Prioridade (3+ meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overdueReport.summary.escalationCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="no-print flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportOverdueCsv}
              disabled={overdueReport.summary.brotherCount === 0}
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV resumo
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportOverdueDetailCsv}
              disabled={overdueReport.summary.brotherCount === 0}
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV detalhado
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handlePrintOverdue()}
              disabled={overdueReport.summary.brotherCount === 0}
            >
              <Download className="h-4 w-4" />
              Imprimir / PDF
            </Button>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="no-print">
              <CardTitle className="text-base">Pré-visualização</CardTitle>
              <CardDescription>Relatório de verificação de atrasos</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="max-h-[70vh] overflow-auto border-t bg-white p-3 sm:rounded-md sm:border sm:p-4">
                <div id="membership-overdue-report-container" ref={overduePrintRef}>
                  <MembershipOverdueReportDocument data={overdueReport} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extrato" className="space-y-4">
          <div className="no-print rounded-lg border bg-card p-4 space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Selecione o irmão
              </p>
              <p className="text-xs text-muted-foreground">
                Gere o extrato completo (mensalidades, taxas de grau, ágape e tronco)
                para entregar ao irmão.
              </p>
            </div>
            <BrotherSearchCombobox
              brothers={brothers}
              value={selectedBrotherId}
              onChange={setSelectedBrotherId}
              placeholder="Buscar irmão..."
            />
          </div>

          {brotherStatement ? (
            <>
              <div className="no-print flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleExportUnifiedStatement}
                  disabled={brotherStatement.paidPayments.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV extrato completo
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleExportStatementSchedule}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV cronograma
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleExportStatementPayments}
                  disabled={brotherStatement.contributions.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV mensalidades
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handlePrintStatement()}
                  disabled={loadingBrotherPayments}
                >
                  <Download className="h-4 w-4" />
                  Imprimir / PDF
                </Button>
              </div>

              {loadingBrotherPayments ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando taxas de grau, ágape e tronco...
                </div>
              ) : null}

              <Card className="overflow-hidden">
                <CardHeader className="no-print">
                  <CardTitle className="text-base">Pré-visualização</CardTitle>
                  <CardDescription>{brotherStatement.brotherName}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  <div className="max-h-[70vh] overflow-auto border-t bg-white p-3 sm:rounded-md sm:border sm:p-4">
                    <div id="membership-statement-report-container" ref={statementPrintRef}>
                      <MembershipBrotherStatementDocument statement={brotherStatement} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Selecione um irmão para gerar o extrato financeiro completo.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
