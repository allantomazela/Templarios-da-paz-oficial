-- Permite upload de avatar por membros autenticados em site-assets/avatars/
-- Complementa "Admins and Editors can * assets" (20251222100000).

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Members can upload own avatar folder" ON storage.objects;
DROP POLICY IF EXISTS "Members can update own avatar folder" ON storage.objects;
DROP POLICY IF EXISTS "Members can delete own avatar folder" ON storage.objects;

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'site-assets'
    AND (name LIKE 'avatars/%')
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can update avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'site-assets'
    AND (name LIKE 'avatars/%')
  )
  WITH CHECK (
    bucket_id = 'site-assets'
    AND (name LIKE 'avatars/%')
  );

CREATE POLICY "Authenticated users can delete avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'site-assets'
    AND (name LIKE 'avatars/%')
  );

CREATE POLICY "Members can upload own avatar folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'site-assets'
    AND name LIKE ('avatars/' || auth.uid()::text || '/%')
  );

CREATE POLICY "Members can update own avatar folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'site-assets'
    AND name LIKE ('avatars/' || auth.uid()::text || '/%')
  )
  WITH CHECK (
    bucket_id = 'site-assets'
    AND name LIKE ('avatars/' || auth.uid()::text || '/%')
  );

CREATE POLICY "Members can delete own avatar folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'site-assets'
    AND name LIKE ('avatars/' || auth.uid()::text || '/%')
  );
