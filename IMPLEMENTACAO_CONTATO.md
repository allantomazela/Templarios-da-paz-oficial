# Implementação: Sistema de Contato e Mensagens

## Resumo

Foi implementado um sistema completo para gerenciar informações de contato e receber mensagens através do formulário do site.

## O que foi implementado

### 1. Banco de Dados

#### Migração: `20250105000000_add_contact_fields.sql`

- **Novos campos em `site_settings`:**
  - `contact_phone` - Telefone de contato exibido no site
  - `contact_message_email` - Email que receberá as mensagens do formulário

- **Nova tabela `contact_messages`:**
  - Armazena todas as mensagens enviadas pelo formulário
  - Campos: `id`, `name`, `email`, `message`, `status`, `created_at`, `updated_at`
  - Status: `new`, `read`, `replied`, `archived`
  - RLS configurado: público pode inserir, apenas admins/editores podem visualizar/atualizar

### 2. Store (Zustand)

**Arquivo:** `src/stores/useSiteSettingsStore.ts`

- Adicionados campos `phone` e `messageEmail` na interface `contact`
- Atualizado `mapSettingsFromDB` para incluir os novos campos
- Atualizado `updateContact` para salvar os novos campos

### 3. Configurações Institucionais

**Arquivo:** `src/components/settings/InstitutionalSettings.tsx`

- Adicionados campos no formulário:
  - **Telefone de Contato** - Campo opcional para telefone
  - **Email para Receber Mensagens** - Campo opcional para email de destino
- Validação com Zod
- Sincronização com o store

### 4. Seção de Contato do Site

**Arquivo:** `src/components/home/ContactSection.tsx`

- **Exibição:**
  - Endereço (já existia)
  - Telefone (novo - exibido se configurado)
  - Email (já existia)

- **Formulário funcional:**
  - Validação com React Hook Form + Zod
  - Campos: Nome, Email, Mensagem
  - Salva mensagem no banco de dados (`contact_messages`)
  - Tenta enviar email via Edge Function (opcional)
  - Feedback visual com toast notifications
  - Estado de loading durante envio

### 5. Edge Function para Email

**Arquivo:** `supabase/functions/send-contact-email/index.ts`

- Função preparada para integração com serviços de email
- Suporte para Resend (comentado, pronto para uso)
- Estrutura para outros serviços (SendGrid, SMTP próprio)
- Atualmente retorna sucesso (mensagem já salva no banco)

## Como usar

### 1. Aplicar Migração

```bash
# Via Supabase CLI
supabase migration up

# Ou via Dashboard do Supabase
# Execute o arquivo: supabase/migrations/20250105000000_add_contact_fields.sql
```

### 2. Configurar Informações de Contato

1. Acesse: **Dashboard > Configurações do Site > Institucional**
2. Vá para a aba **"Contato"**
3. Preencha:
   - **Telefone de Contato** (opcional) - Será exibido no site
   - **Email para Receber Mensagens** (opcional) - Receberá as mensagens do formulário
4. Clique em **"Salvar Todas as Configurações"**

### 3. Visualizar Mensagens Recebidas

As mensagens são salvas na tabela `contact_messages` no banco de dados.

**Para visualizar via SQL:**
```sql
SELECT * FROM contact_messages 
ORDER BY created_at DESC;
```

**Para criar uma interface de visualização (futuro):**
- Criar componente `ContactMessagesList.tsx` na secretaria
- Listar mensagens com filtros por status
- Permitir marcar como lida/respondida/arquivada

### 4. Configurar Envio de Emails (Opcional)

Para habilitar o envio real de emails:

#### Opção A: Resend (Recomendado)

1. Crie conta em [resend.com](https://resend.com)
2. Obtenha API Key
3. Configure no Supabase:
   ```bash
   supabase secrets set RESEND_API_KEY=sua_chave_aqui
   ```
4. Descomente o código da Opção 1 em `supabase/functions/send-contact-email/index.ts`
5. Faça deploy:
   ```bash
   supabase functions deploy send-contact-email
   ```

#### Opção B: SendGrid

1. Crie conta em [sendgrid.com](https://sendgrid.com)
2. Implemente a integração no código da Edge Function
3. Configure API Key como secret
4. Faça deploy

## Estrutura de Dados

### Tabela: `contact_messages`

```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Campos em `site_settings`

```sql
contact_phone TEXT,
contact_message_email TEXT
```

## Próximos Passos Sugeridos

1. **Interface de Gerenciamento de Mensagens:**
   - Criar página na secretaria para visualizar mensagens
   - Filtros por status
   - Marcar como lida/respondida
   - Responder diretamente pelo sistema

2. **Notificações:**
   - Notificar admins/editores quando nova mensagem chegar
   - Email de confirmação para quem enviou a mensagem

3. **Melhorias no Formulário:**
   - Campo de assunto
   - Upload de anexos (opcional)
   - CAPTCHA para prevenir spam

4. **Relatórios:**
   - Estatísticas de mensagens recebidas
   - Tempo médio de resposta
   - Mensagens por período

## Notas Importantes

- As mensagens são **sempre salvas no banco**, mesmo se o email falhar
- O email é **opcional** - o sistema funciona sem ele
- A Edge Function de email precisa ser configurada para envio real
- RLS está configurado: apenas admins/editores podem ver mensagens

## Testando

1. Acesse a página inicial do site
2. Role até a seção "Entre em Contato"
3. Preencha o formulário
4. Envie a mensagem
5. Verifique no banco de dados se a mensagem foi salva:
   ```sql
   SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 1;
   ```
