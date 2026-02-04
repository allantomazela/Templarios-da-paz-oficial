import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LibraryItem } from '@/lib/data'
import { Search, FileText, Download, Lock, AlertCircle, Loader2, Upload, Pencil, Trash2 } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import { useState, useMemo, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useToast } from '@/hooks/use-toast'
import { uploadToStorage } from '@/lib/upload-utils'
import { getSaveErrorMessage, isAuthError } from '@/lib/auth-utils'

interface LibraryItemFromDB {
  id: string
  title: string
  type: 'PDF' | 'Imagem' | 'Video' | 'Texto'
  degree: 'Aprendiz' | 'Companheiro' | 'Mestre'
  file_url: string
  file_name: string | null
  file_size: number | null
  added_at: string
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

type MasonicDegree = 'Aprendiz' | 'Companheiro' | 'Mestre'

/**
 * Verifica se um usuário pode acessar material de um determinado grau
 * Regras:
 * - Grau I (Aprendiz): só acessa material de Grau I
 * - Grau II (Companheiro): acessa material de Grau I e Grau II
 * - Grau III (Mestre): acessa tudo
 */
function canAccessDegree(
  userDegree: MasonicDegree | undefined | null,
  materialDegree: MasonicDegree,
): boolean {
  // Se não tem grau definido, não acessa nada
  if (!userDegree) return false

  // Mestre acessa tudo
  if (userDegree === 'Mestre') return true

  // Companheiro acessa Aprendiz e Companheiro
  if (userDegree === 'Companheiro') {
    return materialDegree === 'Aprendiz' || materialDegree === 'Companheiro'
  }

  // Aprendiz só acessa Aprendiz
  if (userDegree === 'Aprendiz') {
    return materialDegree === 'Aprendiz'
  }

  // Caso padrão: não acessa
  return false
}

/**
 * Retorna os graus que o usuário pode acessar
 */
function getAccessibleDegrees(
  userDegree: MasonicDegree | undefined | null,
): MasonicDegree[] {
  if (!userDegree) return []

  if (userDegree === 'Mestre') {
    return ['Aprendiz', 'Companheiro', 'Mestre']
  }

  if (userDegree === 'Companheiro') {
    return ['Aprendiz', 'Companheiro']
  }

  if (userDegree === 'Aprendiz') {
    return ['Aprendiz']
  }

  return []
}

/** Apenas admin ou editor (Irmão Secretário) podem enviar PDFs. */
function canUploadLibrary(role: string | undefined): boolean {
  return role === 'admin' || role === 'editor'
}

export default function LibraryPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDegree, setUploadDegree] = useState<MasonicDegree>('Aprendiz')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDegree, setEditDegree] = useState<MasonicDegree>('Aprendiz')
  const [editFile, setEditFile] = useState<File | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const supabaseAny = supabase as any

  const userDegree = user?.profile?.masonic_degree as MasonicDegree | undefined
  const canUpload = canUploadLibrary(user?.role)

  // Load library items from Supabase
  const loadLibraryItems = useAsyncOperation(
    async () => {
      setLoading(true)
      try {
        const { data, error } = await supabaseAny
          .from('library_items')
          .select('*')
          .order('added_at', { ascending: false })

        if (error) throw error

        const mapped: LibraryItem[] = (data || []).map((item: LibraryItemFromDB) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          degree: item.degree,
          addedAt: item.added_at,
          fileUrl: item.file_url || null,
        }))

        setLibraryItems(mapped)
      } catch (error) {
        if (isAuthError(error)) {
          useAuthStore.getState().clearSessionAndRedirectToLogin()
          return
        }
        console.error('Error loading library items:', error)
      } finally {
        setLoading(false)
      }
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar materiais da biblioteca.',
    },
  )

  useEffect(() => {
    loadLibraryItems.execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !uploadTitle.trim() || !uploadFile) {
      toast({
        variant: 'destructive',
        title: 'Preencha os campos',
        description: 'Informe o título e selecione um arquivo PDF.',
      })
      return
    }
    if (uploadFile.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Apenas arquivos PDF são permitidos.',
      })
      return
    }
    setIsUploading(true)
    try {
      const publicUrl = await uploadToStorage(
        uploadFile,
        'site-assets',
        'library',
      )
      const { error } = await supabase.from('library_items').insert({
        title: uploadTitle.trim(),
        type: 'PDF',
        degree: uploadDegree,
        file_url: publicUrl,
        file_name: uploadFile.name,
        file_size: uploadFile.size,
        added_at: new Date().toISOString().slice(0, 10),
        uploaded_by: user.id,
      })
      if (error) throw error
      toast({
        title: 'PDF enviado',
        description: 'O arquivo foi disponibilizado na biblioteca.',
      })
      setUploadTitle('')
      setUploadDegree('Aprendiz')
      setUploadFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      loadLibraryItems.execute()
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setIsUploading(false)
    }
  }

  const openEdit = (item: LibraryItem) => {
    setEditingItem(item)
    setEditTitle(item.title)
    setEditDegree(item.degree as MasonicDegree)
    setEditFile(null)
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  const closeEdit = () => {
    setEditingItem(null)
    setEditTitle('')
    setEditDegree('Aprendiz')
    setEditFile(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem || !editTitle.trim()) return
    setIsSavingEdit(true)
    try {
      let fileUrl = libraryItems.find((i) => i.id === editingItem.id)?.fileUrl ?? editingItem.fileUrl
      if (editFile) {
        if (editFile.type !== 'application/pdf') {
          toast({
            variant: 'destructive',
            title: 'Arquivo inválido',
            description: 'Apenas arquivos PDF são permitidos.',
          })
          setIsSavingEdit(false)
          return
        }
        fileUrl = await uploadToStorage(editFile, 'site-assets', 'library')
      }
      const { error } = await supabase
        .from('library_items')
        .update({
          title: editTitle.trim(),
          degree: editDegree,
          ...(fileUrl && { file_url: fileUrl }),
          ...(editFile && {
            file_name: editFile.name,
            file_size: editFile.size,
          }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id)
      if (error) throw error
      toast({ title: 'Documento atualizado', description: 'As alterações foram salvas.' })
      closeEdit()
      loadLibraryItems.execute()
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return
    const item = libraryItems.find((i) => i.id === deleteTargetId)
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('library_items').delete().eq('id', deleteTargetId)
      if (error) throw error
      // Remover arquivo do Storage (opcional; falha não bloqueia)
      if (item?.fileUrl) {
        try {
          const path = item.fileUrl.split('/').slice(-2).join('/')
          await supabase.storage.from('site-assets').remove([path])
        } catch {
          // Ignorar; registro já foi removido
        }
      }
      toast({ title: 'Documento excluído', description: 'O item foi removido da biblioteca.' })
      setDeleteTargetId(null)
      loadLibraryItems.execute()
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

  // Obter graus acessíveis
  const accessibleDegrees = useMemo(
    () => getAccessibleDegrees(userDegree),
    [userDegree],
  )

  // Filtrar biblioteca rigorosamente
  const filteredLibrary = useMemo(() => {
    return libraryItems.filter((item) => {
      // Verificar se o usuário pode acessar este material
      return canAccessDegree(userDegree, item.degree as MasonicDegree)
    })
  }, [libraryItems, userDegree])

  // Filtrar por termo de busca
  const searchFilteredLibrary = useMemo(() => {
    if (!searchTerm.trim()) return filteredLibrary

    const term = searchTerm.toLowerCase()
    return filteredLibrary.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        item.degree.toLowerCase().includes(term),
    )
  }, [filteredLibrary, searchTerm])

  // Tabs disponíveis baseadas no acesso
  const availableTabs = useMemo(() => {
    const tabs: Array<{ value: string; label: string }> = [
      { value: 'all', label: 'Todos' },
    ]

    if (accessibleDegrees.includes('Aprendiz')) {
      tabs.push({ value: 'Aprendiz', label: 'Grau I' })
    }
    if (accessibleDegrees.includes('Companheiro')) {
      tabs.push({ value: 'Companheiro', label: 'Grau II' })
    }
    if (accessibleDegrees.includes('Mestre')) {
      tabs.push({ value: 'Mestre', label: 'Grau III' })
    }

    return tabs
  }, [accessibleDegrees])

  // Verificar se usuário não tem grau definido
  const hasNoDegree = !userDegree

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Biblioteca Virtual
        </h2>
        <p className="text-muted-foreground">
          Acervo de estudos e documentos maçônicos.
        </p>
      </div>

      {/* Alerta se não tem grau definido */}
      {hasNoDegree && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Acesso Restrito:</strong> Seu perfil não possui grau maçônico
            definido. Entre em contato com a administração para ter acesso aos
            materiais da biblioteca.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta informativo sobre acesso */}
      {!hasNoDegree && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Você tem acesso aos materiais dos seguintes graus:{' '}
            <strong>
              {accessibleDegrees
                .map((d) => {
                  if (d === 'Aprendiz') return 'Grau I'
                  if (d === 'Companheiro') return 'Grau II'
                  return 'Grau III'
                })
                .join(', ')}
            </strong>
            . Materiais de outros graus não estão disponíveis para seu nível.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Pesquisar material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {canUpload && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Enviar PDF para a Biblioteca
            </CardTitle>
            <CardDescription>
              Como Secretário, você pode disponibilizar arquivos em PDF para
              download pelos irmãos. Selecione o grau que pode acessar o
              material.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="upload-title">Título do documento</Label>
                  <Input
                    id="upload-title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Ex.: Ritual do Grau de Aprendiz"
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-degree">Grau com acesso</Label>
                  <Select
                    value={uploadDegree}
                    onValueChange={(v) => setUploadDegree(v as MasonicDegree)}
                    disabled={isUploading}
                  >
                    <SelectTrigger id="upload-degree">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aprendiz">Grau I - Aprendiz</SelectItem>
                      <SelectItem value="Companheiro">
                        Grau II - Companheiro
                      </SelectItem>
                      <SelectItem value="Mestre">Grau III - Mestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload-file">Arquivo PDF</Label>
                <Input
                  id="upload-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  disabled={isUploading}
                />
                {uploadFile && (
                  <p className="text-xs text-muted-foreground">
                    {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar PDF
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando materiais da biblioteca...</span>
          </div>
        </div>
      ) : hasNoDegree ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Lock className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">
            Acesso Restrito
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Você precisa ter um grau maçônico definido para acessar os materiais
            da biblioteca.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {availableTabs.map((tab) => {
            // Filtrar materiais por tab, mas sempre respeitando o acesso do usuário
            const tabMaterials = searchFilteredLibrary.filter((item) => {
              if (tab.value === 'all') return true
              return item.degree === tab.value
            })

            return (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                {tabMaterials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Nenhum material encontrado
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchTerm
                        ? 'Tente ajustar sua busca'
                        : 'Não há materiais disponíveis nesta categoria'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tabMaterials.map((item) => {
                      // Validação adicional: garantir que o item é acessível
                      const isAccessible = canAccessDegree(
                        userDegree,
                        item.degree as MasonicDegree,
                      )

                      if (!isAccessible) {
                        // Não deveria acontecer, mas por segurança não renderiza
                        return null
                      }

                      return (
                        <Card
                          key={item.id}
                          className="hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <CardHeader className="bg-secondary/10 pb-4">
                            <div className="flex justify-center py-4 text-primary group-hover:scale-110 transition-transform">
                              <FileText className="h-16 w-16" />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <CardTitle className="text-base line-clamp-2">
                              {item.title}
                            </CardTitle>
                            <CardDescription className="mt-2 text-xs">
                              Grau: {item.degree} • Tipo: {item.type}
                            </CardDescription>
                          </CardContent>
                          <CardFooter className="flex flex-col gap-2">
                            <div className="flex w-full gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  const fullItem = libraryItems.find((i) => i.id === item.id)
                                  if (fullItem?.fileUrl) {
                                    window.open(fullItem.fileUrl, '_blank')
                                  }
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" /> Baixar
                              </Button>
                              {canUpload && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    title="Editar"
                                    onClick={() => {
                                      const full = libraryItems.find((i) => i.id === item.id)
                                      if (full) openEdit(full)
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    title="Excluir"
                                    onClick={() => setDeleteTargetId(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardFooter>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      {/* Dialog Editar documento */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar documento</DialogTitle>
            <DialogDescription>
              Altere o título, o grau com acesso ou substitua o arquivo PDF.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Título do documento"
                disabled={isSavingEdit}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-degree">Grau com acesso</Label>
              <Select
                value={editDegree}
                onValueChange={(v) => setEditDegree(v as MasonicDegree)}
                disabled={isSavingEdit}
              >
                <SelectTrigger id="edit-degree">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprendiz">Grau I - Aprendiz</SelectItem>
                  <SelectItem value="Companheiro">Grau II - Companheiro</SelectItem>
                  <SelectItem value="Mestre">Grau III - Mestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-file">Substituir arquivo (opcional)</Label>
              <Input
                id="edit-file"
                ref={editFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
                disabled={isSavingEdit}
              />
              {editFile && (
                <p className="text-xs text-muted-foreground">
                  Novo arquivo: {editFile.name} ({(editFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEdit} disabled={isSavingEdit}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingEdit}>
                {isSavingEdit ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação Excluir */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será removido da biblioteca e os irmãos
              não poderão mais baixá-lo.
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
    </div>
  )
}
