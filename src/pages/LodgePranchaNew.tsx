import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  Loader2,
  Printer,
  Save,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { usePrintReport } from '@/hooks/use-print-report'
import useAuthStore from '@/stores/useAuthStore'
import { LodgePranchaDocument } from '@/components/prancha/LodgePranchaDocument'
import { LODGE_PRANCHA_PRINT_STYLE } from '@/lib/lodge-prancha-print-style'
import {
  createLodgePranchaDraft,
  submitLodgePrancha,
  updateLodgePranchaDraft,
} from '@/lib/lodge-prancha-api'
import { buildPranchaPrintTitle } from '@/lib/lodge-prancha'
import { getSaveErrorMessage } from '@/lib/auth-utils'

/**
 * Formulário para qualquer irmão gerar prancha pronta para impressão
 * e envio digital ao Venerável Mestre.
 * O nome do solicitante vem sempre do usuário logado.
 */
export default function LodgePranchaNew() {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)
  const printRef = useRef<HTMLDivElement>(null)

  const loggedBrotherName = useMemo(
    () => user?.profile?.full_name?.trim() || '',
    [user?.profile?.full_name],
  )

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const createdAtLabel = useMemo(
    () => format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    [],
  )

  const canPrint =
    Boolean(loggedBrotherName) &&
    subject.trim().length > 2 &&
    body.trim().length > 10
  const printTitle = buildPranchaPrintTitle(subject)

  const handlePrint = usePrintReport({
    contentRef: printRef,
    documentTitle: printTitle.replace(/[^\wÀ-ÿ\- ]+/g, '_').slice(0, 80),
    pageStyle: LODGE_PRANCHA_PRINT_STYLE,
    successTitle: 'Prancha enviada à impressão',
    successDescription:
      'Use "Salvar como PDF" se quiser o arquivo. Assine e coloque no saco de propostas.',
    errorDescription: 'Não foi possível imprimir a prancha.',
  })

  async function ensureSaved(): Promise<string | null> {
    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: 'Sessão necessária',
        description: 'Faça login novamente para salvar a prancha.',
      })
      return null
    }
    if (!loggedBrotherName) {
      toast({
        variant: 'destructive',
        title: 'Nome do perfil',
        description:
          'Seu cadastro ainda não tem nome completo. Atualize em Meu Perfil.',
      })
      return null
    }
    if (!canPrint) {
      toast({
        variant: 'destructive',
        title: 'Preencha a prancha',
        description: 'Informe um assunto e o texto com pelo menos algumas linhas.',
      })
      return null
    }

    setSaving(true)
    try {
      const payload = {
        authorName: loggedBrotherName,
        subject: subject.trim(),
        body: body.trim(),
        sessionDate: sessionDate || null,
      }
      if (savedId) {
        try {
          const row = await updateLodgePranchaDraft(savedId, payload)
          return row.id
        } catch {
          return savedId
        }
      }
      const row = await createLodgePranchaDraft({
        authorId: user.id,
        ...payload,
      })
      setSavedId(row.id)
      return row.id
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: getSaveErrorMessage(error),
      })
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDraft() {
    const id = await ensureSaved()
    if (!id) return
    toast({
      title: 'Rascunho salvo',
      description: 'Você pode imprimir ou enviar ao Venerável quando quiser.',
    })
  }

  async function handleSubmitToVenerable() {
    setSubmitting(true)
    try {
      const id = await ensureSaved()
      if (!id) return
      await submitLodgePrancha(id)
      toast({
        title: 'Prancha enviada',
        description:
          'O Venerável Mestre (e o administrador geral) foram notificados. Você ainda pode imprimir para o saco.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Falha no envio',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 gap-1">
            <Link to="/dashboard/prancha">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Nova prancha</h2>
          <p className="text-muted-foreground">
            Preencha, imprima para assinar e, se desejar, envie digitalmente ao
            Venerável Mestre.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da prancha</CardTitle>
            <CardDescription>
              O solicitante é preenchido automaticamente com o nome de quem está
              logado. Assunto e texto alimentam o documento oficial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prancha-author">Solicitante (usuário logado)</Label>
              <Input
                id="prancha-author"
                value={loggedBrotherName}
                readOnly
                placeholder="Carregando nome do perfil..."
                className="bg-muted/40"
              />
              {!loggedBrotherName ? (
                <p className="text-xs text-destructive">
                  Nome não encontrado no perfil. Atualize em Meu Perfil.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prancha-subject">Assunto</Label>
              <Input
                id="prancha-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex.: Solicitação de auxílio / Proposta de trabalho"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prancha-session">Data da sessão (opcional)</Label>
              <Input
                id="prancha-session"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prancha-body">Texto da prancha</Label>
              <Textarea
                id="prancha-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Descreva com clareza o que solicita ou propõe à Loja..."
                className="min-h-[220px]"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSaveDraft()}
                disabled={saving || submitting || !loggedBrotherName}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar rascunho
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!canPrint || saving || submitting}
                onClick={() => handlePrint()}
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir / PDF
              </Button>
              <Button
                type="button"
                disabled={!canPrint || saving || submitting}
                onClick={() => void handleSubmitToVenerable()}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar ao Venerável
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="no-print">
            <CardTitle className="text-base">Pré-visualização</CardTitle>
            <CardDescription>
              Prévia no layout do modelo (moldura, colunas e cabeçalho da Loja).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-4">
            <div className="max-h-[70vh] overflow-auto border-t bg-muted/20 p-3 sm:rounded-md sm:border">
              <div ref={printRef} className="bg-white">
                <LodgePranchaDocument
                  authorName={loggedBrotherName}
                  subject={subject}
                  body={body}
                  sessionDate={sessionDate || null}
                  createdAtLabel={createdAtLabel}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
