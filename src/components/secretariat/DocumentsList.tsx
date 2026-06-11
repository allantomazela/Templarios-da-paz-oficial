import { useState, useEffect, useRef } from 'react'
import { LodgeDocument } from '@/lib/data'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  MoreHorizontal,
  Upload,
  Download,
  Trash2,
  Pencil,
} from 'lucide-react'
import { DocumentDialog } from './DocumentDialog'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  createLodgeDocument,
  deleteLodgeDocument,
  fetchLodgeDocuments,
  updateLodgeDocument,
  type DocumentSaveInput,
} from '@/lib/documents-api'
import { isAuthError, getSaveErrorMessage } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'
import { useToast } from '@/hooks/use-toast'

export function DocumentsList() {
  const [documents, setDocuments] = useState<LodgeDocument[]>([])
  const dialog = useDialog()
  const [selectedDoc, setSelectedDoc] = useState<LodgeDocument | null>(null)
  const hasLoadedRef = useRef(false)
  const { toast } = useToast()

  const loadDocuments = useAsyncOperation(
    async () => {
      const mappedDocuments = await fetchLodgeDocuments()
      setDocuments(mappedDocuments)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar documentos.',
      showErrorToast: false,
    },
  )

  const { execute: loadDocumentsExecute, loading: loadDocumentsLoading } = loadDocuments

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadDocumentsExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveOperation = useAsyncOperation(
    async (data: DocumentSaveInput) => {
      if (selectedDoc) {
        const updatedDoc = await updateLodgeDocument(selectedDoc.id, data)
        setDocuments((prev) =>
          prev.map((d) => (d.id === selectedDoc.id ? updatedDoc : d)),
        )
        return 'Metadados atualizados com sucesso.'
      }

      const newDoc = await createLodgeDocument(data)
      setDocuments((prev) => [newDoc, ...prev])
      return 'Documento enviado com sucesso.'
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar o documento.',
      showErrorToast: false,
      onError: (error) => {
        if (isAuthError(error)) {
          useAuthStore.getState().clearSessionAndRedirectToLogin()
          return
        }
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: getSaveErrorMessage(error),
        })
      },
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      const doc = documents.find((d) => d.id === id)
      await deleteLodgeDocument(id, doc?.url)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      return 'Documento excluído.'
    },
    {
      successMessage: 'Documento removido com sucesso!',
      errorMessage: 'Falha ao remover o documento.',
      showErrorToast: false,
      onError: (error) => {
        if (isAuthError(error)) {
          useAuthStore.getState().clearSessionAndRedirectToLogin()
          return
        }
        toast({
          variant: 'destructive',
          title: 'Erro ao excluir',
          description: getSaveErrorMessage(error),
        })
      },
    },
  )

  const handleSave = async (data: DocumentSaveInput) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
      loadDocumentsExecute()
    }
  }

  const handleDelete = (id: string) => {
    deleteOperation.execute(id)
  }

  const openEdit = (doc: LodgeDocument) => {
    setSelectedDoc(doc)
    dialog.openDialog()
  }

  const openNew = () => {
    setSelectedDoc(null)
    dialog.openDialog()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Upload className="mr-2 h-4 w-4" /> Fazer Upload de Documento
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data Upload</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadDocumentsLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Carregando documentos...
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Nenhum documento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{doc.category}</TableCell>
                  <TableCell>{doc.uploadDate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            if (doc.url) {
                              window.open(doc.url, '_blank')
                            }
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" /> Baixar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(doc)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar Metadados
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DocumentDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        documentToEdit={selectedDoc}
        onSave={handleSave}
        isSaving={saveOperation.loading}
      />
    </div>
  )
}
