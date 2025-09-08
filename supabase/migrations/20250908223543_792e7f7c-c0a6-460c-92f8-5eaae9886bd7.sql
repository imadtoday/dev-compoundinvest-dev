-- Auto-populate campaign_url and contact_url regardless of creation source (UI, API, n8n)
-- Functions + triggers + backfill

-- Function to set campaign_url
CREATE OR REPLACE FUNCTION public.set_campaign_url()
RETURNS trigger AS $$
BEGIN
  IF NEW.campaign_url IS NULL OR NEW.campaign_url = '' THEN
    NEW.campaign_url := 'https://compoundinvest.datatube.app/campaigns/' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists for inserts and updates
DROP TRIGGER IF EXISTS trg_set_campaign_url_insupd ON public.campaigns;
CREATE TRIGGER trg_set_campaign_url_insupd
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.set_campaign_url();

-- Function to set contact_url
CREATE OR REPLACE FUNCTION public.set_contact_url()
RETURNS trigger AS $$
BEGIN
  IF NEW.contact_url IS NULL OR NEW.contact_url = '' THEN
    NEW.contact_url := 'https://compoundinvest.datatube.app/contacts/' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists for inserts and updates
DROP TRIGGER IF EXISTS trg_set_contact_url_insupd ON public.contacts;
CREATE TRIGGER trg_set_contact_url_insupd
BEFORE INSERT OR UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_contact_url();

-- Backfill existing null/empty URLs
UPDATE public.campaigns
SET campaign_url = 'https://compoundinvest.datatube.app/campaigns/' || id::text
WHERE campaign_url IS NULL OR campaign_url = '';

UPDATE public.contacts
SET contact_url = 'https://compoundinvest.datatube.app/contacts/' || id::text
WHERE contact_url IS NULL OR contact_url = '';
