import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, User, Megaphone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatStatus } from "@/lib/utils";

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_e164: "",
    source: "",
    address: "",
  });

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact-detail', id],
    queryFn: async () => {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (!contactData) return null;
      
      // Fetch campaigns for this contact
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false });
      
      const contact: any = {
        ...contactData,
        campaigns: campaignsData || []
      };
      
      if (contact) {
        setFormData({
          first_name: contact.first_name || "",
          last_name: contact.last_name || "",
          email: contact.email || "",
          phone_e164: contact.phone_e164 || "",
          source: contact.source || "",
          address: contact.address || "",
        });
      }
      
      return contact;
    },
    enabled: !!id
  });

  const updateContact = useMutation({
    mutationFn: async (updatedData: any) => {
      const { data, error } = await supabase
        .from('contacts')
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
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4 animate-slide-up">
          <Button 
            variant="outline" 
            onClick={() => navigate('/contacts')}
            className="flex items-center gap-2 btn-premium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contacts
          </Button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-primary">
                {contact?.first_name} {contact?.last_name || ''}
              </h1>
              <p className="text-muted-foreground text-lg">Contact Details</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information Form */}
          <div className="lg:col-span-2">
            <div className="premium-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gradient-primary">Contact Information</CardTitle>
                <CardDescription>
                  Edit and update contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="first_name" className="text-sm font-medium">First Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Enter first name"
                        className="input-premium mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name" className="text-sm font-medium">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Enter last name"
                        className="input-premium mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className="input-premium mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone_e164" className="text-sm font-medium">Phone</Label>
                    <Input
                      id="phone_e164"
                      value={formData.phone_e164}
                      onChange={(e) => handleInputChange('phone_e164', e.target.value)}
                      placeholder="Enter phone number"
                      className="input-premium mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="source" className="text-sm font-medium">Source</Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      placeholder="Enter contact source"
                      className="input-premium mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">Home Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter home address"
                      className="input-premium mt-2"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="btn-premium flex items-center gap-2"
                    disabled={updateContact.isPending}
                  >
                    <Save className="h-4 w-4" />
                    {updateContact.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </div>
          </div>

          {/* Campaigns and Metadata Section */}
          <div className="space-y-6">
            {/* Campaigns Section */}
            <div className="premium-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gradient-primary flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Campaigns ({contact?.campaigns?.length || 0})
                </CardTitle>
                <CardDescription>
                  Associated campaigns for this contact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contact?.campaigns?.length > 0 ? (
                  <div className="space-y-4">
                    {contact.campaigns.map((campaign: any, index: number) => (
                      <Link 
                        key={campaign.id} 
                        to={`/campaigns/${campaign.id}`}
                        className="block hover:bg-muted/70 transition-colors animate-scale-in"
                        style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                      >
                        <div className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-primary hover:underline">{campaign.name || 'Unnamed Campaign'}</h4>
                              <p className="text-sm text-muted-foreground mt-1">Status: <span className="font-medium">{formatStatus(campaign.status)}</span></p>
                              <p className="text-sm text-muted-foreground">
                                Created: {new Date(campaign.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">No campaigns associated with this contact.</p>
                )}
              </CardContent>
            </div>

            {/* Contact Metadata */}
            <div className="premium-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gradient-primary">Contact Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-foreground">Created:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(contact?.created_at || '').toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-foreground">Updated:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(contact?.updated_at || '').toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetail;