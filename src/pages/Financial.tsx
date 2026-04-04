import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialOverview } from '@/components/financial/FinancialOverview'
import { IncomeList } from '@/components/financial/IncomeList'
import { ExpenseList } from '@/components/financial/ExpenseList'
import { ContributionsList } from '@/components/financial/ContributionsList'
import { FinancialReports } from '@/components/financial/FinancialReports'
import { CategoryList } from '@/components/financial/CategoryList'
import { BudgetsAndGoals } from '@/components/financial/BudgetsAndGoals'
import { ReminderSettings } from '@/components/financial/ReminderSettings'
import { BankAccounts } from '@/components/financial/BankAccounts'
import { CashFlowReport } from '@/components/financial/CashFlowReport'
import { CharityCollection } from '@/components/financial/CharityCollection'

export default function Financial() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
        <p className="text-muted-foreground">
          Controle de receitas, despesas, fluxo de caixa e gestão bancária.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex items-center overflow-x-auto">
          <TabsList className="w-full justify-start md:w-auto">
            <TabsTrigger value="overview">Dashboard</TabsTrigger>
            <TabsTrigger value="bank-accounts">Contas Bancárias</TabsTrigger>
            <TabsTrigger value="cash-flow">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="charity">Tronco de Beneficência</TabsTrigger>
            <TabsTrigger value="contributions">Contribuições</TabsTrigger>
            <TabsTrigger value="budgets">Metas e Orçamentos</TabsTrigger>
            <TabsTrigger value="reports">Outros Relatórios</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          {activeTab === 'overview' ? <FinancialOverview /> : null}
        </TabsContent>

        <TabsContent value="bank-accounts">
          {activeTab === 'bank-accounts' ? <BankAccounts /> : null}
        </TabsContent>

        <TabsContent value="cash-flow">
          {activeTab === 'cash-flow' ? <CashFlowReport /> : null}
        </TabsContent>

        <TabsContent value="income">
          {activeTab === 'income' ? <IncomeList /> : null}
        </TabsContent>

        <TabsContent value="expenses">
          {activeTab === 'expenses' ? <ExpenseList /> : null}
        </TabsContent>

        <TabsContent value="charity">
          {activeTab === 'charity' ? <CharityCollection /> : null}
        </TabsContent>

        <TabsContent value="contributions">
          {activeTab === 'contributions' ? <ContributionsList /> : null}
        </TabsContent>

        <TabsContent value="budgets">
          {activeTab === 'budgets' ? <BudgetsAndGoals /> : null}
        </TabsContent>

        <TabsContent value="reports">
          {activeTab === 'reports' ? <FinancialReports /> : null}
        </TabsContent>

        <TabsContent value="categories">
          {activeTab === 'categories' ? <CategoryList /> : null}
        </TabsContent>

        <TabsContent value="settings">
          {activeTab === 'settings' ? <ReminderSettings /> : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
