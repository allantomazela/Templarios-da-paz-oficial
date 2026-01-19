-- Função para notificar admins e editores quando uma nova mensagem de contato chegar
CREATE OR REPLACE FUNCTION public.notify_admins_on_contact_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar notificação para todos os admins e editores
    INSERT INTO public.notifications (profile_id, title, message, link)
    SELECT 
        id, 
        'Nova Mensagem do Site',
        'Nova mensagem recebida de ' || NEW.name || ' (' || NEW.email || ')',
        '/dashboard/secretariat?tab=communications&subtab=contact'
    FROM public.profiles
    WHERE (role = 'admin' OR role = 'editor')
    AND status = 'approved';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para notificar quando uma nova mensagem de contato é inserida
DROP TRIGGER IF EXISTS on_contact_message_notify_admins ON public.contact_messages;
CREATE TRIGGER on_contact_message_notify_admins
    AFTER INSERT ON public.contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_on_contact_message();
