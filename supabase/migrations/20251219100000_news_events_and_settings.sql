-- Create news_events table
CREATE TABLE IF NOT EXISTS public.news_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for news_events
ALTER TABLE public.news_events ENABLE ROW LEVEL SECURITY;

-- Policies for news_events
CREATE POLICY "Allow public read access to news_events" 
ON public.news_events FOR SELECT 
USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert access to news_events" 
ON public.news_events FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update access to news_events" 
ON public.news_events FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete access to news_events" 
ON public.news_events FOR DELETE 
USING (auth.role() = 'authenticated');

-- Update site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS section_order JSONB DEFAULT '["history", "venerables", "news", "contact"]'::jsonb;

ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0f172a';

