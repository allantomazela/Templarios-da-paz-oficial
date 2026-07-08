import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { ScrollableTabsList } from '@/components/ui/scrollable-tabs-list'
import { useModuleActivation } from '@/hooks/use-module-activation'
import useFinancialStore from '@/stores/useFinancialStore'
import { FinancialOverview } from '@/components/financial/FinancialOverview'
import { IncomeList } from '@/components/financial/IncomeList'
import { PayablesPanel } from '@/components/financial/PayablesPanel'
import { ExpenseList } from '@/components/financial/ExpenseList'
import { MembershipPayments } from '@/components/financial/MembershipPayments'
import { FinancialReports } from '@/components/financial/FinancialReports'
import { CategoryList } from '@/components/financial/CategoryList'
import { BudgetsAndGoals } from '@/components/financial/BudgetsAndGoals'
import { ReminderSettings } from '@/components/financial/ReminderSettings'
import { PayableReminderSettings } from '@/components/financial/PayableReminderSettings'
import { MembershipFeeSettings } from '@/components/financial/MembershipFeeSettings'
import { BankAccounts } from '@/components/financial/BankAccounts'
import { CashFlowReport } from '@/components/financial/CashFlowReport'
import { FinancialPlanningPanel } from '@/components/financial/FinancialPlanningPanel'
import { CharityCollection } from '@/components/financial/CharityCollection'
import { AgapeClosing } from '@/components/financial/AgapeClosing'
import { useAgapeClosingPermissions } from '@/hooks/use-agape-closing-permissions'
import { usePositionsReady } from '@/hooks/use-positions-ready'
import { DashboardModuleLoader } from '@/components/DashboardModuleLoader'
import { Navigate } from 'react-router-dom'

const FINANCIAL_TABS = [
  { value: 'overview', label: 'Dashboard' },
  { value: 'bank-accounts', label: 'Contas Bancárias' },
  { value: 'cash-flow', label: 'Fluxo de Caixa' },
  { value: 'income', label: 'Receitas' },
  { value: 'payables', label: 'Contas a pagar' },
  { value: 'expenses', label: 'Despesas' },
  { value: 'charity', label: 'Tronco de Beneficência' },
  { value: 'agape', label: 'Fechamento Ágape' },
  { value: 'contributions', label: 'Mensalidades' },
  { value: 'budgets', label: 'Metas e Orçamentos' },
  { value: 'planning', label: 'Planejamento' },
  { value: 'reports', label: 'Relatório' },
  { value: 'categories', label: 'Categorias' },
  { value: 'settings', label: 'Configurações' },
] as const

type FinancialTabValue = (typeof FINANCIAL_TABS)[number]['value']

export default function Financial() {
  const positionsReady = usePositionsReady()
  const hydrateModule = useFinancialStore((s) => s.hydrateModule)
  const { canManageAgapeClosing, canAccessFullFinancial } =
    useAgapeClosingPermissions()
  const [activeTab, setActiveTab] = useState<FinancialTabValue>('overview')

  useModuleActivation(
    '/dashboard/financial',
    () => {
      void hydrateModule().catch(() => {
        useFinancialStore.getState().resetLoadingFlags()
      })
    },
    { refreshOnVisible: true },
  )

  const visibleTabs = useMemo(() => {
    if (canAccessFullFinancial) return FINANCIAL_TABS
    if (canManageAgapeClosing) {
      return FINANCIAL_TABS.filter((tab) => tab.value === 'agape')
    }
    return []
  }, [canAccessFullFinancial, canManageAgapeClosing])

  useEffect(() => {
    if (visibleTabs.length === 0) return
    const isCurrentVisible = visibleTabs.some((tab) => tab.value === activeTab)
    if (!isCurrentVisible) {
      setActiveTab(visibleTabs[0].value)
    }
  }, [visibleTabs, activeTab])

  if (!positionsReady) {
    return <DashboardModuleLoader />
  }

  if (!canManageAgapeClosing) {
    return <Navigate to="/access-denied" replace />
  }

  const agapeOnly = !canAccessFullFinancial

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {agapeOnly ? 'Fechamento do Ágape' : 'Financeiro'}
        </h2>
        <p className="text-muted-foreground">
          {agapeOnly
            ? 'Controle mensal dos consumos e pagamentos do ágape. Use Correções e ajustes para editar, excluir ou limpar o mês sem acessar o banco de dados.'
            : 'Controle de receitas, despesas, fluxo de caixa e gestão bancária.'}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as FinancialTabValue)}
        className="space-y-4"
      >
        {visibleTabs.length > 1 && (
          <ScrollableTabsList>
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </ScrollableTabsList>
        )}

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

        <TabsContent value="payables">
          {activeTab === 'payables' ? <PayablesPanel /> : null}
        </TabsContent>

        <TabsContent value="expenses">
          {activeTab === 'expenses' ? <ExpenseList /> : null}
        </TabsContent>

        <TabsContent value="charity">
          {activeTab === 'charity' ? <CharityCollection /> : null}
        </TabsContent>

        <TabsContent value="agape">
          {activeTab === 'agape' ? <AgapeClosing /> : null}
        </TabsContent>

        <TabsContent value="contributions">
          {activeTab === 'contributions' ? <MembershipPayments /> : null}
        </TabsContent>

        <TabsContent value="budgets">
          {activeTab === 'budgets' ? <BudgetsAndGoals /> : null}
        </TabsContent>

        <TabsContent value="planning">
          {activeTab === 'planning' ? <FinancialPlanningPanel /> : null}
        </TabsContent>

        <TabsContent value="reports">
          {activeTab === 'reports' ? <FinancialReports /> : null}
        </TabsContent>

        <TabsContent value="categories">
          {activeTab === 'categories' ? <CategoryList /> : null}
        </TabsContent>

        <TabsContent value="settings">
          {activeTab === 'settings' ? (
            <div className="space-y-6">
              <MembershipFeeSettings />
              <ReminderSettings />
              <PayableReminderSettings />
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
