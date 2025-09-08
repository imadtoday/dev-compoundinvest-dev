-- Add engagement_fee and success_fee columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN engagement_fee NUMERIC,
ADD COLUMN success_fee NUMERIC;