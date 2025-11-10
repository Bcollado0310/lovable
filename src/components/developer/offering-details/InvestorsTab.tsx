import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Users, DollarSign, Mail, Phone, Calendar, Download, Shield, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/developerHelpers';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SanitizedInvestorDialog } from '../investor-details/SanitizedInvestorDialog';

// Type definitions for sanitized vs full investor data
interface SanitizedInvestor {
  id: string;
  offering_alias: string; // Per-offering alias like INV-0001
  total_invested: number;
  investment_count: number;
  status: string;
  investor_type: string;
  joined_date: string;
  last_activity_date: string;
}

interface FullInvestor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  total_invested: number;
  investment_count: number;
  status: string;
  investor_type: string;
  created_at: string;
  updated_at: string;
}

type InvestorData = SanitizedInvestor | FullInvestor;

interface InvestorsTabProps {
  offeringId: string;
}

export function InvestorsTab({ offeringId }: InvestorsTabProps) {
  const { hasPermission, organization } = useDeveloperAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [investors, setInvestors] = useState<InvestorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'developer'>('developer');
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Helper function to check if investor data is sanitized
  const isSanitized = (investor: InvestorData): investor is SanitizedInvestor => {
    return 'offering_alias' in investor;
  };

  // Enhanced search function for offering-specific search
  const handleSearch = async (searchValue: string) => {
    setSearchTerm(searchValue);
    
    if (!searchValue.trim()) {
      // If empty search, reload all investors
      fetchInvestors();
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('developer-api/search-offering-investors', {
        body: { 
          offeringId,
          searchTerm: searchValue.trim()
        }
      });

      if (error) throw error;

      setInvestors(data || []);
      
      // Determine user role based on returned data structure
      if (data && data.length > 0) {
        setUserRole(isSanitized(data[0]) ? 'developer' : 'admin');
      }
    } catch (error) {
      console.error('Error searching investors:', error);
      toast({
        title: "Search Error",
        description: userRole === 'developer' 
          ? "Search by offering alias (e.g., INV-0001) or transaction ID only"
          : "Failed to search investors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInvestors();
  }, [offeringId, organization]);

  // Fetch investors for this offering
  const fetchInvestors = async () => {
    if (!offeringId || !organization) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('developer-api/offering-investors', {
        body: { offeringId }
      });

      if (error) throw error;

      setInvestors(data || []);
      
      // Determine user role based on returned data structure
      if (data && data.length > 0) {
        setUserRole(isSanitized(data[0]) ? 'developer' : 'admin');
      }
    } catch (error) {
      console.error('Error fetching investors:', error);
      toast({
        title: "Error",
        description: "Failed to load investor data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle export functionality
  const handleExport = async () => {
    if (!organization) return;

    try {
      const { data, error } = await supabase.functions.invoke('developer-api/export-investors', {
        body: { orgId: organization.id }
      });

      if (error) throw error;

      if (data.format === 'sanitized_csv') {
        // For developers, download the CSV file
        const blob = new Blob([data.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `investors_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Complete",
          description: `Exported ${data.record_count} investor records as sanitized CSV`,
        });
      } else {
        // For admins, show the data (existing behavior)
        toast({
          title: "Export Complete",
          description: `Exported ${data.record_count} investor records with full details`,
        });
        console.log('Export data:', data);
      }
    } catch (error) {
      console.error('Error exporting investors:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export investor data",
        variant: "destructive",
      });
    }
  };

  // Server-side search is now handled by handleSearch function
  // No client-side filtering needed

  const totalInvested = investors.reduce((sum, inv) => sum + inv.total_invested, 0);
  const averageInvestment = investors.length > 0 ? totalInvested / investors.length : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investors.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageInvestment)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by alias or transaction ID..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            {hasPermission('write') && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export List
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Access Notice */}
      {userRole === 'developer' && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">
                Developer Access: Viewing anonymized investor data only
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investors List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading investors...</p>
            </CardContent>
          </Card>
        ) : (
          investors.map((investor) => (
            <Card key={investor.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="px-3 py-1">
                          {isSanitized(investor) ? investor.offering_alias : `INV-${String(investors.indexOf(investor) + 1).padStart(4, '0')}`}
                        </Badge>
                        <Badge variant={investor.status === 'active' ? 'default' : 'outline'}>
                          {investor.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined {formatDate(isSanitized(investor) ? investor.joined_date : investor.created_at)}
                        </span>
                        <span className="text-xs">
                          {investor.investment_count} investment{investor.investment_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-semibold text-lg">
                      {formatCurrency(investor.total_invested)}
                    </div>
                    {hasPermission('write') && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedInvestorId(investor.id);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && investors.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "No investors found matching your search." : "No investors found for this offering."}
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Investor Details Dialog */}
      {selectedInvestorId && (
        <SanitizedInvestorDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          investorId={selectedInvestorId}
          offeringId={offeringId}
        />
      )}
    </div>
  );
}