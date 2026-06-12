-- =============================================================================
-- ZERAR TODOS OS LANÇAMENTOS DO MÓDULO ÁGAPE (começar do zero)
-- =============================================================================
-- Cole e execute TUDO no SQL Editor do Supabase (role postgres).
-- Ao final, a consulta de conferência deve mostrar 0 em todas as linhas.
-- =============================================================================

BEGIN;

-- Receitas do ágape na tesouraria (categoria, descrição ou vínculo com cobrança)
DELETE FROM public.financial_transactions ft
WHERE ft.category ILIKE '%agape%'
   OR ft.category ILIKE '%ágape%'
   OR ft.description ILIKE '%agape%'
   OR ft.description ILIKE '%ágape%'
   OR EXISTS (
     SELECT 1
     FROM public.financial_categories fc
     WHERE fc.id = ft.category_id
       AND (fc.name ILIKE '%agape%' OR fc.name ILIKE '%ágape%')
   )
   OR EXISTS (
     SELECT 1
     FROM public.agape_brother_charges ac
     WHERE ac.transaction_id = ft.id
   );

DELETE FROM public.agape_brother_charges;
DELETE FROM public.agape_monthly_closings;
DELETE FROM public.agape_consumptions;
DELETE FROM public.agape_sessions;
DELETE FROM public.agape_menu_items;

COMMIT;

-- Conferência (todas devem retornar 0)
SELECT 'agape_consumptions' AS tabela, COUNT(*)::bigint AS registros FROM public.agape_consumptions
UNION ALL
SELECT 'agape_sessions', COUNT(*)::bigint FROM public.agape_sessions
UNION ALL
SELECT 'agape_brother_charges', COUNT(*)::bigint FROM public.agape_brother_charges
UNION ALL
SELECT 'agape_monthly_closings', COUNT(*)::bigint FROM public.agape_monthly_closings
UNION ALL
SELECT 'agape_menu_items', COUNT(*)::bigint FROM public.agape_menu_items
UNION ALL
SELECT 'financial_transactions (ágape)', COUNT(*)::bigint
  FROM public.financial_transactions ft
  WHERE ft.category ILIKE '%agape%'
     OR ft.category ILIKE '%ágape%'
     OR ft.description ILIKE '%agape%'
     OR ft.description ILIKE '%ágape%';
