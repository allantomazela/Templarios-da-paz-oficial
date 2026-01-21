# 📋 Guia de Aplicação das Migrações Financeiras

Este guia explica como aplicar todas as migrações necessárias para criar a estrutura completa do sistema financeiro.

## 🎯 Objetivo

Criar todas as tabelas, índices, RLS policies, triggers, views e funções necessárias para o módulo financeiro funcionar corretamente com persistência no banco de dados.

## 📦 Arquivos de Migração

As migrações devem ser aplicadas na seguinte ordem:

1. **`20250106000000_create_financial_accounts_table.sql`**
   - Cria tabela de contas bancárias
   - RLS policies para admin/editor
   - Trigger para updated_at

2. **`20250106010000_create_financial_categories_table.sql`**
   - Cria tabela de categorias
   - RLS policies para admin/editor
   - Trigger para updated_at

3. **`20250106020000_create_financial_transactions_table.sql`**
   - Cria tabela de transações (receitas/despesas)
   - RLS policies para admin/editor
   - Triggers para updated_at e validação de data
   - Índices otimizados

4. **`20250106030000_create_financial_budgets_table.sql`**
   - Cria tabela de orçamentos
   - RLS policies para admin/editor
   - Trigger para updated_at
   - Validação de período

5. **`20250106040000_create_financial_goals_table.sql`**
   - Cria tabela de metas financeiras
   - RLS policies para admin/editor
   - Triggers para updated_at e auto-completar metas
   - Validação de valores

6. **`20250106050000_create_financial_audit_log_table.sql`**
   - Cria tabela de auditoria
   - RLS policy apenas para admins
   - Função para criar logs de auditoria

7. **`20250106060000_create_financial_audit_triggers.sql`**
   - Cria triggers de auditoria em todas as tabelas financeiras
   - Registra todas as operações (INSERT, UPDATE, DELETE)

8. **`20250106070000_create_financial_views_and_functions.sql`**
   - Cria views otimizadas para relatórios
   - Cria funções auxiliares para cálculos
   - Otimiza queries comuns

## 🚀 Como Aplicar

### Opção 1: Aplicar Individualmente (Recomendado)

1. Acesse o **Supabase Dashboard** → **SQL Editor**
2. Abra cada arquivo de migração na ordem listada acima
3. Copie o conteúdo completo do arquivo
4. Cole no SQL Editor
5. Clique em **Run** ou pressione `Ctrl+Enter`
6. Verifique se não há erros
7. Repita para o próximo arquivo

### Opção 2: Aplicar Todas de Uma Vez

1. Acesse o **Supabase Dashboard** → **SQL Editor**
2. Abra todos os arquivos de migração
3. Copie o conteúdo de cada um na ordem
4. Cole tudo no SQL Editor (separado por `;`)
5. Execute tudo de uma vez

## ✅ Verificação Pós-Migração

Após aplicar todas as migrações, execute estas queries para verificar:

```sql
-- Verificar se todas as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'financial_%'
ORDER BY table_name;

-- Verificar se os índices foram criados
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'financial_%'
ORDER BY tablename, indexname;

-- Verificar se as views foram criadas
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'financial_%';

-- Verificar se as funções foram criadas
SELECT proname 
FROM pg_proc 
WHERE proname LIKE '%financial%' OR proname LIKE '%account%'
ORDER BY proname;

-- Verificar se os triggers foram criados
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%financial%' OR tgname LIKE '%audit%'
ORDER BY tgname;
```

## 🔒 Verificação de RLS

Verifique se as RLS policies estão ativas:

```sql
-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'financial_%';

-- Verificar policies criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'financial_%'
ORDER BY tablename, policyname;
```

## 📊 Estrutura Criada

### Tabelas

- ✅ `financial_accounts` - Contas bancárias e caixas
- ✅ `financial_categories` - Categorias de transações
- ✅ `financial_transactions` - Receitas e despesas
- ✅ `financial_budgets` - Orçamentos por categoria
- ✅ `financial_goals` - Metas financeiras
- ✅ `financial_audit_log` - Log de auditoria

### Views

- ✅ `financial_account_balances` - Saldos calculados das contas
- ✅ `financial_monthly_summary` - Resumo mensal
- ✅ `financial_category_totals` - Totais por categoria

### Funções

- ✅ `get_account_balance(UUID, DATE)` - Obter saldo de conta
- ✅ `get_period_totals(DATE, DATE)` - Obter totais de período

### Triggers

- ✅ `update_*_updated_at` - Atualiza timestamp em todas as tabelas
- ✅ `validate_transaction_date` - Valida data de transação
- ✅ `auto_complete_financial_goal` - Auto-completa metas
- ✅ `audit_*` - Triggers de auditoria em todas as tabelas

## ⚠️ Problemas Comuns

### Erro: "relation already exists"

Se uma tabela já existe, você pode:
1. Dropar a tabela (CUIDADO: perde dados!)
2. Ou modificar a migração para usar `CREATE TABLE IF NOT EXISTS`

### Erro: "policy already exists"

As migrações usam `DROP POLICY IF EXISTS`, então isso não deve acontecer. Se acontecer, execute:

```sql
DROP POLICY IF EXISTS "nome_da_policy" ON public.nome_da_tabela;
```

### Erro: "function already exists"

As migrações usam `CREATE OR REPLACE FUNCTION`, então isso não deve acontecer.

## 🔄 Próximos Passos

Após aplicar todas as migrações:

1. ✅ Verificar se não há erros
2. ✅ Testar criação de uma conta bancária
3. ✅ Testar criação de uma categoria
4. ✅ Testar criação de uma transação
5. ✅ Verificar se o audit log está funcionando
6. ✅ Prosseguir para Fase 2: Integração com o código

## 📝 Notas Importantes

- **Backup**: Sempre faça backup antes de aplicar migrações em produção
- **Ordem**: A ordem das migrações é importante devido a dependências (foreign keys)
- **RLS**: Todas as tabelas têm RLS habilitado - apenas admin/editor podem acessar
- **Auditoria**: Todas as operações são registradas automaticamente no audit log
- **Validações**: Muitas validações são feitas no banco (constraints, triggers)

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Execute as queries de verificação acima
3. Verifique se todas as dependências foram criadas
4. Consulte a documentação do Supabase sobre RLS e triggers
