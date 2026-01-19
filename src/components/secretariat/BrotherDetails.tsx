import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Brother } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { formatCPF, formatPhone, formatCEP, formatDateBR } from '@/lib/format-utils'
import { supabase } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface BrotherDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brother: Brother | null
}

export function BrotherDetails({
  open,
  onOpenChange,
  brother,
}: BrotherDetailsProps) {
  const [contributions, setContributions] = useState<Array<{
    id: string
    month: number
    year: number
    amount: number
    status: string
  }>>([])
  const [loadingContributions, setLoadingContributions] = useState(false)
  const supabaseAny = supabase as any

  if (!brother) return null

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  // Buscar contribuições do banco de dados
  useEffect(() => {
    if (!brother?.id || !open) return

    const loadContributions = async () => {
      setLoadingContributions(true)
      try {
        // Buscar contribuições pendentes do irmão
        // Nota: A tabela contributions usa brother_id que referencia profiles.id
        // Mas o brother.id pode ser da tabela brothers, então precisamos verificar
        const { data: contributionsData, error } = await supabaseAny
          .from('contributions')
          .select('*')
          .eq('brother_id', brother.id)
          .neq('status', 'Pago')
          .order('year', { ascending: false })
          .order('month', { ascending: false })

        if (error && error.code !== '404' && error.code !== 'PGRST116') {
          console.error('Erro ao carregar contribuições:', error)
          setContributions([])
        } else if (contributionsData) {
          const mapped = contributionsData.map((c: any) => ({
            id: c.id,
            month: c.month,
            year: c.year,
            amount: parseFloat(c.amount),
            status: c.status,
          }))
          setContributions(mapped)
        } else {
          setContributions([])
        }
      } catch (error) {
        console.error('Erro ao carregar contribuições:', error)
        setContributions([])
      } finally {
        setLoadingContributions(false)
      }
    }

    loadContributions()
  }, [brother?.id, open])

  const brotherContributions = contributions

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Irmão</SheetTitle>
          <SheetDescription>
            Informações completas do registro.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex flex-col items-center justify-center p-4 bg-secondary/10 rounded-lg">
            {brother.photoUrl ? (
              <img
                src={brother.photoUrl}
                alt={brother.name}
                className="h-20 w-20 rounded-full object-cover mb-2 border-2 border-primary"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary mb-2">
                {brother.name.charAt(0)}
              </div>
            )}
            <h3 className="text-lg font-bold text-center">{brother.name}</h3>
            <div className="flex gap-2 mt-2">
              <Badge>{brother.degree}</Badge>
              <Badge
                variant={brother.status === 'Ativo' ? 'default' : 'destructive'}
              >
                {brother.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1">
              Situação Financeira
            </h4>
            <div className="bg-card border rounded-md p-4">
              {brotherContributions.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Nenhuma pendência financeira.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      Pendências Encontradas
                    </span>
                  </div>
                  {brotherContributions.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">
                          Mensalidade {c.month}/{c.year}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {c.status}
                        </p>
                      </div>
                      <span className="font-mono font-medium text-destructive">
                        R$ {c.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1">
              Dados Pessoais
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Email
                </span>
                <span className="text-sm">{brother.email}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Telefone
                </span>
                <span className="text-sm">
                  {brother.phone
                    ? /^\(\d{2}\)/.test(brother.phone)
                      ? brother.phone
                      : formatPhone(brother.phone)
                    : '-'}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">CPF</span>
                <span className="text-sm">
                  {brother.cpf
                    ? /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(brother.cpf)
                      ? brother.cpf
                      : formatCPF(brother.cpf)
                    : '-'}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Data de Nascimento
                </span>
                <span className="text-sm">{formatDate(brother.dob)}</span>
              </div>
            </div>

            {/* Spouse Information */}
            {(brother.spouseName || brother.spouseDob) && (
              <>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1 pt-2">
                  Dados do Cônjuge
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {brother.spouseName && (
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        Nome
                      </span>
                      <span className="text-sm">{brother.spouseName}</span>
                    </div>
                  )}
                  {brother.spouseDob && (
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        Data de Nascimento
                      </span>
                      <span className="text-sm">{formatDate(brother.spouseDob)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Children Information */}
            {brother.children && brother.children.length > 0 && (
              <>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1 pt-2">
                  Filhos
                </h4>
                <div className="space-y-2">
                  {brother.children.map((child, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-md bg-card"
                    >
                      <div className="font-medium text-sm">{child.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Nascimento: {formatDate(child.dob)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Complete Address */}
            {(brother.addressStreet ||
              brother.addressNumber ||
              brother.addressNeighborhood ||
              brother.addressCity ||
              brother.addressState ||
              brother.addressZipcode) && (
              <>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1 pt-2">
                  Endereço Completo
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {brother.addressStreet && (
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        Logradouro
                      </span>
                      <span className="text-sm">{brother.addressStreet}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {brother.addressNumber && (
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Número
                        </span>
                        <span className="text-sm">{brother.addressNumber}</span>
                      </div>
                    )}
                    {brother.addressComplement && (
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Complemento
                        </span>
                        <span className="text-sm">{brother.addressComplement}</span>
                      </div>
                    )}
                  </div>
                  {brother.addressNeighborhood && (
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        Bairro
                      </span>
                      <span className="text-sm">{brother.addressNeighborhood}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {brother.addressCity && (
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Cidade
                        </span>
                        <span className="text-sm">{brother.addressCity}</span>
                      </div>
                    )}
                    {brother.addressState && (
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Estado
                        </span>
                        <span className="text-sm">{brother.addressState}</span>
                      </div>
                    )}
                  </div>
                  {brother.addressZipcode && (
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        CEP
                      </span>
                      <span className="text-sm">
                        {/^\d{5}-\d{3}$/.test(brother.addressZipcode)
                          ? brother.addressZipcode
                          : formatCEP(brother.addressZipcode)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Legacy Address (fallback) */}
            {brother.address &&
              !brother.addressStreet &&
              !brother.addressCity && (
                <>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1 pt-2">
                    Endereço
                  </h4>
                  <div>
                    <span className="text-sm">{brother.address}</span>
                  </div>
                </>
              )}

            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1 pt-2">
              Dados Maçônicos
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-xs text-muted-foreground block">CIM</span>
                <span className="text-sm">#{brother.id.padStart(6, '0')}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Cargo
                </span>
                <span className="text-sm">{brother.role}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Data de Iniciação
                </span>
                <span className="text-sm">
                  {formatDate(brother.initiationDate)}
                </span>
              </div>
              {brother.elevationDate && (
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Data de Elevação
                  </span>
                  <span className="text-sm">{formatDate(brother.elevationDate)}</span>
                </div>
              )}
              {brother.exaltationDate && (
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Data de Exaltação
                  </span>
                  <span className="text-sm">{formatDate(brother.exaltationDate)}</span>
                </div>
              )}
              {brother.masonicRegistrationNumber && (
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Número de Registro Maçônico
                  </span>
                  <span className="text-sm">{brother.masonicRegistrationNumber}</span>
                </div>
              )}
              {brother.obedience && (
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Obediência
                  </span>
                  <span className="text-sm">{brother.obedience}</span>
                </div>
              )}
              {brother.originLodge && (
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Loja de Origem
                  </span>
                  <span className="text-sm">
                    {brother.originLodge}
                    {brother.originLodgeNumber && ` - Nº ${brother.originLodgeNumber}`}
                  </span>
                </div>
              )}
              {brother.currentLodgeNumber && (
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Número da Loja Atual
                  </span>
                  <span className="text-sm">{brother.currentLodgeNumber}</span>
                </div>
              )}
              {brother.affiliationDate && (
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Data de Filiação à Loja Atual
                  </span>
                  <span className="text-sm">{formatDate(brother.affiliationDate)}</span>
                </div>
              )}
              {brother.regularStatus && (
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Status de Regularidade
                  </span>
                  <span className="text-sm">{brother.regularStatus}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground block">
                  Frequência (últimos 12 meses)
                </span>
                <span className="text-sm font-medium">
                  {brother.attendanceRate}%
                </span>
              </div>
              {brother.notes && (
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Observações
                  </span>
                  <span className="text-sm whitespace-pre-wrap">{brother.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
