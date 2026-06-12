-- Diagnóstico: quantos registros do Ágape ainda existem no banco?
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
