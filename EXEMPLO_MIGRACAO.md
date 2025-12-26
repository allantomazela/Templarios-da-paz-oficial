# 📚 Exemplo Prático de Migração - Usando os Novos Hooks

Este documento mostra como migrar componentes existentes para usar os novos hooks customizados de forma segura e gradual.

---

## Exemplo 1: VenerablesManager

### ❌ ANTES (Código Original)

```tsx
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export function VenerablesManager() {
  const { venerables, addVenerable, updateVenerable, deleteVenerable } =
    useSiteSettingsStore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVenerable, setSelectedVenerable] = useState<Venerable | null>(null)

  const handleSave = async (data: any) => {
    try {
      if (selectedVenerable) {
        await updateVenerable({ ...selectedVenerable, ...data })
        toast({ title: 'Sucesso', description: 'Registro atualizado.' })
      } else {
        await addVenerable(data)
        toast({ title: 'Sucesso', description: 'Venerável adicionado.' })
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao salvar o registro.',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteVenerable(id)
      toast({ title: 'Removido', description: 'Venerável removido.' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao remover o registro.',
      })
    }
  }

  const openNew = () => {
    setSelectedVenerable(null)
    setIsDialogOpen(true)
  }

  const openEdit = (venerable: Venerable) => {
    setSelectedVenerable(venerable)
    setIsDialogOpen(true)
  }

  return (
    // ... JSX usando isDialogOpen, setIsDialogOpen, etc
  )
}
```

### ✅ DEPOIS (Usando os Novos Hooks)

```tsx
import { useState } from 'react'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import useSiteSettingsStore, { Venerable } from '@/stores/useSiteSettingsStore'

export function VenerablesManager() {
  const { venerables, addVenerable, updateVenerable, deleteVenerable } =
    useSiteSettingsStore()
  
  // ✅ Hook para gerenciar dialog
  const dialog = useDialog()
  const [selectedVenerable, setSelectedVenerable] = useState<Venerable | null>(null)

  // ✅ Hook para operação de salvar
  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedVenerable) {
        await updateVenerable({ ...selectedVenerable, ...data })
        return 'Registro atualizado.'
      } else {
        await addVenerable(data)
        return 'Venerável adicionado à galeria.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!', // Será sobrescrito pela mensagem do return
      errorMessage: 'Falha ao salvar o registro.',
    }
  )

  // ✅ Hook para operação de deletar
  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      await deleteVenerable(id)
      return 'Venerável removido da galeria.'
    },
    {
      successMessage: 'Registro removido com sucesso!',
      errorMessage: 'Falha ao remover o registro.',
    }
  )

  const handleSave = async (data: any) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
    }
  }

  const handleDelete = async (id: string) => {
    await deleteOperation.execute(id)
  }

  const openNew = () => {
    setSelectedVenerable(null)
    dialog.openDialog()
  }

  const openEdit = (venerable: Venerable) => {
    setSelectedVenerable(venerable)
    dialog.openDialog()
  }

  return (
    // ... JSX usando dialog.open, dialog.onOpenChange, etc
    <VenerableDialog
      open={dialog.open}
      onOpenChange={dialog.onOpenChange}
      venerableToEdit={selectedVenerable}
      onSave={handleSave}
    />
  )
}
```

**Benefícios:**
- ✅ Menos código (removido try/catch manual)
- ✅ Toast automático
- ✅ Gerenciamento de loading automático
- ✅ Código mais limpo e legível

---

## Exemplo 2: VenerableDialog (Upload de Imagem)

### ❌ ANTES (Código Original)

```tsx
export function VenerableDialog({ open, onOpenChange, venerableToEdit, onSave }) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const optimizedFile = await compressImage(file, 400)
      const publicUrl = await uploadToStorage(
        optimizedFile,
        'site-assets',
        'venerables',
      )
      form.setValue('imageUrl', publicUrl, { shouldDirty: true })
      toast({
        title: 'Upload Concluído',
        description: 'Foto do venerável carregada.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar a imagem.',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    // ... JSX
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileSelect}
    />
  )
}
```

### ✅ DEPOIS (Usando useImageUpload)

```tsx
import { useImageUpload } from '@/hooks/use-image-upload'

export function VenerableDialog({ open, onOpenChange, venerableToEdit, onSave }) {
  // ✅ Hook para upload de imagem
  const imageUpload = useImageUpload({
    bucket: 'site-assets',
    folder: 'venerables',
    maxSize: 400, // Avatar size
    quality: 0.8,
    successMessage: 'Foto do venerável carregada.',
    errorMessage: 'Falha ao carregar a imagem.',
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await imageUpload.handleUpload(file)
    if (url) {
      form.setValue('imageUrl', url, { shouldDirty: true })
    }
  }

  return (
    // ... JSX
    <Button
      onClick={() => imageUpload.inputRef.current?.click()}
      disabled={imageUpload.isUploading}
    >
      {imageUpload.isUploading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Upload className="mr-2 h-4 w-4" />
      )}
      Alterar Foto
    </Button>
    <input
      type="file"
      ref={imageUpload.inputRef}
      accept="image/*"
      onChange={handleFileSelect}
      className="hidden"
    />
  )
}
```

**Benefícios:**
- ✅ Código reduzido de ~30 linhas para ~10 linhas
- ✅ Compressão automática
- ✅ Toast automático
- ✅ Tratamento de erros automático
- ✅ Reset do input automático

---

## Comparação: Antes vs Depois

### VenerablesManager

| Aspecto | Antes | Depois |
|--------|-------|--------|
| Linhas de código | ~165 | ~120 |
| Estados gerenciados manualmente | 2 | 1 |
| Try/catch blocks | 2 | 0 |
| Toast manual | 4 | 0 (automático) |
| Código repetido | Alto | Baixo |

### VenerableDialog

| Aspecto | Antes | Depois |
|--------|-------|--------|
| Linhas de código (upload) | ~30 | ~10 |
| Estados de upload | 1 manual | 0 (gerenciado) |
| Lógica de compressão | Manual | Automática |
| Tratamento de erros | Manual | Automático |

---

## 🎯 Próximos Componentes para Migrar

Componentes que se beneficiariam da migração:

1. **BrothersList** - Usa `isDialogOpen` → `useDialog`
2. **DocumentsList** - Usa `isDialogOpen` → `useDialog`
3. **MessagesList** - Usa `isDialogOpen` → `useDialog`
4. **NoticesList** - Usa `isDialogOpen` → `useDialog`
5. **LogoSettings** - Upload de imagens → `useImageUpload`
6. **BrotherDialog** - Upload de foto → `useImageUpload`
7. **Todos os componentes de lista** - Operações CRUD → `useAsyncOperation`

---

## ⚠️ Importante

- **Migração é opcional** - O código atual continua funcionando
- **Migre gradualmente** - Não precisa migrar tudo de uma vez
- **Teste após migração** - Sempre teste a funcionalidade após migrar
- **Mantenha compatibilidade** - Os hooks são retrocompatíveis

