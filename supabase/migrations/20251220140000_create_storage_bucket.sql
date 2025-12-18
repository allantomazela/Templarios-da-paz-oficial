-- Create the site-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts if re-running (safe for migration files usually, but good practice)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- Create policies for site-assets bucket
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'site-assets' );

CREATE POLICY "Authenticated Insert"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Update"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Delete"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );
