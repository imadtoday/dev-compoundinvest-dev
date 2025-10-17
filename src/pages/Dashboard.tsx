import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, UserCheck, Clock, CheckCircle } from "lucide-react";

const Dashboard = () => {
  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get total contacts
      const { data: allContacts } = await supabase
        .from('contacts')
        .select('id');
      
      // Get total campaigns
      const { data: allCampaigns } = await supabase
        .from('campaigns')
        .select('id');
      
      // Get workflow 1 campaigns
      const { data: workflow1Campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('status', 'workflow_1');
      
      // Get workflow 2 campaigns
      const { data: workflow2Campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('status', 'workflow_2');
      
      // Get workflow 4 campaigns
      const { data: workflow4Campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('status', 'workflow_4');
      
      return { 
        totalContacts: allContacts?.length || 0,
        totalCampaigns: allCampaigns?.length || 0,
        workflow1Count: workflow1Campaigns?.length || 0,
        workflow2Count: workflow2Campaigns?.length || 0,
        workflow4Count: workflow4Campaigns?.length || 0
      };
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
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="border-b border-border pb-6">
          <h1 className="text-4xl font-bold text-gradient-primary">Dashboard</h1>
          <p className="text-muted-foreground text-lg mt-2">Overview of your contacts and campaigns</p>
        </div>

        {/* Stats Cards with premium styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <Link to="/contacts" className="premium-card animate-slide-up hover:scale-105 transition-transform duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Contacts</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient-primary">{stats?.totalContacts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active contacts</p>
            </CardContent>
          </Link>
          
          <Link to="/campaigns" className="premium-card animate-slide-up hover:scale-105 transition-transform duration-200 cursor-pointer" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
              <div className="p-2 bg-accent/10 rounded-lg">
                <UserCheck className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient-gold">{stats?.totalCampaigns || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">All campaigns</p>
            </CardContent>
          </Link>
          
          <Link to="/campaigns?workflow=workflow_1" className="premium-card animate-slide-up hover:scale-105 transition-transform duration-200 cursor-pointer" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Workflow 1</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.workflow1Count || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">In workflow 1</p>
            </CardContent>
          </Link>

          <Link to="/campaigns?workflow=workflow_2" className="premium-card animate-slide-up hover:scale-105 transition-transform duration-200 cursor-pointer" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Workflow 2</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats?.workflow2Count || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">In workflow 2</p>
            </CardContent>
          </Link>

          <Link to="/campaigns?workflow=workflow_4" className="premium-card animate-slide-up hover:scale-105 transition-transform duration-200 cursor-pointer" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Workflow 4</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.workflow4Count || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">In workflow 4</p>
            </CardContent>
          </Link>
        </div>

        {/* Latest Contacts with premium styling */}
        <div className="premium-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gradient-primary">Latest Contacts</CardTitle>
            <CardDescription className="text-muted-foreground">Your most recent 5 contacts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestContacts?.map((contact, index) => (
                    <TableRow 
                      key={contact.id} 
                      className="hover:bg-muted/30 transition-colors duration-200"
                      style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                    >
                      <TableCell>
                        <Link 
                          to={`/contacts/${contact.id}`}
                          className="font-medium text-primary hover:text-accent transition-colors duration-200 hover:underline"
                        >
                          {contact.first_name} {contact.last_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{contact.email || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.phone_e164 || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!latestContacts || latestContacts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No contacts found. <Link to="/contacts" className="text-primary hover:underline">Add your first contact</Link>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;