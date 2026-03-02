# Padrão: Atualização da tela após salvar/atualizar/excluir

Para que a interface atualize **sem precisar dar refresh**, todos os módulos que salvam dados devem seguir um destes padrões.

## 1. Refetch após mutação (recomendado)

Após **insert**, **update** ou **delete** no Supabase, chame a função que carrega os dados da tela:

```ts
// Exemplo: após salvar
const result = await saveOperation.execute(data)
if (result) {
  loadItems.execute()  // recarrega a lista
  dialog.closeDialog()
}
```

Em **stores Zustand**, após mutação bem-sucedida, chame o `fetch` correspondente:

```ts
// Exemplo: em useChancellorStore.saveVisitorAttendances
await get().fetchVisitorAttendances(sessionRecordId)
```

## 2. Atualização otimista com setState

Se atualizar o estado local em vez de refetch, use **sempre a forma funcional** de `setState` para evitar estado stale:

```ts
// Correto
setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
setItems((prev) => [newItem, ...prev])
setItems((prev) => prev.filter((item) => item.id !== id))

// Evitar (pode usar valor antigo de items)
setItems(items.map(...))
```

## 3. Checklist por módulo

| Módulo | Após salvar | Após excluir | Observação |
|--------|-------------|--------------|------------|
| Secretaria – Candidatos | `loadCandidates.execute()` | `loadCandidates.execute()` | handleSave e refreshAfterDetail |
| Secretaria – Irmãos | `loadBrothersExecute()` | - | handleSave |
| Secretaria – Fases | `onUpdated()` (refetch fases) | `onUpdated()` | PhaseDefinitionsManager |
| Secretaria – Documentos | `loadDocumentsExecute()` | `loadDocumentsExecute()` + setState funcional |
| Secretaria – Mensagens contato | `loadMessages.execute()` | - | updateStatus, sendReply, updateCategory |
| Secretaria – Avisos | setState funcional | setState funcional | NoticesList |
| Biblioteca | `loadLibraryItems.execute()` | `loadLibraryItems.execute()` | Library.tsx |
| Chancellor – Visitantes | `fetchVisitorAttendances(id)` na store | - | useChancellorStore.saveVisitorAttendances |
| Financeiro (store) | set() com dado retornado | set() removendo item | useFinancialStore |
| Ágape (store) | fetchSessions / fetchMenuItems / fetchConsumptions | idem | useAgapeStore |
| Notícias (store) | set() com dado retornado | set() removendo item | useNewsStore |

## 4. Stores que já refazem fetch após mutação

- **useAgapeStore**: createSession, updateSession, createMenuItem, updateMenuItem, deleteMenuItem, createConsumption, updateConsumption, deleteConsumption chamam o `fetch*` correspondente.
- **useChancellorStore**: saveVisitorAttendances chama fetchVisitorAttendances após salvar.
- **useFinancialStore**, **useNewsStore**, **useRedirectsStore**: atualizam estado com o retorno da API ou removem o item no delete.

Sempre que adicionar uma nova mutação (insert/update/delete), garanta que a lista ou o estado exibido na tela seja atualizado (por refetch ou por setState funcional).
