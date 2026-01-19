-- =====================================================
-- Script Completo: Aplicar Todas as Melhorias de Contato
-- =====================================================
-- Este script aplica:
-- 1. Notificações automáticas
-- 2. Campos para resposta direta
-- 3. Campos para categorias/tags
-- =====================================================

-- PARTE 1: VERIFICAÇÃO
-- =====================================================

DO $$
DECLARE
  function_exists BOOLEAN;
  trigger_exists BOOLEAN;
  category_exists BOOLEAN;
  reply_text_exists BOOLEAN;
BEGIN
  -- Verificar função de notificação
  SELECT EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'notify_admins_on_contact_message'
  ) INTO function_exists;

  -- Verificar trigger
  SELECT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'on_contact_message_notify_admins'
  ) INTO trigger_exists;

  -- Verificar campos
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_messages' 
    AND column_name = 'category'
  ) INTO category_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_messages' 
    AND column_name = 'reply_text'
  ) INTO reply_text_exists;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICAÇÃO DE STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Função de notificação: %', CASE WHEN function_exists THEN '✅ EXISTE' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Trigger de notificação: %', CASE WHEN trigger_exists THEN '✅ EXISTE' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Campo category: %', CASE WHEN category_exists THEN '✅ EXISTE' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Campo reply_text: %', CASE WHEN reply_text_exists THEN '✅ EXISTE' ELSE '❌ FALTANDO' END;
  RAISE NOTICE '========================================';

  IF function_exists AND trigger_exists AND category_exists AND reply_text_exists THEN
    RAISE NOTICE '✅ Todas as melhorias já foram aplicadas!';
    RETURN;
  END IF;

  RAISE NOTICE '⚠️ Aplicando melhorias...';
END $$;

-- PARTE 2: FUNÇÃO E TRIGGER DE NOTIFICAÇÃO
-- =====================================================

-- Função para notificar admins e editores quando uma nova mensagem de contato chegar
CREATE OR REPLACE FUNCTION public.notify_admins_on_contact_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar notificação para todos os admins e editores
    INSERT INTO public.notifications (profile_id, title, message, link)
    SELECT 
        id, 
        'Nova Mensagem do Site',
        'Nova mensagem recebida de ' || NEW.name || ' (' || NEW.email || ')',
        '/dashboard/secretariat?tab=communications&subtab=contact'
    FROM public.profiles
    WHERE (role = 'admin' OR role = 'editor')
    AND status = 'approved';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para notificar quando uma nova mensagem de contato é inserida
DROP TRIGGER IF EXISTS on_contact_message_notify_admins ON public.contact_messages;
CREATE TRIGGER on_contact_message_notify_admins
    AFTER INSERT ON public.contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_on_contact_message();

-- PARTE 3: CAMPOS ADICIONAIS
-- =====================================================

-- Adicionar campos para resposta direta e tags/categorias
ALTER TABLE public.contact_messages 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS reply_text TEXT,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS replied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_category ON public.contact_messages(category);
CREATE INDEX IF NOT EXISTS idx_contact_messages_replied_by ON public.contact_messages(replied_by);

-- Comentários para documentação
COMMENT ON COLUMN public.contact_messages.category IS 'Categoria/tag da mensagem (ex: Dúvida, Sugestão, Reclamação, etc.)';
COMMENT ON COLUMN public.contact_messages.reply_text IS 'Texto da resposta enviada diretamente pelo sistema';
COMMENT ON COLUMN public.contact_messages.replied_at IS 'Data e hora em que a resposta foi enviada';
COMMENT ON COLUMN public.contact_messages.replied_by IS 'ID do usuário que enviou a resposta';

-- PARTE 4: VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  function_exists BOOLEAN;
  trigger_exists BOOLEAN;
  category_exists BOOLEAN;
  reply_text_exists BOOLEAN;
  replied_at_exists BOOLEAN;
  replied_by_exists BOOLEAN;
  category_index_exists BOOLEAN;
  replied_by_index_exists BOOLEAN;
BEGIN
  -- Verificar novamente
  SELECT EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'notify_admins_on_contact_message'
  ) INTO function_exists;

  SELECT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'on_contact_message_notify_admins'
  ) INTO trigger_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_messages' 
    AND column_name = 'category'
  ) INTO category_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_messages' 
    AND column_name = 'reply_text'
  ) INTO reply_text_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_messages' 
    AND column_name = 'replied_at'
  ) INTO replied_at_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_messages' 
    AND column_name = 'replied_by'
  ) INTO replied_by_exists;

  SELECT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'contact_messages' 
    AND indexname = 'idx_contact_messages_category'
  ) INTO category_index_exists;

  SELECT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'contact_messages' 
    AND indexname = 'idx_contact_messages_replied_by'
  ) INTO replied_by_index_exists;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICAÇÃO FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Função de notificação: %', CASE WHEN function_exists THEN '✅ CRIADA' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Trigger de notificação: %', CASE WHEN trigger_exists THEN '✅ CRIADO' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Campo category: %', CASE WHEN category_exists THEN '✅ CRIADO' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Campo reply_text: %', CASE WHEN reply_text_exists THEN '✅ CRIADO' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Campo replied_at: %', CASE WHEN replied_at_exists THEN '✅ CRIADO' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Campo replied_by: %', CASE WHEN replied_by_exists THEN '✅ CRIADO' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Índice category: %', CASE WHEN category_index_exists THEN '✅ CRIADO' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Índice replied_by: %', CASE WHEN replied_by_index_exists THEN '✅ CRIADO' ELSE '❌ FALTANDO' END;
  RAISE NOTICE '========================================';

  IF function_exists AND trigger_exists AND category_exists AND reply_text_exists 
     AND replied_at_exists AND replied_by_exists AND category_index_exists AND replied_by_index_exists THEN
    RAISE NOTICE '✅ SUCESSO! Todas as melhorias foram aplicadas com sucesso!';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO! Alguns itens não foram criados. Verifique os erros acima.';
  END IF;
END $$;
