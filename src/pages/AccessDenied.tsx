import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/useAuthStore'
import { ShieldAlert, LogOut, Clock, Ban } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AccessDenied() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const status = user?.profile?.status || 'pending'

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5" />
      </div>

      <div className="z-10 w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center border-4 border-background shadow-xl">
            {status === 'pending' ? (
              <Clock className="h-12 w-12 text-amber-500" />
            ) : (
              <Ban className="h-12 w-12 text-destructive" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {status === 'pending' ? 'Aguardando Aprovação' : 'Acesso Bloqueado'}
          </h1>

          {status === 'pending' ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-lg">
                Sua conta foi criada com sucesso e está{' '}
                <strong className="text-amber-600">em análise</strong>.
              </p>
              <div className="bg-card p-4 rounded-lg border text-sm text-left shadow-sm">
                <p className="mb-2">
                  <strong>Próximos passos:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Seu cadastro será verificado pela Secretaria.</li>
                  <li>Você receberá um email assim que aprovado.</li>
                  <li>O acesso ao painel será liberado automaticamente.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground text-lg">
                Sua conta encontra-se{' '}
                <strong className="text-destructive">bloqueada</strong> ou
                suspensa.
              </p>
              <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20 text-sm">
                <p className="text-destructive">
                  Entre em contato com a administração da loja para regularizar
                  sua situação.
                </p>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="mt-8 w-full"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair e Voltar ao Início
        </Button>
      </div>
    </div>
  )
}
