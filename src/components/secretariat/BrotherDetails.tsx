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
import useFinancialStore from '@/stores/useFinancialStore'
import { AlertTriangle, CheckCircle } from 'lucide-react'

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
  const { contributions } = useFinancialStore()

  if (!brother) return null

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  const brotherContributions = contributions.filter(
    (c) => c.brotherId === brother.id && c.status !== 'Pago',
  )

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
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary mb-2">
              {brother.name.charAt(0)}
            </div>
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
                <span className="text-sm">{brother.phone}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">CPF</span>
                <span className="text-sm">{brother.cpf || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Data de Nascimento
                </span>
                <span className="text-sm">{formatDate(brother.dob)}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Endereço
                </span>
                <span className="text-sm">{brother.address || '-'}</span>
              </div>
            </div>

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
              <div>
                <span className="text-xs text-muted-foreground block">
                  Frequência (últimos 12 meses)
                </span>
                <span className="text-sm font-medium">
                  {brother.attendanceRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
