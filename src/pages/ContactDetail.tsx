import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, User, Megaphone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    lead_fName: "",
    lead_lName: "",
    lead_email: "",
    lead_phone: "",
    status: "",
    freshsales_deal_id: "",
    contact_id: "",
    client_id: "",
  });

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact-detail', id],
    queryFn: async () => {
      // Get contact data only (no campaigns for now)
      const { data: contactData } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (!contactData) return null;
      
      const contact: any = {
        ...contactData,
        campaigns: [] // Empty campaigns array for now
      };
      
      if (contact) {
        setFormData({
          lead_fName: contact.lead_fName || "",
          lead_lName: contact.lead_lName || "",
          lead_email: contact.lead_email || "",
          lead_phone: contact.lead_phone || "",
          status: contact.status || "",
          freshsales_deal_id: contact.freshsales_deal_id || "",
          contact_id: contact.contact_id || "",
          client_id: contact.client_id || "",
        });
      }
      
      return contact;
    },
    enabled: !!id
  });

  const updateContact = useMutation({
    mutationFn: async (updatedData: any) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['contacts-list'] });
      toast({
        title: "Contact Updated",
        description: "Contact information has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update contact information.",
        variant: "destructive",
      });
      console.error("Update error:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateContact.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">Loading contact details...</div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Contact not found</p>
              <Button 
                onClick={() => navigate('/contacts')} 
                className="mt-4"
              >
                Back to Contacts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/contacts')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contacts
          </Button>
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {contact?.lead_fName} {contact?.lead_lName || ''}
              </h1>
              <p className="text-muted-foreground">Contact Details</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Edit and update contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lead_fName">First Name</Label>
                      <Input
                        id="lead_fName"
                        value={formData.lead_fName}
                        onChange={(e) => handleInputChange('lead_fName', e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lead_lName">Last Name</Label>
                      <Input
                        id="lead_lName"
                        value={formData.lead_lName}
                        onChange={(e) => handleInputChange('lead_lName', e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="lead_email">Email</Label>
                    <Input
                      id="lead_email"
                      type="email"
                      value={formData.lead_email}
                      onChange={(e) => handleInputChange('lead_email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lead_phone">Phone</Label>
                    <Input
                      id="lead_phone"
                      value={formData.lead_phone}
                      onChange={(e) => handleInputChange('lead_phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="handover">Handover</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="freshsales_deal_id">Freshsales Deal ID</Label>
                    <Input
                      id="freshsales_deal_id"
                      value={formData.freshsales_deal_id}
                      onChange={(e) => handleInputChange('freshsales_deal_id', e.target.value)}
                      placeholder="Enter Freshsales Deal ID"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_id">Contact ID</Label>
                      <Input
                        id="contact_id"
                        value={formData.contact_id}
                        onChange={(e) => handleInputChange('contact_id', e.target.value)}
                        placeholder="Enter contact ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_id">Client ID</Label>
                      <Input
                        id="client_id"
                        value={formData.client_id}
                        onChange={(e) => handleInputChange('client_id', e.target.value)}
                        placeholder="Enter client ID"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="flex items-center gap-2"
                    disabled={updateContact.isPending}
                  >
                    <Save className="h-4 w-4" />
                    {updateContact.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Campaigns ({contact?.campaigns?.length || 0})
                </CardTitle>
                <CardDescription>
                  Associated campaigns for this contact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contact?.campaigns && contact.campaigns.length > 0 ? (
                  <div className="space-y-3">
                    {contact.campaigns.map((campaign: any) => (
                      <div
                        key={campaign.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium text-sm">{campaign.name || `Campaign ${campaign.id}`}</div>
                        <div className="text-xs text-muted-foreground">
                          Status: {campaign.status || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(campaign.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No campaigns associated with this contact.</p>
                )}
              </CardContent>
            </Card>

            {/* Contact Metadata */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Contact Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(contact?.created_at || '').toLocaleString()}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Updated:</span>{' '}
                  {new Date(contact?.updated_at || '').toLocaleString()}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Last Question ID:</span>{' '}
                  {contact?.last_question_id}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetail;