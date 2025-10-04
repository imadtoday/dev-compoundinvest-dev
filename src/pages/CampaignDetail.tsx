import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Megaphone, MessageCircle, Edit3, Save, X, Plus, Trash2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatInTimeZone } from "date-fns-tz";
import { Separator } from "@/components/ui/separator";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: boolean }>({});
  const [editingNoteValues, setEditingNoteValues] = useState<{ [key: string]: string }>({});
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingFees, setEditingFees] = useState(false);
  const [engagementFee, setEngagementFee] = useState("");
  const [successFee, setSuccessFee] = useState("");
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressValue, setAddressValue] = useState("");
  
  // Proposal creation state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [isAskingPurchasingEntity, setIsAskingPurchasingEntity] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const formatCurrency = (value: number | string) => {
    if (!value) return "";
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    return numValue.toLocaleString('en-US');
  };

  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/,/g, '')) || 0;
  };

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
            phone_e164,
            address
          )
        `)
        .eq('id', id)
        .single();
      
      return data;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (campaign) {
      setEngagementFee(campaign.engagement_fee ? formatCurrency(campaign.engagement_fee) : "");
      setSuccessFee(campaign.success_fee ? formatCurrency(campaign.success_fee) : "");
      setAddressValue(campaign.contacts?.address || "");
    }
  }, [campaign]);

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

  console.log('Component answers:', answers);

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

  // Fetch campaign notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["campaign-notes", id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from("campaign_notes")
        .select("*")
        .eq("campaign_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch existing proposals for this campaign
  const { data: proposals = [] } = useQuery({
    queryKey: ["campaign-proposals", id],
    queryFn: async () => {
      if (!id) return [];
      
      // Use a raw SQL query since proposals table isn't in types
      const { data, error } = await supabase
        .from('proposals' as any)
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching proposals:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!id,
  });

  // Realtime updates: refresh proposals when a new one is inserted/updated for this campaign
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`proposals-changes-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'proposals',
        filter: `campaign_id=eq.${id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['campaign-proposals', id] });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'proposals',
        filter: `campaign_id=eq.${id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['campaign-proposals', id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

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
      const selectedValues = values.map((raw: string) => {
        const value = typeof raw === 'string' ? raw.trim() : String(raw);
        const normalized = value
          .toLowerCase()
          .replace(/\*/g, '')
          .replace(/[?!.]/g, '')
          .trim();
        if (normalized === 'other' || normalized.startsWith('other')) {
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

  const formatTextWithBold = (text: string) => {
    if (!text) return text;
    
    // First handle double asterisks ** for bold
    let result = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Then handle single asterisks * for bold (but not if they're already part of double asterisks)
    result = result.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<strong>$1</strong>');
    
    // Return JSX with dangerouslySetInnerHTML to render the HTML
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  const updateAnswer = useMutation({
    mutationFn: async ({ answerId, newValue }: { answerId: string, newValue: string }) => {
      const { data, error } = await supabase
        .from('campaign_answers')
        .update({ value_text: newValue })
        .eq('id', answerId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-answers', id] });
      setEditingAnswer(null);
      setEditValue("");
      toast({
        title: "Answer Updated",
        description: "The answer has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update the answer.",
        variant: "destructive",
      });
      console.error("Update error:", error);
    }
  });

  const handleEditAnswer = (answer: any, allAnswers: any[]) => {
    setEditingAnswer(answer.id);
    setEditValue(renderAnswerValue(answer, allAnswers));
  };

  const handleSaveAnswer = (answerId: string) => {
    updateAnswer.mutate({ answerId, newValue: editValue });
  };

  const handleCancelEdit = () => {
    setEditingAnswer(null);
    setEditValue("");
  };

  // Notes mutations
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from("campaign_notes")
        .insert({ campaign_id: id, content })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-notes", id] });
      setNewNoteContent("");
      toast({
        title: "Note Added",
        description: "The note has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add note.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: string; content: string }) => {
      const { data, error } = await supabase
        .from("campaign_notes")
        .update({ content })
        .eq("id", noteId)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-notes", id] });
      toast({
        title: "Note Updated",
        description: "The note has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update note.",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("campaign_notes")
        .delete()
        .eq("id", noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-notes", id] });
      toast({
        title: "Note Deleted",
        description: "The note has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    },
  });

  // Notes handlers
  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    createNoteMutation.mutate(newNoteContent);
  };

  const handleEditNote = (noteId: string, currentContent: string) => {
    setEditingNotes(prev => ({ ...prev, [noteId]: true }));
    setEditingNoteValues(prev => ({ ...prev, [noteId]: currentContent }));
  };

  const handleSaveNote = (noteId: string) => {
    const content = editingNoteValues[noteId];
    if (!content.trim()) return;
    
    updateNoteMutation.mutate({ noteId, content }, {
      onSuccess: () => {
        setEditingNotes(prev => ({ ...prev, [noteId]: false }));
        setEditingNoteValues(prev => ({ ...prev, [noteId]: "" }));
      }
    });
  };

  const handleCancelNoteEdit = (noteId: string) => {
    setEditingNotes(prev => ({ ...prev, [noteId]: false }));
    setEditingNoteValues(prev => ({ ...prev, [noteId]: "" }));
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  // Fees mutation
  const updateFeesMutation = useMutation({
    mutationFn: async ({ engagementFee, successFee }: { engagementFee: number | null, successFee: number | null }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .update({ 
          engagement_fee: engagementFee,
          success_fee: successFee
        })
        .eq("id", id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-detail", id] });
      setEditingFees(false);
      toast({
        title: "Fees Updated",
        description: "The fees have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update fees.",
        variant: "destructive",
      });
    },
  });

  const handleEditFees = () => {
    setEditingFees(true);
  };

  const handleSaveFees = () => {
    const engagementValue = engagementFee ? parseCurrency(engagementFee) : null;
    const successValue = successFee ? parseCurrency(successFee) : null;
    updateFeesMutation.mutate({ engagementFee: engagementValue, successFee: successValue });
  };

  const handleCancelFeesEdit = () => {
    setEditingFees(false);
    // Reset values to original
    if (campaign) {
      setEngagementFee(campaign.engagement_fee ? formatCurrency(campaign.engagement_fee) : "");
      setSuccessFee(campaign.success_fee ? formatCurrency(campaign.success_fee) : "");
    }
  };

  // Address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async (newAddress: string) => {
      const { data, error } = await supabase
        .from("contacts")
        .update({ address: newAddress || null })
        .eq("id", campaign?.contacts?.id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-detail", id] });
      setEditingAddress(false);
      toast({
        title: "Address Updated",
        description: "The home address has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update the address.",
        variant: "destructive",
      });
    },
  });

  const handleEditAddress = () => {
    setEditingAddress(true);
  };

  const handleSaveAddress = () => {
    updateAddressMutation.mutate(addressValue.trim());
  };

  const handleCancelAddressEdit = () => {
    setEditingAddress(false);
    setAddressValue(campaign?.contacts?.address || "");
  };

  // Proposal creation handlers
  const proposalTemplates = [
    { id: '695126', name: 'CompoundInvest Proposal (Brisbane)' },
    { id: '695124', name: 'CompoundInvest Proposal (Central Coast + Newcastle)' },
    { id: '695123', name: 'CompoundInvest Proposal (Central Coast)' },
    { id: '695121', name: 'CompoundInvest Proposal (Geelong)' },
    { id: '695120', name: 'CompoundInvest Proposal (Melbourne + Central Coast + Newcastle)' },
    { id: '695118', name: 'CompoundInvest Proposal (Melbourne + Central Coast)' },
    { id: '695119', name: 'CompoundInvest Proposal (Melbourne + Geelong)' },
    { id: '695117', name: 'CompoundInvest Proposal (Melbourne + Newcastle)' },
    { id: '678717', name: 'CompoundInvest Proposal (Melbourne)' },
    { id: '695122', name: 'CompoundInvest Proposal (Newcastle)' },
    { id: '695125', name: 'CompoundInvest Proposal (Sydney)' }
  ];

  const getTemplateName = (templateId: string) => {
    const template = proposalTemplates.find(t => t.id === templateId);
    return template?.name || `Template ${templateId}`;
  };

  const getProposalStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'default';
      case 'sent':
        return 'secondary';
      case 'draft':
        return 'outline';
      case 'declined':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleCreateProposal = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a proposal template",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    const missingFields = [];
    
    // Check campaign fields - using contact address as home address
    if (!campaign?.contacts?.address) missingFields.push("Home address");
    if (!campaign?.engagement_fee) missingFields.push("Engagement Fee");
    if (!campaign?.success_fee) missingFields.push("Success Fee");
    
    // Check contact fields
    if (!campaign?.contacts?.first_name) missingFields.push("Contact first name");
    if (!campaign?.contacts?.last_name) missingFields.push("Contact last name");
    if (!campaign?.contacts?.email) missingFields.push("Contact email");
    if (!campaign?.contacts?.phone_e164) missingFields.push("Contact phone");
    
    // Check specific answers (questions 1, 2, 6, and 7)
    const requiredQuestions = [1, 2, 6, 7];
    console.log('Available answers:', answers.map(a => ({ ordinal: a.questions?.ordinal, value: a.interpreted_value })));
    requiredQuestions.forEach(questionNumber => {
      const answer = answers.find(a => a.questions?.ordinal === questionNumber);
      console.log(`Question ${questionNumber} answer:`, answer);
      if (!answer?.interpreted_value || answer.interpreted_value.trim() === '') {
        missingFields.push(`Answer to question ${questionNumber}`);
      }
    });
    console.log('Missing fields:', missingFields);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Information",
        description: `Please make sure the following fields are filled out before attempting to create a proposal: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsCreatingProposal(true);
    
    try {
      const selectedTemplateInfo = proposalTemplates.find(t => t.id === selectedTemplate);
      
      const webhookUrl = 'https://datatube.app.n8n.cloud/webhook/faf7ed5b-7569-4750-b59a-9b488b67ebcd';
      const queryParams = new URLSearchParams({
        campaignId: campaign?.id || '',
        contactId: campaign?.contact_id || '',
        template_id: selectedTemplate,
        template_name: selectedTemplateInfo?.name || '',
        name: campaign?.name || '',
        contactName: `${campaign?.contacts?.first_name} ${campaign?.contacts?.last_name}`,
        contactEmail: campaign?.contacts?.email || '',
        engagementFee: campaign?.engagement_fee?.toString() || '',
        successFee: campaign?.success_fee?.toString() || '',
        answers: JSON.stringify(answers),
        timestamp: new Date().toISOString(),
      });
      
      const response = await fetch(`${webhookUrl}?${queryParams}`, {
        method: 'GET',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Proposal creation workflow has been triggered successfully",
        });
        setSelectedTemplate('');
        // Invalidate and refetch proposals to show the new proposal
        queryClient.invalidateQueries({ queryKey: ["campaign-proposals", id] });
      } else {
        throw new Error('Failed to trigger workflow');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast({
        title: "Error",
        description: "Failed to create proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProposal(false);
    }
  };

  const handleCurrencyInput = (value: string, setter: (val: string) => void) => {
    // Remove any non-digit characters
    const numericValue = value.replace(/[^\d]/g, '');
    
    // Format with commas
    if (numericValue) {
      const formatted = parseInt(numericValue).toLocaleString('en-US');
      setter(formatted);
    } else {
      setter('');
    }
  };

  const handleAskPurchasingEntity = async () => {
    setIsAskingPurchasingEntity(true);
    
    try {
      const baseUrl = 'https://datatube.app.n8n.cloud/webhook/handleAskPurchasingEntity';
      
      // Create URL with query parameters
      const params = new URLSearchParams({
        campaignId: campaign?.id || '',
        campaign_name: campaign?.name || '',
        contact_id: campaign?.contacts?.id || '',
        contact_first_name: campaign?.contacts?.first_name || '',
        contact_last_name: campaign?.contacts?.last_name || '',
        contact_email: campaign?.contacts?.email || '',
        contact_phone: campaign?.contacts?.phone_e164 || '',
        contact_address: campaign?.contacts?.address || '',
        timestamp: new Date().toISOString(),
      });

      const webhookUrl = `${baseUrl}?${params.toString()}`;
      
      console.log('Triggering GET webhook with URL:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
      });

      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);

      if (response.ok) {
        toast({
          title: "Success",
          description: "Purchasing entity details request has been sent",
        });
      } else {
        const responseText = await response.text();
        console.log('Response body:', responseText);
        throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error triggering webhook:', error);
      toast({
        title: "Error",
        description: `Failed to send request: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsAskingPurchasingEntity(false);
    }
  };

  const formatSydneyTime = (date: string) => {
    return formatInTimeZone(new Date(date), 'Australia/Sydney', 'MMM d, yyyy h:mm a');
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <h4 className="font-medium text-sm text-muted-foreground">Workflow</h4>
                <Badge variant={getStatusBadgeVariant(campaign.status)}>
                  {campaign.status === 'workflow_1' ? 'Workflow 1' : 
                   campaign.status === 'workflow_2' ? 'Workflow 2' : 
                   campaign.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Workflow Status</h4>
                {campaign.status === 'workflow_1' && (campaign as any).workflow_1_status && (
                  <Badge variant="secondary" className="font-medium px-3 py-1">
                    {((campaign as any).workflow_1_status as string).replace('_', ' ').toUpperCase()}
                  </Badge>
                )}
                {campaign.status === 'workflow_2' && (campaign as any).workflow_2_status && (
                  <Badge variant="secondary" className="font-medium px-3 py-1">
                    {((campaign as any).workflow_2_status as string).replace('_', ' ').toUpperCase()}
                  </Badge>
                )}
                {campaign.status === 'workflow_4' && (campaign as any).workflow_4_status && (
                  <Badge variant="secondary" className="font-medium px-3 py-1">
                    {((campaign as any).workflow_4_status as string).replace('_', ' ').toUpperCase()}
                  </Badge>
                )}
                {!['workflow_1', 'workflow_2', 'workflow_4'].includes(campaign.status) && (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                onClick={handleAskPurchasingEntity}
                variant="outline"
                className="mb-4"
                disabled={isAskingPurchasingEntity}
              >
                {isAskingPurchasingEntity ? "Sending..." : "Ask for Purchasing Entity Details"}
              </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-muted-foreground">Home Address</h4>
                {!editingAddress && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditAddress}
                    className="flex items-center gap-1 h-6 px-2"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </Button>
                )}
              </div>
              {editingAddress ? (
                <div className="space-y-3">
                  <Textarea
                    value={addressValue}
                    onChange={(e) => setAddressValue(e.target.value)}
                    placeholder="Enter home address..."
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveAddress}
                      disabled={updateAddressMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      <Save className="h-3 w-3" />
                      {updateAddressMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelAddressEdit}
                      className="flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground whitespace-pre-wrap">
                  {addressValue || <span className="text-muted-foreground italic">No address entered</span>}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Existing Proposals */}
        {proposals.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Existing Proposals
                  </CardTitle>
                  <CardDescription>
                    Proposals that have been created for this campaign
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await fetch('https://datatube.app.n8n.cloud/webhook-test/1928db19-a525-43da-8564-16f4ac4dcb7a');
                        setLastSyncTime(new Date());
                        toast({ title: "Sync initiated", description: "Proposal platform sync has been triggered" });
                      } catch (error) {
                        toast({ title: "Sync failed", description: "Failed to sync with proposal platform", variant: "destructive" });
                      }
                    }}
                  >
                    Proposal Platform Sync
                  </Button>
                  {lastSyncTime && (
                    <p className="text-sm text-muted-foreground">
                      Last synced: {formatInTimeZone(lastSyncTime, 'America/New_York', 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposals.map((proposal: any) => (
                  <div key={proposal.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-foreground">
                          {getTemplateName(proposal.template_id)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Created: {formatSydneyTime(proposal.created_at)}
                        </p>
                      </div>
                      <Badge variant={getProposalStatusBadgeVariant(proposal.proposal_status)}>
                        {proposal.proposal_status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      {proposal.proposal_preview_url && (
                        <a 
                          href={proposal.proposal_preview_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                        >
                          <FileText className="h-4 w-4" />
                          Preview Proposal
                        </a>
                      )}
                      
                      {proposal.proposal_editor_url && (
                        <a 
                          href={proposal.proposal_editor_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit/Send Proposal
                        </a>
                      )}
                    </div>
                    
                    {proposal.betterproposals_proposal_id && (
                      <p className="text-xs text-muted-foreground">
                        Proposal ID: {proposal.betterproposals_proposal_id}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proposal Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Proposal
            </CardTitle>
            <CardDescription>
              Select a template and create a proposal for this campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Proposal Template
                </label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a proposal template" />
                  </SelectTrigger>
                  <SelectContent>
                    {proposalTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateProposal}
                disabled={!selectedTemplate || isCreatingProposal}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {isCreatingProposal ? 'Creating...' : 'Create Proposal'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This will trigger an automated workflow to create a proposal using the selected template and campaign data.
            </p>
          </CardContent>
        </Card>

        {/* Questions and Answers with Fees and Notes */}
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
          <ResizablePanel defaultSize={65} minSize={40}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Questions & Answers</CardTitle>
                <CardDescription>
                  {answers?.filter(answer => answer.questions && !answer.question_code?.endsWith('_other')).length || 0} questions answered
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[calc(100vh-16rem)]">
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
                      {sectionAnswers.map((answer: any) => (
                        <div key={answer.id} className="border-l-4 border-primary/20 pl-4 py-2">
                          <div className="mb-2">
                            <h4 className="font-medium text-foreground whitespace-pre-wrap">
                              {formatTextWithBold(formatQuestionText(answer.questions?.text || ''))}
                            </h4>
                          </div>
                          <div className="bg-muted/30 rounded-md p-3 ml-8 relative group">
                            {editingAnswer === answer.id ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="min-h-[80px] resize-none"
                                  placeholder="Enter answer..."
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveAnswer(answer.id)}
                                    disabled={updateAnswer.isPending}
                                    className="flex items-center gap-1"
                                  >
                                    <Save className="h-3 w-3" />
                                    {updateAnswer.isPending ? 'Saving...' : 'Save'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="flex items-center gap-1"
                                  >
                                    <X className="h-3 w-3" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-foreground whitespace-pre-wrap">
                                  {formatTextWithBold(renderAnswerValue(answer, answers))}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditAnswer(answer, answers)}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 h-8 px-2"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Edit
                                </Button>
                              </>
                            )}
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
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Fees and Notes Section */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="h-full space-y-4">
              {/* Fees Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      💰 Fees
                    </span>
                    {!editingFees && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleEditFees}
                        className="flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingFees ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Engagement Fee</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            value={engagementFee}
                            onChange={(e) => handleCurrencyInput(e.target.value, setEngagementFee)}
                            placeholder="0"
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Success Fee</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            value={successFee}
                            onChange={(e) => handleCurrencyInput(e.target.value, setSuccessFee)}
                            placeholder="0"
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveFees}
                          disabled={updateFeesMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <Save className="h-3 w-3" />
                          {updateFeesMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelFeesEdit}
                          className="flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Engagement Fee</h4>
                        <p className="text-foreground">${campaign?.engagement_fee ? formatCurrency(campaign.engagement_fee) : '0'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Success Fee</h4>
                        <p className="text-foreground">${campaign?.success_fee ? formatCurrency(campaign.success_fee) : '0'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      📝 Notes
                      <span className="text-sm font-normal text-muted-foreground">
                        {notes.length} notes
                      </span>
                    </span>
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100vh-16rem)]">
                {/* Add new note */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-dashed border-border">
                  <div className="relative">
                    <Textarea
                      placeholder="Add a new note..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="min-h-[100px] resize-none border-0 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <Button 
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim() || createNoteMutation.isPending}
                    className="w-full h-10"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createNoteMutation.isPending ? "Adding..." : "Add Note"}
                  </Button>
                </div>

                {/* Notes list */}
                {notesLoading ? (
                  <div className="text-center text-muted-foreground">Loading notes...</div>
                ) : notes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No notes yet. Add your first note above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note: any) => (
                      <div key={note.id} className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        {editingNotes[note.id] ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editingNoteValues[note.id]}
                              onChange={(e) => setEditingNoteValues(prev => ({ 
                                ...prev, 
                                [note.id]: e.target.value 
                              }))}
                              className="min-h-[100px] resize-none focus-visible:ring-1 focus-visible:ring-primary/50"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNote(note.id)}
                                disabled={updateNoteMutation.isPending}
                                className="h-8"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelNoteEdit(note.id)}
                                className="h-8"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="group">
                            <p className="text-sm text-foreground whitespace-pre-wrap mb-3 leading-relaxed">{note.content}</p>
                            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                              <div className="text-xs text-muted-foreground">
                                <div>{formatSydneyTime(note.created_at)}</div>
                                {note.updated_at !== note.created_at && (
                                  <div className="text-muted-foreground/70">Edited {formatSydneyTime(note.updated_at)}</div>
                                )}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditNote(note.id, note.content)}
                                  className="h-7 w-7 p-0 hover:bg-muted"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                                  disabled={deleteNoteMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

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
                             {(message.sender_type === 'user' || (message.sender_display || '').toLowerCase() === 'you')
                               ? (campaign.contacts?.first_name || 'Contact')
                               : (message.sender_display || message.sender_type)}
                           </span>
                          <span className="text-xs opacity-70">
                            {formatInTimeZone(
                              new Date(message.sent_at),
                              'Australia/Sydney',
                              'dd/MM/yyyy HH:mm:ss'
                            )}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{formatTextWithBold(message.body)}</p>
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