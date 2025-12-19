-- Ensure the Master Admin has the correct role and status
DO $$
DECLARE
  master_email TEXT := 'allantomazela@gmail.com';
  master_uid UUID;
BEGIN
  -- Get the User ID from auth.users
  SELECT id INTO master_uid FROM auth.users WHERE email = master_email;
  
  IF master_uid IS NOT NULL THEN
    -- Update profile if exists to ensure admin role and approved status
    UPDATE public.profiles 
    SET role = 'admin', status = 'approved' 
    WHERE id = master_uid;
    
    -- Safety check: ensure masonic_degree column exists (it should from previous migrations)
    -- If profile doesn't exist (unlikely due to triggers), insert it
    INSERT INTO public.profiles (id, email, role, status, full_name, masonic_degree)
    SELECT 
      id, 
      email, 
      'admin', 
      'approved', 
      COALESCE(raw_user_meta_data->>'name', 'Master Admin'),
      COALESCE(raw_user_meta_data->>'masonic_degree', 'Mestre')
    FROM auth.users
    WHERE id = master_uid
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'admin',
      status = 'approved';
  END IF;
END $$;
