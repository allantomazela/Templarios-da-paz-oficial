-- Limpa dados operacionais dos módulos Ágape e Sessões (Chancelaria).
-- Para zerar SOMENTE o Ágape (incl. fechamento financeiro), use APLICAR_LIMPAR_AGAPE_COMPLETO.sql
-- NÃO remove: eventos da agenda, perfis, irmãos, site_settings (PIX do ágape).
-- Execute no SQL Editor do Supabase como administrador.

BEGIN;

DELETE FROM public.financial_transactions ft
WHERE ft.category = 'Ágape'
   OR EXISTS (
     SELECT 1 FROM public.agape_brother_charges ac WHERE ac.transaction_id = ft.id
   );

DELETE FROM public.agape_brother_charges;
DELETE FROM public.agape_monthly_closings;
DELETE FROM public.agape_consumptions;
DELETE FROM public.agape_sessions;
DELETE FROM public.agape_menu_items;

DELETE FROM public.checkin_tokens;
DELETE FROM public.attendance;
DELETE FROM public.visitor_attendances;
DELETE FROM public.session_records;

COMMIT;
