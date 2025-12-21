import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Trash2, ArrowRight } from 'lucide-react'
import useRedirectsStore, { Redirect } from '@/stores/useRedirectsStore'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function RedirectsManager() {
  const {
    redirects,
    fetchRedirects,
    addRedirect,
    updateRedirect,
    deleteRedirect,
    loading,
  } = useRedirectsStore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRedirect, setSelectedRedirect] = useState<Redirect | null>(
    null,
  )
  const [formData, setFormData] = useState({
    source_path: '',
    target_path: '',
    is_permanent: true,
  })

  useEffect(() => {
    fetchRedirects()
  }, [fetchRedirects])

  const openNew = () => {
    setSelectedRedirect(null)
    setFormData({ source_path: '', target_path: '', is_permanent: true })
    setIsDialogOpen(true)
  }

  const openEdit = (redirect: Redirect) => {
    setSelectedRedirect(redirect)
    setFormData({
      source_path: redirect.source_path,
      target_path: redirect.target_path,
      is_permanent: redirect.is_permanent,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.source_path || !formData.target_path) {
      toast({
        title: 'Erro',
        description: 'Origem e destino são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    // Ensure source starts with /
    let source = formData.source_path
    if (!source.startsWith('/')) source = '/' + source

    try {
      if (selectedRedirect) {
        await updateRedirect(selectedRedirect.id, {
          source_path: source,
          target_path: formData.target_path,
          is_permanent: formData.is_permanent,
        })
        toast({ title: 'Sucesso', description: 'Redirecionamento atualizado.' })
      } else {
        await addRedirect({
          source_path: source,
          target_path: formData.target_path,
          is_permanent: formData.is_permanent,
        })
        toast({ title: 'Sucesso', description: 'Redirecionamento criado.' })
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description:
          'Falha ao salvar redirecionamento. Verifique se a origem já existe.',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este redirecionamento?')) {
      try {
        await deleteRedirect(id)
        toast({
          title: 'Removido',
          description: 'Redirecionamento excluído com sucesso.',
        })
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Falha ao excluir.',
        })
      }
    }
  }

  if (loading && redirects.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Redirecionamentos (301)</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie rotas antigas para evitar links quebrados (404).
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Redirecionamento
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem</TableHead>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redirects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum redirecionamento configurado.
                </TableCell>
              </TableRow>
            ) : (
              redirects.map((redirect) => (
                <TableRow key={redirect.id}>
                  <TableCell className="font-mono text-sm">
                    {redirect.source_path}
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {redirect.target_path}
                  </TableCell>
                  <TableCell>
                    {redirect.is_permanent
                      ? 'Permanente (301)'
                      : 'Temporário (302)'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(redirect)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(redirect.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRedirect ? 'Editar' : 'Novo'} Redirecionamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Caminho de Origem (Antigo)</Label>
              <Input
                placeholder="/rota-antiga"
                value={formData.source_path}
                onChange={(e) =>
                  setFormData({ ...formData, source_path: e.target.value })
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Ex: /noticias/evento-antigo
              </p>
            </div>
            <div className="space-y-2">
              <Label>Caminho de Destino (Novo)</Label>
              <Input
                placeholder="/nova-rota"
                value={formData.target_path}
                onChange={(e) =>
                  setFormData({ ...formData, target_path: e.target.value })
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Ex: /dashboard/noticias
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                checked={formData.is_permanent}
                onCheckedChange={(c) =>
                  setFormData({ ...formData, is_permanent: c })
                }
              />
              <Label>Redirecionamento Permanente</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
