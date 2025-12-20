-- Migration for Push Notifications and Minutes (Atas)

-- 1. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Minutes (Atas) Table
CREATE TABLE IF NOT EXISTS public.minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Minutes Signatures Table
CREATE TABLE IF NOT EXISTS public.minutes_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    minute_id UUID NOT NULL REFERENCES public.minutes(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(minute_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minutes_signatures ENABLE ROW LEVEL SECURITY;

-- Policies for push_subscriptions
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own subscriptions"
    ON public.push_subscriptions
    FOR ALL
    TO authenticated
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Policies for minutes
DROP POLICY IF EXISTS "Authenticated users can view minutes" ON public.minutes;
CREATE POLICY "Authenticated users can view minutes"
    ON public.minutes
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins and Editors can manage minutes" ON public.minutes;
CREATE POLICY "Admins and Editors can manage minutes"
    ON public.minutes
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_editor())
    WITH CHECK (public.is_admin_or_editor());

-- Policies for minutes_signatures
DROP POLICY IF EXISTS "Authenticated users can view signatures" ON public.minutes_signatures;
CREATE POLICY "Authenticated users can view signatures"
    ON public.minutes_signatures
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can sign minutes" ON public.minutes_signatures;
CREATE POLICY "Users can sign minutes"
    ON public.minutes_signatures
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = profile_id);

