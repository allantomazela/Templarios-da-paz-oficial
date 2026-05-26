-- Limpa dados operacionais dos módulos Ágape e Sessões (Chancelaria).
-- NÃO remove: eventos da agenda, perfis, irmãos, site_settings (PIX do ágape).
-- Execute no SQL Editor do Supabase como administrador.

BEGIN;

DELETE FROM public.agape_consumptions;
DELETE FROM public.agape_sessions;
DELETE FROM public.agape_menu_items;

DELETE FROM public.checkin_tokens;
DELETE FROM public.attendance;
DELETE FROM public.visitor_attendances;
DELETE FROM public.session_records;

COMMIT;
