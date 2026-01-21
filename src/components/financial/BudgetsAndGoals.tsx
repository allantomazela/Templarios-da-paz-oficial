import { useState, useMemo, memo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { Budget, FinancialGoal } from '@/lib/data'
import { useToast } from '@/hooks/use-toast'
import useFinancialStore from '@/stores/useFinancialStore'
import { BudgetDialog } from './BudgetDialog'
import { GoalDialog } from './GoalDialog'
import { format } from 'date-fns'
import { useAsyncOperation } from '@/hooks/use-async-operation'

export const BudgetsAndGoals = memo(function BudgetsAndGoals() {
  const {
    budgets,
    goals,
    transactions,
    loading,
    fetchBudgets,
    fetchGoals,
    fetchTransactions,
    addBudget,
    updateBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useFinancialStore()
  const { toast } = useToast()

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchBudgets()
    fetchGoals()
    fetchTransactions()
  }, [fetchBudgets, fetchGoals, fetchTransactions])

  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null)

  // Calculate Budget Progress - Memoized function
  const calculateBudgetProgress = useMemo(
    () => (budget: Budget) => {
      let currentAmount = 0
      // Simple filter: Type and Category. Period is ignored for mock simplicity but usually filters by date.
      const relevantTransactions = transactions.filter(
        (t) =>
          t.type === budget.type &&
          (!budget.category || t.category === budget.category),
      )
      currentAmount = relevantTransactions.reduce(
        (acc, curr) => acc + curr.amount,
        0,
      )
      return {
        current: currentAmount,
        percentage: Math.min((currentAmount / budget.amount) * 100, 100),
      }
    },
    [transactions],
  )

  // Calculate Goal Progress - Memoized function
  const calculateGoalProgress = useMemo(
    () => (goal: FinancialGoal) => {
      let currentAmount = 0
      if (goal.linkedCategory) {
        // Sum all revenue in this category
        currentAmount = transactions
          .filter(
            (t) => t.category === goal.linkedCategory && t.type === 'Receita',
          )
          .reduce((acc, curr) => acc + curr.amount, 0)
      }
      return {
        current: currentAmount,
        percentage: Math.min((currentAmount / goal.targetAmount) * 100, 100),
      }
    },
    [transactions],
  )

  const saveBudgetOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedBudget) {
        await updateBudget({ ...selectedBudget, ...data })
        return 'Orçamento atualizado com sucesso.'
      } else {
        await addBudget({ id: crypto.randomUUID(), ...data })
        return 'Orçamento criado com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar o orçamento.',
    },
  )

  const deleteBudgetOperation = useAsyncOperation(
    async (id: string) => {
      await deleteBudget(id)
      return 'Orçamento removido.'
    },
    {
      successMessage: 'Orçamento removido com sucesso!',
      errorMessage: 'Falha ao remover o orçamento.',
    },
  )

  // Handlers for Budgets
  const handleSaveBudget = async (data: any) => {
    const result = await saveBudgetOperation.execute(data)
    if (result) {
      setIsBudgetDialogOpen(false)
    }
  }

  const handleDeleteBudget = (id: string) => {
    deleteBudgetOperation.execute(id)
  }

  const openNewBudget = () => {
    setSelectedBudget(null)
    setIsBudgetDialogOpen(true)
  }

  const openEditBudget = (budget: Budget) => {
    setSelectedBudget(budget)
    setIsBudgetDialogOpen(true)
  }

  const saveGoalOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedGoal) {
        await updateGoal({ ...selectedGoal, ...data })
        return 'Meta atualizada com sucesso.'
      } else {
        await addGoal({ id: crypto.randomUUID(), ...data })
        return 'Meta criada com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar a meta.',
    },
  )

  const deleteGoalOperation = useAsyncOperation(
    async (id: string) => {
      await deleteGoal(id)
      return 'Meta removida.'
    },
    {
      successMessage: 'Meta removida com sucesso!',
      errorMessage: 'Falha ao remover a meta.',
    },
  )

  // Handlers for Goals
  const handleSaveGoal = async (data: any) => {
    const result = await saveGoalOperation.execute(data)
    if (result) {
      setIsGoalDialogOpen(false)
    }
  }

  const handleDeleteGoal = (id: string) => {
    deleteGoalOperation.execute(id)
  }

  const openNewGoal = () => {
    setSelectedGoal(null)
    setIsGoalDialogOpen(true)
  }

  const openEditGoal = (goal: FinancialGoal) => {
    setSelectedGoal(goal)
    setIsGoalDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Budgets Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Orçamentos</h3>
            <Button size="sm" onClick={openNewBudget}>
              <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
            </Button>
          </div>
          <div className="grid gap-4">
            {budgets.map((budget) => {
              const { current, percentage } = calculateBudgetProgress(budget)
              return (
                <Card key={budget.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {budget.name}
                        </CardTitle>
                        <CardDescription>
                          {budget.category || 'Geral'} • {budget.period}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditBudget(budget)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteBudget(budget.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        {budget.type === 'Receita' ? 'Arrecadado' : 'Gasto'}: R${' '}
                        {current.toFixed(2)}
                      </span>
                      <span className="font-medium">
                        Meta: R$ {budget.amount.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className={`h-2 ${
                        budget.type === 'Despesa' && percentage > 90
                          ? 'bg-red-100 [&>div]:bg-red-500'
                          : ''
                      }`}
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      {percentage.toFixed(1)}% do orçamento
                    </p>
                  </CardContent>
                </Card>
              )
            })}
            {budgets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
                Nenhum orçamento definido.
              </p>
            )}
          </div>
        </div>

        {/* Goals Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Metas Financeiras</h3>
            <Button size="sm" onClick={openNewGoal} variant="secondary">
              <TrendingUp className="mr-2 h-4 w-4" /> Nova Meta
            </Button>
          </div>
          <div className="grid gap-4">
            {goals.map((goal) => {
              const { current, percentage } = calculateGoalProgress(goal)
              return (
                <Card key={goal.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{goal.name}</CardTitle>
                        <CardDescription>
                          Prazo: {format(new Date(goal.deadline), 'dd/MM/yyyy')}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditGoal(goal)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Atual: R$ {current.toFixed(2)}
                      </span>
                      <span className="font-medium">
                        Alvo: R$ {goal.targetAmount.toFixed(2)}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2 bg-secondary" />
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      {percentage.toFixed(1)}% concluído
                    </p>
                  </CardContent>
                </Card>
              )
            })}
            {goals.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
                Nenhuma meta definida.
              </p>
            )}
          </div>
        </div>
      </div>

      <BudgetDialog
        open={isBudgetDialogOpen}
        onOpenChange={setIsBudgetDialogOpen}
        budgetToEdit={selectedBudget}
        onSave={handleSaveBudget}
      />

      <GoalDialog
        open={isGoalDialogOpen}
        onOpenChange={setIsGoalDialogOpen}
        goalToEdit={selectedGoal}
        onSave={handleSaveGoal}
      />
    </div>
  )
})
