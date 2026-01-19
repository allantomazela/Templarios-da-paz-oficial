import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface Payment {
  id: string
  type: 'monthly' | 'charity'
  description: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  paymentDate?: string
  month?: number
  year?: number
}

export default function MyPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabaseAny = supabase as any

  const loadPayments = useAsyncOperation(
    async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Usuário não autenticado.')
      }

      setCurrentUserId(user.id)

      const mappedPayments: Payment[] = []

      // Tentar buscar mensalidades (contribuições) se a tabela existir
      const { data: contributions, error: contributionsError } = await supabaseAny
        .from('contributions')
        .select('*')
        .eq('brother_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      // Tratar erro 404 (tabela não existe) como normal, não como erro crítico
      if (contributionsError) {
        const errorCode = (contributionsError as any)?.code || ''
        const errorMessage = contributionsError.message || ''
        
        // Se for erro 404 ou PGRST116 (tabela não existe), ignorar silenciosamente
        if (errorCode === 'PGRST116' || errorMessage.includes('404') || errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
          // Tabela não existe ainda, continuar sem erros
          console.log('Tabela contributions não encontrada - migração ainda não aplicada')
        } else {
          // Outro tipo de erro, logar mas não quebrar
          console.warn('Erro ao buscar contributions:', contributionsError)
        }
      } else if (contributions) {
        contributions.forEach((cont: any) => {
          const dueDate = new Date(cont.year, cont.month - 1, 10) // Vencimento dia 10
          const today = new Date()
          const isOverdue = today > dueDate && cont.status !== 'Pago'

          mappedPayments.push({
            id: cont.id,
            type: 'monthly',
            description: `Mensalidade ${cont.month}/${cont.year}`,
            amount: cont.amount || 0,
            status: cont.status === 'Pago' ? 'paid' : isOverdue ? 'overdue' : 'pending',
            dueDate: format(dueDate, 'yyyy-MM-dd'),
            paymentDate: cont.payment_date ? format(new Date(cont.payment_date), 'yyyy-MM-dd') : undefined,
            month: cont.month,
            year: cont.year,
          })
        })
      }

      // Tentar buscar doações ao tronco de beneficência se a tabela existir
      const { data: charity, error: charityError } = await supabaseAny
        .from('charity_donations')
        .select('*')
        .eq('brother_id', user.id)
        .order('created_at', { ascending: false })

      // Tratar erro 404 (tabela não existe) como normal, não como erro crítico
      if (charityError) {
        const errorCode = (charityError as any)?.code || ''
        const errorMessage = charityError.message || ''
        
        // Se for erro 404 ou PGRST116 (tabela não existe), ignorar silenciosamente
        if (errorCode === 'PGRST116' || errorMessage.includes('404') || errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
          // Tabela não existe ainda, continuar sem erros
          console.log('Tabela charity_donations não encontrada - migração ainda não aplicada')
        } else {
          // Outro tipo de erro, logar mas não quebrar
          console.warn('Erro ao buscar charity_donations:', charityError)
        }
      } else if (charity) {
        charity.forEach((donation: any) => {
          mappedPayments.push({
            id: donation.id,
            type: 'charity',
            description: donation.description || 'Doação ao Tronco de Beneficência',
            amount: donation.amount || 0,
            status: 'paid', // Doações são sempre pagas
            dueDate: format(new Date(donation.created_at), 'yyyy-MM-dd'),
            paymentDate: format(new Date(donation.created_at), 'yyyy-MM-dd'),
          })
        })
      }

      // Ordenar por data de vencimento (mais recentes primeiro)
      mappedPayments.sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime()
        const dateB = new Date(b.dueDate).getTime()
        return dateB - dateA
      })

      setPayments(mappedPayments)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar pagamentos.',
    },
  )

  const { execute: loadPaymentsExecute, loading: loadPaymentsLoading } = loadPayments
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // Evitar loop infinito: só executar uma vez
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadPaymentsExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const monthlyPayments = payments.filter((p) => p.type === 'monthly')
  const charityPayments = payments.filter((p) => p.type === 'charity')
  const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'overdue')

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
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pendente
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
          Acompanhe suas mensalidades e doações ao Tronco de Beneficência.
        </p>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R${' '}
              {payments
                .filter((p) => p.status === 'paid')
                .reduce((sum, p) => sum + p.amount, 0)
                .toFixed(2)
                .replace('.', ',')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              R${' '}
              {pendingPayments
                .reduce((sum, p) => sum + p.amount, 0)
                .toFixed(2)
                .replace('.', ',')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingPayments.length} pagamento(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Doações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${' '}
              {charityPayments
                .reduce((sum, p) => sum + p.amount, 0)
                .toFixed(2)
                .replace('.', ',')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {charityPayments.length} doação(ões)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">
            Mensalidades ({monthlyPayments.length})
          </TabsTrigger>
          <TabsTrigger value="charity">
            Tronco de Beneficência ({charityPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Mensalidades</CardTitle>
            </CardHeader>
            <CardContent>
              {loadPaymentsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando pagamentos...
                </div>
              ) : monthlyPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma mensalidade registrada.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.description}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.dueDate), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="font-mono">
                          R$ {payment.amount.toFixed(2).replace('.', ',')}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.paymentDate
                            ? format(new Date(payment.paymentDate), 'dd/MM/yyyy', {
                                locale: ptBR,
                              })
                            : '-'}
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
                          {format(new Date(payment.paymentDate!), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="font-mono">
                          R$ {payment.amount.toFixed(2).replace('.', ',')}
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
    </div>
  )
}
