import { useState } from 'react'
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
} from 'lucide-react'
import { BankAccount } from '@/lib/data'
import { useToast } from '@/hooks/use-toast'
import useFinancialStore from '@/stores/useFinancialStore'
import { BankAccountDialog } from './BankAccountDialog'
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
  const { accounts, transactions, addAccount, updateAccount, deleteAccount } =
    useFinancialStore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  const handleSave = (data: any) => {
    if (selectedAccount) {
      updateAccount({ ...selectedAccount, ...data })
      toast({ title: 'Sucesso', description: 'Conta atualizada.' })
    } else {
      addAccount({
        id: crypto.randomUUID(),
        color: `hsl(var(--chart-${Math.floor(Math.random() * 5) + 1}))`,
        ...data,
      })
      toast({ title: 'Sucesso', description: 'Conta criada.' })
    }
    setIsDialogOpen(false)
  }

  const handleDeleteClick = (account: BankAccount) => {
    const hasTransactions = transactions.some((t) => t.accountId === account.id)
    if (hasTransactions) {
      toast({
        variant: 'destructive',
        title: 'Ação Bloqueada',
        description:
          'Não é possível excluir conta com transações vinculadas. Edite as transações primeiro.',
      })
      return
    }
    setAccountToDelete(account)
  }

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteAccount(accountToDelete.id)
      toast({ title: 'Sucesso', description: 'Conta removida.' })
      setAccountToDelete(null)
    }
  }

  const openNew = () => {
    setSelectedAccount(null)
    setIsDialogOpen(true)
  }

  const openEdit = (account: BankAccount) => {
    setSelectedAccount(account)
    setIsDialogOpen(true)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Contas Bancárias e Caixas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie suas contas e saldos.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nova Conta
        </Button>
      </div>

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

      <BankAccountDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
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
