import { useMemo, useState } from 'react'
import type { AgapeBrotherCharge } from '@/lib/data'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDialog } from '@/hooks/use-dialog'
import { useAgapeClosingPermissions } from '@/hooks/use-agape-closing-permissions'
import { useAgapeClosingData } from '@/hooks/use-agape-closing-data'
import { useAgapeClosingActions } from '@/hooks/use-agape-closing-actions'
import { computeAgapeClosingSummary } from '@/lib/agape-closing-summary'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { AgapeChargeDialog } from './AgapeChargeDialog'
import { AgapeClosingAdjustmentsPanel } from './AgapeClosingAdjustmentsPanel'
import { AgapeClosingHeader } from './AgapeClosingHeader'
import { AgapeBeveragesTotalCard } from './AgapeBeveragesTotalCard'
import { AgapeClosingSummaryCards } from './AgapeClosingSummaryCards'
import { AgapeClosingStatusAlerts } from './AgapeClosingStatusAlerts'
import { AgapeLiveConsumptionCard } from './AgapeLiveConsumptionCard'
import { AgapeClosingActionsBar } from './AgapeClosingActionsBar'
import { AgapeChargesTable } from './AgapeChargesTable'
import {
  AgapeClearMonthDialog,
  AgapeDeleteChargeDialog,
} from './AgapeClosingConfirmDialogs'

export function AgapeClosing() {
  const { canManageAgapeClosing, canAccessAgapeClosingOnly } =
    useAgapeClosingPermissions()
  const { agapePix } = useSiteSettingsStore()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const dialog = useDialog()
  const [selectedCharge, setSelectedCharge] = useState<AgapeBrotherCharge | null>(null)

  const monthLabel = useMemo(
    () =>
      format(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy', {
        locale: ptBR,
      }),
    [selectedMonth, selectedYear],
  )

  const data = useAgapeClosingData(selectedMonth, selectedYear)
  const { charges, brotherNames, closing, liveTotal, loading } = data

  const actions = useAgapeClosingActions({
    selectedMonth,
    selectedYear,
    monthLabel,
    selectedCharge,
    reload: data.reload,
    onChargeSaved: () => {
      dialog.closeDialog()
      setSelectedCharge(null)
    },
  })
  const { clearMonth, deleteCharge } = actions

  const summary = computeAgapeClosingSummary({ charges, closing, liveTotal })
  const { isClosed } = summary
  const canEdit = canManageAgapeClosing && !isClosed

  const openChargeDialog = (charge: AgapeBrotherCharge | null) => {
    setSelectedCharge(charge)
    dialog.openDialog()
  }

  const handleUseLiveTotalAsBeverages = () => {
    if ((liveTotal ?? 0) <= 0) return
    data.setTotalBeveragesInput(String(liveTotal))
  }

  return (
    <div className="space-y-6">
      <AgapeClosingHeader
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onPeriodChange={(year, month) => {
          setSelectedYear(year)
          setSelectedMonth(month)
        }}
        loading={loading}
        onRefresh={() => data.reload()}
      />

      {!canManageAgapeClosing && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Apenas a administração, a tesouraria e o Mestre de Banquete podem
            gerenciar o fechamento do ágape.
          </AlertDescription>
        </Alert>
      )}

      {canManageAgapeClosing && !loading && (
        <AgapeClosingAdjustmentsPanel
          monthLabel={monthLabel}
          canEdit={canEdit}
          isClosed={isClosed}
          hasCharges={charges.length > 0}
          hasBeveragesTotal={summary.totalBeverages > 0}
          isAgapeOnlyUser={canAccessAgapeClosingOnly}
          onClearMonth={() => clearMonth.setOpen(true)}
          onReopenMonth={() => actions.reopenOperation.execute()}
          clearing={clearMonth.isClearing}
          reopening={actions.reopenOperation.loading}
        />
      )}

      {agapePix.pixName && (
        <Alert>
          <AlertTitle>Beneficiário dos pagamentos PIX</AlertTitle>
          <AlertDescription>
            Os irmãos pagam para <strong>{agapePix.pixName}</strong>
            {agapePix.pixKey ? ` (PIX: ${agapePix.pixKey})` : ''}. Ao confirmar
            cada pagamento aqui, a tesouraria registra a receita correspondente.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <AgapeBeveragesTotalCard
            totalBeveragesInput={data.totalBeveragesInput}
            onTotalBeveragesInputChange={data.setTotalBeveragesInput}
            canEdit={canEdit}
            saving={actions.saveTotalOperation.loading}
            onSave={() => actions.saveTotalOperation.execute(data.totalBeveragesInput)}
            totalBeverages={summary.totalBeverages}
            totalPaid={summary.totalPaid}
            paymentProgress={summary.paymentProgress}
            remainingBalance={summary.remainingBalance}
          />

          <AgapeClosingSummaryCards
            summary={summary}
            chargesCount={charges.length}
            liveTotal={liveTotal}
          />

          <AgapeClosingStatusAlerts summary={summary} liveTotal={liveTotal} />

          <AgapeLiveConsumptionCard
            rows={data.liveConsumptionRows}
            monthLabel={monthLabel}
            liveTotal={liveTotal}
            canEdit={canEdit}
            onUseAsBeveragesTotal={handleUseLiveTotalAsBeverages}
          />

          <AgapeClosingActionsBar
            isReadyToClose={summary.isReadyToClose}
            isClosed={isClosed}
            closeDisabledReason={summary.closeDisabledReason}
            canManage={canManageAgapeClosing}
            canEdit={canEdit}
            importing={actions.generateOperation.loading}
            onImport={() => actions.generateOperation.execute()}
            onRegisterPayment={() => openChargeDialog(null)}
            closingMonth={actions.closeOperation.loading}
            onCloseMonth={() => actions.closeOperation.execute()}
          />

          <AgapeChargesTable
            charges={charges}
            brotherNames={brotherNames}
            monthLabel={monthLabel}
            canEdit={canEdit}
            isDeleting={deleteCharge.isDeleting}
            onEdit={openChargeDialog}
            onDelete={deleteCharge.setTarget}
          />
        </>
      )}

      <AgapeChargeDialog
        open={dialog.open}
        onOpenChange={(open) => {
          dialog.onOpenChange(open)
          if (!open) setSelectedCharge(null)
        }}
        chargeToEdit={selectedCharge}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        readOnlyMonthYear
        onSave={(formData) => actions.saveOperation.execute(formData)}
        saving={actions.saveOperation.loading}
      />

      <AgapeClearMonthDialog
        open={clearMonth.open}
        monthLabel={monthLabel}
        clearing={clearMonth.isClearing}
        onCancel={() => clearMonth.setOpen(false)}
        onConfirm={() => void clearMonth.confirm()}
      />

      <AgapeDeleteChargeDialog
        target={deleteCharge.target}
        brotherNames={brotherNames}
        deleting={deleteCharge.isDeleting}
        onCancel={() => deleteCharge.setTarget(null)}
        onConfirm={() => void deleteCharge.confirm()}
      />
    </div>
  )
}
