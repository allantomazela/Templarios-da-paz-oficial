import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertCircle, CheckCircle2, Loader2, Pencil, Trash2 } from 'lucide-react'
import type { Transaction } from '@/lib/data'
import {
  computeTransactionBalanceImpact,
  type AccountReconciliationAudit,
  type EnrichedSameMonthMensalidadeGroup,
  type ReconciliationAlertType,
} from '@/lib/account-reconciliation'
import {
  deleteReconciliationTransaction,
  deleteReconciliationTransactions,
  fetchTransactionDependencyWarnings,
  type TransactionDependencyWarning,
} from '@/lib/account-reconciliation-adjustments'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import {
  TransactionDialog,
  type TransactionFormValues,
} from '@/components/financial/TransactionDialog'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  saveFinancialTransaction,
  type FinancialTransactionType,
} from '@/lib/financial-transaction-api'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { AcknowledgeReconciliationAlertButton } from '@/components/financial/AcknowledgeReconciliationAlertButton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ReconciliationAuditAlertsProps {
  audit: AccountReconciliationAudit
  accountNameById: Record<string, string>
  linkedMensalidadeIds: Set<string>
  onAlertAcknowledged: () => void
}

export function ReconciliationAuditAlerts({
  audit,
  accountNameById,
  linkedMensalidadeIds,
  onAlertAcknowledged,
}: ReconciliationAuditAlertsProps) {
  const unlinkedErrors = audit.unlinkedMensalidade.filter(
    (item) => item.reason === 'sem_vinculo_mensalidade',
  )
  const unlinkedReview = audit.unlinkedMensalidade.filter(
    (item) => item.reason === 'possivel_duplicata',
  )

  const sameMonthErrors = audit.sameMonthMensalidadeGroups.filter(
    (group) => group.kind === 'duplicate_same_reference',
  )
  const sameMonthReview = audit.sameMonthMensalidadeGroups.filter(
    (group) => group.kind === 'late_same_brother' || group.kind === 'unknown',
  )

  const errorCount =
    audit.orphanTransactions.length +
    audit.duplicateGroups.length +
    unlinkedErrors.length +
    sameMonthErrors.length

  const reviewCount =
    unlinkedReview.length + sameMonthReview.length

  const informativeCount = audit.sameMonthMensalidadeInformative.length

  const hasAlerts = errorCount + reviewCount + informativeCount > 0

  if (!hasAlerts) return null

  const defaultTab =
    errorCount > 0 ? 'errors' : reviewCount > 0 ? 'review' : 'info'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          Alertas de auditoria
        </CardTitle>
        <CardDescription>
          Conferência organizada por prioridade. Em <strong>Erros reais</strong>, exclua ou
          resolva os lançamentos — marcar como verificado não corrige o saldo. Nas abas
          Revisar e Informativos, confirme padrões legítimos quando conferir no extrato.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="errors" className="gap-1.5">
              Erros reais
              {errorCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1">
                  {errorCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-1.5">
              Revisar
              {reviewCount > 0 && (
                <Badge variant="outline" className="h-5 min-w-5 border-amber-400 px-1 text-amber-700">
                  {reviewCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-1.5">
              Informativos
              {informativeCount > 0 && (
                <Badge variant="secondary" className="h-5 min-w-5 px-1">
                  {informativeCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="errors" className="space-y-6 mt-0">
            {errorCount === 0 ? (
              <EmptyTabMessage message="Nenhum erro real pendente." />
            ) : (
              <>
                {audit.orphanTransactions.length > 0 && (
                  <AlertSection
                    title="Transações sem conta"
                    description="Não entram no saldo até serem vinculadas a uma conta."
                  >
                    {audit.orphanTransactions.slice(0, 10).map((transaction) => (
                      <AuditTransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        alertType="orphan_transaction"
                        alertKey={transaction.id}
                        onAlertAcknowledged={onAlertAcknowledged}
                        allowAcknowledge={false}
                      />
                    ))}
                  </AlertSection>
                )}

                {audit.duplicateGroups.length > 0 && (
                  <AlertSection
                    title="Lançamentos duplicados"
                    description="Mesma conta, data, tipo e valor — mantenha um e exclua as cópias."
                  >
                    {audit.duplicateGroups.slice(0, 8).map((group) => (
                      <DuplicateGroupResolver
                        key={group.key}
                        groupKey={group.key}
                        alertType="duplicate_group"
                        accountName={accountNameById[group.accountId ?? ''] ?? 'Sem conta'}
                        dateLabel={group.date}
                        amount={group.amount}
                        type={group.type}
                        transactions={group.transactions}
                        linkedMensalidadeIds={linkedMensalidadeIds}
                        onAlertAcknowledged={onAlertAcknowledged}
                        allowAcknowledge={false}
                      />
                    ))}
                  </AlertSection>
                )}

                {unlinkedErrors.length > 0 && (
                  <AlertSection
                    title="Mensalidades sem vínculo"
                    description="Receitas de Mensalidade sem pagamento registrado — provável lançamento manual indevido."
                  >
                    {unlinkedErrors.slice(0, 15).map((item) => (
                      <AuditTransactionRow
                        key={item.transaction.id}
                        transaction={item.transaction}
                        accountName={accountNameById[item.transaction.accountId ?? '']}
                        badge="Sem vínculo"
                        alertType="unlinked_mensalidade"
                        alertKey={item.transaction.id}
                        onAlertAcknowledged={onAlertAcknowledged}
                        allowAcknowledge={false}
                      />
                    ))}
                  </AlertSection>
                )}

                {sameMonthErrors.length > 0 && (
                  <AlertSection
                    title="Mensalidade repetida (mesmo irmão e referência)"
                    description="Mesmo irmão com a mesma referência MM/AAAA lançada mais de uma vez."
                  >
                    {sameMonthErrors.slice(0, 8).map((group) => (
                      <SameMonthGroupResolver
                        key={group.key}
                        group={group}
                        accountName={accountNameById[group.accountId] ?? 'Sem conta'}
                        linkedMensalidadeIds={linkedMensalidadeIds}
                        onAlertAcknowledged={onAlertAcknowledged}
                      />
                    ))}
                  </AlertSection>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="review" className="space-y-6 mt-0">
            {reviewCount === 0 ? (
              <EmptyTabMessage message="Nada pendente de revisão." />
            ) : (
              <>
                {sameMonthReview.length > 0 && (
                  <AlertSection
                    title="Pagamentos de atraso no mesmo mês"
                    description="Mesmo irmão quitando referências diferentes no mesmo mês de pagamento. Use quitação em lote no cronograma para reduzir alertas futuros."
                  >
                    {sameMonthReview.slice(0, 8).map((group) => (
                      <SameMonthGroupResolver
                        key={group.key}
                        group={group}
                        accountName={accountNameById[group.accountId] ?? 'Sem conta'}
                        linkedMensalidadeIds={linkedMensalidadeIds}
                        onAlertAcknowledged={onAlertAcknowledged}
                        reviewMode
                      />
                    ))}
                  </AlertSection>
                )}

                {unlinkedReview.length > 0 && (
                  <AlertSection
                    title="Possível duplicata de mensalidade"
                    description="Mesma conta, data e valor — confira se não há dois lançamentos para o mesmo pagamento."
                  >
                    {unlinkedReview.slice(0, 15).map((item) => (
                      <AuditTransactionRow
                        key={item.transaction.id}
                        transaction={item.transaction}
                        accountName={accountNameById[item.transaction.accountId ?? '']}
                        badge="Possível duplicata"
                        alertType="unlinked_mensalidade"
                        alertKey={item.transaction.id}
                        onAlertAcknowledged={onAlertAcknowledged}
                      />
                    ))}
                  </AlertSection>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-6 mt-0">
            {informativeCount === 0 ? (
              <EmptyTabMessage message="Nenhum padrão informativo no momento." />
            ) : (
              <AlertSection
                title="Padrões legítimos detectados"
                description="Situações esperadas — irmãos diferentes pagando no mesmo mês ou quitação em lote. Nenhuma ação obrigatória."
              >
                {audit.sameMonthMensalidadeInformative.slice(0, 10).map((group) => (
                  <SameMonthGroupResolver
                    key={group.key}
                    group={group}
                    accountName={accountNameById[group.accountId] ?? 'Sem conta'}
                    linkedMensalidadeIds={linkedMensalidadeIds}
                    onAlertAcknowledged={onAlertAcknowledged}
                    informativeMode
                  />
                ))}
              </AlertSection>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function EmptyTabMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      {message}
    </div>
  )
}

interface SameMonthGroupResolverProps {
  group: EnrichedSameMonthMensalidadeGroup
  accountName: string
  linkedMensalidadeIds: Set<string>
  onAlertAcknowledged: () => void
  reviewMode?: boolean
  informativeMode?: boolean
}

function SameMonthGroupResolver({
  group,
  accountName,
  linkedMensalidadeIds,
  onAlertAcknowledged,
  reviewMode = false,
  informativeMode = false,
}: SameMonthGroupResolverProps) {
  const kindBadge =
    group.kind === 'batch_settlement'
      ? 'Quitação em lote'
      : group.kind === 'different_brothers'
        ? 'Irmãos diferentes'
        : group.kind === 'duplicate_same_reference'
          ? 'Duplicata'
          : group.kind === 'late_same_brother'
            ? 'Atraso habitual'
            : 'Revisar'

  const badgeClass = informativeMode
    ? 'border-sky-300 text-sky-700'
    : reviewMode
      ? 'border-amber-300 text-amber-700'
      : 'border-destructive/40 text-destructive'

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">
            {accountName} · mês pag. {group.monthKey.slice(5)}/{group.monthKey.slice(0, 4)} ·{' '}
            {formatCurrencyBRL(group.amount)}
          </p>
          <Badge variant="outline" className={badgeClass}>
            {kindBadge}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{group.contextLabel}</p>
      </div>

      {informativeMode ? (
        <div className="space-y-2">
          {group.transactionContexts.map((ctx) => (
            <p key={ctx.transactionId} className="text-sm text-muted-foreground">
              · {ctx.summaryLabel}
            </p>
          ))}
          <div className="flex justify-end">
            <AcknowledgeReconciliationAlertButton
              alertType="same_month_mensalidade"
              alertKey={group.key}
              transactionIds={group.transactions.map((item) => item.id)}
              onAcknowledged={onAlertAcknowledged}
              label="Confirmar como legítimo"
            />
          </div>
        </div>
      ) : (
        <DuplicateGroupResolver
          groupKey={group.key}
          alertType="same_month_mensalidade"
          accountName={accountName}
          dateLabel={group.monthKey}
          amount={group.amount}
          type="Receita"
          transactions={group.transactions}
          linkedMensalidadeIds={linkedMensalidadeIds}
          onAlertAcknowledged={onAlertAcknowledged}
          hideHeader
          acknowledgeLabel="Confirmar como legítimo"
          allowResolveDuplicates={!reviewMode}
          allowAcknowledge={reviewMode}
        />
      )}
    </div>
  )
}

interface AlertSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

function AlertSection({ title, description, children }: AlertSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

interface AuditTransactionRowProps {
  transaction: Transaction
  accountName?: string
  badge?: string
  alertType: ReconciliationAlertType
  alertKey: string
  onAlertAcknowledged: () => void
  allowAcknowledge?: boolean
}

function AuditTransactionRow({
  transaction,
  accountName,
  badge,
  alertType,
  alertKey,
  onAlertAcknowledged,
  allowAcknowledge = true,
}: AuditTransactionRowProps) {
  const dialog = useDialog()
  const { toast } = useToast()
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)
  const [deleteWarnings, setDeleteWarnings] = useState<TransactionDependencyWarning[]>(
    [],
  )
  const [loadingWarnings, setLoadingWarnings] = useState(false)

  const balanceImpact = computeTransactionBalanceImpact(transaction)

  const saveOperation = useAsyncOperation(
    async (data: TransactionFormValues) => {
      const transactionId = await saveFinancialTransaction({
        type: transaction.type as FinancialTransactionType,
        data,
        existingId: transaction.id,
      })
      notifyFinancialDataChanged()
      return transactionId
    },
    {
      successMessage: 'Lançamento atualizado.',
      errorMessage: 'Falha ao atualizar lançamento.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      await deleteReconciliationTransaction(id)
      return 'Lançamento excluído.'
    },
    {
      successMessage: 'Lançamento excluído.',
      errorMessage: 'Falha ao excluir lançamento.',
    },
  )

  const openDeleteDialog = async () => {
    setLoadingWarnings(true)
    setPendingDelete(transaction)
    try {
      const warnings = await fetchTransactionDependencyWarnings(transaction.id)
      setDeleteWarnings(warnings)
    } catch {
      toast({
        title: 'Aviso',
        description: 'Não foi possível verificar vínculos. Prossiga com cautela.',
        variant: 'destructive',
      })
      setDeleteWarnings([])
    } finally {
      setLoadingWarnings(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span>{formatDateBR(transaction.date)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-medium">{transaction.description}</span>
            <span className="text-muted-foreground">·</span>
            <span>{formatCurrencyBRL(transaction.amount)}</span>
            {accountName && (
              <>
                <span className="text-muted-foreground">·</span>
                <span>{accountName}</span>
              </>
            )}
            {badge && (
              <Badge variant="outline" className="text-amber-700 border-amber-300">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Excluir altera o saldo em{' '}
            <span
              className={cn(
                balanceImpact >= 0 ? 'text-green-700' : 'text-destructive',
              )}
            >
              {balanceImpact >= 0 ? '+' : ''}
              {formatCurrencyBRL(balanceImpact)}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1">
          <AcknowledgeReconciliationAlertButton
            alertType={alertType}
            alertKey={alertKey}
            transactionIds={[transaction.id]}
            onAcknowledged={onAlertAcknowledged}
            allowAcknowledge={allowAcknowledge}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => dialog.openDialog()}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={loadingWarnings}
            onClick={() => void openDeleteDialog()}
          >
            {loadingWarnings ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-1 h-3.5 w-3.5" />
            )}
            Excluir
          </Button>
        </div>
      </div>

      <TransactionDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        transactionToEdit={transaction}
        onSave={(data) => saveOperation.execute(data)}
        defaultType={transaction.type}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null)
            setDeleteWarnings([])
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {pendingDelete?.description} —{' '}
                  {formatCurrencyBRL(pendingDelete?.amount ?? 0)}
                </p>
                <p>
                  O saldo da conta será ajustado em{' '}
                  {formatCurrencyBRL(balanceImpact)}.
                </p>
                {deleteWarnings.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-900">
                    <p className="font-medium">Vínculos encontrados:</p>
                    <ul className="mt-1 list-disc pl-4">
                      {deleteWarnings.map((warning) => (
                        <li key={`${warning.source}-${warning.label}`}>
                          {warning.label}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-xs">
                      Vínculos serão desfeitos e pagamentos voltarão para pendência,
                      evitando recriação automática da receita.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOperation.loading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteOperation.loading}
              onClick={(event) => {
                event.preventDefault()
                if (!pendingDelete) return
                void deleteOperation.execute(pendingDelete.id).then(() => {
                  setPendingDelete(null)
                  setDeleteWarnings([])
                })
              }}
            >
              {deleteOperation.loading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface DuplicateGroupResolverProps {
  groupKey: string
  alertType: ReconciliationAlertType
  accountName: string
  dateLabel: string
  amount: number
  type: Transaction['type']
  transactions: Transaction[]
  linkedMensalidadeIds: Set<string>
  onAlertAcknowledged: () => void
  hideHeader?: boolean
  acknowledgeLabel?: string
  allowResolveDuplicates?: boolean
  allowAcknowledge?: boolean
}

function DuplicateGroupResolver({
  groupKey,
  alertType,
  accountName,
  dateLabel,
  amount,
  type,
  transactions,
  linkedMensalidadeIds,
  onAlertAcknowledged,
  hideHeader = false,
  acknowledgeLabel = 'Confirmar como legítimo',
  allowResolveDuplicates = true,
  allowAcknowledge = true,
}: DuplicateGroupResolverProps) {
  const { toast } = useToast()
  const defaultKeepId =
    transactions.find((item) => linkedMensalidadeIds.has(item.id))?.id ??
    transactions[0]?.id ??
    ''

  const [keepId, setKeepId] = useState(defaultKeepId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resolving, setResolving] = useState(false)

  const toDelete = transactions.filter((item) => item.id !== keepId)
  const totalBalanceImpact = toDelete.reduce(
    (sum, item) => sum + computeTransactionBalanceImpact(item),
    0,
  )

  const handleResolve = async () => {
    if (toDelete.length === 0) {
      toast({
        title: 'Nada a excluir',
        description: 'Selecione qual lançamento manter e quais remover.',
      })
      return
    }

    setResolving(true)
    try {
      await deleteReconciliationTransactions(toDelete.map((item) => item.id))
      notifyFinancialDataChanged()
      toast({
        title: 'Duplicatas resolvidas',
        description: `${toDelete.length} lançamento(s) excluído(s). Saldo ajustado em ${formatCurrencyBRL(totalBalanceImpact)}.`,
      })
      setConfirmOpen(false)
    } catch (error) {
      toast({
        title: 'Erro ao resolver duplicatas',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className={cn('rounded-md border p-3 space-y-3', hideHeader && 'border-0 p-0')}>
      {!hideHeader && (
        <div>
          <p className="text-sm font-medium">
            {accountName} · {dateLabel.includes('-') && dateLabel.length === 7
              ? `mês ${dateLabel.slice(5)}/${dateLabel.slice(0, 4)}`
              : formatDateBR(dateLabel)}{' '}
            · {type} · {formatCurrencyBRL(amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {transactions.length} lançamentos — escolha qual manter
          </p>
        </div>
      )}

      <RadioGroup value={keepId} onValueChange={setKeepId} className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-start gap-2 rounded-md border px-2 py-2"
          >
            <RadioGroupItem value={transaction.id} id={`${groupKey}-${transaction.id}`} />
            <Label
              htmlFor={`${groupKey}-${transaction.id}`}
              className="flex-1 cursor-pointer text-sm font-normal"
            >
              <span className="font-medium">{formatDateBR(transaction.date)}</span>
              {' — '}
              {transaction.description}
              {linkedMensalidadeIds.has(transaction.id) && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Vinculado
                </Badge>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Excluir {toDelete.length} cópia(s): saldo{' '}
          <span
            className={cn(
              totalBalanceImpact >= 0 ? 'text-green-700' : 'text-destructive',
            )}
          >
            {totalBalanceImpact >= 0 ? '+' : ''}
            {formatCurrencyBRL(totalBalanceImpact)}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <AcknowledgeReconciliationAlertButton
            alertType={alertType}
            alertKey={groupKey}
            transactionIds={transactions.map((item) => item.id)}
            onAcknowledged={onAlertAcknowledged}
            label={acknowledgeLabel}
            allowAcknowledge={allowAcknowledge}
          />
          {allowResolveDuplicates && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={toDelete.length === 0 || resolving}
              onClick={() => setConfirmOpen(true)}
            >
              Resolver duplicatas
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão de duplicatas?</AlertDialogTitle>
            <AlertDialogDescription>
              Serão excluídos {toDelete.length} lançamento(s). O saldo da conta
              será ajustado em {formatCurrencyBRL(totalBalanceImpact)}. Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resolving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={resolving}
              onClick={(event) => {
                event.preventDefault()
                void handleResolve()
              }}
            >
              {resolving ? 'Excluindo...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
