import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone, MessageCircle } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { Separator } from "@/components/ui/separator";

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign-detail', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data } = await supabase
        .from('campaigns')
        .select(`
          *,
          contacts (
            id,
            first_name,
            last_name,
            email,
            phone_e164
          )
        `)
        .eq('id', id)
        .single();
      
      return data;
    },
    enabled: !!id
  });

  const { data: answers } = useQuery({
    queryKey: ['campaign-answers', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data } = await supabase
        .from('campaign_answers')
        .select(`
          *,
          questions (
            id,
            text,
            code,
            section,
            ordinal
          )
        `)
        .eq('campaign_id', id)
        .order('answered_at', { ascending: true });
      
      return data || [];
    },
    enabled: !!id
  });

  const { data: messages } = useQuery({
    queryKey: ['campaign-messages', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('campaign_id', id)
        .order('sent_at', { ascending: true });
      
      return data || [];
    },
    enabled: !!id
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
        return 'default';
      case 'new':
        return 'secondary';
      case 'in_progress':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatQuestionText = (text: string) => {
    if (!text) return '';
    // Remove newlines and clean up the text
    let cleanText = text.replace(/\\n/g, '\n');
    
    // Remove multiple choice options (A), B), C), etc.) and everything after them
    const lines = cleanText.split('\n');
    const questionLines = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Stop at the first line that looks like a multiple choice option
      if (/^[A-Z]\)\s/.test(trimmedLine)) {
        break;
      }
      // Skip lines that contain "Reply Yes or No" instructions
      if (trimmedLine.toLowerCase().includes('reply yes or no')) {
        continue;
      }
      questionLines.push(line);
    }
    
    return questionLines.join('\n').trim();
  };

  const normalizeValueJson = (val: any): string[] | null => {
    if (val == null) return null;
    if (Array.isArray(val)) return val as string[];
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed as string[];
        if (parsed && typeof parsed === 'object') {
          // Handle the specific structure with selected_values
          if (Array.isArray(parsed.selected_values)) return parsed.selected_values as string[];
          if (Array.isArray(parsed.selected)) return parsed.selected as string[];
          if (Array.isArray(parsed.values)) return parsed.values as string[];
          const truthy = Object.entries(parsed as Record<string, any>)
            .filter(([_, v]) => !!v)
            .map(([k]) => k);
          return truthy.length ? truthy : null;
        }
      } catch {}
      return null;
    }
    if (typeof val === 'object') {
      if (Array.isArray(val.selected_values)) return val.selected_values as string[];
      if (Array.isArray(val.selected)) return val.selected as string[];
      if (Array.isArray(val.values)) return val.values as string[];
      const truthy = Object.entries(val as Record<string, any>)
        .filter(([_, v]) => !!v)
        .map(([k]) => k);
      return truthy.length ? truthy : null;
    }
    return null;
  };

  const renderAnswerValue = (answer: any, allAnswers: any[]) => {
    const text = typeof answer.value_text === 'string' ? answer.value_text.trim() : '';
    if (text) return text;

    const values = normalizeValueJson(answer.value_json);
    if (values && values.length) {
      const selectedValues = values.map((value: string) => {
        if (value === 'Other?' || value === 'other' || value === 'Other') {
          // Try to find the corresponding "other" field for any question
          const otherFieldCode = `${answer.question_code}_other`;
          const otherAnswer = allAnswers.find((a) => a.question_code === otherFieldCode);
          const otherText = typeof otherAnswer?.value_text === 'string' ? otherAnswer.value_text.trim() : '';
          return otherText ? `Other: ${otherText}` : 'Other';
        }
        return value;
      });
      return selectedValues.join('\n');
    }

    return 'No answer provided';
  };

  const getSectionEmoji = (section: string) => {
    const sectionLower = section?.toLowerCase() || '';
    if (sectionLower.includes('focus')) return '🎯';
    if (sectionLower.includes('timeframe') || sectionLower.includes('time')) return '⏳';
    if (sectionLower.includes('portfolio') || sectionLower.includes('property')) return '🏘️';
    if (sectionLower.includes('preference')) return '💡';
    if (sectionLower.includes('location') || sectionLower.includes('cities')) return '📍';
    if (sectionLower.includes('budget') || sectionLower.includes('finance')) return '💰';
    if (sectionLower.includes('support') || sectionLower.includes('help')) return '🤝';
    return '📋';
  };

  const getQuestionEmoji = (ordinal: number) => {
    const emojiMap = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return ordinal <= 10 ? emojiMap[ordinal - 1] : '📝';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading campaign...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Campaign not found.</p>
            <Link to="/campaigns">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/campaigns">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-8 w-8" />
            {campaign.name || 'Unnamed Campaign'}
          </h1>
          <p className="text-muted-foreground">Campaign details and conversation</p>
        </div>

        {/* Campaign Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Campaign Name</h4>
                <p className="text-foreground">{campaign.name || 'Unnamed Campaign'}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Contact</h4>
                {campaign.contacts ? (
                  <Link 
                    to={`/contacts/${campaign.contacts.id}`}
                    className="text-primary hover:underline"
                  >
                    {campaign.contacts.first_name} {campaign.contacts.last_name}
                  </Link>
                ) : (
                  <p className="text-muted-foreground">No contact assigned</p>
                )}
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                <Badge variant={getStatusBadgeVariant(campaign.status)}>
                  {campaign.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions and Answers */}
        <Card>
          <CardHeader>
            <CardTitle>Questions & Answers</CardTitle>
            <CardDescription>
              {answers?.length || 0} questions answered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {answers && answers.length > 0 ? (
              <div className="space-y-6">
                {(() => {
                  const filteredAnswers = answers
                    .filter(answer => answer.questions && !answer.question_code?.endsWith('_other'))
                    .sort((a, b) => (a.questions?.ordinal || 0) - (b.questions?.ordinal || 0));

                  const groupedBySection = filteredAnswers.reduce((acc: any, answer) => {
                    const section = answer.questions?.section || 'Other';
                    if (!acc[section]) acc[section] = [];
                    acc[section].push(answer);
                    return acc;
                  }, {});

                  return Object.entries(groupedBySection).map(([section, sectionAnswers]: [string, any]) => (
                    <div key={section} className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          {getSectionEmoji(section)} {section}
                        </h3>
                      </div>
                      {sectionAnswers.map((answer: any) => (
                        <div key={answer.id} className="border-l-4 border-primary/20 pl-4 py-2">
                          <div className="mb-2">
                            <h4 className="font-medium text-foreground whitespace-pre-wrap flex items-start gap-2">
                              <span className="text-lg">{getQuestionEmoji(answer.questions?.ordinal || 1)} ✅</span>
                              <span>{formatQuestionText(answer.questions?.text || '')}</span>
                            </h4>
                          </div>
                          <div className="bg-muted/30 rounded-md p-3 ml-8">
                            <p className="text-foreground whitespace-pre-wrap">
                              {renderAnswerValue(answer, answers)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Answered: {formatInTimeZone(
                                new Date(answer.answered_at),
                                'Australia/Sydney',
                                'dd/MM/yyyy HH:mm'
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <p className="text-muted-foreground">No questions answered yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Conversation Transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversation Transcript
            </CardTitle>
            <CardDescription>
              {messages?.length || 0} messages in conversation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message: any, index: number) => (
                  <div key={message.id} className="space-y-2">
                    <div className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender_type === 'user' 
                          ? 'bg-primary text-primary-foreground ml-auto' 
                          : 'bg-muted'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.sender_display || message.sender_type}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatInTimeZone(
                              new Date(message.sent_at),
                              'Australia/Sydney',
                              'dd/MM/yyyy HH:mm:ss'
                            )}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                      </div>
                    </div>
                    {index < messages.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No messages in conversation yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CampaignDetail;