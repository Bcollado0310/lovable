import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/developerHelpers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SanitizedTransaction {
  id: string;
  transaction_ref: string; // Truncated ID
  date: string;
  amount: number;
  event_type: string;
  status: string;
  settlement_status: string;
  payment_method?: string;
  description?: string;
}

interface SanitizedInvestorData {
  id: string;
  alias: string;
  status: string;
  investor_type: string;
  joined_date: string;
  total_invested: number;
  investment_count: number;
  transactions: SanitizedTransaction[];
  documents?: Array<{
    id: string;
    type: string;
    filename: string; // Generic filename without revealing content
    uploaded_date: string;
    status: string;
  }>;
}

interface SanitizedInvestorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorId: string;
  offeringId?: string;
}

const transactionTypeLabels: Record<string, string> = {
  investment: 'Investment',
  distribution: 'Distribution',
  refund: 'Refund',
  fee: 'Fee',
  adjustment: 'Adjustment'
};

const statusIcons = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
  processing: Clock
};

const statusColors = {
  completed: 'text-green-600',
  pending: 'text-yellow-600', 
  failed: 'text-red-600',
  processing: 'text-blue-600'
};

export function SanitizedInvestorDialog({ 
  open, 
  onOpenChange, 
  investorId,
  offeringId 
}: SanitizedInvestorDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [investorData, setInvestorData] = useState<SanitizedInvestorData | null>(null);

  useEffect(() => {
    if (open && investorId) {
      fetchInvestorDetails();
    }
  }, [open, investorId]);

  const fetchInvestorDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('developer-api/investor-details', {
        body: { 
          investorId,
          offeringId: offeringId || null
        }
      });

      if (error) throw error;
      setInvestorData(data);
    } catch (error) {
      console.error('Error fetching investor details:', error);
      toast({
        title: "Error",
        description: "Failed to load investor details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportTransactions = () => {
    if (!investorData?.transactions) return;
    
    const csvHeaders = [
      'Transaction Ref',
      'Date', 
      'Type',
      'Amount',
      'Status',
      'Settlement Status',
      'Payment Method'
    ];
    
    const csvData = investorData.transactions.map(tx => [
      tx.transaction_ref,
      new Date(tx.date).toLocaleDateString(),
      transactionTypeLabels[tx.event_type] || tx.event_type,
      tx.amount,
      tx.status,
      tx.settlement_status,
      tx.payment_method || 'N/A'
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${investorData.alias}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Export Complete",
      description: "Transaction history exported successfully",
    });
  };

  if (!investorData && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <DialogTitle>Investor Details (Sanitized View)</DialogTitle>
          </div>
          <DialogDescription>
            This view shows only non-sensitive information. Contact details and identification data are hidden for privacy.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading investor details...</p>
            </div>
          </div>
        ) : investorData && (
          <div className="space-y-6">
            {/* Investor Summary */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Investor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="px-3 py-1">
                      {investorData.alias}
                    </Badge>
                    <Badge variant={investorData.status === 'active' ? 'default' : 'outline'}>
                      {investorData.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Joined {formatDate(investorData.joined_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span>{investorData.investor_type} investor</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Investment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold">
                    {formatCurrency(investorData.total_invested)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Across {investorData.investment_count} investment{investorData.investment_count !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm">
                    {investorData.transactions.length} total transactions
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    <CardTitle>Transaction History</CardTitle>
                  </div>
                  {investorData.transactions.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleExportTransactions}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {investorData.transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {investorData.transactions.map((transaction) => {
                      const StatusIcon = statusIcons[transaction.status as keyof typeof statusIcons] || Clock;
                      const statusColor = statusColors[transaction.status as keyof typeof statusColors] || 'text-gray-600';
                      
                      return (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full bg-muted ${statusColor}`}>
                              <StatusIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {transactionTypeLabels[transaction.event_type] || transaction.event_type}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Ref: {transaction.transaction_ref}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(transaction.date)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(transaction.amount)}
                            </div>
                            <div className="text-sm">
                              <Badge variant="outline" className="mr-1">
                                {transaction.status}
                              </Badge>
                              <Badge variant="secondary">
                                {transaction.settlement_status}
                              </Badge>
                            </div>
                            {transaction.payment_method && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {transaction.payment_method}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents (if any) */}
            {investorData.documents && investorData.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <CardTitle>Documents</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {investorData.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{doc.filename}</div>
                            <div className="text-sm text-muted-foreground">
                              {doc.type} • Uploaded {formatDate(doc.uploaded_date)}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">{doc.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}