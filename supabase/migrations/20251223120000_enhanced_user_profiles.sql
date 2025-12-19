-- Create user status enum
DO $$ BEGIN
    CREATE TYPE public.user_status AS ENUM ('pending', 'approved', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status public.user_status DEFAULT 'pending'::public.user_status;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS masonic_degree TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles to have default status 'approved' (to avoid locking out current users)
UPDATE public.profiles SET status = 'approved' WHERE status IS NULL;

-- Backfill emails for existing profiles from auth.users (requires superuser privileges which migrations usually have)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Update handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_master_admin BOOLEAN;
  default_status public.user_status;
  default_role public.app_role;
BEGIN
  is_master_admin := NEW.email = 'allantomazela@gmail.com';
  
  -- Determine status: Master admin is approved, others are pending
  IF is_master_admin THEN
    default_status := 'approved';
    default_role := 'admin';
  ELSE
    default_status := 'pending';
    default_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'member');
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, status, masonic_degree)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    default_role,
    default_status,
    NEW.raw_user_meta_data->>'masonic_degree'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is set (it might already exist, replacing function updates behavior)
-- But just in case, we ensure it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Provision Master Admin specifically if user already exists
UPDATE public.profiles 
SET role = 'admin', status = 'approved', email = 'allantomazela@gmail.com'
FROM auth.users
WHERE profiles.id = auth.users.id AND auth.users.email = 'allantomazela@gmail.com';
