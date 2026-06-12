-- Imagem opcional nos itens do cardápio do Ágape.

ALTER TABLE public.agape_menu_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.agape_menu_items.image_url IS
  'URL pública da imagem do produto no cardápio (Supabase Storage site-assets/agape-menu/)';

-- Upload de imagens do cardápio pelo Mestre de Banquete / VM / admin.
DROP POLICY IF EXISTS "Agape managers can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Agape managers can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Agape managers can delete menu images" ON storage.objects;

CREATE POLICY "Agape managers can upload menu images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'site-assets'
    AND name LIKE 'agape-menu/%'
    AND public.can_manage_agape(auth.uid())
  );

CREATE POLICY "Agape managers can update menu images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'site-assets'
    AND name LIKE 'agape-menu/%'
    AND public.can_manage_agape(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'site-assets'
    AND name LIKE 'agape-menu/%'
    AND public.can_manage_agape(auth.uid())
  );

CREATE POLICY "Agape managers can delete menu images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'site-assets'
    AND name LIKE 'agape-menu/%'
    AND public.can_manage_agape(auth.uid())
  );
