-- Fix: Ensure trigger works correctly when unblocking users
-- This migration improves the trigger to handle all status transitions properly

-- Drop and recreate the trigger with better conditions
DROP TRIGGER IF EXISTS on_profile_approved_confirm_email ON public.profiles;

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.confirm_email_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Only process if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Check if user exists in auth.users before trying to update
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = NEW.id) INTO user_exists;
    
    IF user_exists THEN
      -- Only update if email is not already confirmed
      UPDATE auth.users
      SET 
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmed_at = COALESCE(confirmed_at, NOW())
      WHERE id = NEW.id
      AND (email_confirmed_at IS NULL OR confirmed_at IS NULL);
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    -- This allows the status update to succeed even if email confirmation fails
    RAISE WARNING 'Error confirming email for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER on_profile_approved_confirm_email
  AFTER UPDATE OF status ON public.profiles
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
  EXECUTE FUNCTION public.confirm_email_on_approval();
