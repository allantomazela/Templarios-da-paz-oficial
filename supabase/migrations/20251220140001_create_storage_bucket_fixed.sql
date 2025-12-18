-- Create the site-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for site-assets bucket
-- We use DO block to check existence because we might not be able to DROP policies
-- (due to ownership permissions on storage.objects) and we want to avoid "policy already exists" errors.

DO $$
BEGIN
    -- Public Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access site-assets'
    ) THEN
        CREATE POLICY "Public Access site-assets"
          ON storage.objects FOR SELECT
          USING ( bucket_id = 'site-assets' );
    END IF;

    -- Authenticated Insert
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Insert site-assets'
    ) THEN
        CREATE POLICY "Authenticated Insert site-assets"
          ON storage.objects FOR INSERT
          WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );
    END IF;

    -- Authenticated Update
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Update site-assets'
    ) THEN
        CREATE POLICY "Authenticated Update site-assets"
          ON storage.objects FOR UPDATE
          USING ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );
    END IF;

    -- Authenticated Delete
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Delete site-assets'
    ) THEN
        CREATE POLICY "Authenticated Delete site-assets"
          ON storage.objects FOR DELETE
          USING ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );
    END IF;
END
$$;
