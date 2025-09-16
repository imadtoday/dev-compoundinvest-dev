-- Update the set_campaign_url function to use dev domain
CREATE OR REPLACE FUNCTION public.set_campaign_url()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.campaign_url IS NULL OR NEW.campaign_url = '' THEN
    NEW.campaign_url := 'https://dev-ci.datatube.app/campaigns/' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$function$;