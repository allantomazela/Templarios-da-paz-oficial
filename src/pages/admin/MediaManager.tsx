import { NewsManager } from '@/components/admin/NewsManager'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export default function MediaManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mídia e Notícias</h2>
        <p className="text-muted-foreground">
          Gerencie notícias, eventos e comunicados públicos do site.
        </p>
      </div>

      <div className="space-y-6">
        <NewsManager />
      </div>
    </div>
  )
}
