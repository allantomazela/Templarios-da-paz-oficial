-- Create custom types
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'member');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role public.app_role DEFAULT 'member'::public.app_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update Policies for existing tables based on RBAC

-- News Events
DROP POLICY IF EXISTS "Allow authenticated insert access to news_events" ON public.news_events;
DROP POLICY IF EXISTS "Allow authenticated update access to news_events" ON public.news_events;
DROP POLICY IF EXISTS "Allow authenticated delete access to news_events" ON public.news_events;

CREATE POLICY "Admins and Editors can insert news"
  ON public.news_events FOR INSERT
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    ) 
  );

CREATE POLICY "Admins and Editors can update news"
  ON public.news_events FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    ) 
  );

CREATE POLICY "Admins and Editors can delete news"
  ON public.news_events FOR DELETE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    ) 
  );

-- Site Settings
DROP POLICY IF EXISTS "Allow authenticated update access to site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow authenticated insert access to site_settings" ON public.site_settings;

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) 
  );

-- Venerables
DROP POLICY IF EXISTS "Allow authenticated all access to venerables" ON public.venerables;

CREATE POLICY "Admins and Editors can manage venerables"
  ON public.venerables FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    ) 
  );

-- Storage Policies updates for RBAC
-- Note: Supabase Storage policies are a bit different, checking bucket_id etc.
-- We previously allowed all authenticated users. Now we restrict.

DROP POLICY IF EXISTS "Authenticated Insert site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete site-assets" ON storage.objects;

CREATE POLICY "Admins and Editors can upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-assets' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

CREATE POLICY "Admins and Editors can update assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'site-assets' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

CREATE POLICY "Admins and Editors can delete assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'site-assets' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );
