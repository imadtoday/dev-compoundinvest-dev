import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Megaphone, Search } from "lucide-react";
import { useState } from "react";
import { formatInTimeZone } from "date-fns-tz";

const CampaignsList = () => {
  const [searchTerm, setSearchTerm] = useState("");

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
    
    return matchesSearch;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
        return 'default';
      case 'new':
        return 'secondary';
      case 'in_progress':
        return 'outline';
      default:
        return 'secondary';
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

        {/* Search */}
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
                      <TableHead className="font-semibold">Status</TableHead>
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
                            variant={getStatusBadgeVariant(campaign.status)}
                            className="bg-accent/10 text-accent border-accent/20"
                          >
                            {campaign.status}
                          </Badge>
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
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
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