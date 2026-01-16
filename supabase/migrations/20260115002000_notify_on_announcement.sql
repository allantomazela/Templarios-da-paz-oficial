-- Function to notify all users when a new announcement is created
CREATE OR REPLACE FUNCTION public.notify_users_on_announcement()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a notification for all authenticated users (profiles with status = 'approved')
    INSERT INTO public.notifications (profile_id, title, message, link)
    SELECT 
        id, 
        'Novo Aviso no Mural',
        'Um novo aviso foi publicado: ' || NEW.title,
        '/dashboard/secretariat'
    FROM public.profiles
    WHERE status = 'approved'
    AND id != NEW.author_id; -- Don't notify the author
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to notify users when a new announcement is created
DROP TRIGGER IF EXISTS on_announcement_notify_users ON public.announcements;
CREATE TRIGGER on_announcement_notify_users
    AFTER INSERT ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_users_on_announcement();
