-- =====================================================
-- Script de Verificação e Aplicação da Migração
-- Campos de Contato e Tabela de Mensagens
-- =====================================================

-- PARTE 1: VERIFICAÇÃO
-- =====================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  column_phone_exists BOOLEAN;
  column_email_exists BOOLEAN;
BEGIN
  -- Verificar se a tabela contact_messages existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_messages'
  ) INTO table_exists;

  -- Verificar se os campos foram adicionados
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'site_settings' 
    AND column_name = 'contact_phone'
  ) INTO column_phone_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'site_settings' 
    AND column_name = 'contact_message_email'
  ) INTO column_email_exists;

  -- Exibir status
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICAÇÃO DE STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tabela contact_messages existe: %', table_exists;
  RAISE NOTICE 'Campo contact_phone existe: %', column_phone_exists;
  RAISE NOTICE 'Campo contact_message_email existe: %', column_email_exists;
  RAISE NOTICE '========================================';

  -- Se tudo já existe, não precisa aplicar
  IF table_exists AND column_phone_exists AND column_email_exists THEN
    RAISE NOTICE '✅ Migração já foi aplicada! Nada a fazer.';
    RETURN;
  END IF;

  RAISE NOTICE '⚠️ Migração não aplicada completamente. Aplicando...';
END $$;

-- PARTE 2: APLICAÇÃO DA MIGRAÇÃO
-- =====================================================

-- Adicionar campos de telefone e email para mensagens do formulário
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_message_email TEXT;

-- Criar tabela para armazenar mensagens do formulário de contato
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índice para melhorar consultas
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Allow public insert to contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins and Editors can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins and Editors can update contact messages" ON public.contact_messages;

-- Política: Qualquer pessoa pode inserir mensagens (formulário público)
CREATE POLICY "Allow public insert to contact_messages"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política: Apenas admins e editores podem visualizar mensagens
CREATE POLICY "Admins and Editors can view contact messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'editor')
  )
);

-- Política: Apenas admins e editores podem atualizar mensagens
CREATE POLICY "Admins and Editors can update contact messages"
ON public.contact_messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'editor')
  )
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_messages_updated_at();

-- PARTE 3: VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  column_phone_exists BOOLEAN;
  column_email_exists BOOLEAN;
  policies_count INTEGER;
BEGIN
  -- Verificar novamente
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_messages'
  ) INTO table_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'site_settings' 
    AND column_name = 'contact_phone'
  ) INTO column_phone_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'site_settings' 
    AND column_name = 'contact_message_email'
  ) INTO column_email_exists;

  -- Contar políticas RLS
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies
  WHERE tablename = 'contact_messages';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICAÇÃO FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tabela contact_messages: %', CASE WHEN table_exists THEN '✅ CRIADA' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Campo contact_phone: %', CASE WHEN column_phone_exists THEN '✅ CRIADO' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Campo contact_message_email: %', CASE WHEN column_email_exists THEN '✅ CRIADO' ELSE '❌ FALTANDO' END;
  RAISE NOTICE 'Políticas RLS: %', policies_count;
  RAISE NOTICE '========================================';

  IF table_exists AND column_phone_exists AND column_email_exists THEN
    RAISE NOTICE '✅ SUCESSO! Migração aplicada com sucesso!';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO! Alguns itens não foram criados. Verifique os erros acima.';
  END IF;
END $$;

-- PARTE 4: TESTE DE INSERÇÃO (OPCIONAL - COMENTADO)
-- =====================================================
-- Descomente para testar se a inserção funciona:

/*
INSERT INTO public.contact_messages (name, email, message)
VALUES ('Teste', 'teste@example.com', 'Esta é uma mensagem de teste')
ON CONFLICT DO NOTHING;

-- Verificar se foi inserido
SELECT * FROM public.contact_messages WHERE email = 'teste@example.com';

-- Limpar teste (descomente se quiser remover o registro de teste)
-- DELETE FROM public.contact_messages WHERE email = 'teste@example.com';
*/
