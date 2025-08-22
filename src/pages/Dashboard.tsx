import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, UserCheck, Clock, CheckCircle } from "lucide-react";

const Dashboard = () => {
  // Fetch leads stats
  const { data: stats } = useQuery({
    queryKey: ['leads-stats'],
    queryFn: async () => {
      const { data: allLeads } = await supabase
        .from('leads')
        .select('status');
      
      const total = allLeads?.length || 0;
      const inProgress = allLeads?.filter(lead => lead.status === 'in_progress').length || 0;
      const handover = allLeads?.filter(lead => lead.status === 'handover').length || 0;
      const complete = allLeads?.filter(lead => lead.status === 'complete').length || 0;
      
      return { total, inProgress, handover, complete };
    }
  });

  // Fetch latest 5 leads
  const { data: latestLeads } = useQuery({
    queryKey: ['latest-leads'],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('id, lead_fName, lead_email, lead_phone, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      return data || [];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'handover': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-foreground">Leads Dashboard</h1>
          <p className="text-muted-foreground">Overview of your leads and their progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.inProgress || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Handover</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.handover || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Complete</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.complete || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Leads</CardTitle>
            <CardDescription>Your most recent 5 leads</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestLeads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link 
                        to={`/leads/${lead.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {lead.lead_fName || 'N/A'}
                      </Link>
                    </TableCell>
                    <TableCell>{lead.lead_email || 'N/A'}</TableCell>
                    <TableCell>{lead.lead_phone}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(lead.created_at).toLocaleDateString()}
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