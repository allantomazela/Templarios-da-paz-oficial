import { useState, useCallback } from 'react'

/**
 * Hook para gerenciar estado de abertura/fechamento de dialogs
 * 
 * @param initialOpen - Estado inicial do dialog (padrão: false)
 * @returns Objeto com `open`, `onOpenChange`, `openDialog`, `closeDialog` e `toggle`
 * 
 * @example
 * ```tsx
 * const dialog = useDialog()
 * 
 * return (
 *   <Dialog open={dialog.open} onOpenChange={dialog.onOpenChange}>
 *     <Button onClick={dialog.openDialog}>Abrir</Button>
 *   </Dialog>
 * )
 * ```
 */
export function useDialog(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen)

  const openDialog = useCallback(() => {
    setOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const onOpenChange = useCallback((value: boolean) => {
    setOpen(value)
  }, [])

  return {
    open,
    onOpenChange,
    openDialog,
    closeDialog,
    toggle,
  }
}

