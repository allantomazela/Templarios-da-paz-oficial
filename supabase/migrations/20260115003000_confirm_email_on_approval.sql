-- Function to confirm email when user is approved
CREATE OR REPLACE FUNCTION public.confirm_email_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to 'approved', confirm the email in auth.users
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Only update if email is not already confirmed
    -- This prevents errors when desbloquear (unblocking) users
    UPDATE auth.users
    SET 
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW())
    WHERE id = NEW.id
    AND (email_confirmed_at IS NULL OR confirmed_at IS NULL);
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

-- Trigger to confirm email when status is updated to approved
DROP TRIGGER IF EXISTS on_profile_approved_confirm_email ON public.profiles;
CREATE TRIGGER on_profile_approved_confirm_email
  AFTER UPDATE OF status ON public.profiles
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
  EXECUTE FUNCTION public.confirm_email_on_approval();
