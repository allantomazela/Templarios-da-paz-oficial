import { AuthCard } from '@/components/auth/AuthCard'
import { Navigate, Link } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function Login() {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Return to Home Button */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          asChild
          className="gap-2 hover:bg-background/50"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Início
          </Link>
        </Button>
      </div>

      <div className="z-10 w-full flex flex-col items-center gap-8">
        <div className="text-center space-y-2 animate-fade-in-down">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground drop-shadow-sm">
            Templários da Paz
          </h1>
          <p className="text-muted-foreground text-lg">Acesso Restrito</p>
        </div>

        <AuthCard />
      </div>
    </div>
  )
}
