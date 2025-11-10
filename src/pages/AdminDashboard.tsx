import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Download, LogOut } from 'lucide-react';

interface WaitlistEntry {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  country_code: string;
  age: number;
  income_bracket: string;
  marketing_opt_in: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const [waitlistData, setWaitlistData] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchWaitlistData();
    }
  }, [isAdmin, authLoading]);

  const fetchWaitlistData = async () => {
    try {
      setLoading(true);
      
      // Log admin access attempt
      const { error: logError } = await supabase.rpc('log_admin_access', {
        p_action: 'SELECT',
        p_table_name: 'waitlist_signups'
      });

      const { data, error } = await (supabase as any)
        .from('waitlist_signups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch waitlist data: " + error.message,
          variant: "destructive"
        });
      } else {
        setWaitlistData(data || []);
      }
    } catch (error) {
      console.error('Error fetching waitlist data:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      // Log admin export action
      await supabase.rpc('log_admin_access', {
        p_action: 'EXPORT',
        p_table_name: 'waitlist_signups'
      });

      const csvContent = [
        ['Email', 'First Name', 'Last Name', 'Country', 'Age', 'Income Bracket', 'Marketing Opt-in', 'Created At'],
        ...waitlistData.map(entry => [
          entry.email,
          entry.first_name,
          entry.last_name,
          entry.country_code,
          entry.age.toString(),
          entry.income_bracket,
          entry.marketing_opt_in ? 'Yes' : 'No',
          new Date(entry.created_at).toLocaleDateString()
        ])
      ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aurora-equity-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Waitlist data has been downloaded as CSV.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have admin permissions to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => signOut()} variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage Aurora Equity waitlist</p>
          </div>
          <Button onClick={() => signOut()} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{waitlistData.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marketing Opt-ins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {waitlistData.filter(entry => entry.marketing_opt_in).length}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button onClick={exportData} size="sm" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Waitlist Entries</CardTitle>
            <CardDescription>
              All user signups and their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : waitlistData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No waitlist entries found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Income</TableHead>
                    <TableHead>Marketing</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitlistData.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.first_name} {entry.last_name}
                      </TableCell>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>{entry.country_code}</TableCell>
                      <TableCell>{entry.age}</TableCell>
                      <TableCell>{entry.income_bracket}</TableCell>
                      <TableCell>
                        <Badge variant={entry.marketing_opt_in ? "default" : "secondary"}>
                          {entry.marketing_opt_in ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;