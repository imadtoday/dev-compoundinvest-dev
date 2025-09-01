import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Search, Users } from "lucide-react";

const ContactsList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: async () => {
      // Get all contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone_e164')
        .order('created_at', { ascending: false });
      
      if (!contactsData) return [];
      
      // Get campaign counts for each contact
      const contactsWithCampaigns = await Promise.all(
        contactsData.map(async (contact: any) => {
          const { count } = await supabase
            .from('campaigns')
            .select('*', { count: 'exact', head: true })
            .eq('contact_id', contact.id);
          
          return {
            ...contact,
            campaignCount: count || 0
          };
        })
      );
      
      return contactsWithCampaigns;
    }
  });

  const filteredContacts = contacts?.filter(contact => {
    const matchesSearch = !searchTerm || 
      (contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.phone_e164?.includes(searchTerm));
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-primary">Contacts</h1>
              <p className="text-muted-foreground text-lg mt-2">Manage and view all your contacts</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 flex-col sm:flex-row animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search contacts by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-12 h-12 text-base"
            />
          </div>
        </div>

        {/* Contacts Table */}
        <div className="premium-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gradient-primary">
              All Contacts ({filteredContacts?.length || 0})
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Click on a contact name to view detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground mt-4">Loading contacts...</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">First Name</TableHead>
                      <TableHead className="font-semibold">Last Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Campaigns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts?.map((contact, index) => (
                      <TableRow 
                        key={contact.id}
                        className="hover:bg-muted/30 transition-colors duration-200"
                        style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                      >
                        <TableCell>
                          <Link 
                            to={`/contacts/${contact.id}`}
                            className="font-medium text-primary hover:text-accent transition-colors duration-200 hover:underline"
                          >
                            {contact.first_name || 'N/A'}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{contact.last_name || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">{contact.email || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">{contact.phone_e164 || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium bg-accent/10 text-accent px-2 py-1 rounded-full">
                              {contact.campaignCount}
                            </span>
                            <span className="text-xs text-muted-foreground">campaigns</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredContacts?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          No contacts found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default ContactsList;