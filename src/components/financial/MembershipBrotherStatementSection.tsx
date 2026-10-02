import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Download, FileSpreadsheet, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { MembershipBrotherStatementData } from '@/lib/membership-report'
import {
  exportMembershipBrotherStatementPaymentsCsv,
  exportMembershipBrotherStatementScheduleCsv,
  exportUnifiedBrotherStatementCsv,
} from '@/lib/membership-report-export'
import type { ApprovedBrotherOption } from '@/lib/contribution-payments'
import { runCsvExportWithToast } from '@/lib/csv-export-toast'
import { MEMBERSHIP_PRINT_STYLE } from '@/lib/membership-print-style'
import { BrotherSearchCombobox } from './BrotherSearchCombobox'
import { MembershipBrotherStatementDocument } from './MembershipBrotherStatementDocument'

export function MembershipBrotherStatementSection({
  brothers,
  selectedBrotherId,
  onBrotherChange,
  brotherStatement,
  loadingBrotherPayments,
}: MembershipBrotherStatementSectionProps) {
  const { toast } = useToast()
  const statementPrintRef = useRef<HTMLDivElement>(null)

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

  return (
    <>
      <div className="no-print rounded-lg border bg-card p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Selecione o irmão
          </p>
          <p className="text-xs text-muted-foreground">
            Gere o extrato completo (mensalidades, taxas de grau, ágape, tronco e
            vendas do templo) para entregar ao irmão.
          </p>
        </div>
        <BrotherSearchCombobox
          brothers={brothers}
          value={selectedBrotherId}
          onChange={onBrotherChange}
          placeholder="Buscar irmão..."
        />
      </div>

      {brotherStatement ? (
        <>
          <div className="no-print flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                runCsvExportWithToast(
                  toast,
                  () => exportUnifiedBrotherStatementCsv(brotherStatement),
                  'Extrato completo baixado.',
                )
              }
              disabled={brotherStatement.paidPayments.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV extrato completo
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                runCsvExportWithToast(
                  toast,
                  () => exportMembershipBrotherStatementScheduleCsv(brotherStatement),
                  'Cronograma do irmão baixado.',
                )
              }
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV cronograma
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                runCsvExportWithToast(
                  toast,
                  () => exportMembershipBrotherStatementPaymentsCsv(brotherStatement),
                  'Lançamentos do irmão baixados.',
                )
              }
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
    </>
  )
}

interface MembershipBrotherStatementSectionProps {
  brothers: ApprovedBrotherOption[]
  selectedBrotherId: string
  onBrotherChange: (brotherId: string) => void
  brotherStatement: MembershipBrotherStatementData | null
  loadingBrotherPayments: boolean
}
