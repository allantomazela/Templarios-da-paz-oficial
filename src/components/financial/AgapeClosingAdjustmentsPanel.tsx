import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Pencil,
  Trash2,
  Unlock,
  ExternalLink,
  Loader2,
  Wrench,
} from 'lucide-react'

interface AgapeClosingAdjustmentsPanelProps {
  monthLabel: string
  canEdit: boolean
  isClosed: boolean
  hasCharges: boolean
  hasBeveragesTotal: boolean
  isAgapeOnlyUser: boolean
  onClearMonth: () => void
  onReopenMonth: () => void
  clearing: boolean
  reopening: boolean
}

export function AgapeClosingAdjustmentsPanel({
  monthLabel,
  canEdit,
  isClosed,
  hasCharges,
  hasBeveragesTotal,
  isAgapeOnlyUser,
  onClearMonth,
  onReopenMonth,
  clearing,
  reopening,
}: AgapeClosingAdjustmentsPanelProps) {
  const canClearMonth = canEdit && (hasCharges || hasBeveragesTotal)
  const showReopen = isClosed

  if (!canEdit && !showReopen) {
    return null
  }

  return (
    <div className="space-y-3">
      {isAgapeOnlyUser && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTitle className="text-blue-900">Mestre de Banquete</AlertTitle>
          <AlertDescription className="text-blue-800">
            Você gerencia o fechamento financeiro do ágape nesta tela. Para corrigir
            consumos lançados nas sessões, use o módulo{' '}
            <Link to="/dashboard/agape" className="font-medium underline">
              Ágape → Sessões
            </Link>
            . Depois, volte aqui e clique em <strong>Importar consumos do mês</strong>.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4" />
            Correções e ajustes
          </CardTitle>
          <CardDescription>
            Corrija erros de lançamento direto pelo sistema — sem precisar do banco
            de dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Pencil className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              <span>
                <strong className="text-foreground">Editar uma cobrança:</strong> use o
                ícone de lápis na linha do irmão na tabela abaixo.
              </span>
            </li>
            <li className="flex gap-2">
              <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              <span>
                <strong className="text-foreground">Excluir uma cobrança:</strong> use a
                lixeira na linha. Se já houve pagamento, a receita na tesouraria também
                é removida.
              </span>
            </li>
            {canClearMonth && (
              <li className="flex gap-2">
                <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span>
                  <strong className="text-foreground">Recomeçar o mês inteiro:</strong>{' '}
                  remove todas as cobranças de {monthLabel}, zera o total das bebidas e
                  as receitas do ágape vinculadas.
                </span>
              </li>
            )}
            {isClosed && (
              <li className="flex gap-2">
                <Unlock className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                <span>
                  <strong className="text-foreground">Mês encerrado:</strong> use{' '}
                  <em>Reabrir mês</em> antes de editar ou excluir lançamentos.
                </span>
              </li>
            )}
          </ul>

          <div className="flex flex-wrap gap-2">
            {canClearMonth && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onClearMonth}
                disabled={clearing}
              >
                {clearing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Limpar mês ({monthLabel})
              </Button>
            )}

            {showReopen && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onReopenMonth}
                disabled={reopening}
              >
                {reopening ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="mr-2 h-4 w-4" />
                )}
                Reabrir mês para ajustes
              </Button>
            )}

            <Button type="button" variant="ghost" size="sm" asChild>
              <Link to="/dashboard/agape">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir módulo Ágape
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
