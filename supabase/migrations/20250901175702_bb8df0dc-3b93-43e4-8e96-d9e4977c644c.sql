-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);

-- Create policies for company assets bucket
CREATE POLICY "Anyone can view company assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-assets');

CREATE POLICY "Anyone can upload company assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Anyone can update company assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-assets');

CREATE POLICY "Anyone can delete company assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'company-assets');

-- Create a table to store company settings
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  company_name TEXT DEFAULT 'CompoundInvest',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for company settings
CREATE POLICY "Anyone can view company settings" 
ON public.company_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert company settings" 
ON public.company_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update company settings" 
ON public.company_settings 
FOR UPDATE 
USING (true);

-- Insert default settings
INSERT INTO public.company_settings (company_name) VALUES ('CompoundInvest');

-- Create trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();