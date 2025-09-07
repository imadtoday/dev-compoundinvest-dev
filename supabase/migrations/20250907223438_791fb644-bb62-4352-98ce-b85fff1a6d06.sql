-- Create campaign_notes table for multiple notes per campaign
CREATE TABLE public.campaign_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.campaign_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for campaign notes access
CREATE POLICY "Allow all access to campaign_notes" 
ON public.campaign_notes 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_campaign_notes_updated_at
BEFORE UPDATE ON public.campaign_notes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();