# Guia de Teste - Módulo de Comunicações

Este documento explica como testar as funcionalidades de comunicação do sistema: **Mural de Avisos** e **Mensagens Internas**.

## 📋 Índice

1. [Mural de Avisos](#mural-de-avisos)
2. [Mensagens Internas](#mensagens-internas)
3. [Notificações](#notificações)

---

## 🗨️ Mural de Avisos

### Localização
- **Rota:** `/dashboard/secretariat`
- **Aba:** "Comunicações" → "Mural de Avisos"

### Como Testar

#### 1. Criar um Aviso
1. Acesse a Secretaria → Aba "Comunicações"
2. Clique em "Mural de Avisos"
3. Clique no botão **"Novo Aviso"**
4. Preencha os campos:
   - **Título:** Ex: "Reunião Extraordinária"
   - **Mensagem:** Ex: "Convocamos todos os irmãos para reunião extraordinária..."
   - **Prioridade:** Alta, Média ou Baixa
   - **Data de Expiração:** (opcional)
5. Clique em **"Salvar"**

#### 2. Verificar Exibição
- O aviso deve aparecer na lista de avisos
- Avisos com prioridade "Alta" devem aparecer destacados
- Avisos expirados devem aparecer com visual diferenciado

#### 3. Editar um Aviso
1. Clique no ícone de **editar** (lápis) ao lado do aviso
2. Modifique os campos desejados
3. Clique em **"Salvar"**

#### 4. Excluir um Aviso
1. Clique no ícone de **excluir** (lixeira) ao lado do aviso
2. Confirme a exclusão no diálogo

#### 5. Visualizar Detalhes
- Clique no aviso para ver os detalhes completos
- Verifique se todas as informações estão corretas

---

## 💬 Mensagens Internas

### Localização
- **Rota:** `/dashboard/secretariat`
- **Aba:** "Comunicações" → "Mensagens Internas"

### Como Testar

#### 1. Enviar uma Mensagem
1. Acesse a Secretaria → Aba "Comunicações"
2. Clique em "Mensagens Internas"
3. Clique no botão **"Nova Mensagem"**
4. Preencha os campos:
   - **Destinatário:** Selecione um ou mais irmãos
   - **Assunto:** Ex: "Lembrete: Reunião de amanhã"
   - **Mensagem:** Digite o conteúdo da mensagem
5. Clique em **"Enviar"**

#### 2. Verificar Mensagens Enviadas
- Acesse a aba **"Enviadas"**
- Sua mensagem deve aparecer na lista
- Verifique se o status está correto (enviada, lida, etc.)

#### 3. Verificar Mensagens Recebidas
- Acesse a aba **"Recebidas"**
- Se você enviou uma mensagem para si mesmo ou outro usuário logado, ela deve aparecer aqui
- Mensagens não lidas devem aparecer destacadas

#### 4. Responder uma Mensagem
1. Clique em uma mensagem recebida
2. Clique no botão **"Responder"**
3. O campo destinatário deve estar pré-preenchido
4. Digite sua resposta
5. Clique em **"Enviar"**

#### 5. Marcar como Lida
- Ao abrir uma mensagem recebida, ela deve ser marcada automaticamente como lida
- Verifique se o indicador visual muda

---

## 🔔 Notificações

### Como Funciona

Quando uma mensagem é enviada, o sistema deve:
1. Criar uma notificação no banco de dados (tabela `notifications`)
2. Exibir uma notificação visual no sistema
3. (Opcional) Enviar notificação push se o usuário tiver permissão

### Como Testar Notificações

#### 1. Verificar Notificações no Banco
```sql
-- Ver todas as notificações
SELECT * FROM notifications ORDER BY created_at DESC;

-- Ver notificações de um usuário específico
SELECT * FROM notifications 
WHERE profile_id = 'ID_DO_USUARIO' 
ORDER BY created_at DESC;
```

#### 2. Verificar Notificações na Interface
- As notificações devem aparecer no **canto superior direito** da tela
- Clique no ícone de **sino** no header para ver todas as notificações
- Notificações não lidas devem aparecer com um badge de contador

#### 3. Marcar Notificações como Lidas
- Clique em uma notificação para marcá-la como lida
- O badge de contador deve diminuir

---

## 🐛 Problemas Comuns e Soluções

### Mensagens não aparecem
- **Verificar:** Se o destinatário está correto
- **Verificar:** Se há erros no console do navegador
- **Verificar:** Se as notificações estão sendo criadas no banco

### Notificações não são exibidas
- **Verificar:** Se o usuário está logado
- **Verificar:** Se há erros no console
- **Verificar:** Se a tabela `notifications` existe no banco

### Avisos não aparecem no mural
- **Verificar:** Se o aviso não está expirado
- **Verificar:** Se há filtros aplicados
- **Verificar:** Se o aviso foi salvo corretamente

---

## 📝 Notas Técnicas

### Estrutura de Dados

#### Notificações (tabela `notifications`)
```typescript
{
  id: string
  profile_id: string
  title: string
  message: string
  link?: string
  is_read: boolean
  created_at: Date
}
```

#### Mensagens (mock data)
```typescript
{
  id: string
  date: string
  sender: string
  senderId: string
  recipients: string[]
  subject: string
  content: string
  read: boolean
  type: 'sent' | 'received'
}
```

### Integração com Supabase

Para implementar notificações reais, adicione após o envio de mensagem:

```typescript
import { supabase } from '@/lib/supabase/client'

// Após enviar mensagem com sucesso
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  for (const recipientId of recipients) {
    await supabase.from('notifications').insert({
      profile_id: recipientId,
      title: 'Nova Mensagem Interna',
      message: `Você recebeu uma mensagem: ${subject}`,
      link: '/dashboard/secretariat?tab=messages',
    })
  }
}
```

---

## ✅ Checklist de Testes

- [ ] Criar um aviso no mural
- [ ] Editar um aviso existente
- [ ] Excluir um aviso
- [ ] Enviar uma mensagem interna
- [ ] Receber uma mensagem interna
- [ ] Responder uma mensagem
- [ ] Verificar notificações no banco de dados
- [ ] Verificar notificações na interface
- [ ] Marcar notificações como lidas
- [ ] Testar com múltiplos usuários

---

**Última atualização:** 2025-01-02

