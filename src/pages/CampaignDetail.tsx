import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Megaphone, MessageCircle, Edit3, Save, X, Plus, Trash2, FileText, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const [isSyncingProposals, setIsSyncingProposals] = useState(false);
  
  // Navigation state
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Template ID to name mapping
  const getTemplateName = (templateId: string) => {
    const templateMap: Record<string, string> = {
      '695126': 'CompoundInvest Proposal (Brisbane)',
      '695124': 'CompoundInvest Proposal (Central Coast + Newcastle)',
      '695123': 'CompoundInvest Proposal (Central Coast)',
      '695121': 'CompoundInvest Proposal (Geelong)',
      '695120': 'CompoundInvest Proposal (Melbourne + Central Coast + Newcastle)',
      '695118': 'CompoundInvest Proposal (Melbourne + Central Coast)',
      '695119': 'CompoundInvest Proposal (Melbourne + Geelong)',
      '695117': 'CompoundInvest Proposal (Melbourne + Newcastle)',
      '678717': 'CompoundInvest Proposal (Melbourne)',
      '695122': 'CompoundInvest Proposal (Newcastle)',
      '695125': 'CompoundInvest Proposal (Sydney)',
    };
    return templateMap[templateId] || templateId;
  };

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
            ordinal,
            questionnaire_id
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

  const { data: notes = [] } = useQuery({
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

  const { data: proposals = [] } = useQuery({
    queryKey: ["campaign-proposals", id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('proposals' as any)
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false});

      if (error) {
        console.error('Error fetching proposals:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!id,
  });

  const { data: cronSync } = useQuery({
    queryKey: ["cron-sync"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cron_sync' as any)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching cron sync:', error);
        return null;
      }
      return data ? (data as any as { id: number; created_at: string; updated_at: string }) : null;
    },
  });

  // Filter answers by questionnaire
  const workflow1Answers = answers?.filter(a => a.questions?.questionnaire_id === '2bf87f22-142d-4db7-aa2c-9dc6d63da39d') || [];
  const workflow4Answers = answers?.filter(a => a.questions?.questionnaire_id === '134a10e9-3331-4774-9972-2321bf829ec0') || [];

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Get section status - for workflows, use the workflow_x_status field
  const getSectionStatus = (sectionId: string) => {
    if (sectionId === 'workflow1') {
      const status = (campaign as any)?.workflow_1_status;
      if (status === 'complete') return 'complete';
      if (status) return 'in_progress';
      return 'incomplete';
    }
    if (sectionId === 'workflow2') {
      const status = (campaign as any)?.workflow_2_status;
      if (status === 'accepted') return 'complete';
      if (status) return 'in_progress';
      return 'incomplete';
    }
    if (sectionId === 'workflow4') {
      const status = (campaign as any)?.workflow_4_status;
      if (status === 'complete') return 'complete';
      if (status) return 'in_progress';
      return 'incomplete';
    }
    if (sectionId === 'notes') return notes.length > 0 ? 'complete' : 'incomplete';
    if (sectionId === 'transcript') return messages && messages.length > 0 ? 'complete' : 'incomplete';
    return 'complete';
  };

  const getSectionIcon = (status: string, isActive: boolean) => {
    if (status === 'complete') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'in_progress') return <CheckCircle2 className="h-4 w-4 text-orange-500" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete': return 'default';
      case 'new': return 'secondary';
      case 'in_progress': return 'outline';
      default: return 'secondary';
    }
  };

  const handleCurrencyInput = (value: string, setter: (val: string) => void) => {
    const numericValue = value.replace(/[^\d]/g, '');
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

      const response = await fetch(`${baseUrl}?${params.toString()}`, { method: 'GET' });
      if (response.ok) {
        toast({ title: "Success", description: "Purchasing entity details request has been sent" });
      } else {
        throw new Error(`Webhook failed with status ${response.status}`);
      }
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to send request: ${error.message}`, variant: "destructive" });
    } finally {
      setIsAskingPurchasingEntity(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!selectedTemplate || !campaign) return;

    // Check if workflow 1 is complete
    if ((campaign as any).workflow_1_status !== 'complete') {
      toast({
        title: "Workflow 1 Incomplete",
        description: "Please complete Workflow 1 before creating a proposal.",
        variant: "destructive",
      });
      return;
    }

    // Validation
    const missingFields: string[] = [];
    
    // Check contact details
    if (!campaign.contacts?.first_name) missingFields.push("Contact first name");
    if (!campaign.contacts?.last_name) missingFields.push("Contact last name");
    if (!campaign.contacts?.email) missingFields.push("Contact email");
    if (!campaign.contacts?.phone_e164) missingFields.push("Contact phone");
    
    // Check address
    if (!campaign.contacts?.address) missingFields.push("Home address");
    
    // Check fees
    if (!campaign.engagement_fee) missingFields.push("Engagement Fee");
    if (!campaign.success_fee) missingFields.push("Success Fee");
    
    // Check workflow 1 answers for questions 1, 2, 6, and 7
    const requiredQuestionCodes = ['Q1', 'Q2', 'Q6', 'Q7'];
    const workflow1AnswersList = answers?.filter(a => a.questions?.questionnaire_id === '2bf87f22-142d-4db7-aa2c-9dc6d63da39d') || [];
    
    requiredQuestionCodes.forEach(code => {
      const answer = workflow1AnswersList.find(a => a.questions?.code === code);
      if (!answer || !answer.value_text) {
        missingFields.push(`Answer to question ${code.replace('Q', '')}`);
      }
    });
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please make sure the following fields are filled out before attempting to create a proposal: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsCreatingProposal(true);
    try {
      const baseUrl = 'https://datatube.app.n8n.cloud/webhook/faf7ed5b-7569-4750-b59a-9b488b67ebcd';
      const params = new URLSearchParams({
        campaignId: campaign.id,
        name: campaign.name || '',
        contactId: campaign.contacts?.id || '',
        contact_first_name: campaign.contacts?.first_name || '',
        contact_last_name: campaign.contacts?.last_name || '',
        contact_email: campaign.contacts?.email || '',
        contact_phone: campaign.contacts?.phone_e164 || '',
        contact_address: campaign.contacts?.address || '',
        template_id: selectedTemplate,
        template_name: getTemplateName(selectedTemplate),
        engagementFee: campaign.engagement_fee?.toString() || '0',
        successFee: campaign.success_fee?.toString() || '0',
        timestamp: new Date().toISOString(),
      });

      console.log('Creating proposal with params:', Object.fromEntries(params));
      const response = await fetch(`${baseUrl}?${params.toString()}`, { method: 'GET' });
      console.log('Proposal creation response:', response.status, response.ok);
      
      if (response.ok) {
        toast({ title: "Success", description: "Proposal is being created" });
        setSelectedTemplate('');
        
        // Wait a bit for the webhook to complete before refetching
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["campaign-proposals", id] });
        }, 2000);
      } else {
        const errorText = await response.text();
        console.error('Webhook error:', errorText);
        throw new Error(`Webhook failed with status ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Failed to create proposal:', error);
      toast({ title: "Error", description: `Failed to create proposal: ${error.message}`, variant: "destructive" });
    } finally {
      setIsCreatingProposal(false);
    }
  };

  const handleSyncProposals = async () => {
    console.log('Starting proposal sync...');
    setIsSyncingProposals(true);
    try {
      const baseUrl = 'https://datatube.app.n8n.cloud/webhook/1928db19-a525-43da-8564-16f4ac4dcb7a';
      const params = new URLSearchParams({
        campaignId: campaign?.id || '',
        timestamp: new Date().toISOString(),
      });

      console.log('Syncing proposals with params:', Object.fromEntries(params));
      const response = await fetch(`${baseUrl}?${params.toString()}`, { method: 'GET' });
      console.log('Sync response:', response.status, response.ok);
      
      if (response.ok) {
        toast({ title: "Success", description: "Proposals synced from platform" });
        // Wait a moment for the database to update before refreshing
        await new Promise(resolve => setTimeout(resolve, 500));
        queryClient.invalidateQueries({ queryKey: ["campaign-proposals", id] });
        queryClient.invalidateQueries({ queryKey: ["cron-sync"] });
      } else {
        const errorText = await response.text();
        console.error('Sync error:', errorText);
        throw new Error(`Webhook failed with status ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Failed to sync proposals:', error);
      toast({ title: "Error", description: `Failed to sync proposals: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSyncingProposals(false);
    }
  };

  const handleEditFees = () => setEditingFees(true);
  const handleSaveFees = () => {
    const engagementValue = engagementFee ? parseCurrency(engagementFee) : null;
    const successValue = successFee ? parseCurrency(successFee) : null;
    updateFeesMutation.mutate({ engagementFee: engagementValue, successFee: successValue });
  };
  const handleCancelFeesEdit = () => {
    setEditingFees(false);
    if (campaign) {
      setEngagementFee(campaign.engagement_fee ? formatCurrency(campaign.engagement_fee) : "");
      setSuccessFee(campaign.success_fee ? formatCurrency(campaign.success_fee) : "");
    }
  };

  const handleEditAddress = () => setEditingAddress(true);
  const handleSaveAddress = () => updateAddressMutation.mutate(addressValue.trim());
  const handleCancelAddressEdit = () => {
    setEditingAddress(false);
    setAddressValue(campaign?.contacts?.address || "");
  };

  // Mutations
  const deleteCampaignMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Campaign deleted",
        description: "The campaign has been successfully deleted.",
      });
      navigate('/campaigns');
    },
    onError: (error) => {
      toast({
        title: "Error deleting campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFeesMutation = useMutation({
    mutationFn: async ({ engagementFee, successFee }: { engagementFee: number | null, successFee: number | null }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .update({ engagement_fee: engagementFee, success_fee: successFee })
        .eq("id", id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-detail", id] });
      setEditingFees(false);
      toast({ title: "Fees Updated", description: "The fees have been successfully updated." });
    },
  });

  const updateWorkflow1StatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("campaigns")
        .update({ workflow_1_status: newStatus } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-detail", id] });
      toast({ title: "Status Updated", description: "Workflow 1 status has been updated." });
    },
  });

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
      toast({ title: "Address Updated", description: "The home address has been successfully updated." });
    },
  });

  const updateAnswerMutation = useMutation({
    mutationFn: async ({ answerId, newValue }: { answerId: string, newValue: string }) => {
      const { data, error } = await supabase
        .from("campaign_answers")
        .update({ value_text: newValue })
        .eq("id", answerId)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-answers", id] });
      setEditingAnswer(null);
      setEditValue("");
      toast({ title: "Answer Updated", description: "The answer has been successfully updated." });
    },
  });

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
      toast({ title: "Note Added" });
    },
  });

  const formatSydneyTime = (date: string) => {
    return formatInTimeZone(new Date(date), 'Australia/Sydney', 'MMM d, yyyy h:mm a');
  };

  const renderFormattedText = (raw: string) => {
    const text = typeof raw === 'string' ? raw.trim() : '';
    if (!text) return <span className="text-muted-foreground">No content</span>;

    // Normalize newlines and convert escaped \n to real line breaks
    const normalized = text
      .replace(/\r\n/g, '\n')
      .replace(/\\n/g, '\n');

    const lines = normalized.split('\n');

    return (
      <div className="space-y-2">
        {lines.map((line, lineIndex) => {
          // Bold segments wrapped with ** ** or * *
          const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
          return (
            <div key={lineIndex}>
              {parts.map((part, i) => {
                // Handle **text** (double asterisks)
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                // Handle *text* (single asterisks)
                if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                  return <strong key={i}>{part.slice(1, -1)}</strong>;
                }
                return <span key={i}>{part}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderAnswerValue = (answer: any) => {
    return renderFormattedText(typeof answer?.value_text === 'string' ? answer.value_text : '');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto text-center py-8">
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto text-center py-8">
          <p className="text-muted-foreground">Campaign not found.</p>
          <Link to="/campaigns">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const navSections = [
    { id: 'overview', label: 'Campaign Overview', status: 'complete' },
    { id: 'workflow1', label: 'Workflow 1', status: getSectionStatus('workflow1') },
    { id: 'workflow2', label: 'Workflow 2', status: getSectionStatus('workflow2') },
    { id: 'workflow4', label: 'Workflow 4', status: getSectionStatus('workflow4') },
    { id: 'notes', label: 'Notes', status: getSectionStatus('notes') },
    { id: 'transcript', label: 'Transcript', status: getSectionStatus('transcript') },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Top Bar */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Link to="/campaigns">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>
                {(() => {
                  const completedWorkflows = [
                    (campaign as any)?.workflow_1_status === 'complete',
                    (campaign as any)?.workflow_2_status === 'complete',
                    (campaign as any)?.workflow_4_status === 'complete'
                  ].filter(Boolean).length;
                  return `${completedWorkflows} out of 3 Workflows Complete`;
                })()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {campaign.name || 'Campaign Progress'}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto flex gap-6 p-6">
        {/* Left Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <Card className="sticky top-6">
            <CardContent className="p-4">
              <nav className="space-y-1">
                {navSections.map((section) => {
                  const isActive = campaign.status === section.id || (section.id === 'overview');
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-md transition-colors flex items-center gap-2",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      {getSectionIcon(section.status, isActive)}
                      <span className="flex-1 text-sm">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Scrollable Content */}
        <ScrollArea className="flex-1 min-w-0 h-[calc(100vh-180px)]">
          <div className="space-y-6 pr-6 md:pr-8 break-words">
            {/* Campaign Overview Section */}
            <div ref={(el) => (sectionRefs.current['overview'] = el)}>
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
                        <Link to={`/contacts/${campaign.contacts.id}`} className="text-primary hover:underline">
                          {campaign.contacts.first_name} {campaign.contacts.last_name}
                        </Link>
                      ) : (
                        <p className="text-muted-foreground">No contact assigned</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Workflow</h4>
                      <Badge variant={getStatusBadgeVariant(campaign.status)}>
                        {campaign.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    {campaign.scheduled_start && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Scheduled Consultation Call</h4>
                        <p className="text-foreground">
                          {format(toZonedTime(new Date(campaign.scheduled_start), 'Australia/Sydney'), 'PPP p')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Fees Section */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">💰 Fees</h3>
                      {!editingFees && (
                        <Button size="sm" variant="ghost" onClick={handleEditFees}>
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    {editingFees ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Engagement Fee ($)</label>
                          <Input
                            value={engagementFee}
                            onChange={(e) => handleCurrencyInput(e.target.value, setEngagementFee)}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Success Fee ($)</label>
                          <Input
                            value={successFee}
                            onChange={(e) => handleCurrencyInput(e.target.value, setSuccessFee)}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveFees}>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelFeesEdit}>
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground">Engagement Fee</h4>
                          <p className="text-lg font-semibold text-foreground">
                            {campaign.engagement_fee ? `$${formatCurrency(campaign.engagement_fee)}` : <span className="text-muted-foreground italic">Not set</span>}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground">Success Fee</h4>
                          <p className="text-lg font-semibold text-foreground">
                            {campaign.success_fee ? `$${formatCurrency(campaign.success_fee)}` : <span className="text-muted-foreground italic">Not set</span>}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Home Address</h4>
                      {!editingAddress && (
                        <Button size="sm" variant="ghost" onClick={handleEditAddress}>
                          <Edit3 className="h-3 w-3 mr-1" />
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
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveAddress}>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelAddressEdit}>
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground whitespace-pre-wrap break-words">
                        {addressValue || <span className="text-muted-foreground italic">No address entered</span>}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workflow 1 Section */}
            <div ref={(el) => (sectionRefs.current['workflow1'] = el)}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Workflow 1</CardTitle>
                      <CardDescription>{workflow1Answers.length} questions answered</CardDescription>
                    </div>
                    <Select 
                      value={(campaign as any)?.workflow_1_status || 'consent_pending'}
                      onValueChange={(value) => updateWorkflow1StatusMutation.mutate(value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consent_pending">Consent pending</SelectItem>
                        <SelectItem value="intake_in_progress">Intake in progress</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {workflow1Answers.length > 0 ? (
                    <div className="space-y-4">
                      {workflow1Answers.map((answer) => (
                        <div key={answer.id} className="border-b border-border pb-4 last:border-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="font-medium text-sm flex-1">{renderFormattedText(answer.questions?.text ?? '')}</div>
                            {editingAnswer !== answer.id && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setEditingAnswer(answer.id);
                                  setEditValue(answer.value_text || "");
                                }}
                              >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                          {editingAnswer === answer.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="min-h-[80px]"
                              />
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => updateAnswerMutation.mutate({ answerId: answer.id, newValue: editValue })}
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditingAnswer(null);
                                    setEditValue("");
                                  }}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-foreground break-words">{renderAnswerValue(answer)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No questions answered yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Workflow 2 Section */}
            <div ref={(el) => (sectionRefs.current['workflow2'] = el)}>
              <Card>
                <CardHeader>
                  <CardTitle>Workflow 2 - Proposals</CardTitle>
                  <CardDescription>{proposals.length} proposals created</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sync Proposals Button */}
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Proposal Platform Sync
                    </h3>
                    <Button
                      onClick={handleSyncProposals}
                      variant="outline"
                      disabled={isSyncingProposals}
                      className="w-full"
                    >
                      {isSyncingProposals ? "Syncing..." : "Sync Proposals from Platform"}
                    </Button>
                    {cronSync?.updated_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last synced: {formatSydneyTime(cronSync.updated_at)}
                      </p>
                    )}
                  </div>

                  {/* Create Proposal Section */}
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Create New Proposal
                    </h3>
                    <div className="flex gap-2">
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select proposal template..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="678717">CompoundInvest Proposal (Melbourne)</SelectItem>
                          <SelectItem value="695117">CompoundInvest Proposal (Melbourne + Newcastle)</SelectItem>
                          <SelectItem value="695118">CompoundInvest Proposal (Melbourne + Central Coast)</SelectItem>
                          <SelectItem value="695119">CompoundInvest Proposal (Melbourne + Geelong)</SelectItem>
                          <SelectItem value="695120">CompoundInvest Proposal (Melbourne + Central Coast + Newcastle)</SelectItem>
                          <SelectItem value="695121">CompoundInvest Proposal (Geelong)</SelectItem>
                          <SelectItem value="695122">CompoundInvest Proposal (Newcastle)</SelectItem>
                          <SelectItem value="695123">CompoundInvest Proposal (Central Coast)</SelectItem>
                          <SelectItem value="695124">CompoundInvest Proposal (Central Coast + Newcastle)</SelectItem>
                          <SelectItem value="695125">CompoundInvest Proposal (Sydney)</SelectItem>
                          <SelectItem value="695126">CompoundInvest Proposal (Brisbane)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleCreateProposal}
                        disabled={!selectedTemplate || isCreatingProposal}
                      >
                        {isCreatingProposal ? "Creating..." : "Create Proposal"}
                      </Button>
                    </div>
                  </div>

                  {/* Existing Proposals List */}
                  {proposals.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Existing Proposals</h3>
                      {proposals.map((proposal: any) => (
                        <div key={proposal.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="font-medium flex-1">{getTemplateName(proposal.template_id)}</h4>
                            <Badge className="shrink-0">{proposal.proposal_status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">Created: {formatSydneyTime(proposal.created_at)}</p>
                          <div className="flex flex-wrap gap-2">
                            {proposal.proposal_preview_url && (
                              <a 
                                href={proposal.proposal_preview_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Proposal Preview
                                </Button>
                              </a>
                            )}
                            {proposal.proposal_editor_url && (
                              <a 
                                href={proposal.proposal_editor_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm">
                                  <Edit3 className="h-3 w-3 mr-1" />
                                  Edit/Send Proposal
                                </Button>
                              </a>
                            )}
                            {proposal.proposal_url && (
                              <a 
                                href={proposal.proposal_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {proposal.proposal_status === 'sent' ? 'View Live Proposal' : 
                                   proposal.proposal_status === 'accepted' ? 'View Accepted Proposal' : 
                                   'View Proposal'}
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No proposals created yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Workflow 4 Section */}
            <div ref={(el) => (sectionRefs.current['workflow4'] = el)}>
              <Card>
                <CardHeader>
                  <CardTitle>Workflow 4</CardTitle>
                  <CardDescription>{workflow4Answers.length} questions answered</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(campaign as any)?.workflow_2_status !== 'accepted' && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        Workflow 2 must be completed before asking for purchasing entity details.
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={handleAskPurchasingEntity}
                    variant="outline"
                    disabled={isAskingPurchasingEntity || (campaign as any)?.workflow_2_status !== 'accepted'}
                  >
                    {isAskingPurchasingEntity ? "Sending..." : "Ask for Purchasing Entity Details"}
                  </Button>
                  
                  {workflow4Answers.length > 0 ? (
                    <div className="space-y-4">
                      {workflow4Answers.map((answer) => (
                        <div key={answer.id} className="border-b border-border pb-4 last:border-0">
                          <h4 className="font-medium text-sm mb-1">{answer.questions?.text}</h4>
                          <div className="text-foreground break-words">{renderAnswerValue(answer)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No questions answered yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notes Section */}
            <div ref={(el) => (sectionRefs.current['notes'] = el)}>
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>{notes.length} notes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Add a new note..."
                        className="min-h-[80px]"
                      />
                      <Button
                        onClick={() => newNoteContent.trim() && createNoteMutation.mutate(newNoteContent)}
                        disabled={!newNoteContent.trim() || createNoteMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {notes.map((note: any) => (
                      <div key={note.id} className="border border-border rounded-lg p-4">
                        <p className="text-foreground whitespace-pre-wrap break-words">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatSydneyTime(note.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transcript Section */}
            <div ref={(el) => (sectionRefs.current['transcript'] = el)}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Conversation Transcript
                  </CardTitle>
                  <CardDescription>{messages?.length || 0} messages</CardDescription>
                </CardHeader>
                <CardContent>
                  {messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message: any) => (
                        <div key={message.id} className="flex gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{message.sender_display || message.sender_type}</span>
                              <span className="text-xs text-muted-foreground">{formatSydneyTime(message.sent_at)}</span>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap break-words">{message.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No messages yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Delete Campaign Section */}
              <div className="mt-8 pt-8 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Campaign
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the campaign
                        and all associated messages, notes, and data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteCampaignMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Campaign
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CampaignDetail;
