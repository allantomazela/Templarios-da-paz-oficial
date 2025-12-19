import { MediaGallery } from '@/components/admin/MediaGallery'
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
        <h2 className="text-3xl font-bold tracking-tight">
          Gerenciador de Mídia
        </h2>
        <p className="text-muted-foreground">
          Gerencie todos os arquivos e imagens do site.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Galeria de Arquivos</CardTitle>
          <CardDescription>
            Arquivos armazenados no bucket 'site-assets'.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaGallery />
        </CardContent>
      </Card>
    </div>
  )
}
