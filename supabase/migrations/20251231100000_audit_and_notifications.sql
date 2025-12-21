-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = profile_id);

-- Policy: Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = profile_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only Admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Function to notify admins on new signup
CREATE OR REPLACE FUNCTION public.notify_admins_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (profile_id, title, message, link)
    SELECT id, 'Novo Usuário Cadastrado', 'O usuário ' || NEW.full_name || ' solicitou acesso.', '/dashboard/admin'
    FROM public.profiles
    WHERE role = 'admin';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new signup
DROP TRIGGER IF EXISTS on_signup_notify_admin ON public.profiles;
CREATE TRIGGER on_signup_notify_admin
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION public.notify_admins_on_signup();

-- Function to log changes
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER AS $$
DECLARE
    actor_id UUID;
    payload JSONB;
BEGIN
    actor_id := auth.uid();
    
    IF TG_OP = 'UPDATE' THEN
        payload := jsonb_build_object('old', OLD, 'new', NEW);
        INSERT INTO public.audit_logs (profile_id, action, entity_type, entity_id, details)
        VALUES (actor_id, 'UPDATE', TG_TABLE_NAME, NEW.id::text, payload);
    ELSIF TG_OP = 'DELETE' THEN
        payload := jsonb_build_object('old', OLD);
        INSERT INTO public.audit_logs (profile_id, action, entity_type, entity_id, details)
        VALUES (actor_id, 'DELETE', TG_TABLE_NAME, OLD.id::text, payload);
    ELSIF TG_OP = 'INSERT' THEN
        payload := jsonb_build_object('new', NEW);
        INSERT INTO public.audit_logs (profile_id, action, entity_type, entity_id, details)
        VALUES (actor_id, 'CREATE', TG_TABLE_NAME, NEW.id::text, payload);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for audit on site_settings
DROP TRIGGER IF EXISTS audit_site_settings ON public.site_settings;
CREATE TRIGGER audit_site_settings
    AFTER UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.log_changes();

-- Triggers for audit on profiles (status or role changes)
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION public.log_changes();
