-- Adicionar campos para resposta direta e tags/categorias
ALTER TABLE public.contact_messages 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS reply_text TEXT,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS replied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Criar índice para categoria
CREATE INDEX IF NOT EXISTS idx_contact_messages_category ON public.contact_messages(category);

-- Criar índice para replied_by
CREATE INDEX IF NOT EXISTS idx_contact_messages_replied_by ON public.contact_messages(replied_by);

-- Comentários para documentação
COMMENT ON COLUMN public.contact_messages.category IS 'Categoria/tag da mensagem (ex: Dúvida, Sugestão, Reclamação, etc.)';
COMMENT ON COLUMN public.contact_messages.reply_text IS 'Texto da resposta enviada diretamente pelo sistema';
COMMENT ON COLUMN public.contact_messages.replied_at IS 'Data e hora em que a resposta foi enviada';
COMMENT ON COLUMN public.contact_messages.replied_by IS 'ID do usuário que enviou a resposta';
