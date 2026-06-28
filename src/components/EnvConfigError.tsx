import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface EnvConfigErrorProps {
  message: string
}

export function EnvConfigError({ message }: EnvConfigErrorProps) {
  const isLocalhost =
    typeof window !== 'undefined' &&
    /localhost|127\.0\.0\.1/.test(window.location.hostname)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <h1 className="text-lg font-semibold text-foreground">
            Configuração necessária
          </h1>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">{message}</p>

        <div className="mb-6 rounded-md bg-muted/50 p-4 text-sm text-foreground">
          {isLocalhost ? (
            <>
              <p className="mb-2 font-medium">Para desenvolvimento local:</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>
                  Crie o arquivo <code className="text-foreground">.env</code>{' '}
                  na raiz do projeto
                </li>
                <li>
                  Copie as variáveis de{' '}
                  <code className="text-foreground">.env.example</code>
                </li>
                <li>
                  Obtenha a chave pública em Supabase → Settings → API
                </li>
                <li>Reinicie o servidor com `npm run dev`</li>
              </ol>
            </>
          ) : (
            <>
              <p className="mb-2 font-medium">Para o site em produção:</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>
                  Confirme os secrets{' '}
                  <code className="text-foreground">VITE_SUPABASE_URL</code> e{' '}
                  <code className="text-foreground">
                    VITE_SUPABASE_PUBLISHABLE_KEY
                  </code>{' '}
                  em GitHub → Settings → Secrets → Actions
                </li>
                <li>Faça um novo deploy (push na branch main)</li>
                <li>
                  Se persistir, limpe o cache do navegador ou teste em aba
                  anônima
                </li>
              </ol>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="default">
            <a
              href="https://app.supabase.com/project/hxncevpbwcearzxrstzj/settings/api"
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir API do Supabase
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
          {!isLocalhost ? (
            <Button asChild variant="outline">
              <Link to="/conectividade">Diagnóstico de rede</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
