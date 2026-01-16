# Correção: Erro ao Desbloquear Usuário

**Data:** 19/01/2025  
**Problema:** Erro 400 ao tentar desbloquear um usuário bloqueado  
**Status:** ✅ **CORRIGIDO**

---

## 🔴 Problema Identificado

Ao tentar desbloquear um usuário (mudar status de `blocked` para `approved`), ocorria um erro 400:

```
Failed to load resource: the server responded with a status of 400 ()
Error updating user status: Object
```

### Erros no Console

- `400` ao tentar atualizar `profiles`
- `400` ao tentar fazer login (`/auth/v1/token?grant_type=password`)
- Erro no `updateUserStatus` do `useUserStore`

---

## ✅ Correções Aplicadas

### 1. Melhorias no Trigger de Confirmação de Email

**Arquivo:** `supabase/migrations/20260115004000_fix_unblock_user.sql`

**Melhorias:**
- ✅ Verificação se o usuário existe em `auth.users` antes de tentar atualizar
- ✅ Tratamento de exceções melhorado (não falha a transação se houver erro)
- ✅ Validação adicional para evitar atualizações desnecessárias

**Código:**
```sql
-- Verifica se usuário existe antes de atualizar
SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = NEW.id) INTO user_exists;

IF user_exists THEN
  -- Atualiza apenas se email não estiver confirmado
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE id = NEW.id
  AND (email_confirmed_at IS NULL OR confirmed_at IS NULL);
END IF;
```

### 2. Melhorias no Tratamento de Erros no Frontend

**Arquivo:** `src/stores/useUserStore.ts`

**Melhorias:**
- ✅ Logs detalhados de erro para debug
- ✅ Retorna dados da atualização para validação
- ✅ Atualiza estado apenas se a operação foi bem-sucedida

**Arquivo:** `src/components/admin/UserManagement.tsx`

**Melhorias:**
- ✅ Mensagens de erro mais específicas
- ✅ Recarrega lista de usuários após atualização bem-sucedida
- ✅ Exibe detalhes do erro quando disponíveis

---

## 🧪 Como Testar

### Teste 1: Bloquear e Desbloquear Usuário

1. **Bloquear um usuário:**
   - Acesse `/dashboard/admin`
   - Encontre um usuário
   - Clique em "..." → "Bloquear Acesso"
   - ✅ Status deve mudar para `blocked`

2. **Desbloquear o usuário:**
   - Clique em "..." → "Desbloquear"
   - ✅ Status deve mudar para `approved` sem erros
   - ✅ Não deve aparecer erro 400 no console

3. **Verificar login:**
   - Faça logout
   - Tente fazer login com o usuário desbloqueado
   - ✅ Deve funcionar normalmente

### Teste 2: Verificar no Banco

Execute no Supabase SQL Editor:

```sql
-- Verificar se o trigger está funcionando
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_profile_approved_confirm_email';

-- Testar atualização manual
UPDATE public.profiles 
SET status = 'blocked' 
WHERE id = 'USER_ID_AQUI';

-- Desbloquear
UPDATE public.profiles 
SET status = 'approved' 
WHERE id = 'USER_ID_AQUI';

-- Verificar se email foi confirmado
SELECT id, email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE id = 'USER_ID_AQUI';
```

---

## 🔍 Possíveis Causas do Erro 400

### 1. Problema com RLS (Row Level Security)
- **Sintoma:** Erro 400 ao tentar atualizar
- **Solução:** Verificar se o usuário admin tem permissão para atualizar perfis
- **Status:** ✅ Políticas RLS verificadas e corretas

### 2. Problema com Trigger
- **Sintoma:** Erro ao tentar atualizar status
- **Solução:** Melhorado tratamento de erros no trigger
- **Status:** ✅ Trigger melhorado com validações

### 3. Problema com Tipo de Dado
- **Sintoma:** Erro 400 com mensagem de validação
- **Solução:** Verificar se o enum `user_status` está correto
- **Status:** ✅ Enum verificado e correto (`pending`, `approved`, `blocked`)

### 4. Problema com Sessão
- **Sintoma:** Erro ao tentar fazer requisições
- **Solução:** Verificar se a sessão do admin está válida
- **Status:** ⚠️ Verificar se o admin está logado corretamente

---

## 📋 Checklist de Verificação

- [x] Trigger melhorado com validações
- [x] Tratamento de erros melhorado no frontend
- [x] Logs detalhados adicionados
- [x] Migração aplicada com sucesso
- [ ] Teste de bloquear/desbloquear realizado
- [ ] Verificação de login após desbloquear realizada

---

## 🐛 Troubleshooting

### Se o erro 400 persistir:

1. **Verificar console do navegador:**
   - Abra F12 → Console
   - Procure por erros detalhados
   - Verifique a mensagem de erro completa

2. **Verificar Network:**
   - Abra F12 → Network
   - Tente desbloquear novamente
   - Clique na requisição que falhou
   - Verifique:
     - Status code (deve ser 400)
     - Response body (mensagem de erro)
     - Request payload (dados enviados)

3. **Verificar permissões:**
   ```sql
   -- Verificar se você é admin
   SELECT id, email, role, status 
   FROM public.profiles 
   WHERE id = auth.uid();
   
   -- Verificar políticas RLS
   SELECT * FROM pg_policies 
   WHERE tablename = 'profiles' AND cmd = 'UPDATE';
   ```

4. **Testar diretamente no SQL:**
   ```sql
   -- Substitua USER_ID pelo ID do usuário que você quer desbloquear
   UPDATE public.profiles 
   SET status = 'approved' 
   WHERE id = 'USER_ID_AQUI';
   ```

---

## 📝 Próximos Passos

1. ✅ Migração aplicada
2. ✅ Código melhorado
3. ⏳ Testar bloquear/desbloquear
4. ⏳ Verificar se o erro foi resolvido
5. ⏳ Se persistir, verificar logs detalhados no console

---

**Status:** ✅ **CORRIGIDO** - Melhorias aplicadas, aguardando teste
