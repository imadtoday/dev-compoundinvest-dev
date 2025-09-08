import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AddContact = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_e164: "",
    address: "",
    source: "manual"
  });

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // If it starts with 61, it's already formatted for Australia
    if (digits.startsWith('61')) {
      return `+${digits}`;
    }
    
    // If it starts with 0, replace with +61
    if (digits.startsWith('0')) {
      return `+61${digits.slice(1)}`;
    }
    
    // If it doesn't start with 0 or 61, assume it's missing the country code
    if (digits.length === 9 || digits.length === 10) {
      return `+61${digits}`;
    }
    
    return `+${digits}`;
  };

  const createContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          first_name: contactData.first_name || null,
          last_name: contactData.last_name || null,
          email: contactData.email || null,
          phone_e164: contactData.phone_e164 || null,
          address: contactData.address || null,
          source: contactData.source
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts-list'] });
      queryClient.invalidateQueries({ queryKey: ['contacts-dropdown'] });
      toast({
        title: "Contact Created",
        description: "The contact has been successfully created.",
      });
      navigate(`/contacts/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create contact. Please try again.",
        variant: "destructive",
      });
      console.error("Create contact error:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() && !formData.last_name.trim()) {
      toast({
        title: "Validation Error",
        description: "At least first name or last name is required.",
        variant: "destructive",
      });
      return;
    }

    const contactData = {
      ...formData,
      phone_e164: formData.phone_e164 ? formatPhoneNumber(formData.phone_e164) : null
    };

    createContactMutation.mutate(contactData);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/contacts">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contacts
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Add New Contact</h1>
              <p className="text-muted-foreground">Create a new contact for campaign management</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_e164">Phone Number</Label>
                  <Input
                    id="phone_e164"
                    value={formData.phone_e164}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_e164: e.target.value }))}
                    placeholder="Enter phone number (e.g., 0412 345 678)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Australian numbers will be automatically formatted with +61 country code
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Home Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter full home address..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={createContactMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {createContactMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Contact
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/contacts')}>
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

export default AddContact;