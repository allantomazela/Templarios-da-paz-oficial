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
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { Budget, FinancialGoal, Transaction } from '@/lib/data'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { BudgetDialog } from './BudgetDialog'
import { GoalDialog } from './GoalDialog'
import { format } from 'date-fns'

interface BudgetFromDB {
  id: string
  name: string
  type: 'Receita' | 'Despesa'
  category_id: string | null
  amount: number
  period: 'Mensal' | 'Anual' | 'Personalizado'
  start_date: string | null
  end_date: string | null
  financial_categories?: {
    id: string
    name: string
  }
}

interface GoalFromDB {
  id: string
  name: string
  target_amount: number
  linked_category_id: string | null
  deadline: string
  financial_categories?: {
    id: string
    name: string
  }
}

interface TransactionFromDB {
  id: string
  date: string
  description: string
  category_id: string
  type: 'Receita' | 'Despesa'
  amount: number
  account_id: string | null
  financial_categories?: {
    id: string
    name: string
  }
}

export const BudgetsAndGoals = memo(function BudgetsAndGoals() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabaseAny = supabase as any

  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null)

  // Load all data from Supabase
  const loadData = useAsyncOperation(
    async () => {
      setLoading(true)
      try {
        // Load budgets
        const { data: budgetsData, error: budgetsError } = await supabaseAny
          .from('budgets')
          .select(
            `
            *,
            financial_categories!budgets_category_id_fkey (
              id,
              name
            )
          `,
          )
          .order('name')

        if (budgetsError) throw budgetsError

        const mappedBudgets: Budget[] = (budgetsData || []).map(
          (b: BudgetFromDB) => ({
            id: b.id,
            name: b.name,
            type: b.type,
            category: b.financial_categories?.name || undefined,
            amount: parseFloat(b.amount.toString()),
            period: b.period,
            startDate: b.start_date || undefined,
            endDate: b.end_date || undefined,
          }),
        )

        // Load goals
        const { data: goalsData, error: goalsError } = await supabaseAny
          .from('financial_goals')
          .select(
            `
            *,
            financial_categories!financial_goals_linked_category_id_fkey (
              id,
              name
            )
          `,
          )
          .order('deadline')

        if (goalsError) throw goalsError

        const mappedGoals: FinancialGoal[] = (goalsData || []).map(
          (g: GoalFromDB) => ({
            id: g.id,
            name: g.name,
            targetAmount: parseFloat(g.target_amount.toString()),
            linkedCategory: g.financial_categories?.name || undefined,
            deadline: g.deadline,
          }),
        )

        // Load transactions for progress calculation
        const { data: transactionsData, error: transactionsError } =
          await supabaseAny
            .from('financial_transactions')
            .select(
              `
              *,
              financial_categories!financial_transactions_category_id_fkey (
                id,
                name
              )
            `,
            )
            .order('date', { ascending: false })

        if (transactionsError) throw transactionsError

        const mappedTransactions: Transaction[] = (transactionsData || []).map(
          (t: TransactionFromDB) => ({
            id: t.id,
            date: t.date,
            description: t.description,
            category: t.financial_categories?.name || 'Sem categoria',
            type: t.type,
            amount: parseFloat(t.amount.toString()),
            accountId: t.account_id || undefined,
          }),
        )

        setBudgets(mappedBudgets)
        setGoals(mappedGoals)
        setTransactions(mappedTransactions)
      } catch (error) {
        console.error('Error loading budgets and goals:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar dados.',
    },
  )

  useEffect(() => {
    loadData.execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Handlers for Budgets
  const handleSaveBudget = useAsyncOperation(
    async (data: any) => {
      // Find category by name if provided
      let categoryId = null
      if (data.category) {
        const { data: categoryData, error: categoryError } = await supabaseAny
          .from('financial_categories')
          .select('id')
          .eq('name', data.category)
          .eq('type', data.type)
          .maybeSingle()

        if (categoryError) {
          throw new Error('Erro ao buscar categoria.')
        }

        if (categoryData) {
          categoryId = categoryData.id
        } else {
          throw new Error('Categoria não encontrada.')
        }
      }

      if (selectedBudget) {
        // Update
        const { error } = await supabaseAny
          .from('budgets')
          .update({
            name: data.name,
            type: data.type,
            category_id: categoryId,
            amount: data.amount,
            period: data.period,
            start_date: data.startDate || null,
            end_date: data.endDate || null,
          })
          .eq('id', selectedBudget.id)

        if (error) throw error

        await loadData.execute()
        return 'Orçamento atualizado.'
      } else {
        // Create
        const { error } = await supabaseAny.from('budgets').insert({
          name: data.name,
          type: data.type,
          category_id: categoryId,
          amount: data.amount,
          period: data.period,
          start_date: data.startDate || null,
          end_date: data.endDate || null,
        })

        if (error) throw error

        await loadData.execute()
        return 'Orçamento criado.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar o orçamento.',
    },
  )

  const handleDeleteBudget = useAsyncOperation(
    async (id: string) => {
      const { error } = await supabaseAny
        .from('budgets')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadData.execute()
      return 'Orçamento excluído.'
    },
    {
      successMessage: 'Orçamento removido com sucesso!',
      errorMessage: 'Falha ao remover o orçamento.',
    },
  )

  const onSaveBudget = async (data: any) => {
    const result = await handleSaveBudget.execute(data)
    if (result) {
      setIsBudgetDialogOpen(false)
    }
  }

  const onDeleteBudget = (id: string) => {
    handleDeleteBudget.execute(id)
  }

  const openNewBudget = () => {
    setSelectedBudget(null)
    setIsBudgetDialogOpen(true)
  }

  const openEditBudget = (budget: Budget) => {
    setSelectedBudget(budget)
    setIsBudgetDialogOpen(true)
  }

  // Handlers for Goals
  const handleSaveGoal = useAsyncOperation(
    async (data: any) => {
      // Find category by name if provided
      let linkedCategoryId = null
      if (data.linkedCategory) {
        const { data: categoryData, error: categoryError } = await supabaseAny
          .from('financial_categories')
          .select('id')
          .eq('name', data.linkedCategory)
          .eq('type', 'Receita')
          .maybeSingle()

        if (categoryError) {
          throw new Error('Erro ao buscar categoria.')
        }

        if (categoryData) {
          linkedCategoryId = categoryData.id
        } else {
          throw new Error('Categoria não encontrada.')
        }
      }

      if (selectedGoal) {
        // Update
        const { error } = await supabaseAny
          .from('financial_goals')
          .update({
            name: data.name,
            target_amount: data.targetAmount,
            linked_category_id: linkedCategoryId,
            deadline: data.deadline,
          })
          .eq('id', selectedGoal.id)

        if (error) throw error

        await loadData.execute()
        return 'Meta atualizada.'
      } else {
        // Create
        const { error } = await supabaseAny.from('financial_goals').insert({
          name: data.name,
          target_amount: data.targetAmount,
          linked_category_id: linkedCategoryId,
          deadline: data.deadline,
        })

        if (error) throw error

        await loadData.execute()
        return 'Meta criada.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar a meta.',
    },
  )

  const handleDeleteGoal = useAsyncOperation(
    async (id: string) => {
      const { error } = await supabaseAny
        .from('financial_goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadData.execute()
      return 'Meta excluída.'
    },
    {
      successMessage: 'Meta removida com sucesso!',
      errorMessage: 'Falha ao remover a meta.',
    },
  )

  const onSaveGoal = async (data: any) => {
    const result = await handleSaveGoal.execute(data)
    if (result) {
      setIsGoalDialogOpen(false)
    }
  }

  const onDeleteGoal = (id: string) => {
    handleDeleteGoal.execute(id)
  }

  const openNewGoal = () => {
    setSelectedGoal(null)
    setIsGoalDialogOpen(true)
  }

  const openEditGoal = (goal: FinancialGoal) => {
    setSelectedGoal(goal)
    setIsGoalDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando orçamentos e metas...</span>
        </div>
      </div>
    )
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
                          onClick={() => onDeleteBudget(budget.id)}
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
                          onClick={() => onDeleteGoal(goal.id)}
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
        onSave={onSaveBudget}
      />

      <GoalDialog
        open={isGoalDialogOpen}
        onOpenChange={setIsGoalDialogOpen}
        goalToEdit={selectedGoal}
        onSave={onSaveGoal}
      />
    </div>
  )
})
