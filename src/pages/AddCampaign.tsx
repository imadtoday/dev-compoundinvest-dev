import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AddCampaign = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    contact_id: "",
    workflow_1_status: "CONSENT_PENDING",
    engagement_fee: "",
    success_fee: "",
    notes: ""
  });

  const [answers, setAnswers] = useState<{ [key: string]: { values: string[], letters?: string[], text?: string } }>({});

  // Fetch contacts for the dropdown
  const { data: contacts } = useQuery({
    queryKey: ['contacts-dropdown'],
    queryFn: async () => {
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .order('first_name', { ascending: true });
      
      return data || [];
    }
  });

  // Fetch questions for the form
  const { data: questions } = useQuery({
    queryKey: ['questions-form'],
    queryFn: async () => {
      const { data } = await supabase
        .from('questions')
        .select(`
          *,
          questionnaires!inner (
            id,
            name,
            is_active
          )
        `)
        .eq('questionnaires.is_active', true)
        .order('ordinal', { ascending: true });
      
      return data || [];
    }
  });

  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/,/g, '')) || null;
  };

  const handleCurrencyInput = (value: string, field: string) => {
    // Remove any non-digit characters
    const numericValue = value.replace(/[^\d]/g, '');
    
    // Format with commas
    if (numericValue) {
      const formatted = parseInt(numericValue).toLocaleString('en-US');
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: '' }));
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

  const getQuestionOptions = (question: any) => {
    if (!question.options_json?.options) return [];
    return question.options_json.options;
  };

  const getOptionText = (question: any, letter: string) => {
    // For Yes/No questions, just show Yes or No
    if (['own_properties', 'finance_status'].includes(question.code)) {
      return letter === 'Yes' ? 'Yes' : 'No';
    }
    
    // Map letters to actual option text based on question content
    const questionText = question.text;
    const lines = questionText.split('\n');
    
    for (const line of lines) {
      if (line.trim().startsWith(`${letter})`)) {
        return line.replace(`${letter})`, '').replace(/\*/g, '').trim();
      }
    }
    
    // Fallback mappings for specific questions
    const specificMappings: { [key: string]: { [key: string]: string } } = {
      'current_focus': {
        'A': 'Building – just getting started or buying your first 1–2 properties',
        'B': 'Consolidating – own a few and strengthening your position', 
        'C': 'Expanding – scaling up the portfolio with new acquisitions',
        'D': 'Other'
      },
      'timeframe': {
        'A': '0–5 years',
        'B': '5–10 years', 
        'C': '10–15 years',
        'D': '15–25 years',
        'E': 'Over 25 years'
      },
      'investment_timing': {
        'A': 'Immediately',
        'B': 'Within 3 months',
        'C': '3–6 months', 
        'D': '6+ months'
      },
      'budget_range': {
        'A': 'Under $500k',
        'B': '$500k–$750k',
        'C': '$750k–$1m',
        'D': '$1m–$1.5m',
        'E': '$1.5m+'
      },
      'cities': {
        'A': 'Sydney', 'B': 'Melbourne', 'C': 'Brisbane', 'D': 'Adelaide',
        'E': 'Perth', 'F': 'Canberra', 'G': 'Hobart', 'H': 'Darwin',
        'I': 'Regional areas', 'J': 'Other'
      }
    };
    
    return specificMappings[question.code]?.[letter] || `Option ${letter}`;
  };

  const handleAnswerChange = (questionCode: string, values: string[], letters?: string[], text?: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionCode]: { values, letters, text }
    }));
  };

  const handleCheckboxChange = (questionCode: string, optionLetter: string, optionValue: string, checked: boolean) => {
    const currentAnswer = answers[questionCode] || { values: [], letters: [] };
    let newValues = [...(currentAnswer.values || [])];
    let newLetters = [...(currentAnswer.letters || [])];

    if (checked) {
      if (!newValues.includes(optionValue)) {
        newValues.push(optionValue);
        newLetters.push(optionLetter);
      }
    } else {
      newValues = newValues.filter(v => v !== optionValue);
      newLetters = newLetters.filter(l => l !== optionLetter);
    }

    handleAnswerChange(questionCode, newValues, newLetters, currentAnswer.text);
  };

  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      // Determine base domain for this project and create the campaign with a client-generated id
      const getProjectDomain = () => {
        const hostname = window.location.hostname;
        
        // If already on custom domain, use it
        if (!hostname.includes('lovableproject.com') && !hostname.includes('lovable.app')) {
          return window.location.origin;
        }
        
        // This is the dev Lovable project, so use dev custom domain
        return 'https://dev-ci.datatube.app';
      };

      const domain = getProjectDomain();
      const newCampaignId = crypto.randomUUID();
      const campaignUrl = `${domain}/campaigns/${newCampaignId}`;
      console.log('AddCampaign domain resolution', { hostname: window.location.hostname, origin: window.location.origin, resolvedDomain: domain, campaignUrl });

      // Create the campaign with precomputed URL
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          id: newCampaignId,
          name: campaignData.name,
          contact_id: campaignData.contact_id,
          status: 'workflow_1',
          workflow_1_status: campaignData.workflow_1_status,
          engagement_fee: campaignData.engagement_fee,
          success_fee: campaignData.success_fee,
          notes: campaignData.notes || null,
          calendly_event_type: null,
          calendly_payload_json: {},
          answers: {},
          answered_questions: [],
          skipped_questions: [],
          campaign_url: campaignUrl
        })
        .select()
        .single();

      console.log('AddCampaign insert result', { campaignId: newCampaignId, campaignUrl, error: campaignError, data: campaign });
      if (campaignError) throw campaignError;

      // Then create campaign answers for any provided answers
      if (campaignData.answers && Object.keys(campaignData.answers).length > 0) {
        const answersToInsert = [];
        
        for (const [questionCode, answerData] of Object.entries(campaignData.answers)) {
          const question = questions?.find(q => q.code === questionCode);
          if (question && (answerData as any).values && (answerData as any).values.length > 0) {
            const answerEntry: any = {
              campaign_id: campaign.id,
              contact_id: campaignData.contact_id,
              question_id: question.id,
              questionnaire_id: question.questionnaire_id,
              question_code: questionCode,
              answered_at: new Date().toISOString(),
              is_confirmed: true
            };

            if (question.type === 'choice' && (answerData as any).letters) {
              // Format as value_json for choice questions
              answerEntry.value_json = {
                selected_letters: (answerData as any).letters,
                selected_values: (answerData as any).values
              };
              answerEntry.interpreted_value = (answerData as any).letters.join(',');
            } else {
              // Text answer (for "other" fields)
              answerEntry.value_text = (answerData as any).text || (answerData as any).values[0];
            }

            answersToInsert.push(answerEntry);
          }
        }

        if (answersToInsert.length > 0) {
          const { error: answersError } = await supabase
            .from('campaign_answers')
            .insert(answersToInsert);

          if (answersError) throw answersError;
        }
      }

      return campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns-list'] });
      toast({
        title: "Campaign Created",
        description: "The campaign has been successfully created.",
      });
      navigate(`/campaigns/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
      console.error("Create campaign error:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Campaign name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.contact_id) {
      toast({
        title: "Validation Error",
        description: "Please select a contact.",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      ...formData,
      engagement_fee: formData.engagement_fee ? parseCurrency(formData.engagement_fee) : null,
      success_fee: formData.success_fee ? parseCurrency(formData.success_fee) : null,
      answers: answers
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/campaigns">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Add New Campaign</h1>
              <p className="text-muted-foreground">Create a new campaign for client engagement</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter campaign name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contact *</Label>
                  <Select value={formData.contact_id} onValueChange={(value) => setFormData(prev => ({ ...prev, contact_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts?.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name} ({contact.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workflow_1_status">Workflow 1 Status</Label>
                  <Select value={formData.workflow_1_status} onValueChange={(value) => setFormData(prev => ({ ...prev, workflow_1_status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSENT_PENDING">Consent pending</SelectItem>
                      <SelectItem value="INTAKE_IN_PROGRESS">Intake in progress</SelectItem>
                      <SelectItem value="COMPLETE">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engagement_fee">Engagement Fee</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="engagement_fee"
                      value={formData.engagement_fee}
                      onChange={(e) => handleCurrencyInput(e.target.value, 'engagement_fee')}
                      placeholder="0"
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="success_fee">Success Fee</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="success_fee"
                      value={formData.success_fee}
                      onChange={(e) => handleCurrencyInput(e.target.value, 'success_fee')}
                      placeholder="0"
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes about this campaign..."
                  rows={4}
                />
              </div>

              {/* Questions Section */}
              {questions && questions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Questionnaire (Optional)</h3>
                      <p className="text-sm text-muted-foreground">These questions can be filled out now or edited later</p>
                    </div>
                    
                    {questions
                      .filter(q => !['current_focus_other', 'cities_other'].includes(q.code)) // Hide Q8 and Q9
                      .map((question, index) => {
                        const visibleIndex = questions.filter(q => !['current_focus_other', 'cities_other'].includes(q.code)).indexOf(question) + 1;
                        const currentAnswer = answers[question.code] || { values: [], letters: [] };
                        
                        return (
                          <div key={question.id}>
                            <div className="space-y-3 p-4 border border-border rounded-lg">
                              <div>
                                <Label className="text-sm font-medium">
                                  {visibleIndex}. {formatQuestionText(question.text)}
                                </Label>
                              </div>
                              
                              {question.type === 'choice' ? (
                                <div className="space-y-3">
                                  {getQuestionOptions(question).map((option) => {
                                    const optionValue = `Option ${option}`;
                                    const isChecked = currentAnswer.letters?.includes(option) || false;
                                    
                                    return (
                                      <div key={option} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`${question.code}-${option}`}
                                          checked={isChecked}
                                          onCheckedChange={(checked) => 
                                            handleCheckboxChange(question.code, option, optionValue, checked === true)
                                          }
                                        />
                                        <Label 
                                          htmlFor={`${question.code}-${option}`}
                                          className="text-sm font-normal cursor-pointer"
                                        >
                                          {['own_properties', 'finance_status'].includes(question.code) 
                                            ? getOptionText(question, option)
                                            : `${option}) ${getOptionText(question, option)}`
                                          }
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <Textarea
                                  value={currentAnswer.text || ""}
                                  onChange={(e) => handleAnswerChange(question.code, [e.target.value], [], e.target.value)}
                                  placeholder="Enter your answer..."
                                  rows={3}
                                />
                              )}
                            </div>
                            
                            {/* Show conditional "other" questions */}
                            {question.code === 'current_focus' && currentAnswer.letters?.includes('D') && (
                              <div className="ml-8 mt-4 space-y-3 p-4 border border-border rounded-lg bg-muted/30">
                                <Label className="text-sm font-medium">
                                  Please describe your other current focus:
                                </Label>
                                <Textarea
                                  value={answers['current_focus_other']?.text || ""}
                                  onChange={(e) => handleAnswerChange('current_focus_other', [e.target.value], [], e.target.value)}
                                  placeholder="Describe your other focus..."
                                  rows={3}
                                />
                              </div>
                            )}
                            
                            {question.code === 'cities' && currentAnswer.letters?.includes('J') && (
                              <div className="ml-8 mt-4 space-y-3 p-4 border border-border rounded-lg bg-muted/30">
                                <Label className="text-sm font-medium">
                                  Which other cities or areas did you have in mind?
                                </Label>
                                <Textarea
                                  value={answers['cities_other']?.text || ""}
                                  onChange={(e) => handleAnswerChange('cities_other', [e.target.value], [], e.target.value)}
                                  placeholder="Enter cities or areas..."
                                  rows={3}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={createCampaignMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {createCampaignMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Campaign
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/campaigns')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddCampaign;