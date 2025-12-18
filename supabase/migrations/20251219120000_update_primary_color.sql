-- Update the primary_color to the brand blue #007AFF for the default settings row (id 1)
-- ensuring the application reflects the correct visual identity by default
UPDATE public.site_settings
SET primary_color = '#007AFF'
WHERE id = 1;
