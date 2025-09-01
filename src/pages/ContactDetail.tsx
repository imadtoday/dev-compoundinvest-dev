import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, User, Megaphone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
      
      const contact: any = {
        ...contactData,
        campaigns: [] // Empty campaigns array for now
      };
      
      if (contact) {
        setFormData({
          first_name: contact.first_name || "",
          last_name: contact.last_name || "",
          email: contact.email || "",
          phone_e164: contact.phone_e164 || "",
          source: contact.source || "",
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
                {contact?.first_name} {contact?.last_name || ''}
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
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone_e164">Phone</Label>
                    <Input
                      id="phone_e164"
                      value={formData.phone_e164}
                      onChange={(e) => handleInputChange('phone_e164', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      placeholder="Enter contact source"
                    />
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
                  Campaigns (0)
                </CardTitle>
                <CardDescription>
                  Associated campaigns for this contact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">No campaigns associated with this contact.</p>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetail;