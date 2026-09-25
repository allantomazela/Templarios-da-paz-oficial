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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import useEssentialLinksStore, {
  type EssentialLink,
} from '@/stores/useEssentialLinksStore'
import {
  ESSENTIAL_LINK_ICON_OPTIONS,
  resolveEssentialLinkIcon,
} from '@/lib/essential-link-icons'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'

const EMPTY_FORM = {
  title: '',
  url: '',
  icon_name: 'Link2',
  sort_order: '0',
  is_active: true,
}

export function EssentialLinksManager() {
  const {
    links,
    fetchLinks,
    addLink,
    updateLink,
    deleteLink,
    loading,
  } = useEssentialLinksStore()

  const dialog = useDialog()
  const [selectedLink, setSelectedLink] = useState<EssentialLink | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)

  useEffect(() => {
    void fetchLinks({ includeInactive: true })
  }, [fetchLinks])

  const saveOperation = useAsyncOperation(
    async () => {
      const title = formData.title.trim()
      const url = formData.url.trim()
      const sortOrder = Number.parseInt(formData.sort_order, 10)

      if (!title || !url) {
        throw new Error('Título e URL são obrigatórios.')
      }
      if (!/^https?:\/\//i.test(url)) {
        throw new Error('A URL deve começar com http:// ou https://.')
      }
      if (Number.isNaN(sortOrder)) {
        throw new Error('A ordem deve ser um número válido.')
      }

      const payload = {
        title,
        url,
        icon_name: formData.icon_name || 'Link2',
        sort_order: sortOrder,
        is_active: formData.is_active,
      }

      if (selectedLink) {
        await updateLink(selectedLink.id, payload)
        return 'Link atualizado com sucesso.'
      }

      await addLink(payload)
      return 'Link criado com sucesso.'
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar o link essencial.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      await deleteLink(id)
      return 'Link excluído com sucesso.'
    },
    {
      successMessage: 'Link removido com sucesso!',
      errorMessage: 'Falha ao excluir o link.',
    },
  )

  const openNew = () => {
    const nextOrder =
      links.reduce((max, link) => Math.max(max, link.sort_order), 0) + 10
    setSelectedLink(null)
    setFormData({ ...EMPTY_FORM, sort_order: String(nextOrder) })
    dialog.openDialog()
  }

  const openEdit = (link: EssentialLink) => {
    setSelectedLink(link)
    setFormData({
      title: link.title,
      url: link.url,
      icon_name: link.icon_name || 'Link2',
      sort_order: String(link.sort_order),
      is_active: link.is_active,
    })
    dialog.openDialog()
  }

  const handleSave = async () => {
    const result = await saveOperation.execute()
    if (result) {
      dialog.closeDialog()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este link?')) {
      await deleteOperation.execute(id)
    }
  }

  if (loading && links.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-medium">Links Essenciais</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os links exibidos na área restrita para todos os irmãos.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Link
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">Ordem</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="hidden md:table-cell">URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum link cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => {
                const Icon = resolveEssentialLinkIcon(link.icon_name)
                return (
                  <TableRow key={link.id}>
                    <TableCell className="font-mono text-sm">
                      {link.sort_order}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium">{link.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[280px] truncate font-mono text-xs text-muted-foreground md:table-cell">
                      {link.url}
                    </TableCell>
                    <TableCell>
                      <Badge variant={link.is_active ? 'default' : 'secondary'}>
                        {link.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-1 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Abrir link"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(link)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog.open} onOpenChange={dialog.onOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {selectedLink ? 'Editar' : 'Novo'} Link Essencial
            </DialogTitle>
            <DialogDescription className="sr-only">
              Informe título, URL, ícone e ordem de exibição do link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="essential-link-title">Título</Label>
              <Input
                id="essential-link-title"
                placeholder="Ex: Grande Oriente de São Paulo"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="essential-link-url">URL</Label>
              <Input
                id="essential-link-url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ícone</Label>
                <Select
                  value={formData.icon_name}
                  onValueChange={(value) =>
                    setFormData({ ...formData, icon_name: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ícone" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESSENTIAL_LINK_ICON_OPTIONS.map((iconName) => {
                      const Icon = resolveEssentialLinkIcon(iconName)
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {iconName}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="essential-link-order">Ordem</Label>
                <Input
                  id="essential-link-order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label>Link ativo (visível para os irmãos)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dialog.closeDialog()}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveOperation.loading}>
              {saveOperation.loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
