import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  MoreHorizontal, 
  Receipt, 
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  ExternalLink,
  Copy,
  Edit,
  Upload,
  CreditCard
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TransactionLedgerProps {
  transactions: any[];
  loading?: boolean;
  onExportSelected?: (selectedTransactions: any[]) => void;
}

const transactionTypeLabels: Record<string, string> = {
  contribution: 'Contribution',
  capital_call: 'Capital Call',
  distribution_income: 'Distribution (Income)',
  return_of_capital: 'Return of Capital',
  withdrawal: 'Withdrawal',
  fee_mgmt: 'Management Fee',
  fee_txn: 'Transaction Fee',
  dividend: 'Dividend/Interest',
  sale_proceeds: 'Sale Proceeds',
  tax_withholding: 'Tax Withholding',
  tax_refund: 'Tax Refund',
  adjustment: 'Adjustment',
  investment: 'Investment', // Legacy support
  fee: 'Fee' // Legacy support
};

const statusIcons = {
  posted: CheckCircle,
  pending: Clock,
  failed: XCircle,
  reversed: RotateCcw
};

const statusColors = {
  posted: 'text-green-500',
  pending: 'text-yellow-500',
  failed: 'text-red-500',
  reversed: 'text-gray-500'
};

export default function TransactionLedger({ transactions, loading, onExportSelected }: TransactionLedgerProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'created_at' | 'amount'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Calculate running balance
  const transactionsWithBalance = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const aValue = sortField === 'created_at' ? new Date(a.created_at).getTime() : a.amount;
      const bValue = sortField === 'created_at' ? new Date(b.created_at).getTime() : b.amount;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    let runningBalance = 0;
    return sorted.map(transaction => {
      const isOutflow = ['contribution', 'capital_call', 'withdrawal', 'fee_mgmt', 'fee_txn', 'tax_withholding', 'investment', 'fee'].includes(transaction.transaction_type);
      const netAmount = isOutflow ? -Math.abs(transaction.amount) : Math.abs(transaction.amount);
      runningBalance += netAmount;
      
      return {
        ...transaction,
        netAmount,
        runningBalance: runningBalance,
        isOutflow
      };
    });
  }, [transactions, sortField, sortDirection]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedTransactions(checked ? transactions.map(t => t.id) : []);
  };

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    setSelectedTransactions(prev => 
      checked 
        ? [...prev, transactionId]
        : prev.filter(id => id !== transactionId)
    );
  };

  const toggleRowExpansion = (transactionId: string) => {
    setExpandedRows(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSort = (field: 'created_at' | 'amount') => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'contribution':
      case 'capital_call':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'distribution_income':
      case 'return_of_capital':
      case 'dividend':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'fee_mgmt':
      case 'fee_txn':
      case 'fee':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'withdrawal':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'sale_proceeds':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'tax_withholding':
      case 'tax_refund':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
          <p className="text-muted-foreground">
            Link your bank or fund an investment to see transactions here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Ledger</CardTitle>
            {selectedTransactions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedTransactions.length} selected
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onExportSelected?.(transactions.filter(t => selectedTransactions.includes(t.id)))}
                >
                  Export Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('created_at')}
                  >
                    Date {sortField === 'created_at' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>Description/Note</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort('amount')}
                  >
                    Gross {sortField === 'amount' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Doc</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsWithBalance.map((transaction) => {
                  const StatusIcon = statusIcons[transaction.status as keyof typeof statusIcons] || CheckCircle;
                  const isExpanded = expandedRows.includes(transaction.id);
                  const isSelected = selectedTransactions.includes(transaction.id);
                  
                  return (
                    <>
                      {/* Main Row */}
                      <TableRow 
                        key={transaction.id}
                        className={cn(
                          "group hover:bg-muted/50",
                          isSelected && "bg-muted/30"
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectTransaction(transaction.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleRowExpansion(transaction.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                            {transactionTypeLabels[transaction.transaction_type] || transaction.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.properties?.title ? (
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-32">
                                {transaction.properties.title}
                              </span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-48 truncate">
                            {transaction.description || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.method || 'ACH'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${Math.abs(transaction.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ${(transaction.fees || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          transaction.isOutflow ? "text-red-500" : "text-green-500"
                        )}>
                          {transaction.isOutflow ? '-' : '+'}${Math.abs(transaction.netAmount).toLocaleString()}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          transaction.runningBalance >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          ${transaction.runningBalance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger>
                              <StatusIcon className={cn("h-4 w-4", statusColors[transaction.status as keyof typeof statusColors] || "text-green-500")} />
                            </TooltipTrigger>
                            <TooltipContent>
                              {transaction.status || 'Posted'}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {transaction.documents?.length > 0 ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <FileText className="h-4 w-4 text-blue-500 cursor-pointer" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {transaction.documents.length} document(s)
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Add Note
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Receipt
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy ID
                              </DropdownMenuItem>
                              {!transaction.reconciled && (
                                <DropdownMenuItem>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Reconciled
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={13} className="p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Reference ID:</strong>
                                <p className="text-muted-foreground font-mono">
                                  {transaction.id.slice(0, 8)}...
                                </p>
                              </div>
                              <div>
                                <strong>Bank Trace:</strong>
                                <p className="text-muted-foreground">
                                  {transaction.bank_trace || 'N/A'}
                                </p>
                              </div>
                              {transaction.processed_at && (
                                <div>
                                  <strong>Processed:</strong>
                                  <p className="text-muted-foreground">
                                    {format(new Date(transaction.processed_at), 'MMM d, yyyy h:mm a')}
                                  </p>
                                </div>
                              )}
                              <div>
                                <strong>Payment Method:</strong>
                                <p className="text-muted-foreground">
                                  {transaction.method || 'ACH Transfer'}
                                </p>
                              </div>
                              {Array.isArray(transaction.split_lines) && transaction.split_lines.length > 0 && (
                                <div className="col-span-2">
                                  <strong>Split Details:</strong>
                                  <div className="mt-1 space-y-1">
                                    {transaction.split_lines.map((split: any, index: number) => (
                                      <div key={index} className="flex justify-between text-muted-foreground">
                                        <span>{split.description}</span>
                                        <span>${split.amount.toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}