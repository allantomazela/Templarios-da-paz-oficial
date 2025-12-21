ALTER TABLE public.news_events 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'news';

-- Update existing records to have a category
UPDATE public.news_events 
SET category = 'news' 
WHERE category IS NULL;
