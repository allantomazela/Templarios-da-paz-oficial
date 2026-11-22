import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Archive,
  Eye,
  FilePlus2,
  Loader2,
  Printer,
  ScrollText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { usePrintReport } from '@/hooks/use-print-report'
import { useCanManageLodgePranchas } from '@/hooks/use-can-manage-lodge-pranchas'
import useAuthStore from '@/stores/useAuthStore'
import { LodgePranchaDocument } from '@/components/prancha/LodgePranchaDocument'
import { LODGE_PRANCHA_PRINT_STYLE } from '@/lib/lodge-prancha-print-style'
import {
  archiveLodgePrancha,
  listMyLodgePranchas,
  markLodgePranchaRead,
} from '@/lib/lodge-prancha-api'
import {
  LODGE_PRANCHA_STATUS_LABEL,
  type LodgePrancha,
} from '@/lib/lodge-prancha'
import { getSaveErrorMessage } from '@/lib/auth-utils'

export default function LodgePranchaPage() {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)
  const canManage = useCanManageLodgePranchas()
  const [items, setItems] = useState<LodgePrancha[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<LodgePrancha | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = usePrintReport({
    contentRef: printRef,
    documentTitle: selected
      ? `Prancha_${selected.subject.slice(0, 40)}`
      : 'Prancha',
    pageStyle: LODGE_PRANCHA_PRINT_STYLE,
    successDescription: 'Use "Salvar como PDF" se preferir o arquivo.',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await listMyLodgePranchas()
      setItems(rows)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const inbox = canManage
    ? items.filter((item) => item.status !== 'draft')
    : items.filter((item) => item.author_id === user?.id)

  async function openPrancha(item: LodgePrancha) {
    setSelected(item)
    if (
      canManage &&
      item.author_id !== user?.id &&
      (item.status === 'submitted' || item.status === 'read')
    ) {
      try {
        if (item.status === 'submitted') {
          await markLodgePranchaRead(item.id)
          setItems((prev) =>
            prev.map((row) =>
              row.id === item.id
                ? { ...row, status: 'read', read_at: new Date().toISOString() }
                : row,
            ),
          )
          setSelected((current) =>
            current && current.id === item.id
              ? { ...current, status: 'read', read_at: new Date().toISOString() }
              : current,
          )
        }
      } catch {
        // leitura é best-effort
      }
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveLodgePrancha(id)
      toast({ title: 'Prancha arquivada' })
      setSelected(null)
      await load()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: getSaveErrorMessage(error),
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ScrollText className="h-7 w-7 text-muted-foreground" />
            Prancha
          </h2>
          <p className="text-muted-foreground">
            {canManage
              ? 'Caixa do Venerável / administração: pranchas enviadas pelos irmãos.'
              : 'Crie sua prancha para impressão (saco de propostas) e envio ao Venerável.'}
          </p>
        </div>
        <Button asChild className="gap-2 shrink-0">
          <Link to="/dashboard/prancha/nova">
            <FilePlus2 className="h-4 w-4" />
            Nova prancha
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {canManage ? 'Pranchas recebidas' : 'Minhas pranchas'}
          </CardTitle>
          <CardDescription>
            {canManage
              ? 'Visível apenas ao Venerável Mestre em exercício e ao administrador geral.'
              : 'Somente você vê as suas. O Venerável vê as que forem enviadas.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : inbox.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma prancha por enquanto.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {inbox.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium truncate">{item.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {canManage ? `${item.author_name} · ` : null}
                      {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary">
                      {LODGE_PRANCHA_STATUS_LABEL[item.status]}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => void openPrancha(item)}
                    >
                      <Eye className="h-4 w-4" />
                      Abrir
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prancha</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              <div className="no-print flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="gap-1"
                  onClick={() => handlePrint()}
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / PDF
                </Button>
                {canManage && selected.status !== 'archived' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => void handleArchive(selected.id)}
                  >
                    <Archive className="h-4 w-4" />
                    Arquivar
                  </Button>
                ) : null}
              </div>
              <div ref={printRef} className="rounded-md border bg-white">
                <LodgePranchaDocument
                  authorName={selected.author_name}
                  subject={selected.subject}
                  body={selected.body}
                  sessionDate={selected.session_date}
                  createdAtLabel={format(
                    new Date(selected.created_at),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: ptBR },
                  )}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
