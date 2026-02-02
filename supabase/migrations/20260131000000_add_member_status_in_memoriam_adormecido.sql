-- Adiciona status de membro: in_memoriam (falecido) e adormecido (afastado / pediu kit place)
-- Permite à loja marcar irmãos como In Memoriam ou Adormecido sem excluir o registro.

ALTER TYPE public.user_status ADD VALUE IF NOT EXISTS 'in_memoriam';
ALTER TYPE public.user_status ADD VALUE IF NOT EXISTS 'adormecido';
