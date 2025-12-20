-- Migration to fix RLS recursion and ensure public access

-- 1. Create Helper Functions (Security Definer to bypass RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'editor')
  );
END;
$$;

-- 2. Profiles Table Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially recursive or outdated policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Read access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Delete access for profiles" ON public.profiles;

-- Create clean policies using helper functions to avoid recursion
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- 3. Site Settings Policies
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin full access for site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins have full control on site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow authenticated update access to site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow authenticated insert access to site_settings" ON public.site_settings;

-- Public Read (Anon + Authenticated) - Explicitly allow id=1
CREATE POLICY "Public read access for site_settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (id = 1);

-- Admin Write
CREATE POLICY "Admin write access for site_settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin insert access for site_settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());


-- 4. News Events Policies
ALTER TABLE public.news_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published news" ON public.news_events;
DROP POLICY IF EXISTS "Admin full access for news_events" ON public.news_events;
DROP POLICY IF EXISTS "Admins have full control on news_events" ON public.news_events;
DROP POLICY IF EXISTS "Admins and Editors can insert news" ON public.news_events;
DROP POLICY IF EXISTS "Admins and Editors can update news" ON public.news_events;
DROP POLICY IF EXISTS "Admins and Editors can delete news" ON public.news_events;
DROP POLICY IF EXISTS "Allow authenticated insert access to news_events" ON public.news_events;
DROP POLICY IF EXISTS "Allow authenticated update access to news_events" ON public.news_events;
DROP POLICY IF EXISTS "Allow authenticated delete access to news_events" ON public.news_events;

-- Public Read Published
CREATE POLICY "Public read published news"
  ON public.news_events FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Staff (Admin/Editor) Full Access
CREATE POLICY "Staff full access for news_events"
  ON public.news_events FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor());


-- 5. Venerables Policies
ALTER TABLE public.venerables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read venerables" ON public.venerables;
DROP POLICY IF EXISTS "Admin full access for venerables" ON public.venerables;
DROP POLICY IF EXISTS "Admins have full control on venerables" ON public.venerables;
DROP POLICY IF EXISTS "Admins and Editors can manage venerables" ON public.venerables;
DROP POLICY IF EXISTS "Allow authenticated all access to venerables" ON public.venerables;

-- Public Read
CREATE POLICY "Public read venerables"
  ON public.venerables FOR SELECT
  TO anon, authenticated
  USING (true);

-- Staff (Admin/Editor) Full Access
CREATE POLICY "Staff full access for venerables"
  ON public.venerables FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor());


-- 6. Ensure default site_settings exists to prevent frontend errors
INSERT INTO public.site_settings (id, history_title, history_text, values_liberty, values_equality, values_fraternity)
VALUES (
  1, 
  'Nossa História', 
  'Em construção...', 
  'Liberdade de pensamento e expressão.', 
  'Igualdade de direitos e deveres.', 
  'Fraternidade entre todos os homens.'
)
ON CONFLICT (id) DO NOTHING;
