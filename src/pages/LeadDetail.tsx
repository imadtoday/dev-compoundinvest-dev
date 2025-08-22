import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();
      
      return data;
    }
  });

  const [formData, setFormData] = useState({
    lead_fName: '',
    lead_email: '',
    lead_phone: '',
    status: '',
    freshsales_deal_id: '',
    contact_id: '',
    client_id: '',
    last_question_id: 0,
  });

  // Update form data when lead data loads
  useState(() => {
    if (lead) {
      setFormData({
        lead_fName: lead.lead_fName || '',
        lead_email: lead.lead_email || '',
        lead_phone: lead.lead_phone || '',
        status: lead.status || '',
        freshsales_deal_id: lead.freshsales_deal_id || '',
        contact_id: lead.contact_id || '',
        client_id: lead.client_id || '',
        last_question_id: lead.last_question_id || 0,
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: typeof formData) => {
      if (!id) throw new Error('No lead ID');
      
      const { error } = await supabase
        .from('leads')
        .update(updatedData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update lead: " + error.message,
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'handover': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">Loading lead details...</div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">Lead not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <Link to="/leads">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              {lead.lead_fName || 'Unnamed Lead'}
            </h1>
            <p className="text-muted-foreground">Lead details and information</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Lead
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Contact details and basic data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead_fName">Name</Label>
                {isEditing ? (
                  <Input
                    id="lead_fName"
                    value={formData.lead_fName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lead_fName: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{lead.lead_fName || 'N/A'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead_email">Email</Label>
                {isEditing ? (
                  <Input
                    id="lead_email"
                    type="email"
                    value={formData.lead_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, lead_email: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{lead.lead_email || 'N/A'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead_phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="lead_phone"
                    value={formData.lead_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, lead_phone: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{lead.lead_phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                {isEditing ? (
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="handover">Handover</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Internal tracking and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="freshsales_deal_id">Freshsales Deal ID</Label>
                {isEditing ? (
                  <Input
                    id="freshsales_deal_id"
                    value={formData.freshsales_deal_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, freshsales_deal_id: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{lead.freshsales_deal_id || 'N/A'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_id">Contact ID</Label>
                {isEditing ? (
                  <Input
                    id="contact_id"
                    value={formData.contact_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_id: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{lead.contact_id || 'N/A'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID</Label>
                {isEditing ? (
                  <Input
                    id="client_id"
                    value={formData.client_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{lead.client_id || 'N/A'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_question_id">Last Question ID</Label>
                {isEditing ? (
                  <Input
                    id="last_question_id"
                    type="number"
                    value={formData.last_question_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_question_id: parseInt(e.target.value) || 0 }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{lead.last_question_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Created At</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(lead.created_at).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Updated At</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(lead.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Questions and Answers */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Questions & Answers</CardTitle>
              <CardDescription>Interview progress and responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Answered Questions</Label>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(lead.answered_questions) ? lead.answered_questions.length : 0} questions answered
                  </p>
                </div>
                <div>
                  <Label>Skipped Questions</Label>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(lead.skipped_questions) ? lead.skipped_questions.length : 0} questions skipped
                  </p>
                </div>
                <div>
                  <Label>Side Conversation Streak</Label>
                  <p className="text-sm text-muted-foreground">
                    {lead.side_convo_streak} consecutive side conversations
                  </p>
                </div>
              </div>

              {lead.answers && Object.keys(lead.answers).length > 0 && (
                <div className="space-y-2">
                  <Label>Answers</Label>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(lead.answers, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;