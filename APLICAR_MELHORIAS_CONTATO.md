# 📋 Guia: Aplicar Melhorias no Sistema de Contato

## 🎯 Funcionalidades Implementadas

### 1. ✅ Notificações Automáticas
- Admins e editores recebem notificação quando nova mensagem chega
- Notificação aparece no sistema e pode ser clicada para ir direto à mensagem

### 2. ✅ Exportação de Mensagens
- Exportar para CSV (Excel)
- Exportar para PDF (impressão)

### 3. ✅ Resposta Direta pelo Sistema
- Responder mensagens sem abrir cliente de email
- Resposta salva no banco de dados
- Email enviado automaticamente (se configurado)

### 4. ✅ Tags/Categorias
- Organizar mensagens por categoria
- Categorias disponíveis: Dúvida, Sugestão, Reclamação, Elogio, Solicitação, Outro
- Filtrar mensagens por categoria

## 🚀 Como Aplicar as Migrações

### Migração 1: Notificações

**Arquivo:** `supabase/migrations/20250105010000_notify_on_contact_message.sql`

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo da migração
4. Copie e execute o conteúdo

**O que faz:**
- Cria função que notifica admins/editores quando nova mensagem chega
- Cria trigger que executa automaticamente

### Migração 2: Campos Adicionais

**Arquivo:** `supabase/migrations/20250105020000_add_contact_message_features.sql`

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo da migração
4. Copie e execute o conteúdo

**O que faz:**
- Adiciona campo `category` (categoria/tag)
- Adiciona campo `reply_text` (texto da resposta)
- Adiciona campo `replied_at` (data da resposta)
- Adiciona campo `replied_by` (quem respondeu)
- Cria índices para melhorar performance

## 📝 Como Usar as Funcionalidades

### 1. Notificações

**Automático:** Quando alguém envia uma mensagem pelo formulário do site, todos os admins e editores recebem uma notificação.

**Ver notificações:**
- Clique no ícone de sino no header
- As notificações aparecem no topo da tela
- Clique na notificação para ir direto à mensagem

### 2. Exportar Mensagens

**Exportar CSV:**
1. Acesse: Dashboard > Secretaria > Comunicações > Mensagens do Site
2. Aplique filtros se necessário (status, categoria, busca)
3. Clique em **"Exportar"** > **"Exportar CSV"**
4. O arquivo será baixado automaticamente

**Exportar PDF:**
1. Acesse: Dashboard > Secretaria > Comunicações > Mensagens do Site
2. Aplique filtros se necessário
3. Clique em **"Exportar"** > **"Exportar PDF"**
4. A janela de impressão será aberta
5. Escolha "Salvar como PDF" na impressora

### 3. Responder Diretamente

**Como responder:**
1. Abra uma mensagem (clique no ícone de olho)
2. Clique em **"Responder Diretamente"**
3. Digite sua resposta no campo
4. Clique em **"Enviar Resposta"**
5. A resposta será salva e um email será enviado (se configurado)

**Editar resposta:**
- Se a mensagem já tiver resposta, o botão muda para "Editar Resposta"
- Você pode atualizar a resposta existente

### 4. Categorias/Tags

**Adicionar categoria:**
1. Abra uma mensagem
2. Clique em **"Adicionar Categoria"** ou **"Alterar Categoria"**
3. Selecione uma categoria
4. Clique em **"Salvar"**

**Categorias disponíveis:**
- Dúvida
- Sugestão
- Reclamação
- Elogio
- Solicitação
- Outro
- Sem categoria

**Filtrar por categoria:**
- Use o dropdown "Categoria" nos filtros
- Selecione a categoria desejada
- A tabela será filtrada automaticamente

## 🔧 Configuração de Email (Opcional)

Para habilitar o envio real de emails:

### Opção 1: Resend

1. Crie conta em [resend.com](https://resend.com)
2. Obtenha API Key
3. Configure no Supabase:
   ```bash
   supabase secrets set RESEND_API_KEY=sua_chave_aqui
   ```
4. Descomente o código em `supabase/functions/send-contact-reply/index.ts`
5. Faça deploy:
   ```bash
   supabase functions deploy send-contact-reply
   ```

### Opção 2: SendGrid

1. Crie conta em [sendgrid.com](https://sendgrid.com)
2. Implemente a integração no código da Edge Function
3. Configure API Key como secret
4. Faça deploy

## 📊 Estrutura de Dados Atualizada

### Tabela: `contact_messages`

```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  category TEXT,                    -- NOVO
  reply_text TEXT,                  -- NOVO
  replied_at TIMESTAMP,             -- NOVO
  replied_by UUID,                  -- NOVO
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## ✅ Verificação Pós-Migração

Execute estas queries para verificar:

```sql
-- Verificar se os campos foram adicionados
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'contact_messages' 
AND column_name IN ('category', 'reply_text', 'replied_at', 'replied_by');

-- Verificar se a função de notificação existe
SELECT proname 
FROM pg_proc 
WHERE proname = 'notify_admins_on_contact_message';

-- Verificar se o trigger existe
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'on_contact_message_notify_admins';
```

## 🧪 Testes

### Teste 1: Notificações
1. Envie uma mensagem pelo formulário do site (sem estar logado)
2. Faça login como admin/editor
3. Verifique se aparece notificação no sino
4. Clique na notificação
5. Deve ir direto para a mensagem

### Teste 2: Exportação
1. Acesse Mensagens do Site
2. Exporte para CSV
3. Abra o arquivo no Excel
4. Verifique se todos os dados estão corretos
5. Exporte para PDF
6. Verifique se a formatação está correta

### Teste 3: Resposta Direta
1. Abra uma mensagem
2. Clique em "Responder Diretamente"
3. Digite uma resposta
4. Envie
5. Verifique se a resposta aparece na mensagem
6. Verifique se o status mudou para "Respondida"

### Teste 4: Categorias
1. Abra uma mensagem
2. Adicione uma categoria
3. Feche o dialog
4. Verifique se a categoria aparece na tabela
5. Use o filtro de categoria
6. Verifique se a mensagem aparece

## 📝 Notas Importantes

- **Notificações:** Funcionam automaticamente após aplicar a migração
- **Exportação:** Exporta apenas as mensagens filtradas/visíveis
- **Resposta:** Salva no banco mesmo se o email falhar
- **Categorias:** Podem ser alteradas a qualquer momento
- **RLS:** Apenas admins/editores podem ver e gerenciar mensagens

## 🆘 Troubleshooting

### Notificações não aparecem
- Verifique se a migração foi aplicada
- Verifique se o usuário é admin/editor
- Verifique se o status do perfil é 'approved'

### Exportação não funciona
- Verifique se há mensagens para exportar
- Verifique o console do navegador para erros
- Tente exportar uma quantidade menor de mensagens

### Resposta não salva
- Verifique se está logado
- Verifique se tem permissão (admin/editor)
- Verifique o console para erros

### Categoria não salva
- Verifique se a migração foi aplicada
- Verifique se o campo `category` existe na tabela
- Verifique o console para erros

## 🎉 Pronto!

Todas as funcionalidades estão implementadas e prontas para uso. Aplique as migrações e comece a usar!
