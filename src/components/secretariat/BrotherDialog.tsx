import { Brother } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormHeader } from '@/components/ui/form-header'
import { UserPlus } from 'lucide-react'
import {
  BrotherForm,
  type BrotherFormValues,
} from '@/components/secretariat/BrotherForm'

export type { BrotherFormValues }

interface BrotherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brotherToEdit: Brother | null
  onSave: (data: BrotherFormValues) => void | Promise<void>
  isSaving?: boolean
}

export function BrotherDialog({
  open,
  onOpenChange,
  brotherToEdit,
  onSave,
  isSaving = false,
}: BrotherDialogProps) {
  const dialogTitle = brotherToEdit ? 'Editar Irmão' : 'Adicionar Novo Irmão'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <FormHeader
          title={dialogTitle}
          description="Gerencie as informações pessoais e maçônicas do irmão."
          icon={<UserPlus className="h-5 w-5" />}
        />

        <BrotherForm
          brotherToEdit={brotherToEdit}
          onSave={onSave}
          isSaving={isSaving}
          mode="secretariat"
          active={open}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
