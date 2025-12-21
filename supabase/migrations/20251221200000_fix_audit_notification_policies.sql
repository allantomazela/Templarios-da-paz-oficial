-- Migration to fix potential conflicts with policies in 20251231100000_audit_and_notifications.sql
-- This migration ensures that if the policies already exist (due to previous partial runs or conflicts),
-- they are dropped so that the audit_and_notifications migration can recreate them without errors.

DO $$
BEGIN
    -- Check if notifications table exists and drop policies if they exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
    END IF;

    -- Check if audit_logs table exists and drop policies if they exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
        DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
    END IF;
END $$;
