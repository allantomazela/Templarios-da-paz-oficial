import { useMemo, useRef, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, Presentation, Play, Printer } from 'lucide-react'
import {
  endOfYear,
  format,
  isWithinInterval,
  startOfYear,
} from 'date-fns'
import { useFinancialCoreData } from '@/hooks/use-financial-core-data'
import { useFinancialAmountVisibility } from '@/hooks/use-financial-amount-visibility'
import { usePrintReport } from '@/hooks/use-print-report'
import { computeGlobalBalance } from '@/lib/financial-balances'
import { isTreasuryTransaction } from '@/lib/transaction-control-only'
import { parseCalendarDate } from '@/lib/format-utils'
import {
  buildLodgePresentationSlides,
  LODGE_FINANCIAL_SYSTEM_MODULES,
} from '@/lib/financial-lodge-presentation'
import { LODGE_PRESENTATION_PRINT_STYLE } from '@/lib/financial-lodge-presentation-print-style'
import { FinancialLodgePresentationDeck } from '@/components/financial/FinancialLodgePresentationDeck'
import { FinancialLodgePresentationDocument } from '@/components/financial/FinancialLodgePresentationDocument'
import { FinancialAmountVisibilityToggle } from '@/components/financial/FinancialAmountVisibilityToggle'
import useFinancialStore from '@/stores/useFinancialStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'

/**
 * Painel aditivo: gera apresentação pronta para projetar em loja.
 * Não altera lançamentos nem outras abas do Financeiro.
 */
export function FinancialLodgePresentation() {
  const { accounts, transactions, loading } = useFinancialCoreData()
  const balanceLedger = useFinancialStore((state) => state.balanceLedger)
  const siteTitle = useSiteSettingsStore((state) => state.siteTitle)
  const { amountsVisible, toggleAmountsVisible } =
    useFinancialAmountVisibility()
  const [includeAmounts, setIncludeAmounts] = useState(false)
  const [deckOpen, setDeckOpen] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const printRef = useRef<HTMLDivElement>(null)

  const metrics = useMemo(() => {
    const now = new Date()
    const start = startOfYear(now)
    const end = endOfYear(now)
    const balanceSource =
      balanceLedger.length > 0 ? balanceLedger : transactions
    const globalBalance = computeGlobalBalance(accounts, balanceSource)

    const periodTx = transactions.filter((transaction) => {
      const date = parseCalendarDate(transaction.date)
      return date ? isWithinInterval(date, { start, end }) : false
    })
    const periodIncome = periodTx
      .filter((t) => t.type === 'Receita' && isTreasuryTransaction(t))
      .reduce((sum, t) => sum + t.amount, 0)
    const periodExpense = periodTx
      .filter((t) => t.type === 'Despesa' && isTreasuryTransaction(t))
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      lodgeName: siteTitle?.trim() || 'Templários da Paz',
      generatedAt: now,
      accountCount: accounts.length,
      globalBalance,
      periodLabel: 'Ano atual',
      periodIncome,
      periodExpense,
      periodResult: periodIncome - periodExpense,
    }
  }, [accounts, balanceLedger, siteTitle, transactions])

  const slides = useMemo(
    () =>
      buildLodgePresentationSlides({
        metrics,
        includeAmounts,
        amountsVisible,
      }),
    [amountsVisible, includeAmounts, metrics],
  )

  const handlePrint = usePrintReport({
    contentRef: printRef,
    documentTitle: `Apresentacao_Tesouraria_${format(new Date(), 'yyyy-MM-dd')}`,
    pageStyle: LODGE_PRESENTATION_PRINT_STYLE,
    successTitle: 'Apresentação enviada à impressão',
    successDescription:
      'Use "Salvar como PDF" na janela de impressão para gerar o arquivo.',
    errorDescription:
      'Não foi possível gerar o PDF da apresentação. Tente novamente.',
  })

  function handleStart() {
    setSlideIndex(0)
    setDeckOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Presentation className="h-5 w-5 text-muted-foreground" />
          Apresentação para a Loja
        </h3>
        <p className="text-sm text-muted-foreground">
          Gere com um clique um roteiro pronto para projetar: o que é a
          Tesouraria, deveres do Tesoureiro e o que o sistema já oferece.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gerar apresentação</CardTitle>
          <CardDescription>
            Conteúdo institucional fixo +, se quiser, um slide com a posição
            atual do Financeiro. Por padrão os valores monetários ficam de fora
            para uso seguro em sessão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando dados financeiros...
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {metrics.accountCount} conta(s) no sistema · período de referência:{' '}
              {metrics.periodLabel.toLowerCase()}.
            </p>
          )}

          <div className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Checkbox
                id="include-amounts"
                checked={includeAmounts}
                onCheckedChange={(checked) => setIncludeAmounts(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="include-amounts">
                  Incluir slide com números da Tesouraria
                </Label>
                <p className="text-xs text-muted-foreground">
                  Saldo global e resultado do ano. Recomendado ocultar valores
                  se for projetar com muitas pessoas.
                </p>
              </div>
            </div>
            {includeAmounts ? (
              <FinancialAmountVisibilityToggle
                amountsVisible={amountsVisible}
                onToggle={toggleAmountsVisible}
              />
            ) : null}
          </div>

          <div className="rounded-md border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium">
              O roteiro inclui ({slides.length} slides):
            </p>
            <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <li>• Capa e objetivos</li>
              <li>• O que é a Tesouraria</li>
              <li>• Deveres do Tesoureiro</li>
              <li>• Fluxo e governança</li>
              <li>• Módulos já disponíveis no sistema</li>
              {includeAmounts ? <li>• Posição atual (opcional)</li> : null}
              <li>• Rotina sugerida e encerramento</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleStart}
              disabled={loading || slides.length === 0}
            >
              <Play className="mr-2 h-4 w-4" />
              Iniciar apresentação
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handlePrint()}
              disabled={loading || slides.length === 0}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Módulos já no sistema</CardTitle>
          <CardDescription>
            Lista usada no slide de produto — apenas leitura, sem alterar dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {LODGE_FINANCIAL_SYSTEM_MODULES.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="no-print">
          <CardTitle className="text-base">Pré-visualização do PDF</CardTitle>
          <CardDescription>
            Mesmo roteiro da apresentação em tela. Na impressão, cada slide
            vira uma página em A4 paisagem.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="max-h-[70vh] overflow-auto border-t bg-white p-3 sm:rounded-md sm:border sm:p-4">
            <div
              id="lodge-presentation-print-container"
              ref={printRef}
              className="rounded-md border bg-white p-4 text-black print:border-0 print:p-0"
            >
              <FinancialLodgePresentationDocument
                slides={slides}
                lodgeName={metrics.lodgeName}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <FinancialLodgePresentationDeck
        open={deckOpen}
        slides={slides}
        index={slideIndex}
        onIndexChange={setSlideIndex}
        onClose={() => setDeckOpen(false)}
      />
    </div>
  )
}
