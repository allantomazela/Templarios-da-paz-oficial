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
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'

export function DocumentsList() {
  const [documents, setDocuments] = useState<LodgeDocument[]>([])
  const dialog = useDialog()
  const [selectedDoc, setSelectedDoc] = useState<LodgeDocument | null>(null)
  const supabaseAny = supabase as any
  const hasLoadedRef = useRef(false)

  // Função para mapear dados do banco para o tipo LodgeDocument
  const mapDocumentFromDB = (row: any): LodgeDocument => {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      category: row.category,
      uploadDate: row.upload_date || format(new Date(row.created_at), 'yyyy-MM-dd'),
      type: row.file_type || 'PDF',
      url: row.file_url,
    }
  }

  const loadDocuments = useAsyncOperation(
    async () => {
      const { data: rows, error } = await supabaseAny
        .from('lodge_documents')
        .select('*')
        .order('upload_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        // Se a tabela não existir ainda, apenas logar e continuar
        if (error.code === '404' || error.code === 'PGRST116') {
          console.warn('Tabela lodge_documents não encontrada. A migração precisa ser aplicada.')
          setDocuments([])
          return null
        }
        console.error('Erro ao carregar documentos:', error)
        throw new Error('Não foi possível carregar os documentos.')
      }

      const mappedDocuments = (rows || []).map(mapDocumentFromDB)
      setDocuments(mappedDocuments)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar documentos.',
      showErrorToast: false, // Não mostrar toast se a tabela não existir
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
    async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (selectedDoc) {
        // Atualizar metadados
        const { data: updatedRows, error } = await supabaseAny
          .from('lodge_documents')
          .update({
            title: data.title,
            description: data.description,
            category: data.category,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedDoc.id)
          .select('*')
          .limit(1)

        if (error) {
          console.error('Erro ao atualizar documento:', error)
          throw new Error('Falha ao atualizar os metadados do documento.')
        }

        const updatedRow = updatedRows?.[0]
        if (!updatedRow) {
          throw new Error('Documento não encontrado após atualização.')
        }

        const updatedDoc = mapDocumentFromDB(updatedRow)
        setDocuments(
          documents.map((d) => (d.id === selectedDoc.id ? updatedDoc : d)),
        )
        return 'Metadados atualizados com sucesso.'
      } else {
        // Criar novo documento (o upload do arquivo é feito no DocumentDialog)
        if (!data.fileUrl) {
          throw new Error('Arquivo não foi enviado. Por favor, faça o upload do arquivo.')
        }

        const { data: createdRows, error } = await supabaseAny
          .from('lodge_documents')
          .insert({
            title: data.title,
            description: data.description,
            category: data.category,
            file_url: data.fileUrl,
            file_name: data.fileName,
            file_size: data.fileSize,
            file_type: data.fileType,
            upload_date: format(new Date(), 'yyyy-MM-dd'),
            uploaded_by: user?.id || null,
          })
          .select('*')
          .limit(1)

        if (error) {
          console.error('Erro ao criar documento:', error)
          throw new Error('Falha ao salvar o documento.')
        }

        const createdRow = createdRows?.[0]
        if (!createdRow) {
          throw new Error('Documento não foi criado corretamente.')
        }

        const newDoc = mapDocumentFromDB(createdRow)
        setDocuments([newDoc, ...documents])
        return 'Documento enviado com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar o documento.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      // Buscar o documento para obter a URL do arquivo
      const doc = documents.find((d) => d.id === id)
      
      const { error } = await supabaseAny
        .from('lodge_documents')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar documento:', error)
        throw new Error('Falha ao remover o documento.')
      }

      // Tentar deletar o arquivo do storage (opcional, não crítico se falhar)
      if (doc?.url) {
        try {
          const filePath = doc.url.split('/').slice(-2).join('/') // Extrair path do storage
          await supabase.storage.from('site-assets').remove([filePath])
        } catch (storageError) {
          console.warn('Erro ao deletar arquivo do storage (não crítico):', storageError)
        }
      }

      setDocuments(documents.filter((d) => d.id !== id))
      return 'Documento excluído.'
    },
    {
      successMessage: 'Documento removido com sucesso!',
      errorMessage: 'Falha ao remover o documento.',
    },
  )

  const handleSave = async (data: any) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
      // Recarregar lista após salvar
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
      />
    </div>
  )
}
