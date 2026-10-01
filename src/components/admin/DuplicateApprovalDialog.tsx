import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Profile } from '@/stores/useAuthStore'

interface DuplicateApprovalDialogProps {
  user: Profile | null
  matches: Profile[]
  onCancel: () => void
  onConfirm: () => void
}

export function DuplicateApprovalDialog({
  user,
  matches,
  onCancel,
  onConfirm,
}: DuplicateApprovalDialogProps) {
  return (
    <AlertDialog open={!!user} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Possível cadastro duplicado</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>{user?.full_name}</strong> ({user?.email || 'sem e-mail'})
                tem nome parecido com:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {matches.map((match) => (
                  <li key={match.id}>
                    <strong>{match.full_name}</strong> —{' '}
                    {match.email || 'sem e-mail'} ({STATUS_LABELS[match.status] ?? match.status})
                  </li>
                ))}
              </ul>
              <p>
                Se for a mesma pessoa, não aprove: confirme com o irmão qual
                e-mail ele usa. Aprovar cria um novo cadastro na secretaria e
                ele passa a ser cobrado na tesouraria.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Aprovar mesmo assim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const STATUS_LABELS: Record<string, string> = {
  approved: 'aprovado',
  pending: 'pendente',
  blocked: 'bloqueado',
  in_memoriam: 'in memoriam',
  adormecido: 'adormecido',
}
