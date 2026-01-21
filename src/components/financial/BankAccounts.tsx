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
import { BankAccountDialog } from './BankAccountDialog'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
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

<<<<<<< HEAD
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
=======
interface BankAccountFromDB {
  id: string
  name: string
  type: 'Corrente' | 'Poupança' | 'Caixa' | 'Investimento'
  initial_balance: number
  color: string | null
  created_at: string
  updated_at: string
}
>>>>>>> c2521e56afe76ce1fb856c2a463dd416fbc37422

export function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const dialog = useDialog()
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null,
  )
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(
    null,
  )
  const { toast } = useToast()
  const supabaseAny = supabase as any

  // Load accounts from Supabase
  const loadAccounts = useAsyncOperation(
    async () => {
      setLoading(true)
      const { data, error } = await supabaseAny
        .from('bank_accounts')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        throw new Error('Falha ao carregar contas.')
      }

      const mapped: BankAccount[] = (data || []).map((a: BankAccountFromDB) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        initialBalance: parseFloat(a.initial_balance.toString()),
        color: a.color || undefined,
      }))

      setAccounts(mapped)
      setLoading(false)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar contas.',
    },
  )

  useEffect(() => {
    loadAccounts.execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // TODO: Calculate balance from transactions when financial_transactions is integrated
  // For now, we show initial balance only

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedAccount) {
<<<<<<< HEAD
        await updateAccount({ ...selectedAccount, ...data })
        return 'Conta atualizada com sucesso.'
      } else {
        await addAccount({
          id: crypto.randomUUID(),
          color: `hsl(var(--chart-${Math.floor(Math.random() * 5) + 1}))`,
          ...data,
        })
=======
        // Update
        const { error } = await supabaseAny
          .from('bank_accounts')
          .update({
            name: data.name,
            type: data.type,
            initial_balance: data.initialBalance,
          })
          .eq('id', selectedAccount.id)

        if (error) throw error

        await loadAccounts.execute()
        return 'Conta atualizada com sucesso.'
      } else {
        // Create - generate random color if not provided
        const colors = [
          'hsl(var(--chart-1))',
          'hsl(var(--chart-2))',
          'hsl(var(--chart-3))',
          'hsl(var(--chart-4))',
          'hsl(var(--chart-5))',
        ]
        const randomColor = colors[Math.floor(Math.random() * colors.length)]

        const { error } = await supabaseAny
          .from('bank_accounts')
          .insert({
            name: data.name,
            type: data.type,
            initial_balance: data.initialBalance,
            color: randomColor,
          })

        if (error) throw error

        await loadAccounts.execute()
>>>>>>> c2521e56afe76ce1fb856c2a463dd416fbc37422
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
<<<<<<< HEAD
      await deleteAccount(id)
=======
      // Check if account has transactions
      const { data: transactions, error: checkError } = await supabaseAny
        .from('financial_transactions')
        .select('id')
        .eq('account_id', id)
        .limit(1)

      if (checkError) throw checkError

      if (transactions && transactions.length > 0) {
        toast({
          title: 'Erro',
          description: 'Não é possível excluir uma conta que possui transações associadas.',
          variant: 'destructive',
        })
        return
      }

      const { error } = await supabaseAny
        .from('bank_accounts')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadAccounts.execute()
>>>>>>> c2521e56afe76ce1fb856c2a463dd416fbc37422
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

<<<<<<< HEAD
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
=======
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando contas...</span>
          </div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma conta cadastrada.</p>
          <p className="text-sm mt-2">
            Clique em "Nova Conta" para adicionar uma conta bancária.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const balance = account.initialBalance // Will be updated when transactions are integrated
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
>>>>>>> c2521e56afe76ce1fb856c2a463dd416fbc37422
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
