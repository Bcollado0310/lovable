import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export type GroupBy = 'asset_type' | 'vehicle' | 'geography' | 'risk' | 'sponsor' | 'status';
export type StatusFilter = 'active' | 'exited' | 'commitments' | 'watchlist' | 'all';
export type TimeRange = 'since_inception' | 'ytd' | '1y' | 'custom';
export type SortBy = 'value' | 'irr' | 'net_return' | 'name';
export type Currency = 'USD' | 'EUR' | 'GBP';

interface FilterState {
  search: string;
  groupBy: GroupBy;
  status: StatusFilter;
  timeRange: TimeRange;
  sortBy: SortBy;
  sortOrder: 'asc' | 'desc';
  currency: Currency;
  customDateRange?: { start: Date; end: Date };
}

const defaultFilters: FilterState = {
  search: '',
  groupBy: 'asset_type',
  status: 'all',
  timeRange: 'since_inception',
  sortBy: 'value',
  sortOrder: 'desc',
  currency: 'USD',
};

export function useInvestmentFilters() {
  const [filters, setFilters] = useLocalStorage<FilterState>('investment-filters', defaultFilters);
  const [isTableView, setIsTableView] = useLocalStorage('investment-view-mode', true);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const filterInvestments = (investments: any[]) => {
    return useMemo(() => {
      let filtered = [...investments];

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(inv => 
          inv.properties?.title?.toLowerCase().includes(searchLower) ||
          inv.properties?.city?.toLowerCase().includes(searchLower) ||
          inv.properties?.sponsor?.toLowerCase().includes(searchLower)
        );
      }

      // Status filter
      if (filters.status !== 'all') {
        filtered = filtered.filter(inv => {
          switch (filters.status) {
            case 'active':
              return inv.investment_status === 'active';
            case 'exited':
              return inv.investment_status === 'exited';
            case 'commitments':
              return inv.investment_status === 'committed';
            case 'watchlist':
              return inv.investment_status === 'watchlist';
            default:
              return true;
          }
        });
      }

      // Sort
      filtered.sort((a, b) => {
        let aVal, bVal;
        
        switch (filters.sortBy) {
          case 'value':
            aVal = a.current_value || 0;
            bVal = b.current_value || 0;
            break;
          case 'irr':
            aVal = a.irr || 0;
            bVal = b.irr || 0;
            break;
          case 'net_return':
            aVal = a.net_return_percent || 0;
            bVal = b.net_return_percent || 0;
            break;
          case 'name':
            aVal = a.properties?.title || '';
            bVal = b.properties?.title || '';
            break;
          default:
            return 0;
        }

        if (typeof aVal === 'string') {
          return filters.sortOrder === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });

      return filtered;
    }, [investments, filters]);
  };

  const groupInvestments = (investments: any[]) => {
    return useMemo(() => {
      const grouped = investments.reduce((groups, investment) => {
        let key = 'Other';
        
        switch (filters.groupBy) {
          case 'asset_type':
            key = investment.properties?.property_type || 'Other';
            break;
          case 'geography':
            key = investment.properties?.city || 'Other';
            break;
          case 'risk':
            const risk = investment.properties?.risk_rating || 0;
            key = risk <= 3 ? 'Low Risk' : risk <= 6 ? 'Medium Risk' : 'High Risk';
            break;
          case 'sponsor':
            key = investment.properties?.sponsor || 'Other';
            break;
          case 'status':
            key = investment.investment_status || 'Other';
            break;
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(investment);
        return groups;
      }, {} as Record<string, any[]>);

      return grouped;
    }, [investments, filters.groupBy]);
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    isTableView,
    setIsTableView,
    filterInvestments,
    groupInvestments,
  };
}