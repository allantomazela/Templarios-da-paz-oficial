-- Conta de quem já se cadastrou, mas ainda não foi iniciado.
-- Valor de enum em arquivo separado: o Postgres não permite usar o valor
-- novo na mesma transação em que ele é criado.
ALTER TYPE public.user_status ADD VALUE IF NOT EXISTS 'pre_iniciacao';
