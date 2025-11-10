import { Search, Filter, Grid3X3, Table, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInvestmentFilters } from '@/hooks/useInvestmentFilters';
import { analytics } from '@/utils/analytics';

interface InvestmentFiltersBarProps {
  onExport: (type: 'csv' | 'xlsx', scope: 'selected' | 'all') => void;
  selectedCount: number;
}

export function InvestmentFiltersBar({ onExport, selectedCount }: InvestmentFiltersBarProps) {
  const { filters, updateFilter, resetFilters, isTableView, setIsTableView } = useInvestmentFilters();

  const statusFilters = [
    { value: 'all', label: 'All', count: 0 },
    { value: 'active', label: 'Active', count: 0 },
    { value: 'exited', label: 'Exited', count: 0 },
    { value: 'commitments', label: 'Commitments', count: 0 },
    { value: 'watchlist', label: 'Watchlist', count: 0 },
  ];

  const handleExport = (type: 'csv' | 'xlsx', scope: 'selected' | 'all') => {
    analytics.track('investment_export', { type, scope, selected_count: selectedCount });
    onExport(type, scope);
  };

  return (
    <div className="glass-card border-glass-border p-4 space-y-4">
      {/* Top Row - Search, Group By, View Toggle, Export */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search investments..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>

          {/* Group By */}
          <Select
            value={filters.groupBy}
            onValueChange={(value: any) => {
              updateFilter('groupBy', value);
              analytics.track('investment_group_changed', { group: value });
            }}
          >
            <SelectTrigger className="w-48 bg-background/50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asset_type">Asset Type</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="geography">Geography</SelectItem>
              <SelectItem value="risk">Risk</SelectItem>
              <SelectItem value="sponsor">Sponsor</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right Side - View Toggle & Export */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={isTableView ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsTableView(true)}
              className="px-3"
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant={!isTableView ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsTableView(false)}
              className="px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Export
                <MoreHorizontal className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv', 'all')}>
                Export All as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx', 'all')}>
                Export All as Excel
              </DropdownMenuItem>
              {selectedCount > 0 && (
                <>
                  <DropdownMenuItem onClick={() => handleExport('csv', 'selected')}>
                    Export Selected as CSV ({selectedCount})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('xlsx', 'selected')}>
                    Export Selected as Excel ({selectedCount})
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Second Row - Status Chips, Time Range, Sort, Currency */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <Badge
              key={status.value}
              variant={filters.status === status.value ? "default" : "outline"}
              className="cursor-pointer hover:bg-accent"
              onClick={() => updateFilter('status', status.value as any)}
            >
              {status.label}
            </Badge>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Time Range */}
          <Select
            value={filters.timeRange}
            onValueChange={(value: any) => {
              updateFilter('timeRange', value);
              analytics.track('investment_timerange_changed', { range: value });
            }}
          >
            <SelectTrigger className="w-48 bg-background/50">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="since_inception">Since Inception</SelectItem>
              <SelectItem value="ytd">YTD</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={`${filters.sortBy}_${filters.sortOrder}`}
            onValueChange={(value: any) => {
              const [sortBy, sortOrder] = value.split('_');
              updateFilter('sortBy', sortBy);
              updateFilter('sortOrder', sortOrder);
              analytics.track('investment_sort_changed', { sort_by: sortBy, order: sortOrder });
            }}
          >
            <SelectTrigger className="w-48 bg-background/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value_desc">Value (High to Low)</SelectItem>
              <SelectItem value="value_asc">Value (Low to High)</SelectItem>
              <SelectItem value="irr_desc">IRR (High to Low)</SelectItem>
              <SelectItem value="irr_asc">IRR (Low to High)</SelectItem>
              <SelectItem value="net_return_desc">Net Return % (High to Low)</SelectItem>
              <SelectItem value="net_return_asc">Net Return % (Low to High)</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>

          {/* Currency */}
          <Select
            value={filters.currency}
            onValueChange={(value: any) => updateFilter('currency', value)}
          >
            <SelectTrigger className="w-24 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Indicator */}
      {(filters.search || filters.status !== 'all' || filters.timeRange !== 'since_inception') && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {filters.search && <Badge variant="secondary">Search: "{filters.search}"</Badge>}
          {filters.status !== 'all' && <Badge variant="secondary">Status: {filters.status}</Badge>}
          {filters.timeRange !== 'since_inception' && <Badge variant="secondary">Range: {filters.timeRange}</Badge>}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-auto p-1 text-xs hover:text-primary"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}