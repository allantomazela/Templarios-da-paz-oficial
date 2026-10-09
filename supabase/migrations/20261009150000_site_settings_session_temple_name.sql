-- Nome do templo onde a loja realiza as sessões (usado nos impressos: folha do livro de presença e relatório GOB).
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS session_temple_name text;

UPDATE public.site_settings
   SET session_temple_name = 'Templo das Espadas'
 WHERE id = 1
   AND session_temple_name IS NULL;
