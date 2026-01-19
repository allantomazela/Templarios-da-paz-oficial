# 📋 Guia: Aplicar Migração de Contato

## 🎯 Objetivo

Aplicar a migração que adiciona:
- Campos `contact_phone` e `contact_message_email` na tabela `site_settings`
- Tabela `contact_messages` para armazenar mensagens do formulário

## 🚀 Como Aplicar

### Método 1: Script Automático (Recomendado)

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://app.supabase.com
   - Selecione o projeto: `hxncevpbwcearzxrstzj`

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **SQL Editor**
   - Clique em **New Query**

3. **Execute o Script:**
   - Abra o arquivo: `supabase/migrations/VERIFICAR_E_APLICAR_CONTACT_FIELDS.sql`
   - Copie **TODO** o conteúdo
   - Cole no SQL Editor
   - Clique em **Run** (ou pressione `Ctrl+Enter`)

4. **Verifique o Resultado:**
   - O script mostrará mensagens de status
   - Procure por: `✅ SUCESSO! Migração aplicada com sucesso!`

### Método 2: Migração Original

Se preferir usar a migração original:

1. Abra: `supabase/migrations/20250105000000_add_contact_fields.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute

## ✅ Verificação Manual

Após aplicar, execute estas queries para verificar:

### 1. Verificar Campos em site_settings

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND column_name IN ('contact_phone', 'contact_message_email');
```

**Resultado esperado:** 2 linhas (contact_phone e contact_message_email)

### 2. Verificar Tabela contact_messages

```sql
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'contact_messages';
```

**Resultado esperado:** 1 linha com `contact_messages`

### 3. Verificar Estrutura da Tabela

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contact_messages'
ORDER BY ordinal_position;
```

**Resultado esperado:** 7 colunas:
- id (uuid)
- name (text)
- email (text)
- message (text)
- status (text)
- created_at (timestamp)
- updated_at (timestamp)

### 4. Verificar Políticas RLS

```sql
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'contact_messages';
```

**Resultado esperado:** 3 políticas:
- Allow public insert to contact_messages
- Admins and Editors can view contact messages
- Admins and Editors can update contact messages

### 5. Teste de Inserção (Opcional)

```sql
-- Testar inserção (qualquer pessoa pode inserir)
INSERT INTO public.contact_messages (name, email, message)
VALUES ('Teste', 'teste@example.com', 'Mensagem de teste')
RETURNING *;

-- Verificar se foi inserido
SELECT * FROM public.contact_messages WHERE email = 'teste@example.com';

-- Limpar teste
DELETE FROM public.contact_messages WHERE email = 'teste@example.com';
```

## 🔍 Troubleshooting

### Erro: "relation does not exist"
- **Causa:** Tabela `site_settings` não existe
- **Solução:** Aplique as migrações anteriores primeiro

### Erro: "permission denied"
- **Causa:** Sem permissões suficientes
- **Solução:** Use uma conta com permissões de administrador no Supabase

### Erro: "policy already exists"
- **Causa:** Política RLS já existe
- **Solução:** O script usa `DROP POLICY IF EXISTS`, então isso não deve acontecer. Se acontecer, ignore o erro.

### Erro: "column already exists"
- **Causa:** Campos já foram adicionados
- **Solução:** O script usa `IF NOT EXISTS`, então isso não deve acontecer. Se acontecer, significa que a migração já foi aplicada parcialmente.

## 📊 Status Esperado Após Aplicação

✅ **Tabela `contact_messages` criada**
- 7 colunas
- 3 índices
- 3 políticas RLS
- 1 trigger

✅ **Campos adicionados em `site_settings`**
- `contact_phone` (TEXT, nullable)
- `contact_message_email` (TEXT, nullable)

## 🧪 Teste no Frontend

Após aplicar a migração:

1. Acesse a página inicial do site
2. Role até a seção "Entre em Contato"
3. Preencha o formulário
4. Envie a mensagem
5. Verifique se não há erro 404
6. Verifique no banco se a mensagem foi salva:

```sql
SELECT * FROM public.contact_messages ORDER BY created_at DESC LIMIT 5;
```

## 📝 Notas

- O script é **idempotente** (pode ser executado múltiplas vezes sem problemas)
- Usa `IF NOT EXISTS` para evitar erros se já existir
- Remove e recria políticas para garantir consistência
- Mostra mensagens de status durante a execução

## 🆘 Precisa de Ajuda?

Se encontrar algum problema:

1. Verifique os logs no SQL Editor
2. Execute as queries de verificação manual
3. Verifique se todas as migrações anteriores foram aplicadas
4. Consulte a documentação do Supabase: https://supabase.com/docs
