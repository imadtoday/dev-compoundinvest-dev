import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useSearchParams } from "react-router-dom";
import { Megaphone, Search, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { formatInTimeZone } from "date-fns-tz";

const CampaignsList = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState<string>("all");

  // Set workflow filter from URL params on mount
  useEffect(() => {
    const workflowParam = searchParams.get("workflow");
    if (workflowParam) {
      setWorkflowFilter(workflowParam);
    }
  }, [searchParams]);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('campaigns')
        .select(`
          *,
          contacts (
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });
      
      return data || [];
    }
  });

  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = !searchTerm || 
      (campaign.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.contacts?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.contacts?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesWorkflow = workflowFilter === "all" || 
      campaign.status === workflowFilter;
    
    return matchesSearch && matchesWorkflow;
  });

  const formatWorkflowStatus = (status: string) => {
    return status
      .split('_')
      .map((word, index) => 
        index === 0 
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word.toLowerCase()
      )
      .join(' ');
  };

  const getWorkflowStatusBadgeStyle = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'complete' || lowerStatus === 'accepted') {
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
    } else if (lowerStatus === 'intake_in_progress' || lowerStatus === 'sent') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
    } else if (lowerStatus === 'consent_pending') {
      return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'in_progress':
      case 'intake_in_progress':
        return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-primary">Campaigns</h1>
              <p className="text-muted-foreground text-lg mt-2">Manage and view all your campaigns</p>
            </div>
          </div>
        </div>

        {/* Search, Filter, and Add Button */}
        <div className="flex gap-4 flex-col sm:flex-row animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search campaigns by name or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-12 h-12 text-base"
            />
          </div>
          <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-12 bg-background">
              <SelectValue placeholder="Filter by workflow" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Workflows</SelectItem>
              <SelectItem value="workflow_1">Workflow 1</SelectItem>
              <SelectItem value="workflow_2">Workflow 2</SelectItem>
              <SelectItem value="workflow_4">Workflow 4</SelectItem>
            </SelectContent>
          </Select>
          <Link to="/campaigns/add">
            <Button className="h-12 px-6 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Campaign
            </Button>
          </Link>
        </div>

        {/* Campaigns Table */}
        <div className="premium-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gradient-primary">
              All Campaigns ({filteredCampaigns?.length || 0})
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Click on a campaign name to view detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground mt-4">Loading campaigns...</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Campaign Name</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Workflow</TableHead>
                      <TableHead className="font-semibold">Workflow Status</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns?.map((campaign, index) => (
                      <TableRow 
                        key={campaign.id}
                        className="hover:bg-muted/30 transition-colors duration-200"
                        style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                      >
                        <TableCell>
                          <Link 
                            to={`/campaigns/${campaign.id}`}
                            className="font-medium text-primary hover:text-accent transition-colors duration-200 hover:underline"
                          >
                            {campaign.name || 'Unnamed Campaign'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {campaign.contacts ? (
                            <Link 
                              to={`/contacts/${campaign.contacts.id}`}
                              className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:underline"
                            >
                              {campaign.contacts.first_name} {campaign.contacts.last_name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">No contact assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`font-medium px-3 py-1 transition-colors duration-200 ${getStatusBadgeStyle(campaign.status)}`}
                          >
                            {campaign.status === 'workflow_1' ? 'Workflow 1' : 
                             campaign.status === 'workflow_2' ? 'Workflow 2' : 
                             campaign.status === 'workflow_4' ? 'Workflow 4' :
                             campaign.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {campaign.status === 'workflow_1' && (campaign as any).workflow_1_status && (
                            <Badge className={`font-medium px-3 py-1 ${getWorkflowStatusBadgeStyle((campaign as any).workflow_1_status as string)}`}>
                              {formatWorkflowStatus((campaign as any).workflow_1_status as string)}
                            </Badge>
                          )}
                          {campaign.status === 'workflow_2' && (campaign as any).workflow_2_status && (
                            <Badge className={`font-medium px-3 py-1 ${getWorkflowStatusBadgeStyle((campaign as any).workflow_2_status as string)}`}>
                              {formatWorkflowStatus((campaign as any).workflow_2_status as string)}
                            </Badge>
                          )}
                          {campaign.status !== 'workflow_1' && campaign.status !== 'workflow_2' && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatInTimeZone(
                            new Date(campaign.created_at),
                            'Australia/Sydney',
                            'dd/MM/yyyy HH:mm'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                     {filteredCampaigns?.length === 0 && (
                       <TableRow>
                         <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                           No campaigns found matching your criteria
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

export default CampaignsList;