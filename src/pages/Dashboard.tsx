import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, UserCheck, Clock, CheckCircle } from "lucide-react";

const Dashboard = () => {
  // Fetch contacts stats
  const { data: stats } = useQuery({
    queryKey: ['contacts-stats'],
    queryFn: async () => {
      const { data: allContacts } = await supabase
        .from('contacts')
        .select('id');
      
      const total = allContacts?.length || 0;
      
      return { total, inProgress: 0, handover: 0, complete: 0 };
    }
  });

  // Fetch latest 5 contacts
  const { data: latestContacts } = useQuery({
    queryKey: ['latest-contacts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone_e164, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      return data || [];
    }
  });


  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your contacts and campaigns</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Contacts</CardTitle>
            <CardDescription>Your most recent 5 contacts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestContacts?.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Link 
                        to={`/contacts/${contact.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {contact.first_name} {contact.last_name}
                      </Link>
                    </TableCell>
                    <TableCell>{contact.email || 'N/A'}</TableCell>
                    <TableCell>{contact.phone_e164 || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(contact.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;