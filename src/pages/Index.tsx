import { AuthCard } from '@/components/auth/AuthCard'
import { Navigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'

export default function Index() {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-20" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 w-full flex flex-col items-center gap-8">
        <div className="text-center space-y-2 animate-fade-in-down">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white drop-shadow-lg">
            Templários da Paz
          </h1>
          <p className="text-muted-foreground text-lg">Botucatu - SP</p>
        </div>

        <AuthCard />
      </div>
    </div>
  )
}
