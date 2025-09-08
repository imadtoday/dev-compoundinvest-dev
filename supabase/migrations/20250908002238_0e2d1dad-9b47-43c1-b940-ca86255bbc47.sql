-- Add favicon_url column to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN favicon_url text;