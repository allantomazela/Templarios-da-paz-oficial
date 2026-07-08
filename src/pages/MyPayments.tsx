import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase/client'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Clock,
  History,
  XCircle,
} from 'lucide-react'
import {
  fetchMemberPayments,
  getMemberPaymentCategoryLabel,
  getPaidMemberPayments,
  sumPaidMemberPayments,
  type MemberPayment as Payment,
} from '@/lib/member-payments'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import {
  fetchContributionsForProfile,
  fetchMembershipFeeSettings,
} from '@/lib/contribution-payments'
import { MembershipScheduleTable } from '@/components/financial/MembershipScheduleTable'
import {
  buildMembershipScheduleForBrother,
} from '@/lib/membership-schedule'
import { MEMBERSHIP_LABELS } from '@/lib/membership-labels'

export default function MyPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [memberSince, setMemberSince] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  const loadPayments = useAsyncOperation(
    async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Usuário não autenticado.')
      }

      const supabaseAny = supabase as any
      const [{ data: profile }, mappedPayments, settings] = await Promise.all([
        supabaseAny
          .from('profiles')
          .select('created_at')
          .eq('id', user.id)
          .maybeSingle(),
        fetchMemberPayments(user.id),
        fetchMembershipFeeSettings(),
      ])

      setMemberSince(profile?.created_at ?? null)
      setPayments(mappedPayments)

      const contributions = await fetchContributionsForProfile(user.id)
      return buildMembershipScheduleForBrother(
        user.id,
        'Você',
        contributions,
        settings,
        profile?.created_at,
      )
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar pagamentos.',
    },
  )

  const { execute: loadPaymentsExecute, loading: loadPaymentsLoading, data: schedule } =
    loadPayments

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadPaymentsExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const monthlyPayments = payments.filter((p) => p.type === 'monthly')
  const charityPayments = payments.filter((p) => p.type === 'charity')
  const ceremonyPayments = payments.filter((p) => p.type === 'ceremony')
  const agapePayments = payments.filter((p) => p.type === 'agape')
  const pendingPayments = useMemo(
    () => payments.filter((p) => p.status !== 'paid'),
    [payments],
  )
  const paidPayments = useMemo(
    () => getPaidMemberPayments(payments),
    [payments],
  )
  const totalPaidAll = useMemo(
    () => sumPaidMemberPayments(payments),
    [payments],
  )

  const openSchedule = useMemo(
    () => schedule?.openEntries ?? [],
    [schedule],
  )
  const overdueSchedule = useMemo(
    () => schedule?.overdueEntries ?? [],
    [schedule],
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Pago
          </Badge>
        )
      case 'overdue':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Vencido
          </Badge>
        )
      case 'pending':
      case 'upcoming':
        return (
          <Badge className="bg-sky-600 hover:bg-sky-700">
            <Clock className="mr-1 h-3 w-3" />
            À vencer
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Meus Pagamentos</h2>
        <p className="text-muted-foreground">
          Acompanhe seu extrato completo de pagamentos, cronograma de
          mensalidades e pendências.
        </p>
      </div>

      {overdueSchedule.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Mensalidades em atraso</AlertTitle>
          <AlertDescription>
            Você possui {overdueSchedule.length} mês(es) em atraso, totalizando{' '}
            {formatCurrencyBRL(schedule?.totalOverdue ?? 0)}. Confira o
            cronograma abaixo para se organizar.
          </AlertDescription>
        </Alert>
      ) : schedule && schedule.entries.length > 0 ? (
        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CheckCircle className="h-4 w-4 text-green-700" />
          <AlertTitle className="text-green-800 dark:text-green-300">
            Mensalidades em dia
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            Não há meses em atraso no seu cronograma.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrencyBRL(totalPaidAll)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidPayments.length} pagamento(s) registrado(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{MEMBERSHIP_LABELS.upcoming} (mensalidades)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrencyBRL(schedule?.totalOpen ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {openSchedule.length} mês(es) à vencer ou parcial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em atraso (mensalidades)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrencyBRL(schedule?.totalOverdue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdueSchedule.length} mês(es)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Doações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyBRL(
                charityPayments.reduce((sum, p) => sum + p.amount, 0),
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {charityPayments.length} doação(ões)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="extrato" className="space-y-4">
        <TabsList>
          <TabsTrigger value="extrato">
            <History className="mr-2 h-4 w-4" />
            Extrato ({paidPayments.length})
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <CalendarDays className="mr-2 h-4 w-4" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="open">
            À vencer ({openSchedule.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendências ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Pagas ({schedule?.paidEntries.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="entries">
            Mensalidades ({monthlyPayments.length})
          </TabsTrigger>
          <TabsTrigger value="ceremony">
            Taxas de grau ({ceremonyPayments.length})
          </TabsTrigger>
          <TabsTrigger value="agape">
            Ágape ({agapePayments.length})
          </TabsTrigger>
          <TabsTrigger value="charity">
            Tronco ({charityPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extrato">
          <Card>
            <CardHeader>
              <CardTitle>Extrato de pagamentos realizados</CardTitle>
            </CardHeader>
            <CardContent>
              {loadPaymentsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando extrato...
                </div>
              ) : paidPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pagamento registrado ainda.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data pagamento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidPayments.map((payment) => (
                      <TableRow key={`${payment.type}-${payment.id}`}>
                        <TableCell>
                          {getMemberPaymentCategoryLabel(payment)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.description}
                        </TableCell>
                        <TableCell>
                          {payment.paymentDate
                            ? formatDateBR(payment.paymentDate)
                            : formatDateBR(payment.dueDate)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrencyBRL(payment.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de mensalidades</CardTitle>
            </CardHeader>
            <CardContent>
              {loadPaymentsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando cronograma...
                </div>
              ) : (
                <MembershipScheduleTable
                  entries={schedule?.entries ?? []}
                  emptyMessage="Nenhum período no cronograma. Entre em contato com a tesouraria."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="open">
          <Card>
            <CardHeader>
              <CardTitle>Mensalidades à vencer ou parciais</CardTitle>
            </CardHeader>
            <CardContent>
              <MembershipScheduleTable
                entries={openSchedule}
                emptyMessage="Nenhuma mensalidade à vencer no momento."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pendências (todas as categorias)</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma pendência registrada.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment) => (
                      <TableRow key={`${payment.type}-${payment.id}`}>
                        <TableCell>{getMemberPaymentCategoryLabel(payment)}</TableCell>
                        <TableCell className="font-medium">
                          {payment.description}
                        </TableCell>
                        <TableCell>{formatDateBR(payment.dueDate)}</TableCell>
                        <TableCell className="font-mono">
                          {formatCurrencyBRL(payment.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardHeader>
              <CardTitle>Meses quitados</CardTitle>
            </CardHeader>
            <CardContent>
              <MembershipScheduleTable
                entries={schedule?.paidEntries ?? []}
                emptyMessage="Nenhum mês quitado ainda."
                highlightOverdue={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>Lançamentos registrados</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum lançamento registrado.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.description}
                        </TableCell>
                        <TableCell>{formatDateBR(payment.dueDate)}</TableCell>
                        <TableCell className="font-mono">
                          {formatCurrencyBRL(payment.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.paymentDate
                            ? formatDateBR(payment.paymentDate)
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ceremony">
          <Card>
            <CardHeader>
              <CardTitle>Taxas de grau (iniciação, elevação, exaltação)</CardTitle>
            </CardHeader>
            <CardContent>
              {ceremonyPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma taxa de grau registrada. Se você já pagou, solicite à
                  tesouraria o lançamento em Financeiro → Mensalidades → Iniciação,
                  Elevação e Outros.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ceremonyPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.description}
                        </TableCell>
                        <TableCell>{formatDateBR(payment.dueDate)}</TableCell>
                        <TableCell className="font-mono">
                          {formatCurrencyBRL(payment.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.paymentDate
                            ? formatDateBR(payment.paymentDate)
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agape">
          <Card>
            <CardHeader>
              <CardTitle>Consumo do Ágape</CardTitle>
            </CardHeader>
            <CardContent>
              {agapePayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma cobrança de ágape registrada.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agapePayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.description}
                        </TableCell>
                        <TableCell>{formatDateBR(payment.dueDate)}</TableCell>
                        <TableCell className="font-mono">
                          {formatCurrencyBRL(payment.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.paymentDate
                            ? formatDateBR(payment.paymentDate)
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charity">
          <Card>
            <CardHeader>
              <CardTitle>Tronco de Beneficência</CardTitle>
            </CardHeader>
            <CardContent>
              {charityPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma doação registrada.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charityPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.description}
                        </TableCell>
                        <TableCell>
                          {formatDateBR(payment.paymentDate!)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrencyBRL(payment.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {memberSince ? (
        <p className="text-xs text-muted-foreground">
          Cronograma calculado a partir de{' '}
          {formatDateBR(memberSince.split('T')[0])}.
        </p>
      ) : null}
    </div>
  )
}
