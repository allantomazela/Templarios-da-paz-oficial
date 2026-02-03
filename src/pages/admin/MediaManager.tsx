import { NewsManager } from '@/components/admin/NewsManager'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { NEWS_IMAGE_RULE_LABEL } from '@/constants/upload-rules'

export default function MediaManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mídia e Notícias</h2>
        <p className="text-muted-foreground">
          Gerencie notícias, eventos e comunicados públicos do site.
        </p>
      </div>

      <Alert className="border-muted bg-muted/30">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Imagens (notícias e eventos):</strong> {NEWS_IMAGE_RULE_LABEL}
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <NewsManager />
      </div>
    </div>
  )
}
