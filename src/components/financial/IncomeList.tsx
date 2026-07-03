import { useState, useRef, useMemo } from 'react'
import { Transaction } from '@/lib/data'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pencil,
  Trash2,
  Calendar,
  Folder,
  Wallet,
  Loader2,
} from 'lucide-react'
import {
  TransactionDialog,
  type TransactionFormValues,
} from './TransactionDialog'
import { TransactionAttachmentIndicator } from './TransactionAttachmentIndicator'
import { TransactionAttachmentActions } from './TransactionAttachmentActions'
import { TransactionListToolbar } from './TransactionListToolbar'
import { FinancialCashSummaryBar } from './FinancialCashSummaryBar'
import { formatDateBR } from '@/lib/format-utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { formatCurrencyBRL } from '@/lib/format-utils'
import { useToast } from '@/hooks/use-toast'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import { useFinancialAttachmentAccess } from '@/hooks/use-financial-attachment-access'
import { useFinancialTransactionList } from '@/hooks/use-financial-transaction-list'
import {
  saveFinancialTransaction,
} from '@/lib/financial-transaction-api'
import { TransactionDeleteConfirmDialog } from '@/components/financial/TransactionDeleteConfirmDialog'
import { TransactionListFiltersPanel } from '@/components/financial/TransactionListFiltersPanel'
import { useTransactionListFilters } from '@/hooks/use-transaction-list-filters'
import {
  computeCashAvailability,
  sumTransactionAmounts,
} from '@/lib/financial-balance-math'

export function IncomeList() {
  const { toast } = useToast()
  const canManageAttachments = useFinancialAttachmentAccess()
  const {
    transactions: incomes,
    accounts,
    allTransactions,
    accountNames,
    loading,
  } = useFinancialTransactionList('Receita', {
    includeAttachmentCounts: canManageAttachments,
  })
  const dialog = useDialog()
  const [selectedIncome, setSelectedIncome] = useState<Transaction | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)
  const createIdempotencyKeyRef = useRef<string | null>(null)

  const {
    filters,
    updateFilters,
    resetFilters,
    filteredTransactions: filteredIncomes,
    categories,
    brothers,
    brothersLoading,
    membershipLinksLoading,
    hasActiveFilters,
  } = useTransactionListFilters({
    transactions: incomes,
    accounts,
    accountNames,
    enableMembershipLinkFilter: true,
  })

  const filteredTotal = useMemo(
    () => sumTransactionAmounts(filteredIncomes),
    [filteredIncomes],
  )

  const cashSummary = useMemo(
    () => computeCashAvailability(accounts, allTransactions),
    [accounts, allTransactions],
  )

  const refreshIncomes = () => {
    notifyFinancialDataChanged()
  }

  const saveOperation = useAsyncOperation(
    async (data: TransactionFormValues): Promise<string | null> => {
      const transactionId = await saveFinancialTransaction({
        type: 'Receita',
        data: {
          ...data,
          forecastItemId: data.forecastItemId || null,
        },
        existingId: selectedIncome?.id,
        idempotencyKeyRef: createIdempotencyKeyRef,
      })

      await refreshIncomes()
      return transactionId
    },
    {
      successMessage: 'Receita salva com sucesso!',
      errorMessage: 'Falha ao salvar a receita.',
    },
  )

  const handleDelete = (income: Transaction) => {
    setPendingDelete(income)
  }

  const handleSave = async (data: TransactionFormValues) => {
    return saveOperation.execute(data)
  }

  const handleDeleteConfirmed = (message: string) => {
    notifyFinancialDataChanged()
    toast({
      title: 'Receita removida',
      description: message,
    })
    setPendingDelete(null)
  }

  const openNew = () => {
    setSelectedIncome(null)
    dialog.openDialog()
  }

  const openEdit = (income: Transaction) => {
    setSelectedIncome(income)
    dialog.openDialog()
  }

  const getAccountName = (id?: string) => {
    if (!id) return 'N/A'
    return accountNames[id] || 'N/A'
  }

  return (
    <div className="space-y-4">
      <TransactionListToolbar
        searchPlaceholder="Buscar por descrição, categoria, conta ou valor..."
        searchTerm={filters.searchTerm}
        onSearchChange={(value) => updateFilters({ searchTerm: value })}
        listTotalLabel={hasActiveFilters ? 'Total filtrado' : 'Total de receitas'}
        listTotal={filteredTotal}
        listTotalClassName="text-green-600"
        actionLabel="Nova Receita"
        onAction={openNew}
        actionClassName="bg-green-600 hover:bg-green-700"
      />

      <TransactionListFiltersPanel
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        categories={categories}
        accounts={accounts}
        accountNames={accountNames}
        brothers={brothers}
        brothersLoading={brothersLoading}
        resultCount={filteredIncomes.length}
        totalCount={incomes.length}
        showMembershipLinkFilter
        membershipLinksLoading={membershipLinksLoading}
      />

      {!loading ? <FinancialCashSummaryBar summary={cashSummary} highlight="income" /> : null}

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando receitas...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredIncomes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {hasActiveFilters
                    ? 'Nenhuma receita encontrada com os filtros aplicados.'
                    : 'Nenhuma receita cadastrada.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredIncomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell>
                    {formatDateBR(income.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{income.description}</span>
                      <TransactionAttachmentIndicator
                        transaction={income}
                        visible={canManageAttachments}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{income.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-normal text-muted-foreground"
                    >
                      {getAccountName(income.accountId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatCurrencyBRL(income.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-0">
                      <TransactionAttachmentActions
                        transactionId={income.id}
                        attachmentCount={income.attachmentCount}
                        visible={canManageAttachments}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(income)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(income)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando receitas...
          </div>
        ) : filteredIncomes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            {hasActiveFilters
              ? 'Nenhuma receita encontrada com os filtros aplicados.'
              : 'Nenhuma receita cadastrada.'}
          </div>
        ) : (
          filteredIncomes.map((income) => (
            <Card key={income.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-medium">{income.description}</h4>
                    <TransactionAttachmentIndicator
                      transaction={income}
                      visible={canManageAttachments}
                    />
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrencyBRL(income.amount)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <TransactionAttachmentActions
                      transactionId={income.id}
                      attachmentCount={income.attachmentCount}
                      visible={canManageAttachments}
                      size="sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(income)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(income)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateBR(income.date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    {income.category}
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <Wallet className="h-3 w-3" />
                    {getAccountName(income.accountId)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <TransactionDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        transactionToEdit={selectedIncome}
        onSave={handleSave}
        defaultType="Receita"
      />

      <TransactionDeleteConfirmDialog
        transaction={pendingDelete}
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onDeleted={handleDeleteConfirmed}
        onError={(message) =>
          toast({
            title: 'Erro ao excluir receita',
            description: message,
            variant: 'destructive',
          })
        }
      />
    </div>
  )
}
