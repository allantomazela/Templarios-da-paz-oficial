# Relatório de Verificação de Integridade do Banco de Dados
## Projeto: Templários Oficial

**Data da Verificação:** 22/12/2025

---

## ✅ Atualização de Status (15/01/2026)

Com base nas credenciais fornecidas e no relatório `VERIFICACAO_INTEGRIDADE_COMPLETA.md`, o projeto ativo é:

- **Project ID:** `hxncevpbwcearzxrstzj`
- **URL:** `https://hxncevpbwcearzxrstzj.supabase.co`
- **Status esperado:** tabelas principais presentes, migrações aplicadas e bucket `site-assets` configurado

Observação: este documento permanece como histórico da verificação anterior.

---

## 🔍 Resumo Executivo

**Status Geral:** ⚠️ **ATENÇÃO NECESSÁRIA**

Nenhum dos projetos Supabase disponíveis na conta atual possui as tabelas necessárias para o sistema "Templários da Paz". As migrações ainda não foram aplicadas.

---

## 📊 Projetos Verificados

### 1. Projeto: SOSREPLAY (nnqcwcfgowdioypbysht)
- **Status:** ❌ Não compatível
- **Tabelas Encontradas:** 
  - `profiles` (estrutura diferente - roles: agent, coordinator, client)
  - `clients`, `tickets`, `technicians`
  - `knowledge_articles`, `knowledge_categories`
  - `audit_logs` (estrutura diferente)
  - `system_logs`, `performance_metrics`
- **Tabelas Necessárias Faltando:** 
  - ❌ `site_settings`
  - ❌ `venerables`
  - ❌ `news_events`
  - ❌ `minutes`
  - ❌ `minutes_signatures`
  - ❌ `push_subscriptions`
  - ❌ `notifications`
  - ❌ `redirects`
- **Migrações Aplicadas:** 3 migrações (sistema diferente)
- **Conclusão:** Este é um projeto de outro sistema (SOSREPLAY)

### 2. Projeto: hometomazela@gmail.com's Project (pdjiimzpswmeqvixcmfj)
- **Status:** ❌ Não compatível
- **Tabelas Encontradas:**
  - `profiles` (estrutura diferente - user_type: mestre, aluno, responsavel)
  - `students`, `classes`, `attendance`
  - `graduations`, `messages`, `payments`
  - `events`, `polos`, `training_sessions`
  - `financial_transactions`, `financial_categories`
  - `user_settings`
- **Tabelas Necessárias Faltando:**
  - ❌ `site_settings`
  - ❌ `venerables`
  - ❌ `news_events`
  - ❌ `minutes`
  - ❌ `minutes_signatures`
  - ❌ `push_subscriptions`
  - ❌ `notifications`
  - ❌ `redirects`
- **Migrações Aplicadas:** 20 migrações (sistema de academia/taekwondo)
- **Conclusão:** Este é um projeto de sistema de academia/taekwondo

---

## ✅ Tabelas Necessárias para o Sistema

O sistema "Templários da Paz" requer as seguintes tabelas:

1. ✅ `site_settings` - Configurações do site (logo, cores, textos, contato)
2. ✅ `venerables` - Lista de veneráveis da loja
3. ✅ `news_events` - Notícias e eventos
4. ✅ `profiles` - Perfis de usuários (com roles: admin, editor, member)
5. ✅ `minutes` - Atas das reuniões
6. ✅ `minutes_signatures` - Assinaturas das atas
7. ✅ `push_subscriptions` - Assinaturas de notificações push
8. ✅ `notifications` - Notificações do sistema
9. ✅ `audit_logs` - Logs de auditoria (estrutura específica)
10. ✅ `redirects` - Redirecionamentos de URL

---

## 🔐 Verificações de Segurança

### Projeto SOSREPLAY
- ⚠️ **RLS sem políticas:** 3 tabelas (kb_subscriptions, knowledge_articles, knowledge_categories)
- ⚠️ **Funções sem search_path:** 2 funções (update_updated_at_column, handle_new_user)
- ⚠️ **Proteção de senha vazada:** Desabilitada

### Projeto hometomazela@gmail.com's Project
- ⚠️ **Proteção de senha vazada:** Desabilitada

---

## 📋 Migrações Necessárias

O sistema possui **19 migrações** que precisam ser aplicadas na ordem:

1. `20251218203000_create_site_settings_and_venerables.sql`
2. `20251219100000_news_events_and_settings.sql`
3. `20251219120000_update_primary_color.sql`
4. `20251220140001_create_storage_bucket_fixed.sql`
5. `20251221100000_fix_storage_policies.sql`
6. `20251221200000_fix_audit_notification_policies.sql`
7. `20251222100000_create_profiles_and_rbac.sql`
8. `20251223120000_enhanced_user_profiles.sql`
9. `20251224100000_master_admin_security.sql`
10. `20251226180000_fix_master_admin_and_permissions.sql`
11. `20251227100000_audit_admin_permissions.sql`
12. `20251227120000_ensure_master_admin.sql`
13. `20251227130000_fix_rls_policies.sql`
14. `20251228100000_create_push_and_minutes_tables.sql`
15. `20251229100000_add_theme_settings.sql`
16. `20251230100000_add_category_to_news.sql`
17. `20251231100000_audit_and_notifications.sql`
18. `20251231150000_add_seo_and_favicon.sql`
19. `20251231160000_create_redirects_table.sql`

---

## 🗄️ Storage Buckets Necessários

- ❌ `site-assets` - Bucket para upload de imagens (logo, favicon, mídia)

---

## 🎯 Recomendações

### Opção 1: Criar Novo Projeto (RECOMENDADO)
1. Criar um novo projeto Supabase chamado "Templários Oficial"
2. Aplicar todas as 19 migrações na ordem
3. Configurar o bucket `site-assets`
4. Atualizar o arquivo `.env` com as novas credenciais

### Opção 2: Usar Projeto Existente (NÃO RECOMENDADO)
1. Escolher um dos projetos existentes
2. **CUIDADO:** Isso pode conflitar com dados existentes
3. Aplicar as migrações (pode causar conflitos)
4. Verificar e resolver conflitos

### Opção 3: Verificar se Projeto Existe em Outra Organização
1. Verificar se o projeto "Templários Oficial" está em outra organização
2. Se sim, usar esse projeto
3. Se não, seguir Opção 1

---

## ⚠️ Ações Imediatas Necessárias

1. **Identificar o projeto correto** - Verificar se "Templários Oficial" existe em outra organização
2. **Aplicar migrações** - Todas as 19 migrações precisam ser aplicadas
3. **Configurar storage** - Criar bucket `site-assets`
4. **Verificar .env** - Confirmar que as credenciais estão corretas
5. **Testar conexão** - Verificar se a aplicação consegue conectar ao banco

---

## 📝 Próximos Passos

1. Confirmar qual projeto Supabase está configurado no arquivo `.env`
2. Se o projeto não existir, criar um novo projeto "Templários Oficial"
3. Aplicar todas as 19 migrações na ordem correta
4. Configurar o bucket de storage `site-assets`
5. Verificar se o usuário master admin (`allantomazela@gmail.com`) existe
6. Testar a aplicação (`npm start`)

---

## 🔗 Arquivos de Referência

- Migrações: `supabase/migrations/`
- Configuração: `.env`
- Cliente Supabase: `src/lib/supabase/client.ts`
- Tipos: `src/lib/supabase/types.ts`

