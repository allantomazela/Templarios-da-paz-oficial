-- Validação rápida: Contas a pagar (rode no SQL Editor do Supabase)

-- 1) Tabela e colunas principais
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'financial_payables'
ORDER BY ordinal_position;

-- 2) RLS ativo
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'financial_payables';

-- 3) Políticas de acesso
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'financial_payables';

-- 4) Triggers
SELECT tgname
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'financial_payables' AND NOT t.tgisinternal;

-- 5) Lembretes (site_settings)
SELECT
  payable_reminder_enabled,
  payable_reminder_frequency,
  payable_reminder_days
FROM public.site_settings
WHERE id = 1;

-- 6) Contagem atual (deve ser 0 até você cadastrar no app)
SELECT COUNT(*) AS total_payables FROM public.financial_payables;
