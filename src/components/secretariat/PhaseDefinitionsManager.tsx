import { useState } from 'react'
import type { SindicanciaPhaseDefinition } from '@/lib/data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Loader2, ListOrdered } from 'lucide-react'
import { PhaseDefinitionDialog } from './PhaseDefinitionDialog'
import { useDialog } from '@/hooks/use-dialog'
import {
  createPhaseDefinition,
  deletePhaseDefinition,
  updatePhaseDefinition,
} from '@/lib/phase-definitions-api'
import { isAuthError, getSaveErrorMessage } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'
import { useToast } from '@/hooks/use-toast'

interface PhaseDefinitionsManagerProps {
  phases: SindicanciaPhaseDefinition[]
  onUpdated: () => void
}

export function PhaseDefinitionsManager({ phases, onUpdated }: PhaseDefinitionsManagerProps) {
  const [open, setOpen] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState<SindicanciaPhaseDefinition | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const dialog = useDialog()
  const { toast } = useToast()

  const maxOrder = phases.length > 0 ? Math.max(...phases.map((p) => p.order), 0) : 0

  const handleSave = async (data: { name: string; description?: string; order: number }) => {
    setIsSaving(true)
    try {
      if (selectedPhase) {
        await updatePhaseDefinition(selectedPhase.id, data)
        toast({ title: 'Fase atualizada', description: 'As alterações foram salvas.' })
      } else {
        await createPhaseDefinition(data)
        toast({
          title: 'Fase adicionada',
          description: 'A nova fase está disponível para os candidatos.',
        })
      }
      dialog.closeDialog()
      onUpdated()
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return
    setIsDeleting(true)
    try {
      await deletePhaseDefinition(deleteTargetId)
      toast({
        title: 'Fase removida',
        description: 'A fase foi excluída. Andamentos vinculados foram removidos.',
      })
      setDeleteTargetId(null)
      onUpdated()
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openNew = () => {
    setSelectedPhase(null)
    dialog.openDialog()
  }

  const openEdit = (phase: SindicanciaPhaseDefinition) => {
    setSelectedPhase(phase)
    dialog.openDialog()
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between px-4 py-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="gap-2 font-medium">
              {open ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <ListOrdered className="h-4 w-4" />
              Fases da sindicância ({phases.length})
            </Button>
          </CollapsibleTrigger>
          <Button size="sm" variant="secondary" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova fase
          </Button>
        </div>
        <CollapsibleContent>
          <div className="border-t px-4 pb-4 pt-2">
            <p className="text-sm text-muted-foreground mb-3">
              Defina as fases do processo (ex.: Leitura em loja, Escrutínio). A ordem define a
              sequência exibida para cada candidato.
            </p>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Ordem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Nenhuma fase definida. Clique em &quot;Nova fase&quot; para adicionar (ex.:
                        Documentação, Leitura em loja, Escrutínio).
                      </TableCell>
                    </TableRow>
                  ) : (
                    phases.map((phase) => (
                      <TableRow key={phase.id}>
                        <TableCell className="font-mono">{phase.order}</TableCell>
                        <TableCell className="font-medium">{phase.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                          {phase.description || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(phase)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteTargetId(phase.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <PhaseDefinitionDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        phaseToEdit={selectedPhase}
        maxOrder={maxOrder}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fase</AlertDialogTitle>
            <AlertDialogDescription>
              O histórico desta fase para todos os candidatos será removido. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
