-- Migration to ensure Master Admin permissions and access
-- This script guarantees that the specific master email always has admin role and approved status

DO $$
BEGIN
  -- 1. Update existing profile for master admin if it exists
  UPDATE public.profiles
  SET 
    role = 'admin',
    status = 'approved'
  FROM auth.users
  WHERE profiles.id = auth.users.id 
  AND auth.users.email = 'allantomazela@gmail.com';
  
  -- 2. If profile doesn't exist but user does, insert it with correct permissions
  INSERT INTO public.profiles (id, full_name, email, role, status)
  SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'name', 'Administrador Master'), 
    email, 
    'admin', 
    'approved'
  FROM auth.users
  WHERE email = 'allantomazela@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.users.id);
  
END $$;
