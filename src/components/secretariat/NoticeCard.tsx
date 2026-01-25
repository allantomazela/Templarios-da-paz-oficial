import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lock, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Announcement } from '@/lib/data'

export function NoticeCard({
  notice,
  canEdit,
  onEdit,
  onDelete,
}: NoticeCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-lg">{notice.title}</CardTitle>
            {notice.isPrivate && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Privado
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Publicado em{' '}
            {format(new Date(notice.date), "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}{' '}
            por {notice.author}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(notice)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(notice.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
      </CardContent>
    </Card>
  )
}

interface NoticeCardProps {
  notice: Announcement
  canEdit: boolean
  onEdit: (notice: Announcement) => void
  onDelete: (id: string) => void
}
