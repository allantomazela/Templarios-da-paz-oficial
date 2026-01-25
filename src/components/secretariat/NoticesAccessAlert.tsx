import { Card, CardContent } from '@/components/ui/card'
import { Lock } from 'lucide-react'

export function NoticesAccessAlert({ visible }: NoticesAccessAlertProps) {
  if (!visible) return null

  return (
    <Card className="border-amber-500/50 bg-amber-500/10">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-amber-600">
          <Lock className="h-4 w-4" />
          <p className="text-sm">
            Você está visualizando apenas avisos públicos. Avisos privados são
            visíveis apenas para administradores e editores.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface NoticesAccessAlertProps {
  visible: boolean
}
