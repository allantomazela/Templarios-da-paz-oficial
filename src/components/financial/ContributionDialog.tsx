import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Contribution } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormHeader } from '@/components/ui/form-header'
import { Wallet, Loader2 } from 'lucide-react'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type {
  ContributionFormData,
  ContributionTreasuryMode,
  MembershipFeeSettings,
} from '@/lib/contribution-payments'
import { type BrotherOption } from '@/components/financial/BrotherSearchCombobox'
import { MembershipFeeQuickSettings } from '@/components/financial/MembershipFeeQuickSettings'
import { todayLocalISODate } from '@/lib/format-utils'
import {
  isMembershipHistoricalPeriod,
  resolveScheduleExpectedAmount,
} from '@/lib/membership-schedule'
import { ContributionAmountWarning } from '@/components/financial/ContributionAmountWarning'
import { ContributionAmountReductionConfirm } from '@/components/financial/ContributionAmountReductionConfirm'
import { ContributionBasicFields } from '@/components/financial/ContributionBasicFields'
import { ContributionTreasuryFields } from '@/components/financial/ContributionTreasuryFields'
import { ContributionNotesField } from '@/components/financial/ContributionNotesField'
import { ContributionLaunchGuidanceAlert } from '@/components/financial/ContributionLaunchGuidanceAlert'
import {
  getMembershipAmountReduction,
  type MembershipAmountReduction,
} from '@/lib/membership-amount-check'
import {
  buildContributionFormValues,
  contributionMonthNameToNumber,
  contributionSchema,
  type ContributionFormValues,
} from '@/lib/contribution-form-schema'
import { useContributionDialogOptions } from '@/hooks/use-contribution-dialog-options'
import { useLinkableMensalidadeTransactions } from '@/hooks/use-linkable-mensalidade-transactions'

interface ContributionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contributionToEdit: Contribution | null
  defaultBrotherId?: string
  defaultBrotherName?: string
  defaultMonth?: string
  defaultYear?: number
  defaultAmount?: number
  brothers?: BrotherOption[]
  feeSettings?: MembershipFeeSettings
  onUpdateFeeSettings?: (settings: MembershipFeeSettings) => Promise<void>
  onSave: (data: ContributionFormData) => void
  saving?: boolean
  /** Meses em aberto no cronograma do irmão (para orientação de lançamento). */
  openMonthsCount?: number
  /** Lançamento iniciado a partir de uma linha específica do cronograma. */
  launchFromSchedule?: boolean
  /** Modo inicial da tesouraria (ex.: só controle no cronograma). */
  defaultTreasuryMode?: ContributionTreasuryMode
}

export function ContributionDialog({
  open,
  onOpenChange,
  contributionToEdit,
  defaultBrotherId,
  defaultBrotherName,
  defaultMonth,
  defaultYear,
  defaultAmount = 150,
  brothers: brothersProp,
  feeSettings,
  onUpdateFeeSettings,
  onSave,
  saving = false,
  openMonthsCount = 0,
  launchFromSchedule = false,
  defaultTreasuryMode = 'standard',
}: ContributionDialogProps) {
  const { brothers, accounts, loadingOptions } = useContributionDialogOptions(
    open,
    brothersProp,
  )
  const [pendingReduction, setPendingReduction] = useState<{
    reduction: MembershipAmountReduction
    values: ContributionFormValues
  } | null>(null)

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: buildContributionFormValues(null, {
      amount: defaultAmount,
      treasuryMode: 'standard',
    }),
  })

  const watchStatus = form.watch('status')
  const watchBrotherId = form.watch('brotherId')
  const watchMonth = form.watch('month')
  const watchYear = form.watch('year')
  const watchTreasuryMode = form.watch('treasuryMode')
  const watchAmount = form.watch('amount')

  const selectedBrother = brothers.find((b) => b.id === watchBrotherId)

  const expectedAmount = useMemo(() => {
    if (!feeSettings) return null
    return resolveScheduleExpectedAmount(feeSettings, selectedBrother?.membershipSituation)
  }, [feeSettings, selectedBrother?.membershipSituation])

  const isProductionPeriod = useMemo(() => {
    if (!watchMonth) return false
    return !isMembershipHistoricalPeriod(
      watchYear,
      contributionMonthNameToNumber(watchMonth),
    )
  }, [watchMonth, watchYear])

  const linkable = useLinkableMensalidadeTransactions({
    enabled: open && watchStatus === 'Pago' && watchTreasuryMode === 'link_existing',
    brotherName:
      selectedBrother?.full_name?.trim() ||
      defaultBrotherName?.trim() ||
      contributionToEdit?.brotherName?.trim(),
    monthName: watchMonth,
    year: watchYear,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      buildContributionFormValues(contributionToEdit, {
        brotherId: defaultBrotherId,
        month: defaultMonth,
        year: defaultYear,
        amount: defaultAmount,
        treasuryMode: defaultTreasuryMode,
      }),
    )
  }, [
    contributionToEdit,
    defaultBrotherId,
    defaultMonth,
    defaultYear,
    defaultAmount,
    defaultTreasuryMode,
    form,
    open,
  ])

  useEffect(() => {
    if (watchStatus !== 'Pago') return
    if (contributionToEdit) {
      if (!form.getValues('paymentDate')) {
        form.setValue('paymentDate', todayLocalISODate())
      }
      return
    }
    form.setValue('paymentDate', todayLocalISODate())
  }, [watchStatus, contributionToEdit, form])

  const dialogTitle = contributionToEdit
    ? 'Editar mensalidade'
    : 'Registrar mensalidade'
  const dialogDescription = contributionToEdit
    ? 'Atualize o lançamento. Pagamentos confirmados atualizam a receita na tesouraria.'
    : 'Informe o pagamento individual do irmão. Ao marcar como Pago, a receita entra no saldo.'

  const handleSubmit = (values: ContributionFormValues) => {
    const reduction =
      contributionToEdit && expectedAmount != null
        ? getMembershipAmountReduction(
            Number(contributionToEdit.amount),
            Number(values.amount),
            expectedAmount,
          )
        : null

    if (reduction) {
      setPendingReduction({ reduction, values })
      return
    }

    saveValues(values)
  }

  const saveValues = (values: ContributionFormValues) => {
    const brother = brothers.find((b) => b.id === values.brotherId)

    onSave({
      ...values,
      brotherName:
        brother?.full_name?.trim() ||
        defaultBrotherName?.trim() ||
        contributionToEdit?.brotherName ||
        undefined,
      notes: values.notes?.trim() || undefined,
      accountId: values.accountId,
      treasuryMode: values.treasuryMode ?? 'standard',
      linkedTransactionId: values.linkedTransactionId || undefined,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <FormHeader
          title={dialogTitle}
          description={dialogDescription}
          icon={<Wallet className="h-5 w-5" />}
        />

        {feeSettings && onUpdateFeeSettings && !contributionToEdit && (
          <MembershipFeeQuickSettings
            compact
            settings={feeSettings}
            onSave={onUpdateFeeSettings}
          />
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <ContributionLaunchGuidanceAlert
              isEditing={Boolean(contributionToEdit)}
              isSingleMonthLaunch={launchFromSchedule || Boolean(defaultMonth)}
              openMonthsCount={openMonthsCount}
            />

            <ContributionBasicFields
              form={form}
              brothers={brothers}
              brotherSelectedLabel={
                defaultBrotherName || contributionToEdit?.brotherName || undefined
              }
              isEditing={!!contributionToEdit}
              loadingBrothers={loadingOptions && brothers.length === 0}
              defaultAmount={defaultAmount}
            />

            <ContributionAmountWarning
              amount={watchAmount}
              expectedAmount={expectedAmount}
            />

            {watchStatus === 'Pago' && (
              <ContributionTreasuryFields
                form={form}
                isProductionPeriod={isProductionPeriod}
                accounts={accounts}
                loadingOptions={loadingOptions}
                linkableTransactions={linkable.transactions}
                loadingLinkable={linkable.loading}
              />
            )}

            <ContributionNotesField form={form} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || loadingOptions}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        <ContributionAmountReductionConfirm
          reduction={pendingReduction?.reduction ?? null}
          periodText={
            pendingReduction
              ? `${pendingReduction.values.month}/${pendingReduction.values.year}`
              : ''
          }
          onCancel={() => setPendingReduction(null)}
          onConfirm={() => {
            if (pendingReduction) saveValues(pendingReduction.values)
            setPendingReduction(null)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
