import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/useAuthStore'
import { ShieldAlert, LogOut } from 'lucide-react'
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
          <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Acesso Restrito</h1>
          {status === 'pending' ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-lg">
                Sua conta foi criada e está{' '}
                <strong>aguardando aprovação</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Um administrador da loja analisará seu cadastro. Você será
                notificado por email assim que o acesso for liberado.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground text-lg">
                Sua conta encontra-se <strong>bloqueada</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Entre em contato com a secretaria da loja para mais informações.
              </p>
            </div>
          )}
        </div>

        <Button variant="outline" onClick={handleLogout} className="mt-8">
          <LogOut className="mr-2 h-4 w-4" />
          Sair e Voltar ao Início
        </Button>
      </div>
    </div>
  )
}
