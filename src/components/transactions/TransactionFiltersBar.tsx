import { useState } from 'react';
import { Search, Calendar, Filter, Download, FileText, Landmark, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTransactionFilters, TransactionType, TransactionStatus, DateRangeType, GroupingType } from '@/hooks/useTransactionFilters';
import { cn } from '@/lib/utils';

const transactionTypeOptions: { value: TransactionType; label: string }[] = [
  { value: 'contribution', label: 'Contribution/Funding' },
  { value: 'capital_call', label: 'Capital Call' },
  { value: 'distribution_income', label: 'Distribution (Income)' },
  { value: 'return_of_capital', label: 'Return of Capital' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'fee_mgmt', label: 'Management Fee' },
  { value: 'fee_txn', label: 'Transaction Fee' },
  { value: 'dividend', label: 'Dividend/Interest' },
  { value: 'sale_proceeds', label: 'Sale Proceeds' },
  { value: 'tax_withholding', label: 'Tax Withholding' },
  { value: 'tax_refund', label: 'Tax Refund' },
  { value: 'adjustment', label: 'Adjustment' }
];

const statusOptions: { value: TransactionStatus; label: string }[] = [
  { value: 'posted', label: 'Posted' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'reversed', label: 'Reversed' }
];

const dateRangeOptions: { value: DateRangeType; label: string }[] = [
  { value: 'last_30', label: 'Last 30 Days' },
  { value: 'last_90', label: 'Last 90 Days' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' }
];

const groupingOptions: { value: GroupingType; label: string }[] = [
  { value: 'none', label: 'No Grouping' },
  { value: 'month', label: 'By Month' },
  { value: 'investment', label: 'By Investment' },
  { value: 'type', label: 'By Type' }
];

interface TransactionFiltersBarProps {
  onExportCSV: () => void;
  onExportXLSX: () => void;
  onGenerateStatement: () => void;
  onConnectBank: () => void;
  isBankConnected?: boolean;
}

export default function TransactionFiltersBar({
  onExportCSV,
  onExportXLSX,
  onGenerateStatement,
  onConnectBank,
  isBankConnected = false
}: TransactionFiltersBarProps) {
  const { filters, updateFilter, resetFilters, hasActiveFilters } = useTransactionFilters();
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

  const handleTypeToggle = (type: TransactionType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    updateFilter('types', newTypes);
  };

  const handleStatusToggle = (status: TransactionStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    updateFilter('statuses', newStatuses);
  };

  const handleDateRangeChange = (range: DateRangeType) => {
    updateFilter('dateRange', range);
    if (range === 'custom') {
      setShowCustomDateRange(true);
    } else {
      setShowCustomDateRange(false);
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cash Ledger</h1>
          <p className="text-sm text-muted-foreground">Track all transactions and cash flows</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onGenerateStatement} className="gap-2">
            <FileText className="h-4 w-4" />
            Generate Statement
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <Button variant="ghost" onClick={onExportCSV} className="w-full justify-start gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="ghost" onClick={onExportXLSX} className="w-full justify-start gap-2">
                  <Download className="h-4 w-4" />
                  Export XLSX
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {!isBankConnected && (
            <Button onClick={onConnectBank} className="gap-2">
              <Landmark className="h-4 w-4" />
              Connect Bank
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes, investment name, reference..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Date Range */}
        <Popover open={showCustomDateRange} onOpenChange={setShowCustomDateRange}>
          <PopoverTrigger asChild>
            <div>
              <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverTrigger>
          {filters.dateRange === 'custom' && (
            <PopoverContent className="w-auto p-4">
              <div className="space-y-4">
                <div>
                  <Label>Start Date</Label>
                  <CalendarComponent
                    mode="single"
                    selected={filters.customStartDate}
                    onSelect={(date) => updateFilter('customStartDate', date)}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <CalendarComponent
                    mode="single"
                    selected={filters.customEndDate}
                    onSelect={(date) => updateFilter('customEndDate', date)}
                    className="rounded-md border"
                  />
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>

        {/* Transaction Types */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Types {filters.types.length > 0 && `(${filters.types.length})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Transaction Types</h4>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {transactionTypeOptions.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={filters.types.includes(option.value)}
                      onCheckedChange={() => handleTypeToggle(option.value)}
                    />
                    <Label
                      htmlFor={option.value}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              Status {filters.statuses.length > 0 && `(${filters.statuses.length})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Status</h4>
              <div className="space-y-2">
                {statusOptions.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={filters.statuses.includes(option.value)}
                      onCheckedChange={() => handleStatusToggle(option.value)}
                    />
                    <Label
                      htmlFor={option.value}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Amount Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              Amount {(filters.amountMin || filters.amountMax) && '(filtered)'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Amount Range</h4>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="amount-min">Minimum</Label>
                  <Input
                    id="amount-min"
                    type="number"
                    placeholder="0"
                    value={filters.amountMin || ''}
                    onChange={(e) => updateFilter('amountMin', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="amount-max">Maximum</Label>
                  <Input
                    id="amount-max"
                    type="number"
                    placeholder="No limit"
                    value={filters.amountMax || ''}
                    onChange={(e) => updateFilter('amountMax', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-8" />

        {/* Grouping */}
        <Select value={filters.groupBy} onValueChange={(value: GroupingType) => updateFilter('groupBy', value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groupingOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={resetFilters} className="gap-2">
            <X className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {(filters.types.length > 0 || filters.statuses.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {filters.types.map(type => (
            <Badge key={type} variant="secondary" className="gap-1">
              {transactionTypeOptions.find(opt => opt.value === type)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleTypeToggle(type)}
              />
            </Badge>
          ))}
          {filters.statuses.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              {statusOptions.find(opt => opt.value === status)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleStatusToggle(status)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}