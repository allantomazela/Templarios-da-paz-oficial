import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Landmark,
  PiggyBank,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { BankAccount } from '@/lib/data'
import useFinancialStore from '@/stores/useFinancialStore'
import { BankAccountDialog } from './BankAccountDialog'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
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

export function BankAccounts() {
  const {
    accounts,
    transactions,
    loading,
    fetchAccounts,
    fetchTransactions,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useFinancialStore()

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchAccounts()
    fetchTransactions()
  }, [fetchAccounts, fetchTransactions])

  const dialog = useDialog()
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null,
  )
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(
    null,
  )

  const calculateBalance = (account: BankAccount) => {
    const accountTransactions = transactions.filter(
      (t) => t.accountId === account.id,
    )
    const income = accountTransactions
      .filter((t) => t.type === 'Receita')
      .reduce((acc, curr) => acc + curr.amount, 0)
    const expense = accountTransactions
      .filter((t) => t.type === 'Despesa')
      .reduce((acc, curr) => acc + curr.amount, 0)
    return account.initialBalance + income - expense
  }

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedAccount) {
        await updateAccount({ ...selectedAccount, ...data })
        return 'Conta atualizada com sucesso.'
      } else {
        await addAccount({
          id: crypto.randomUUID(),
          color: `hsl(var(--chart-${Math.floor(Math.random() * 5) + 1}))`,
          ...data,
        })
        return 'Conta criada com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar a conta.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      await deleteAccount(id)
      return 'Conta removida.'
    },
    {
      successMessage: 'Conta removida com sucesso!',
      errorMessage: 'Falha ao remover a conta.',
    },
  )

  const handleSave = async (data: any) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
    }
  }

  const handleDeleteClick = (account: BankAccount) => {
    const hasTransactions = transactions.some((t) => t.accountId === account.id)
    if (hasTransactions) {
      // Validation error - will be handled by toast
      return
    }
    setAccountToDelete(account)
  }

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteOperation.execute(accountToDelete.id)
      setAccountToDelete(null)
    }
  }

  const openNew = () => {
    setSelectedAccount(null)
    dialog.openDialog()
  }

  const openEdit = (account: BankAccount) => {
    setSelectedAccount(account)
    dialog.openDialog()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'Corrente':
        return <Landmark className="h-4 w-4" />
      case 'Poupança':
        return <PiggyBank className="h-4 w-4" />
      case 'Investimento':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Wallet className="h-4 w-4" />
    }
  }

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Contas Bancárias e Caixas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie suas contas e saldos.
          </p>
        </div>
        <Button onClick={openNew} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" /> Nova Conta
        </Button>
      </div>

      {accounts.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhuma conta cadastrada. Clique em "Nova Conta" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
          const balance = calculateBalance(account)
          return (
            <Card
              key={account.id}
              className="relative overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: account.color || 'gray' }}
              ></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getIcon(account.type)}
                    {account.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(account)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(account)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{account.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {balance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo Inicial: R$ {account.initialBalance.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}

      <BankAccountDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        accountToEdit={selectedAccount}
        onSave={handleSave}
      />

      <AlertDialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta "{accountToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
