-- Ensure Master Admin has correct role/status regardless of previous states
DO $$
BEGIN
  -- Update existing profile for master admin
  UPDATE public.profiles
  SET 
    role = 'admin',
    status = 'approved'
  FROM auth.users
  WHERE profiles.id = auth.users.id 
  AND auth.users.email = 'allantomazela@gmail.com';
  
  -- Ensure safety check for missing profile
  INSERT INTO public.profiles (id, full_name, email, role, status)
  SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'name', 'Master Admin'), 
    email, 
    'admin', 
    'approved'
  FROM auth.users
  WHERE email = 'allantomazela@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.users.id);
END $$;

-- Policy Audit: Ensure admins have full access across key tables
-- We drop specific policies if they exist to avoid conflicts and recreate them with full permissions

-- News Events Policies
DROP POLICY IF EXISTS "Admins have full control on news_events" ON public.news_events;
CREATE POLICY "Admins have full control on news_events"
  ON public.news_events FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) 
  );

-- Site Settings Policies
DROP POLICY IF EXISTS "Admins have full control on site_settings" ON public.site_settings;
CREATE POLICY "Admins have full control on site_settings"
  ON public.site_settings FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) 
  );

-- Venerables Policies
DROP POLICY IF EXISTS "Admins have full control on venerables" ON public.venerables;
CREATE POLICY "Admins have full control on venerables"
  ON public.venerables FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) 
  );

-- Profiles Policies (Admin Management)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) 
  );

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) 
  );
