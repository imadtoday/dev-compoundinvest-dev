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
      // Get all contacts without campaigns for now
      const { data: contactsData } = await supabase
        .from('leads')
        .select('id, lead_fName, lead_lName, lead_email, lead_phone')
        .order('created_at', { ascending: false });
      
      if (!contactsData) return [];
      
      // Add a static campaign count of 0 for now
      return contactsData.map((contact: any) => ({
        ...contact,
        campaignCount: 0
      }));
    }
  });

  const filteredContacts = contacts?.filter(contact => {
    const matchesSearch = !searchTerm || 
      (contact.lead_fName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.lead_lName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.lead_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.lead_phone?.includes(searchTerm));
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
              <p className="text-muted-foreground">Manage and view all your contacts</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search contacts by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Contacts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Contacts ({filteredContacts?.length || 0})</CardTitle>
            <CardDescription>
              Click on a contact name to view detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading contacts...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Campaigns</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts?.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Link 
                          to={`/contacts/${contact.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {contact.lead_fName || 'N/A'}
                        </Link>
                      </TableCell>
                      <TableCell>{contact.lead_lName || 'N/A'}</TableCell>
                      <TableCell>{contact.lead_email || 'N/A'}</TableCell>
                      <TableCell>{contact.lead_phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{contact.campaignCount}</span>
                          <span className="text-xs text-muted-foreground">campaigns</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredContacts?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No contacts found matching your criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactsList;