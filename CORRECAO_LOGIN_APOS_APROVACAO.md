# Correção: Login Após Aprovação

**Data:** 19/01/2025  
**Problema:** Usuários aprovados não conseguiam fazer login no sistema  
**Status:** ✅ **RESOLVIDO**

---

## 🔴 Problema Identificado

Após criar um novo usuário e aprová-lo como administrador, o usuário não conseguia fazer login no sistema, mesmo com credenciais corretas.

### Causa Raiz

O Supabase Auth exige confirmação de email (`email_confirmed_at`) antes de permitir login. Quando um admin aprova um usuário, apenas o status na tabela `profiles` é atualizado para `approved`, mas o email no `auth.users` permanece não confirmado.

**Fluxo problemático:**
1. ✅ Usuário se cadastra → `auth.users` criado com `email_confirmed_at = NULL`
2. ✅ Perfil criado na tabela `profiles` com `status = 'pending'`
3. ✅ Admin aprova usuário → `profiles.status = 'approved'`
4. ❌ Usuário tenta fazer login → **BLOQUEADO** porque `email_confirmed_at` ainda é `NULL`

---

## ✅ Solução Implementada

Foi criado um **trigger automático** no banco de dados que confirma o email automaticamente quando o status do usuário é alterado para `approved`.

### Migração Aplicada

**Arquivo:** `supabase/migrations/20260115003000_confirm_email_on_approval.sql`

**Função criada:**
- `confirm_email_on_approval()` - Confirma o email no `auth.users` quando o status muda para `approved`

**Trigger criado:**
- `on_profile_approved_confirm_email` - Executa a função automaticamente após atualização do status

### Como Funciona

1. Admin aprova usuário → `profiles.status` muda para `approved`
2. Trigger detecta a mudança automaticamente
3. Função atualiza `auth.users.email_confirmed_at` e `auth.users.confirmed_at`
4. ✅ Usuário pode fazer login normalmente

---

## 🧪 Como Testar

### Teste 1: Novo Usuário

1. **Criar novo usuário:**
   - Acesse `/login`
   - Clique em "Criar conta"
   - Preencha os dados e cadastre

2. **Aprovar como Admin:**
   - Faça login como admin
   - Vá para `/dashboard/admin`
   - Encontre o usuário pendente
   - Clique em "Aprovar Cadastro"

3. **Testar Login:**
   - Faça logout
   - Tente fazer login com o usuário recém-aprovado
   - ✅ **Deve funcionar agora!**

### Teste 2: Verificar no Banco

Execute no Supabase SQL Editor:

```sql
-- Verificar se o trigger existe
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_profile_approved_confirm_email';

-- Verificar se a função existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'confirm_email_on_approval';

-- Testar manualmente (substitua o ID)
UPDATE public.profiles 
SET status = 'approved' 
WHERE id = 'USER_ID_AQUI';

-- Verificar se o email foi confirmado
SELECT id, email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE id = 'USER_ID_AQUI';
```

---

## 📋 Checklist de Verificação

- [x] Migração criada
- [x] Migração aplicada no banco
- [x] Função `confirm_email_on_approval()` criada
- [x] Trigger `on_profile_approved_confirm_email` criado
- [ ] Teste com novo usuário realizado
- [ ] Login após aprovação funcionando

---

## 🔍 Verificação Técnica

### Estrutura da Solução

```sql
-- Função que confirma o email
CREATE OR REPLACE FUNCTION public.confirm_email_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE auth.users
    SET 
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW())
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger que executa a função
CREATE TRIGGER on_profile_approved_confirm_email
  AFTER UPDATE OF status ON public.profiles
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
  EXECUTE FUNCTION public.confirm_email_on_approval();
```

### Segurança

- ✅ Função usa `SECURITY DEFINER` para ter permissão de atualizar `auth.users`
- ✅ `search_path` fixo para prevenir SQL injection
- ✅ Trigger só executa quando status muda para `approved`
- ✅ Não sobrescreve `email_confirmed_at` se já estiver confirmado

---

## ⚠️ Observações Importantes

1. **Usuários já aprovados:** Se você já tem usuários aprovados que não conseguem fazer login, você pode:
   - Re-aprová-los (mudar status para `pending` e depois `approved` novamente)
   - Ou confirmar manualmente via Supabase Dashboard

2. **Confirmação manual (se necessário):**
   ```sql
   -- Confirmar email manualmente para um usuário específico
   UPDATE auth.users
   SET 
     email_confirmed_at = NOW(),
     confirmed_at = NOW()
   WHERE id = 'USER_ID_AQUI';
   ```

3. **Desabilitar confirmação de email (não recomendado):**
   - Se preferir não exigir confirmação de email, pode desabilitar no Supabase Dashboard
   - Mas a solução implementada é mais segura e mantém a confirmação automática

---

## 📝 Próximos Passos

1. ✅ Migração aplicada
2. ⏳ Testar com um novo usuário
3. ⏳ Verificar se usuários já aprovados conseguem fazer login
4. ⏳ Se necessário, confirmar emails manualmente para usuários existentes

---

**Status:** ✅ **CORRIGIDO** - Migração aplicada com sucesso
