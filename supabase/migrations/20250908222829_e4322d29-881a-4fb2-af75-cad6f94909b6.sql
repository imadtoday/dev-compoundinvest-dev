-- Add campaign_url field to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN campaign_url TEXT;

-- Add contact_url field to contacts table  
ALTER TABLE public.contacts
ADD COLUMN contact_url TEXT;