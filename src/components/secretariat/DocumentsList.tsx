import { useState } from 'react'
import { LodgeDocument, mockDocuments } from '@/lib/data'
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
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export function DocumentsList() {
  const [documents, setDocuments] = useState<LodgeDocument[]>(mockDocuments)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<LodgeDocument | null>(null)
  const { toast } = useToast()

  const handleSave = (data: any) => {
    if (selectedDoc) {
      setDocuments(
        documents.map((d) => (d.id === selectedDoc.id ? { ...d, ...data } : d)),
      )
      toast({ title: 'Sucesso', description: 'Metadados atualizados.' })
    } else {
      const newDoc: LodgeDocument = {
        id: String(documents.length + 1),
        uploadDate: format(new Date(), 'yyyy-MM-dd'),
        type: 'PDF', // Mocked type
        url: '#',
        ...data,
      }
      setDocuments([newDoc, ...documents])
      toast({ title: 'Sucesso', description: 'Documento enviado.' })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id))
    toast({ title: 'Removido', description: 'Documento excluído.' })
  }

  const openEdit = (doc: LodgeDocument) => {
    setSelectedDoc(doc)
    setIsDialogOpen(true)
  }

  const openNew = () => {
    setSelectedDoc(null)
    setIsDialogOpen(true)
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
            {documents.length === 0 ? (
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
                        <DropdownMenuItem>
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
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        documentToEdit={selectedDoc}
        onSave={handleSave}
      />
    </div>
  )
}
