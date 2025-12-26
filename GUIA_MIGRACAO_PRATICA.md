# 🚀 Guia Prático de Migração - Passo a Passo

Este guia mostra como migrar componentes existentes para usar os novos hooks de forma **segura e gradual**.

---

## 📋 Checklist de Migração

Antes de começar:
- [ ] Faça backup do arquivo original
- [ ] Teste o componente atual para garantir que funciona
- [ ] Tenha certeza de entender o que o componente faz

---

## Exemplo 1: Migrando VenerablesManager

### Passo 1: Adicionar Imports

```tsx
// ❌ REMOVER (se não for mais usado)
import { useToast } from '@/hooks/use-toast'

// ✅ ADICIONAR
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
```

### Passo 2: Substituir Estado do Dialog

```tsx
// ❌ ANTES
const [isDialogOpen, setIsDialogOpen] = useState(false)

// ✅ DEPOIS
const dialog = useDialog()
```

### Passo 3: Substituir Funções de Operação

```tsx
// ❌ ANTES
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

// ✅ DEPOIS
const saveOperation = useAsyncOperation(
  async (data: any) => {
    if (selectedVenerable) {
      await updateVenerable({ ...selectedVenerable, ...data })
      return 'Registro atualizado com sucesso.'
    } else {
      await addVenerable(data)
      return 'Venerável adicionado à galeria com sucesso.'
    }
  },
  {
    successMessage: 'Operação realizada com sucesso!',
    errorMessage: 'Falha ao salvar o registro.',
  },
)

const handleSave = async (data: any) => {
  const result = await saveOperation.execute(data)
  if (result) {
    dialog.closeDialog()
  }
}
```

### Passo 4: Atualizar JSX

```tsx
// ❌ ANTES
<VenerableDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  // ...
/>

// ✅ DEPOIS
<VenerableDialog
  open={dialog.open}
  onOpenChange={dialog.onOpenChange}
  // ...
/>
```

### Passo 5: Atualizar Funções de Abertura

```tsx
// ❌ ANTES
const openNew = () => {
  setSelectedVenerable(null)
  setIsDialogOpen(true)
}

// ✅ DEPOIS
const openNew = () => {
  setSelectedVenerable(null)
  dialog.openDialog()
}
```

---

## Exemplo 2: Migrando Upload de Imagem

### Passo 1: Adicionar Import

```tsx
// ✅ ADICIONAR
import { useImageUpload } from '@/hooks/use-image-upload'
```

### Passo 2: Substituir Estado e Lógica

```tsx
// ❌ ANTES
const [isUploading, setIsUploading] = useState(false)
const fileInputRef = useRef<HTMLInputElement>(null)

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

// ✅ DEPOIS
const imageUpload = useImageUpload({
  bucket: 'site-assets',
  folder: 'venerables',
  maxSize: 400,
  quality: 0.8,
  successMessage: 'Foto do venerável carregada com sucesso.',
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
```

### Passo 3: Atualizar JSX

```tsx
// ❌ ANTES
<input
  type="file"
  ref={fileInputRef}
  onChange={handleFileSelect}
/>
{isUploading && <Loader2 />}

// ✅ DEPOIS
<input
  type="file"
  ref={imageUpload.inputRef}
  onChange={handleFileSelect}
/>
{imageUpload.isUploading && <Loader2 />}
```

---

## 🧪 Testando a Migração

Após migrar um componente:

1. **Teste manual:**
   ```bash
   npm start
   ```
   - Abra o componente no navegador
   - Teste todas as funcionalidades
   - Verifique se os toasts aparecem
   - Verifique se os erros são tratados

2. **Verifique o console:**
   - Não deve haver erros
   - Logs devem aparecer apenas em desenvolvimento

3. **Teste os testes (se houver):**
   ```bash
   npm test
   ```

---

## 📊 Comparação: Antes vs Depois

### VenerablesManager

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Linhas de código | 165 | 120 | -27% |
| Estados gerenciados | 2 | 1 | -50% |
| Try/catch blocks | 2 | 0 | -100% |
| Toast manual | 4 | 0 | -100% |
| Complexidade | Alta | Baixa | ✅ |

### VenerableDialog (Upload)

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Linhas (upload) | ~30 | ~10 | -67% |
| Estados de upload | 1 | 0 | -100% |
| Lógica de compressão | Manual | Automática | ✅ |
| Tratamento de erros | Manual | Automático | ✅ |

---

## ⚠️ Pontos de Atenção

### 1. Mensagens de Sucesso Customizadas

O `useAsyncOperation` permite mensagens customizadas, mas você pode retornar uma string da função para mensagem dinâmica:

```tsx
const operation = useAsyncOperation(
  async (data) => {
    await saveData(data)
    return 'Mensagem customizada baseada no resultado' // ✅ Isso sobrescreve successMessage
  },
  {
    successMessage: 'Mensagem padrão', // ⚠️ Será ignorada se a função retornar string
  },
)
```

### 2. Fechar Dialog Após Sucesso

```tsx
const handleSave = async (data: any) => {
  const result = await saveOperation.execute(data)
  if (result) {
    // ✅ Só fecha se a operação foi bem-sucedida
    dialog.closeDialog()
  }
  // ❌ Se result for null, significa que houve erro
  // O hook já mostrou o toast de erro
}
```

### 3. Reset do Upload

Quando criar um novo registro, reset o hook de upload:

```tsx
useEffect(() => {
  if (!venerableToEdit) {
    imageUpload.reset() // ✅ Limpa estado do upload
  }
}, [venerableToEdit])
```

---

## 🎯 Ordem Recomendada de Migração

Migre nesta ordem para minimizar riscos:

1. **Componentes simples primeiro:**
   - Componentes que só usam `useDialog`
   - Ex: `VenerablesManager`, `BrothersList`

2. **Componentes com upload:**
   - Componentes que usam `useImageUpload`
   - Ex: `VenerableDialog`, `BrotherDialog`

3. **Componentes complexos por último:**
   - Componentes com múltiplas operações
   - Ex: `FinancialOverview`, `ChancellorOverview`

---

## ✅ Checklist Pós-Migração

Após migrar cada componente:

- [ ] Componente funciona corretamente
- [ ] Toasts aparecem nos momentos certos
- [ ] Erros são tratados adequadamente
- [ ] Loading states funcionam
- [ ] Não há erros no console
- [ ] Código está mais limpo e legível

---

## 📝 Notas Finais

- **Migração é opcional** - O código atual funciona perfeitamente
- **Faça gradualmente** - Migre um componente por vez
- **Teste sempre** - Teste cada migração antes de continuar
- **Mantenha backups** - Faça commit antes de cada migração

Os arquivos de exemplo estão em:
- `src/components/settings/VenerablesManager.migrated.example.tsx`
- `src/components/settings/VenerableDialog.migrated.example.tsx`

Use-os como referência ao migrar outros componentes!

