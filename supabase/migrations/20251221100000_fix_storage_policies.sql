-- Create the site-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to ensure a clean slate and avoid conflicts
-- We use DO block to gracefully handle policy dropping since IF EXISTS works on policies but we want to be explicit
DROP POLICY IF EXISTS "Public Access site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete site-assets" ON storage.objects;

-- Create comprehensive policies for the site-assets bucket

-- 1. Allow public read access (SELECT) for everyone
-- This ensures images are visible on the website without authentication
CREATE POLICY "Public Access site-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

-- 2. Allow authenticated users to upload files (INSERT)
-- Restricts uploading to logged-in users only
CREATE POLICY "Authenticated Insert site-assets"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

-- 3. Allow authenticated users to update their files (UPDATE)
-- Restricts modifications to logged-in users only
CREATE POLICY "Authenticated Update site-assets"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

-- 4. Allow authenticated users to delete files (DELETE)
-- Restricts deletion to logged-in users only
CREATE POLICY "Authenticated Delete site-assets"
ON storage.objects FOR DELETE
USING ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );
