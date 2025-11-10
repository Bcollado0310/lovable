import { useState } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoreHorizontal, TrendingUp, TrendingDown, FileText, Download, BarChart3, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { useInvestmentFilters } from '@/hooks/useInvestmentFilters';
import { analytics } from '@/utils/analytics';

interface Investment {
  id: string;
  properties: {
    title: string;
    sponsor?: string;
    property_type: string;
    images?: string[];
  };
  amount_invested: number;
  current_value: number;
  total_returns: number;
  investment_status: string;
  shares_owned: number;
  target_commitment?: number;
  funded_percentage?: number;
  irr?: number;
  net_return_percent?: number;
  income_ytd?: number;
  next_payout_date?: string;
  next_payout_amount?: number;
}

interface PositionsTableProps {
  investments: Investment[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRowClick: (investment: Investment) => void;
  currency: string;
  isTableView: boolean;
}

export function PositionsTable({ 
  investments, 
  selectedIds, 
  onSelectionChange, 
  onRowClick,
  currency,
  isTableView 
}: PositionsTableProps) {
  const { filters, updateFilter } = useInvestmentFilters();
  const formatCurrency = (amount: number) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(investments.map(inv => inv.id));
      analytics.track('investment_select_all', { count: investments.length });
    } else {
      onSelectionChange([]);
      analytics.track('investment_deselect_all');
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleSort = (sortBy: string) => {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    updateFilter('sortBy', sortBy as any);
    updateFilter('sortOrder', newOrder);
    analytics.track('investment_column_sorted', { column: sortBy, order: newOrder });
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) return null;
    return filters.sortOrder === 'desc' ? 
      <ChevronDown className="h-4 w-4" /> : 
      <ChevronUp className="h-4 w-4" />;
  };

  const SortableHeader = ({ 
    column, 
    children, 
    tooltip,
    className = ""
  }: { 
    column: string; 
    children: React.ReactNode; 
    tooltip: string;
    className?: string;
  }) => (
    <TableHead 
      className={`cursor-pointer hover:bg-muted/50 select-none ${className}`}
      onClick={() => handleSort(column)}
      aria-label={`Sort by ${tooltip}`}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {children}
              <Info className="h-3 w-3 text-muted-foreground" />
              {getSortIcon(column)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableHead>
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      exited: "secondary", 
      committed: "outline"
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const Sparkline = ({ data }: { data: number[] }) => (
    <div className="flex items-end h-8 w-16 gap-0.5">
      {data.map((value, index) => (
        <div
          key={index}
          className="bg-primary/60 rounded-sm flex-1"
          style={{ height: `${Math.max(2, (value / Math.max(...data)) * 100)}%` }}
        />
      ))}
    </div>
  );

  // Show empty state if no investments
  if (investments.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No positions found"
        description="No investments match your current filters. Try adjusting your search or filter criteria."
        actionText="Browse Properties"
        onAction={() => window.location.href = '/properties'}
      />
    );
  }

  if (!isTableView) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investments.map((investment) => (
          <Card 
            key={investment.id}
            className="glass-card border-glass-border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onRowClick(investment)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold gradient-text mb-1">
                    {investment.properties.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {investment.properties.sponsor}
                  </p>
                </div>
                {getStatusBadge(investment.investment_status)}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cost Basis</span>
                  <span className="font-medium">{formatCurrency(investment.amount_invested)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Value</span>
                  <span className="font-medium">{formatCurrency(investment.current_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Net Return</span>
                  <span className={`font-medium flex items-center gap-1 ${
                    investment.total_returns >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {investment.total_returns >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {investment.net_return_percent?.toFixed(2)}%
                  </span>
                </div>
                {investment.funded_percentage !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Funded</span>
                      <span>{investment.funded_percentage}%</span>
                    </div>
                    <Progress value={investment.funded_percentage} className="h-2" />
                  </div>
                )}
              </div>

              <div className="flex justify-center mt-4">
                <Sparkline data={[65, 78, 82, 85, 88, 92, 95, 98]} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-card border-glass-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === investments.length && investments.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all investments"
              />
            </TableHead>
            <SortableHeader 
              column="name" 
              tooltip="Investment name and property details"
              className="min-w-[200px]"
            >
              Investment
            </SortableHeader>
            <SortableHeader 
              column="asset_type" 
              tooltip="Property asset type classification"
              className="hidden md:table-cell"
            >
              Type
            </SortableHeader>
            <SortableHeader 
              column="sponsor" 
              tooltip="Investment sponsor or management company"
              className="hidden lg:table-cell"
            >
              Sponsor
            </SortableHeader>
            <SortableHeader 
              column="funded_percentage" 
              tooltip="Capital commitment progress and funding status"
              className="hidden lg:table-cell"
            >
              Commitment/Funded
            </SortableHeader>
            <SortableHeader 
              column="amount_invested" 
              tooltip="Total capital invested (cost basis)"
              className="hidden lg:table-cell"
            >
              Cost Basis
            </SortableHeader>
            <SortableHeader 
              column="current_value" 
              tooltip="Current market value of investment"
            >
              Current Value
            </SortableHeader>
            <SortableHeader 
              column="unrealized_pl" 
              tooltip="Unrealized profit/loss (Current Value - Cost Basis)"
              className="hidden lg:table-cell"
            >
              Unrealized P/L
            </SortableHeader>
            <SortableHeader 
              column="net_return" 
              tooltip="Net return percentage including distributions"
            >
              Net Return %
            </SortableHeader>
            <SortableHeader 
              column="irr" 
              tooltip="Internal Rate of Return (annualized)"
              className="hidden xl:table-cell"
            >
              IRR
            </SortableHeader>
            <SortableHeader 
              column="income_ytd" 
              tooltip="Year-to-date income and distributions received"
              className="hidden xl:table-cell"
            >
              Income YTD
            </SortableHeader>
            <SortableHeader 
              column="next_payout" 
              tooltip="Next scheduled distribution date and amount"
              className="hidden xl:table-cell"
            >
              Next Payout
            </SortableHeader>
            <SortableHeader 
              column="status" 
              tooltip="Investment status (Active, Exited, Committed)"
              className="hidden lg:table-cell"
            >
              Status
            </SortableHeader>
            <TableHead 
              className="hidden xl:table-cell"
              aria-label="1-year performance chart"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      1Y Chart
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>12-month performance sparkline</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="w-12" aria-label="Actions menu"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investments.map((investment) => {
            const unrealizedPL = investment.current_value - investment.amount_invested;
            
            return (
              <TableRow 
                key={investment.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(investment)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(investment.id)}
                    onCheckedChange={(checked) => handleSelectRow(investment.id, checked as boolean)}
                    aria-label={`Select ${investment.properties.title}`}
                  />
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <div className="flex items-center gap-3">
                    {investment.properties.images?.[0] && (
                      <img 
                        src={investment.properties.images[0]} 
                        alt={investment.properties.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{investment.properties.title}</div>
                      <div className="text-sm text-muted-foreground flex gap-1">
                        <Badge variant="outline" className="text-xs md:hidden">
                          {investment.properties.property_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell capitalize">{investment.properties.property_type}</TableCell>
                <TableCell className="hidden lg:table-cell">{investment.properties.sponsor || '-'}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {investment.funded_percentage !== undefined ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{formatCurrency(investment.target_commitment || 0)}</span>
                        <span>{investment.funded_percentage}%</span>
                      </div>
                      <Progress value={investment.funded_percentage} className="h-2 w-20" />
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{formatCurrency(investment.amount_invested)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(investment.current_value)}</TableCell>
                <TableCell className={`hidden lg:table-cell ${unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {unrealizedPL >= 0 ? '+' : ''}{formatCurrency(unrealizedPL)}
                </TableCell>
                <TableCell className={`${investment.net_return_percent && investment.net_return_percent >= 0 ? 'text-green-400' : 'text-red-400'} font-medium`}>
                  <div className="flex items-center gap-1">
                    {investment.net_return_percent && investment.net_return_percent >= 0 ? 
                      <TrendingUp className="h-3 w-3" /> : 
                      <TrendingDown className="h-3 w-3" />
                    }
                    {investment.net_return_percent?.toFixed(2) || '0.00'}%
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">{investment.irr?.toFixed(2) || '0.00'}%</TableCell>
                <TableCell className="hidden xl:table-cell">{formatCurrency(investment.income_ytd || 0)}</TableCell>
                <TableCell className="hidden xl:table-cell">
                  {investment.next_payout_date ? (
                    <div className="text-sm">
                      <div>{formatCurrency(investment.next_payout_amount || 0)}</div>
                      <div className="text-muted-foreground">
                        {new Date(investment.next_payout_date).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{getStatusBadge(investment.investment_status)}</TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Sparkline data={[65, 78, 82, 85, 88, 92, 95, 98]} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu for {investment.properties.title}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onRowClick(investment)}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download Statement
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Export Cashflows
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}