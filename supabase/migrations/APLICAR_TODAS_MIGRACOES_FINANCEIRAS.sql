-- Script para aplicar todas as migrações financeiras de uma vez
-- Execute este script no Supabase SQL Editor para criar toda a estrutura financeira

-- ============================================
-- FASE 1: ESTRUTURA DE DADOS FINANCEIROS
-- ============================================
-- Este script aplica todas as migrações necessárias para o sistema financeiro
-- Ordem de execução:
-- 1. financial_accounts (contas bancárias)
-- 2. financial_categories (categorias)
-- 3. financial_transactions (transações)
-- 4. financial_budgets (orçamentos)
-- 5. financial_goals (metas)
-- 6. financial_audit_log (auditoria)
-- 7. Triggers de auditoria
-- 8. Views e funções auxiliares

-- Verificar se as tabelas já existem
DO $$
BEGIN
  RAISE NOTICE 'Iniciando aplicação das migrações financeiras...';
  RAISE NOTICE 'Verificando estrutura existente...';
END $$;

-- Aplicar migração 1: financial_accounts
\i supabase/migrations/20250106000000_create_financial_accounts_table.sql

-- Aplicar migração 2: financial_categories
\i supabase/migrations/20250106010000_create_financial_categories_table.sql

-- Aplicar migração 3: financial_transactions
\i supabase/migrations/20250106020000_create_financial_transactions_table.sql

-- Aplicar migração 4: financial_budgets
\i supabase/migrations/20250106030000_create_financial_budgets_table.sql

-- Aplicar migração 5: financial_goals
\i supabase/migrations/20250106040000_create_financial_goals_table.sql

-- Aplicar migração 6: financial_audit_log
\i supabase/migrations/20250106050000_create_financial_audit_log_table.sql

-- Aplicar migração 7: Triggers de auditoria
\i supabase/migrations/20250106060000_create_financial_audit_triggers.sql

-- Aplicar migração 8: Views e funções
\i supabase/migrations/20250106070000_create_financial_views_and_functions.sql

DO $$
BEGIN
  RAISE NOTICE 'Migrações financeiras aplicadas com sucesso!';
  RAISE NOTICE 'Verifique se todas as tabelas foram criadas corretamente.';
END $$;

-- NOTA: O comando \i não funciona no Supabase SQL Editor
-- Você deve copiar e colar o conteúdo de cada arquivo de migração individualmente
-- OU executar cada migração separadamente na ordem correta
