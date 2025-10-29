import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Megaphone, MessageCircle, Edit3, Save, X, Plus, Trash2, FileText, CheckCircle2, Circle, AlertCircle, Mail, Settings } from "lucide-react";
import whatsappIcon from "@/assets/whatsapp-icon.png";
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
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: boolean }>({});
  const [editingNoteValues, setEditingNoteValues] = useState<{ [key: string]: string }>({});
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingFees, setEditingFees] = useState(false);
  const [engagementFee, setEngagementFee] = useState("");
  const [successFee, setSuccessFee] = useState("");
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressValue, setAddressValue] = useState("");
  const [editingInvoiceSettings, setEditingInvoiceSettings] = useState(false);
  const [engagementFeeBracket, setEngagementFeeBracket] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  
  // Proposal creation state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [isAskingPurchasingEntity, setIsAskingPurchasingEntity] = useState(false);
  const [isSyncingProposals, setIsSyncingProposals] = useState(false);
  const [watchProposals, setWatchProposals] = useState(false);
  
  // Navigation state
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeSection, setActiveSection] = useState('overview');
  // Scroll container refs
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

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

  const formatWorkflowStatus = (status: string) => {
    return status
      .split('_')
      .map((word, index) => 
        index === 0 
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word.toLowerCase()
      )
      .join(' ');
  };

  const getWorkflowStatusBadgeStyle = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'complete' || lowerStatus === 'accepted') {
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
    } else if (lowerStatus === 'intake_in_progress' || lowerStatus === 'sent' || lowerStatus === 'in_progress') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
    } else if (lowerStatus === 'pending_finance_pre_approval') {
      return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
    } else if (lowerStatus === 'consent_pending') {
      return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
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
    refetchInterval: watchProposals ? 2000 : false,
    refetchOnWindowFocus: true,
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

  // Realtime updates for proposals status changes
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`proposals:${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'proposals',
        filter: `campaign_id=eq.${id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["campaign-proposals", id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  // Fetch all Workflow 1 questions
  const { data: workflow1Questions = [] } = useQuery({
    queryKey: ["workflow1-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('questionnaire_id', '2bf87f22-142d-4db7-aa2c-9dc6d63da39d')
        .order('ordinal', { ascending: true });

      if (error) {
        console.error('Error fetching workflow 1 questions:', error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch all Workflow 4 questions
  const { data: workflow4Questions = [] } = useQuery({
    queryKey: ["workflow4-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('questionnaire_id', '134a10e9-3331-4774-9972-2321bf829ec0')
        .order('ordinal', { ascending: true });

      if (error) {
        console.error('Error fetching workflow 4 questions:', error);
        return [];
      }
      return data || [];
    },
  });

  // Filter answers by questionnaire
  const workflow1Answers = answers?.filter(a => a.questions?.questionnaire_id === '2bf87f22-142d-4db7-aa2c-9dc6d63da39d') || [];
  const workflow4Answers = answers?.filter(a => a.questions?.questionnaire_id === '134a10e9-3331-4774-9972-2321bf829ec0') || [];

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Scroll spy - robust using IntersectionObserver with ratio + nearest fallback
  useEffect(() => {
    const sectionIds = ['overview', 'workflow1', 'workflow2', 'workflow4', 'notes', 'transcript'];

    let observer: IntersectionObserver | null = null;
    let rafId = 0;

    const setup = () => {
      const rootEl = (viewportRef.current ?? (document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null));
      if (!rootEl) {
        rafId = requestAnimationFrame(setup);
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          let bestId: string | null = null;
          let bestRatio = 0;

          entries.forEach((entry) => {
            const id = (entry.target as HTMLElement).dataset.sectionId;
            if (!id) return;
            if (entry.isIntersecting && entry.intersectionRatio >= bestRatio) {
              bestRatio = entry.intersectionRatio;
              bestId = id;
            }
          });

          if (bestId) {
            setActiveSection(bestId);
            return;
          }

          const targetY = 40; // px from top of scroll ROOT
          const baseTop = rootEl.getBoundingClientRect().top;
          const distances = sectionIds
            .map((id) => {
              const el = sectionRefs.current[id];
              if (!el) return { id, dist: Number.POSITIVE_INFINITY };
              const rect = el.getBoundingClientRect();
              const topRelative = rect.top - baseTop;
              return { id, dist: Math.abs(topRelative - targetY) };
            })
            .sort((a, b) => a.dist - b.dist);

          if (distances.length) setActiveSection(distances[0].id);
        },
        {
          root: rootEl,
          rootMargin: '-40px 0px -50% 0px',
          threshold: [0, 0.1, 0.25, 0.4, 0.5, 0.75, 1],
        }
      );

      // Observe each section
      sectionIds.forEach((id) => {
        const el = sectionRefs.current[id];
        if (el) {
          el.setAttribute('data-section-id', id);
          observer!.observe(el);
        }
      });

      // Initial sync aligned to scroll root
      setTimeout(() => {
        const targetY = 40;
        const baseTop = rootEl.getBoundingClientRect().top;
        const distances = sectionIds
          .map((id) => {
            const el = sectionRefs.current[id];
            if (!el) return { id, dist: Number.POSITIVE_INFINITY };
            const rect = el.getBoundingClientRect();
            const topRelative = rect.top - baseTop;
            return { id, dist: Math.abs(topRelative - targetY) };
          })
          .sort((a, b) => a.dist - b.dist);
        if (distances.length) setActiveSection(distances[0].id);
      }, 100);
    };

    setup();

    return () => {
      if (observer) observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

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
    if (sectionId === 'workflow3') {
      const status = (campaign as any)?.workflow_3_status;
      if (status === 'paid') return 'complete';
      if (status === 'pending') return 'in_progress';
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
        // Refresh the campaign data and answers
        queryClient.invalidateQueries({ queryKey: ["campaign", id] });
        queryClient.invalidateQueries({ queryKey: ["campaign-answers", id] });
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
    const requiredQuestionCodes = ['current_focus', 'timeframe', 'budget_range', 'cities'];
    const workflow1AnswersList = answers?.filter(a => a.questions?.questionnaire_id === '2bf87f22-142d-4db7-aa2c-9dc6d63da39d') || [];
    
    requiredQuestionCodes.forEach(code => {
      const answer = workflow1AnswersList.find(a => a.questions?.code === code);
      // Check for value in value_text, value_json, or interpreted_value
      const hasValue = answer && (answer.value_text || answer.value_json || answer.interpreted_value);
      if (!hasValue) {
        const questionNumber = code === 'current_focus' ? '1' : code === 'timeframe' ? '2' : code === 'budget_range' ? '6' : '7';
        missingFields.push(`Answer to question ${questionNumber}`);
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

        // Start polling for the new proposal to appear (handles webhook delay)
        const initialCount = proposals?.length || 0;
        const startTime = Date.now();
        const pollInterval = setInterval(async () => {
          // Invalidate to trigger a refetch
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["campaign-proposals", id] }),
            queryClient.invalidateQueries({ queryKey: ["campaign-detail", id] })
          ]);

          const latest = (queryClient.getQueryData(["campaign-proposals", id]) as any[]) || [];
          const hasNew = latest.length > initialCount || latest.some(p => {
            try { return new Date(p.created_at).getTime() >= startTime; } catch { return false; }
          });

          if (hasNew) {
            clearInterval(pollInterval);
            toast({ title: "Proposal created", description: "Your new proposal is now visible." });
          }

          // Stop polling after 30s to avoid infinite loops
          if (Date.now() - startTime > 30000) {
            clearInterval(pollInterval);
          }
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
    setWatchProposals(true);
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
        // Wait a moment for the database to update before refreshing
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Refetch both queries to update the UI
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["campaign-proposals", id] }),
          queryClient.refetchQueries({ queryKey: ["cron-sync"] })
        ]);
        toast({ title: "Success", description: "Proposals synced from platform" });
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
      // Keep polling proposals briefly to catch delayed platform updates
      setTimeout(() => setWatchProposals(false), 30000);
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

  const handleEditInvoiceSettings = () => setEditingInvoiceSettings(true);
  const handleSaveInvoiceSettings = () => {
    const discountValue = discountAmount ? parseCurrency(discountAmount) : null;
    updateInvoiceSettingsMutation.mutate({ 
      engagementFeeBracket, 
      discountType, 
      discountAmount: discountValue 
    });
  };
  const handleCancelInvoiceSettingsEdit = () => {
    setEditingInvoiceSettings(false);
    setEngagementFeeBracket((campaign as any)?.engagement_fee_bracket || "");
    setDiscountType((campaign as any)?.discount_type || "");
    setDiscountAmount((campaign as any)?.discount_amount ? formatCurrency((campaign as any).discount_amount) : "");
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

  const updateInvoiceSettingsMutation = useMutation({
    mutationFn: async ({ engagementFeeBracket, discountType, discountAmount }: { 
      engagementFeeBracket: string, 
      discountType: string, 
      discountAmount: number | null 
    }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .update({ 
          engagement_fee_bracket: engagementFeeBracket,
          discount_type: discountType,
          discount_amount: discountAmount
        } as any)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-detail", id] });
      setEditingInvoiceSettings(false);
      toast({ title: "Invoice Settings Updated", description: "The invoice settings have been successfully updated." });
    },
  });

  const updateAnswerMutation = useMutation({
    mutationFn: async ({ answerId, newValue }: { answerId: string, newValue: string }) => {
      const { data, error } = await supabase
        .from("campaign_answers")
        .update({ 
          value_text: newValue,
          value_json: null,  // Clear value_json when manually editing
          interpreted_value: null  // Clear interpreted_value when manually editing
        })
        .eq("id", answerId)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-answers", id] });
      setEditingAnswer(null);
      setEditingQuestionId(null);
      setEditValue("");
      toast({ title: "Answer Updated", description: "The answer has been successfully updated." });
    },
  });

  const createAnswerMutation = useMutation({
    mutationFn: async ({ questionId, value }: { questionId: string; value: string }) => {
      const question = workflow1Questions.find(q => q.id === questionId);
      if (!question) throw new Error("Question not found");
      
      const { data, error } = await supabase
        .from("campaign_answers")
        .insert({
          campaign_id: id,
          contact_id: campaign?.contact_id,
          questionnaire_id: question.questionnaire_id,
          question_id: questionId,
          value_text: value,
          is_confirmed: true,
        })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-answers", id] });
      setEditingAnswer(null);
      setEditingQuestionId(null);
      setEditValue("");
      toast({ title: "Answer Added", description: "The answer has been successfully added." });
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

  const hasAnswerContent = (answer: any) => {
    if (!answer) return false;
    
    // Check value_json
    if (answer?.value_json) {
      try {
        const parsed = typeof answer.value_json === 'string' 
          ? JSON.parse(answer.value_json) 
          : answer.value_json;
        
        if (parsed?.selected_values && Array.isArray(parsed.selected_values) && parsed.selected_values.length > 0) {
          const values = parsed.selected_values.filter((v: string) => v && v.trim());
          if (values.length > 0) return true;
        }
      } catch (e) {
        // Continue to check other fields
      }
    }
    
    // Check other fields
    const value = answer?.value_text || answer?.interpreted_value || answer?.raw_text || '';
    return typeof value === 'string' && value.trim().length > 0;
  };

  const renderAnswerValue = (answer: any) => {
    // Try to get the human-readable answer from value_json first
    if (answer?.value_json) {
      try {
        const parsed = typeof answer.value_json === 'string' 
          ? JSON.parse(answer.value_json) 
          : answer.value_json;
        
        if (parsed?.selected_values && Array.isArray(parsed.selected_values) && parsed.selected_values.length > 0) {
          let values = parsed.selected_values.filter((v: string) => v && v.trim());
          
          // Check if "Other" is selected and look up the corresponding _other field
          if (values.some(v => v.toLowerCase().includes('other'))) {
            const questionCode = answer.question_code;
            const otherFieldCode = `${questionCode}_other`;
            
            // Find the answer for the _other field
            const otherAnswer = answers?.find((a: any) => a.question_code === otherFieldCode);
            
            if (otherAnswer) {
              const otherValue = otherAnswer.value_text || otherAnswer.interpreted_value || otherAnswer.raw_text;
              if (otherValue) {
                // Replace "Other" with "Other: <value>"
                values = values.map(v => 
                  v.toLowerCase().includes('other') ? `Other: ${otherValue}` : v
                );
              }
            }
          }
          
          if (values.length > 0) {
            return renderFormattedText(values.join(', '));
          }
        }
      } catch (e) {
        console.error('Error parsing value_json:', e);
      }
    }
    
    // Fall back to other fields
    const value = answer?.value_text || answer?.interpreted_value || answer?.raw_text || '';
    return renderFormattedText(typeof value === 'string' ? value : '');
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
    { id: 'workflow3', label: 'Workflow 3', status: getSectionStatus('workflow3') },
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
                    (campaign as any)?.workflow_2_status === 'accepted',
                    (campaign as any)?.workflow_3_status === 'paid',
                    (campaign as any)?.workflow_4_status === 'complete'
                  ].filter(Boolean).length;
                  return `${completedWorkflows} out of 4 Workflows Complete`;
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
                  const isActive = activeSection === section.id;
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
          <ScrollArea ref={scrollAreaRef} viewportRef={viewportRef} className="flex-1 min-w-0 h-[calc(100vh-180px)]">
            <div className="space-y-6 pr-4 md:pr-6 lg:pr-8 break-words max-w-full min-w-0 overflow-x-hidden">
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
                        {formatWorkflowStatus(campaign.status)}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Workflow Status</h4>
                      {campaign.status === 'workflow_1' && (campaign as any).workflow_1_status && (
                        <Badge className={`font-medium px-3 py-1 ${getWorkflowStatusBadgeStyle((campaign as any).workflow_1_status as string)}`}>
                          {formatWorkflowStatus((campaign as any).workflow_1_status as string)}
                        </Badge>
                      )}
                      {campaign.status === 'workflow_2' && (campaign as any).workflow_2_status && (
                        <Badge className={`font-medium px-3 py-1 ${getWorkflowStatusBadgeStyle((campaign as any).workflow_2_status as string)}`}>
                          {formatWorkflowStatus((campaign as any).workflow_2_status as string)}
                        </Badge>
                      )}
                      {campaign.status === 'workflow_4' && (campaign as any).workflow_4_status && (
                        <Badge className={`font-medium px-3 py-1 ${getWorkflowStatusBadgeStyle((campaign as any).workflow_4_status as string)}`}>
                          {formatWorkflowStatus((campaign as any).workflow_4_status as string)}
                        </Badge>
                      )}
                      {(!['workflow_1', 'workflow_2', 'workflow_4'].includes(campaign.status) || 
                        (campaign.status === 'workflow_1' && !(campaign as any).workflow_1_status) ||
                        (campaign.status === 'workflow_2' && !(campaign as any).workflow_2_status) ||
                        (campaign.status === 'workflow_4' && !(campaign as any).workflow_4_status)) && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                    {campaign.scheduled_start && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Scheduled Consultation Call</h4>
                        <p className="text-foreground">
                          {format(toZonedTime(new Date(campaign.scheduled_start), 'Australia/Sydney'), 'PPP p')}
                        </p>
                      </div>
                    )}
                    {(campaign as any).first_followup && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Followup Sent</h4>
                        <p className="text-foreground">
                          {format(toZonedTime(new Date((campaign as any).first_followup), 'Australia/Sydney'), 'PPP p')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Fees and Invoice Settings Side by Side */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Fees Section */}
                      <div>
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
                      
                      {/* Invoice Settings Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Invoice Settings
                          </h3>
                          {!editingInvoiceSettings && (
                            <Button size="sm" variant="ghost" onClick={handleEditInvoiceSettings}>
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                        {editingInvoiceSettings ? (
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Engagement Fee Bracket</label>
                              <Select value={engagementFeeBracket} onValueChange={setEngagementFeeBracket}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select bracket" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0-0.5m">Engagement Fee Bracket up to $0.5M ($2,000)</SelectItem>
                                  <SelectItem value="0.5m-1m">Engagement Fee Bracket $0.5M to $1M ($2,500)</SelectItem>
                                  <SelectItem value="1m-2m">Engagement Fee Bracket $1M to $2M ($3,000)</SelectItem>
                                  <SelectItem value="over-2m">Engagement Fee Bracket over $2M ($3,500)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-3">Engagement Fee Discount</h4>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Discount Type</label>
                                  <Select value={discountType} onValueChange={setDiscountType}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Select discount type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="recurring">Recurring Customer Discount</SelectItem>
                                      <SelectItem value="referral">Referral Discount</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Discount Amount ($)</label>
                                  <Input
                                    value={discountAmount}
                                    onChange={(e) => handleCurrencyInput(e.target.value, setDiscountAmount)}
                                    placeholder="0"
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveInvoiceSettings}>
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelInvoiceSettingsEdit}>
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground">Engagement Fee Bracket</h4>
                              <p className="text-foreground mt-1">
                                {engagementFeeBracket ? (
                                  (() => {
                                    const brackets: Record<string, string> = {
                                      "0-0.5m": "Engagement Fee Bracket up to $0.5M ($2,000)",
                                      "0.5m-1m": "Engagement Fee Bracket $0.5M to $1M ($2,500)",
                                      "1m-2m": "Engagement Fee Bracket $1M to $2M ($3,000)",
                                      "over-2m": "Engagement Fee Bracket over $2M ($3,500)"
                                    };
                                    return brackets[engagementFeeBracket] || engagementFeeBracket;
                                  })()
                                ) : (
                                  <span className="text-muted-foreground italic">Not set</span>
                                )}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground">Discount Type</h4>
                              <p className="text-foreground mt-1">
                                {discountType ? (
                                  discountType === "recurring" ? "Recurring Customer Discount" : "Referral Discount"
                                ) : (
                                  <span className="text-muted-foreground italic">Not set</span>
                                )}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground">Discount Amount</h4>
                              <p className="text-lg font-semibold text-foreground">
                                {discountAmount ? `$${formatCurrency(discountAmount)}` : <span className="text-muted-foreground italic">Not set</span>}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
                      <CardTitle>Workflow 1 - Intake Questions</CardTitle>
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
                  <div className="space-y-4">
                    {workflow1Questions
                      .filter(question => 
                        question.text !== "Thanks! Could you please describe your other current focus in a few words?" &&
                        question.text !== "Thanks! Which other cities or areas did you have in mind?"
                      )
                      .map((question) => {
                        const answer = workflow1Answers.find(a => a.question_id === question.id);
                        const isEditing = editingQuestionId === question.id || editingAnswer === answer?.id;
                        
                        return (
                          <div key={question.id} className="border-b border-border pb-4 last:border-0">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex-1">
                                <div className="text-sm text-muted-foreground mb-2">Question:</div>
                                <div className="font-medium">{renderFormattedText(question.text)}</div>
                              </div>
                              {!isEditing && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingQuestionId(question.id);
                                    if (answer) {
                                      setEditingAnswer(answer.id);
                                      // Get value from value_text, value_json, or interpreted_value
                                      let currentValue = "";
                                      if (answer.value_text) {
                                        currentValue = answer.value_text;
                                      } else if (answer.value_json) {
                                        try {
                                          const parsed = typeof answer.value_json === 'string' 
                                            ? JSON.parse(answer.value_json) 
                                            : answer.value_json;
                                          if (parsed?.selected_values && Array.isArray(parsed.selected_values)) {
                                            currentValue = parsed.selected_values.filter((v: string) => v && v.trim()).join(', ');
                                          }
                                        } catch (e) {
                                          console.error('Error parsing value_json for edit:', e);
                                        }
                                      } else if (answer.interpreted_value) {
                                        currentValue = answer.interpreted_value;
                                      }
                                      setEditValue(currentValue);
                                    } else {
                                      setEditValue("");
                                    }
                                  }}
                                >
                                  <Edit3 className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                            {isEditing ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="min-h-[80px]"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      if (answer) {
                                        updateAnswerMutation.mutate({ answerId: answer.id, newValue: editValue });
                                      } else {
                                        createAnswerMutation.mutate({ questionId: question.id, value: editValue });
                                      }
                                    }}
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setEditingAnswer(null);
                                      setEditingQuestionId(null);
                                      setEditValue("");
                                    }}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : answer && hasAnswerContent(answer) ? (
                              <div className="mt-2">
                                <div className="text-sm text-muted-foreground mb-1">Answer:</div>
                                <div className="text-foreground break-words font-medium">{renderAnswerValue(answer)}</div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  {formatSydneyTime(answer.created_at)}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <div className="text-sm text-muted-foreground mb-1">Answer:</div>
                                <div className="text-muted-foreground italic">Not Answered</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
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
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="flex-1 basis-0 min-w-0">
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
                        className="shrink-0"
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
                        <div key={proposal.id} className="border border-border rounded-lg p-4 max-w-full overflow-hidden">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="font-medium flex-1 break-words">{getTemplateName(proposal.template_id)}</h4>
                            <Badge 
                              className="shrink-0"
                              variant={
                                proposal.proposal_status === 'accepted' ? 'success' :
                                proposal.proposal_status === 'draft' ? 'warning' :
                                proposal.proposal_status === 'sent' ? 'info' :
                                'default'
                              }
                            >
                              {proposal.proposal_status.charAt(0).toUpperCase() + proposal.proposal_status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">Created: {formatSydneyTime(proposal.created_at)}</p>
                          <div className="flex flex-wrap gap-2 w-full">
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

            {/* Workflow 3 Section */}
            <div ref={(el) => (sectionRefs.current['workflow3'] = el)}>
              <Card>
                <CardHeader>
                  <CardTitle>Workflow 3 - Invoices</CardTitle>
                  <CardDescription>Invoice management and tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">Invoice functionality will be added here.</p>
                </CardContent>
              </Card>
            </div>

            {/* Workflow 4 Section */}
            <div ref={(el) => (sectionRefs.current['workflow4'] = el)}>
              <Card>
                <CardHeader>
                  <CardTitle>Workflow 4 - Purchasing Entity Details</CardTitle>
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
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAskPurchasingEntity}
                      variant="outline"
                      disabled={isAskingPurchasingEntity || (campaign as any)?.workflow_2_status !== 'accepted'}
                    >
                      {isAskingPurchasingEntity ? "Sending..." : "Ask for Purchasing Entity Details"}
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to delete all Workflow 4 answers? This cannot be undone.')) return;
                        
                        try {
                          const { error: deleteError } = await supabase
                            .from('campaign_answers')
                            .delete()
                            .eq('campaign_id', id)
                            .in('question_id', workflow4Answers.map(a => a.question_id));
                          
                          if (deleteError) throw deleteError;

                          const { error: updateError } = await supabase
                            .from('campaigns')
                            .update({ 
                              workflow_4_status: null,
                              status: 'workflow_2'
                            } as any)
                            .eq('id', id);
                          
                          if (updateError) throw updateError;
                          
                          toast({
                            title: "Success",
                            description: "Workflow 4 reset successfully",
                          });
                          
                          queryClient.invalidateQueries({ queryKey: ['campaign-answers', id] });
                          queryClient.invalidateQueries({ queryKey: ['campaign-detail', id] });
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message,
                            variant: "destructive",
                          });
                        }
                      }}
                      variant="destructive"
                    >
                      Temporary Reset
                    </Button>
                  </div>
                  
                  {workflow4Answers.length > 0 ? (
                    <div className="space-y-4">
                      {workflow4Answers.map((answer) => {
                        const isEditing = editingQuestionId === answer.question_id || editingAnswer === answer.id;
                        
                        return (
                          <div key={answer.id} className="border-b border-border pb-4 last:border-0">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex-1">
                                <div className="text-sm text-muted-foreground mb-2">Question:</div>
                                <div className="font-medium">{renderFormattedText(answer.questions?.text || '')}</div>
                              </div>
                              {!isEditing && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingQuestionId(answer.question_id);
                                    setEditingAnswer(answer.id);
                                    // Get value from value_text, value_json, or interpreted_value
                                    let currentValue = "";
                                    if (answer.value_text) {
                                      currentValue = answer.value_text;
                                    } else if (answer.value_json) {
                                      try {
                                        const parsed = typeof answer.value_json === 'string' 
                                          ? JSON.parse(answer.value_json) 
                                          : answer.value_json;
                                        if (parsed?.selected_values && Array.isArray(parsed.selected_values)) {
                                          currentValue = parsed.selected_values.filter((v: string) => v && v.trim()).join(', ');
                                        }
                                      } catch (e) {
                                        console.error('Error parsing value_json for edit:', e);
                                      }
                                    } else if (answer.interpreted_value) {
                                      currentValue = answer.interpreted_value;
                                    }
                                    setEditValue(currentValue);
                                  }}
                                >
                                  <Edit3 className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                            {isEditing ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="min-h-[80px]"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      updateAnswerMutation.mutate({ answerId: answer.id, newValue: editValue });
                                    }}
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setEditingAnswer(null);
                                      setEditingQuestionId(null);
                                      setEditValue("");
                                    }}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <div className="text-sm text-muted-foreground mb-1">Answer:</div>
                                <div className="text-foreground break-words font-medium">
                                  {answer.question_code === 'upload_pre_approval' ? (() => {
                                    let vj: any = answer.value_json;
                                    try { if (typeof vj === 'string') vj = JSON.parse(vj); } catch {}
                                    const filename = vj?.filename ?? vj?.file?.filename ?? vj?.file?.name ?? vj?.files?.[0]?.filename ?? vj?.files?.[0]?.name;
                                    const fileUrl = vj?.file_url ?? vj?.file?.file_url ?? vj?.file?.url ?? vj?.files?.[0]?.file_url ?? vj?.files?.[0]?.url;
                                    if (filename && fileUrl) {
                                      return (
                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                          {filename}
                                        </a>
                                      );
                                    }
                                    if (fileUrl) {
                                      const fallbackName = fileUrl.split('/').pop() || 'View file';
                                      return (
                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                          {fallbackName}
                                        </a>
                                      );
                                    }
                                    return renderAnswerValue(answer);
                                  })() : renderAnswerValue(answer)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  {formatSydneyTime(answer.created_at)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : workflow4Questions.length > 0 ? (
                    <div className="space-y-4">
                      <div className="border-b border-border pb-4">
                        <div className="text-sm text-muted-foreground mb-2">Question:</div>
                        <div className="font-medium mb-3">{renderFormattedText(workflow4Questions[0].text)}</div>
                        <div className="mt-2">
                          <div className="text-sm text-muted-foreground mb-1">Answer:</div>
                          <div className="text-muted-foreground italic">Not Answered</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
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
                    <div className="space-y-3">
                      {messages.map((message: any, index: number) => (
                        <div key={message.id}>
                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {message.sender_type === 'ai_sms' ? (
                                <Mail className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <img src={whatsappIcon} alt="WhatsApp" className="h-7 w-7" />
                              )}
                              <span className="font-semibold text-sm">{message.sender_display || message.sender_type}</span>
                              <span className="text-xs text-muted-foreground">{formatSydneyTime(message.sent_at)}</span>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
                          </div>
                          {index < messages.length - 1 && <Separator className="mt-3" />}
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
