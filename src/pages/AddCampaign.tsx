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
import { ArrowLeft, Plus, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AddCampaign = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    contact_id: "",
    status: "new",
    scheduled_start: "",
    scheduled_end: "",
    engagement_fee: "",
    success_fee: "",
    notes: ""
  });

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

  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name: campaignData.name,
          contact_id: campaignData.contact_id,
          status: campaignData.status,
          scheduled_start: campaignData.scheduled_start || null,
          scheduled_end: campaignData.scheduled_end || null,
          engagement_fee: campaignData.engagement_fee,
          success_fee: campaignData.success_fee,
          notes: campaignData.notes || null,
          calendly_event_type: null,
          calendly_payload_json: {},
          answers: {},
          answered_questions: [],
          skipped_questions: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_start">Scheduled Start</Label>
                  <Input
                    id="scheduled_start"
                    type="datetime-local"
                    value={formData.scheduled_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_start: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_end">Scheduled End</Label>
                  <Input
                    id="scheduled_end"
                    type="datetime-local"
                    value={formData.scheduled_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_end: e.target.value }))}
                  />
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