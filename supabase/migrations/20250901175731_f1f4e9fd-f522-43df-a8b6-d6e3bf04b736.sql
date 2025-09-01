-- Enable RLS on existing tables that don't have it
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Create basic policies for public access (since this appears to be a single-tenant app)
CREATE POLICY "Allow all access to campaigns" ON public.campaigns FOR ALL USING (true);
CREATE POLICY "Allow all access to contacts" ON public.contacts FOR ALL USING (true);
CREATE POLICY "Allow all access to messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Allow all access to campaign_answers" ON public.campaign_answers FOR ALL USING (true);
CREATE POLICY "Allow all access to campaign_questionnaires" ON public.campaign_questionnaires FOR ALL USING (true);
CREATE POLICY "Allow all access to questionnaires" ON public.questionnaires FOR ALL USING (true);
CREATE POLICY "Allow all access to questions" ON public.questions FOR ALL USING (true);