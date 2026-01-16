# Guia de Teste - Edição de Avisos e Notificações

## ✅ Status das Funcionalidades

- ✅ **Criar avisos** - Funcionando
- ✅ **Excluir avisos** - Funcionando
- ⚠️ **Editar avisos** - Implementado, precisa ser testado
- ⚠️ **Notificações** - Implementado, precisa ser testado

---

## 📝 Como Testar a Edição de Avisos

### Passo a Passo:

1. **Acesse o Mural de Avisos**
   - Vá para `/dashboard/secretariat`
   - Clique na aba "Comunicações"
   - Clique em "Mural de Avisos"

2. **Localize um Aviso Existente**
   - Você deve ver os avisos criados anteriormente
   - Cada aviso tem dois botões no canto superior direito:
     - ✏️ **Lápis** (Editar)
     - 🗑️ **Lixeira** (Excluir)

3. **Clique no Botão de Editar (Lápis)**
   - Um diálogo deve abrir com o título "Editar Aviso"
   - Os campos devem estar preenchidos com os dados atuais do aviso

4. **Modifique os Campos**
   - Altere o **Título** (ex: adicione " [EDITADO]" no final)
   - Altere o **Conteúdo** (ex: adicione uma linha no final)

5. **Salve as Alterações**
   - Clique no botão **"Salvar Publicação"**
   - Você deve ver uma mensagem de sucesso: "Aviso atualizado com sucesso."
   - O diálogo deve fechar automaticamente
   - O aviso na lista deve ser atualizado com as novas informações

### ⚠️ Possíveis Problemas:

- **Se o botão de editar não aparecer:**
  - Verifique se você está logado como Admin ou Editor
  - Apenas usuários com permissão de staff podem editar avisos

- **Se o diálogo não abrir:**
  - Verifique o console do navegador (F12) para erros
  - Recarregue a página e tente novamente

- **Se as alterações não salvarem:**
  - Verifique se há mensagens de erro no console
  - Verifique se você tem permissão para editar (RLS policy)

---

## 🔔 Como Testar as Notificações

### O que foi implementado:

Quando um **novo aviso** é publicado, o sistema automaticamente:
- Cria uma notificação para **todos os usuários aprovados**
- **Exceto** o autor do aviso (ele não recebe notificação do próprio aviso)
- A notificação contém:
  - **Título:** "Novo Aviso no Mural"
  - **Mensagem:** "Um novo aviso foi publicado: [Título do Aviso]"
  - **Link:** `/dashboard/secretariat` (leva para a Secretaria)

### Passo a Passo para Testar:

#### Teste 1: Criar um Novo Aviso e Verificar Notificações

1. **Faça login com uma conta de Admin/Editor**
   - Exemplo: `allantomazela@gmail.com` (Admin)

2. **Crie um novo aviso**
   - Vá para Secretaria → Comunicações → Mural de Avisos
   - Clique em "Criar Novo Aviso"
   - Preencha título e conteúdo
   - Clique em "Salvar Publicação"

3. **Verifique no Banco de Dados (via Supabase Dashboard)**
   - Acesse: https://supabase.com/dashboard/project/hxncevpbwcearzxrstzj
   - Vá para "Table Editor" → `notifications`
   - Você deve ver novas notificações criadas para todos os usuários aprovados
   - **Exceto** o autor do aviso

#### Teste 2: Verificar Notificações na Interface

1. **Faça login com outra conta (não o autor do aviso)**
   - Exemplo: `teste@templarios.com` (Membro)

2. **Verifique as Notificações**
   - As notificações devem aparecer no banner de notificações (canto superior direito)
   - Ou acesse diretamente a área de notificações
   - Você deve ver a notificação: "Novo Aviso no Mural: [Título]"

3. **Clique na Notificação**
   - Deve redirecionar para `/dashboard/secretariat`
   - O aviso deve estar visível na lista

#### Teste 3: Verificar que o Autor NÃO Recebe Notificação

1. **Faça login com a conta que criou o aviso**
   - Exemplo: `allantomazela@gmail.com` (Admin)

2. **Verifique as Notificações**
   - Você **NÃO** deve ver uma notificação sobre o aviso que você mesmo criou
   - Isso é esperado e está correto

---

## 🔍 Verificação Técnica

### Como Verificar se o Trigger Está Funcionando:

1. **Via Supabase SQL Editor:**
   ```sql
   -- Verificar se a função existe
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'notify_users_on_announcement';
   
   -- Verificar se o trigger existe
   SELECT tgname, tgrelid::regclass 
   FROM pg_trigger 
   WHERE tgname = 'on_announcement_notify_users';
   ```

2. **Testar Manualmente:**
   ```sql
   -- Criar um aviso de teste
   INSERT INTO public.announcements (title, content, author_id, author_name)
   VALUES ('Teste de Notificação', 'Este é um teste', 
           (SELECT id FROM profiles WHERE email = 'allantomazela@gmail.com'),
           'Allan Tomazela');
   
   -- Verificar se as notificações foram criadas
   SELECT * FROM public.notifications 
   WHERE title = 'Novo Aviso no Mural' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

---

## 📊 Checklist de Teste

### Edição de Avisos:
- [ ] Botão de editar (lápis) aparece nos avisos
- [ ] Diálogo de edição abre corretamente
- [ ] Campos são preenchidos com dados atuais
- [ ] Alterações são salvas com sucesso
- [ ] Mensagem de sucesso aparece
- [ ] Lista é atualizada após salvar
- [ ] Aviso editado mantém autor e data original

### Notificações:
- [ ] Notificações são criadas ao publicar novo aviso
- [ ] Todos os usuários aprovados recebem notificação
- [ ] Autor do aviso NÃO recebe notificação
- [ ] Notificações aparecem na interface
- [ ] Link da notificação redireciona corretamente
- [ ] Notificações podem ser marcadas como lidas

---

## 🐛 Troubleshooting

### Se as Notificações Não Estiverem Sendo Criadas:

1. **Verifique se a migração foi aplicada:**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations 
   WHERE name = '20260115002000_notify_on_announcement';
   ```

2. **Verifique se o trigger está ativo:**
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgname = 'on_announcement_notify_users';
   ```

3. **Teste a função manualmente:**
   ```sql
   -- Simular um INSERT
   SELECT public.notify_users_on_announcement();
   ```

### Se a Edição Não Estiver Funcionando:

1. **Verifique as permissões RLS:**
   - Apenas Admin e Editor podem editar
   - Verifique se o usuário tem a role correta

2. **Verifique o console do navegador:**
   - Abra F12 → Console
   - Procure por erros ao clicar em editar

3. **Verifique a rede:**
   - Abra F12 → Network
   - Tente editar um aviso
   - Verifique se a requisição PATCH está sendo feita
   - Verifique o status da resposta

---

## ✅ Resultado Esperado

Após seguir este guia, você deve conseguir:

1. ✅ **Editar avisos** clicando no botão de lápis
2. ✅ **Ver notificações** quando um novo aviso é publicado
3. ✅ **Confirmar** que o autor não recebe notificação do próprio aviso

---

**Última atualização:** 19/01/2025  
**Status da Migração:** ✅ Aplicada com sucesso
