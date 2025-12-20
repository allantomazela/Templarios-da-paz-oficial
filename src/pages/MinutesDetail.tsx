import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import useMinutesStore from '@/stores/useMinutesStore'
import useAuthStore from '@/stores/useAuthStore'
import { ArrowLeft, PenTool, CheckCircle2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function MinutesDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentMinute, fetchMinuteDetails, signMinute, loading } =
    useMinutesStore()
  const { user } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    if (id) {
      fetchMinuteDetails(id)
    }
  }, [id, fetchMinuteDetails])

  if (loading || !currentMinute) {
    return <div className="p-8 text-center">Carregando...</div>
  }

  const hasSigned = currentMinute.signatures?.some(
    (s) => s.profile_id === user?.id,
  )

  const handleSign = async () => {
    if (!user || !id) return
    try {
      await signMinute(id, user.id)
      toast({
        title: 'Assinado',
        description: 'Documento assinado digitalmente com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível assinar o documento.',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard/secretariat')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Secretaria
      </Button>

      <Card>
        <CardHeader className="text-center border-b bg-muted/10 pb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-background rounded-full shadow-sm border">
              <PenTool className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{currentMinute.title}</CardTitle>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mt-2">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(currentMinute.date), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="prose max-w-none whitespace-pre-wrap font-serif leading-relaxed text-justify">
            {currentMinute.content}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-6 border-t p-8 bg-muted/5">
          <div className="w-full flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Assinatura Digital</h4>
              <p className="text-sm text-muted-foreground">
                {hasSigned
                  ? 'Você já assinou este documento.'
                  : 'Sua assinatura é necessária para validar este documento.'}
              </p>
            </div>
            {hasSigned ? (
              <Button
                disabled
                variant="outline"
                className="text-green-600 border-green-200 bg-green-50"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Assinado
              </Button>
            ) : (
              <Button onClick={handleSign} size="lg">
                <PenTool className="mr-2 h-4 w-4" /> Assinar Documento
              </Button>
            )}
          </div>

          <div className="w-full space-y-4">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
              Assinaturas ({currentMinute.signatures?.length || 0})
            </h4>
            <ScrollArea className="h-[200px] w-full rounded-md border bg-background p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentMinute.signatures?.map((sig) => (
                  <div
                    key={sig.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${sig.profile_id}`}
                      />
                      <AvatarFallback>
                        {sig.profile?.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {sig.profile?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sig.signed_at), 'dd/MM/yy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
                {(!currentMinute.signatures ||
                  currentMinute.signatures.length === 0) && (
                  <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
                    Nenhuma assinatura registrada ainda.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
