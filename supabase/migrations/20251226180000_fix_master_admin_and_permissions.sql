-- Ensure Master Admin has correct role/status and backfill profile if needed
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
  
  -- Safety check: if profile missing for some reason but user exists (should exist due to triggers, but good for robustness)
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

-- Update handle_new_user trigger function to properly handle defaults and masonic degree
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_master_admin BOOLEAN;
  default_status public.user_status;
  default_role public.app_role;
BEGIN
  is_master_admin := NEW.email = 'allantomazela@gmail.com';
  
  IF is_master_admin THEN
    default_status := 'approved';
    default_role := 'admin';
  ELSE
    default_status := 'pending';
    default_role := 'member';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, status, masonic_degree)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    default_role,
    default_status,
    COALESCE(NEW.raw_user_meta_data->>'masonic_degree', 'Aprendiz')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = default_role,
    status = default_status,
    masonic_degree = EXCLUDED.masonic_degree;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
