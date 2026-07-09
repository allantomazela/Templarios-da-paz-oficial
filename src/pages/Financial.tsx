import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { ScrollableTabsList } from '@/components/ui/scrollable-tabs-list'
import { useModuleActivation } from '@/hooks/use-module-activation'
import useFinancialStore from '@/stores/useFinancialStore'
import { useAgapeClosingPermissions } from '@/hooks/use-agape-closing-permissions'
import { usePositionsReady } from '@/hooks/use-positions-ready'
import { DashboardModuleLoader } from '@/components/DashboardModuleLoader'
import { Navigate } from 'react-router-dom'

const FinancialOverview = lazy(() =>
  import('@/components/financial/FinancialOverview').then((m) => ({
    default: m.FinancialOverview,
  })),
)
const BankAccounts = lazy(() =>
  import('@/components/financial/BankAccounts').then((m) => ({
    default: m.BankAccounts,
  })),
)
const CashFlowReport = lazy(() =>
  import('@/components/financial/CashFlowReport').then((m) => ({
    default: m.CashFlowReport,
  })),
)
const IncomeList = lazy(() =>
  import('@/components/financial/IncomeList').then((m) => ({
    default: m.IncomeList,
  })),
)
const PayablesPanel = lazy(() =>
  import('@/components/financial/PayablesPanel').then((m) => ({
    default: m.PayablesPanel,
  })),
)
const ExpenseList = lazy(() =>
  import('@/components/financial/ExpenseList').then((m) => ({
    default: m.ExpenseList,
  })),
)
const CharityCollection = lazy(() =>
  import('@/components/financial/CharityCollection').then((m) => ({
    default: m.CharityCollection,
  })),
)
const AgapeClosing = lazy(() =>
  import('@/components/financial/AgapeClosing').then((m) => ({
    default: m.AgapeClosing,
  })),
)
const MembershipPayments = lazy(() =>
  import('@/components/financial/MembershipPayments').then((m) => ({
    default: m.MembershipPayments,
  })),
)
const BudgetsAndGoals = lazy(() =>
  import('@/components/financial/BudgetsAndGoals').then((m) => ({
    default: m.BudgetsAndGoals,
  })),
)
const FinancialPlanningPanel = lazy(() =>
  import('@/components/financial/FinancialPlanningPanel').then((m) => ({
    default: m.FinancialPlanningPanel,
  })),
)
const FinancialReports = lazy(() =>
  import('@/components/financial/FinancialReports').then((m) => ({
    default: m.FinancialReports,
  })),
)
const CategoryList = lazy(() =>
  import('@/components/financial/CategoryList').then((m) => ({
    default: m.CategoryList,
  })),
)
const FinancialSettingsPanel = lazy(() =>
  import('@/components/financial/FinancialSettingsPanel').then((m) => ({
    default: m.FinancialSettingsPanel,
  })),
)

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

function FinancialTabPanel({
  active,
  children,
}: {
  active: boolean
  children: ReactNode
}) {
  if (!active) return null
  return <Suspense fallback={<DashboardModuleLoader />}>{children}</Suspense>
}

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
          <FinancialTabPanel active={activeTab === 'overview'}>
            <FinancialOverview />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="bank-accounts">
          <FinancialTabPanel active={activeTab === 'bank-accounts'}>
            <BankAccounts />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="cash-flow">
          <FinancialTabPanel active={activeTab === 'cash-flow'}>
            <CashFlowReport />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="income">
          <FinancialTabPanel active={activeTab === 'income'}>
            <IncomeList />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="payables">
          <FinancialTabPanel active={activeTab === 'payables'}>
            <PayablesPanel />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="expenses">
          <FinancialTabPanel active={activeTab === 'expenses'}>
            <ExpenseList />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="charity">
          <FinancialTabPanel active={activeTab === 'charity'}>
            <CharityCollection />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="agape">
          <FinancialTabPanel active={activeTab === 'agape'}>
            <AgapeClosing />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="contributions">
          <FinancialTabPanel active={activeTab === 'contributions'}>
            <MembershipPayments />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="budgets">
          <FinancialTabPanel active={activeTab === 'budgets'}>
            <BudgetsAndGoals />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="planning">
          <FinancialTabPanel active={activeTab === 'planning'}>
            <FinancialPlanningPanel />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="reports">
          <FinancialTabPanel active={activeTab === 'reports'}>
            <FinancialReports />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="categories">
          <FinancialTabPanel active={activeTab === 'categories'}>
            <CategoryList />
          </FinancialTabPanel>
        </TabsContent>

        <TabsContent value="settings">
          <FinancialTabPanel active={activeTab === 'settings'}>
            <FinancialSettingsPanel />
          </FinancialTabPanel>
        </TabsContent>
      </Tabs>
    </div>
  )
}
