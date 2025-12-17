import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialOverview } from '@/components/financial/FinancialOverview'
import { IncomeList } from '@/components/financial/IncomeList'
import { ExpenseList } from '@/components/financial/ExpenseList'
import { ContributionsList } from '@/components/financial/ContributionsList'
import { FinancialReports } from '@/components/financial/FinancialReports'

export default function Financial() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
        <p className="text-muted-foreground">
          Controle de receitas, despesas, contribuições e relatórios.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="contributions">Contribuições</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinancialOverview />
        </TabsContent>

        <TabsContent value="income">
          <IncomeList />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpenseList />
        </TabsContent>

        <TabsContent value="contributions">
          <ContributionsList />
        </TabsContent>

        <TabsContent value="reports">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
