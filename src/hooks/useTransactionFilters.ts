import { useState, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type TransactionType = 
  | 'contribution'
  | 'capital_call'
  | 'distribution_income'
  | 'return_of_capital'
  | 'withdrawal'
  | 'fee_mgmt'
  | 'fee_txn'
  | 'dividend'
  | 'interest'
  | 'sale_proceeds'
  | 'tax_withholding'
  | 'tax_refund'
  | 'adjustment';

export type TransactionStatus = 'posted' | 'pending' | 'failed' | 'reversed';

export type DateRangeType = 'last_30' | 'last_90' | 'ytd' | 'last_year' | 'custom';

export type GroupingType = 'none' | 'month' | 'investment' | 'type';

export interface TransactionFilters {
  search: string;
  dateRange: DateRangeType;
  customStartDate?: Date;
  customEndDate?: Date;
  types: TransactionType[];
  statuses: TransactionStatus[];
  investmentIds: string[];
  methods: string[];
  amountMin?: number;
  amountMax?: number;
  groupBy: GroupingType;
}

const defaultFilters: TransactionFilters = {
  search: '',
  dateRange: 'last_30',
  types: [],
  statuses: [],
  investmentIds: [],
  methods: [],
  groupBy: 'none'
};

export function useTransactionFilters() {
  const [filters, setFilters] = useLocalStorage<TransactionFilters>('transaction_filters', defaultFilters);
  const [isTableView] = useLocalStorage('transactions_table_view', true);

  const updateFilter = <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.dateRange !== 'last_30' ||
      filters.types.length > 0 ||
      filters.statuses.length > 0 ||
      filters.investmentIds.length > 0 ||
      filters.methods.length > 0 ||
      filters.amountMin !== undefined ||
      filters.amountMax !== undefined
    );
  }, [filters]);

  const getDateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filters.dateRange) {
      case 'last_30':
        return {
          start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: today
        };
      case 'last_90':
        return {
          start: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
          end: today
        };
      case 'ytd':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: today
        };
      case 'last_year':
        return {
          start: new Date(now.getFullYear() - 1, 0, 1),
          end: new Date(now.getFullYear() - 1, 11, 31)
        };
      case 'custom':
        return {
          start: filters.customStartDate || today,
          end: filters.customEndDate || today
        };
      default:
        return { start: today, end: today };
    }
  }, [filters.dateRange, filters.customStartDate, filters.customEndDate]);

  const filterTransactions = useMemo(() => {
    return (transactions: any[]) => {
      return transactions.filter(transaction => {
        // Date range filter
        const transactionDate = new Date(transaction.created_at);
        const { start, end } = getDateRange;
        if (transactionDate < start || transactionDate > end) {
          return false;
        }

        // Search filter
        if (filters.search && !transaction.description?.toLowerCase().includes(filters.search.toLowerCase()) &&
            !transaction.properties?.title?.toLowerCase().includes(filters.search.toLowerCase()) &&
            !transaction.id.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }

        // Type filter
        if (filters.types.length > 0 && !filters.types.includes(transaction.transaction_type)) {
          return false;
        }

        // Status filter
        if (filters.statuses.length > 0 && !filters.statuses.includes(transaction.status || 'posted')) {
          return false;
        }

        // Investment filter
        if (filters.investmentIds.length > 0 && !filters.investmentIds.includes(transaction.investment_id)) {
          return false;
        }

        // Method filter
        if (filters.methods.length > 0 && !filters.methods.includes(transaction.method || 'unknown')) {
          return false;
        }

        // Amount range filter
        const amount = Math.abs(transaction.amount);
        if (filters.amountMin !== undefined && amount < filters.amountMin) {
          return false;
        }
        if (filters.amountMax !== undefined && amount > filters.amountMax) {
          return false;
        }

        return true;
      });
    };
  }, [filters, getDateRange]);

  const groupTransactions = useMemo(() => {
    return (transactions: any[]) => {
      if (filters.groupBy === 'none') {
        return transactions;
      }

      const grouped = transactions.reduce((acc, transaction) => {
        let key: string;
        
        switch (filters.groupBy) {
          case 'month':
            key = new Date(transaction.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            });
            break;
          case 'investment':
            key = transaction.properties?.title || transaction.investment_id || 'Other';
            break;
          case 'type':
            key = transaction.transaction_type.replace('_', ' ').toUpperCase();
            break;
          default:
            key = 'All';
        }

        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(transaction);
        return acc;
      }, {} as Record<string, any[]>);

      // Convert to flat array with group headers
      const result: any[] = [];
      Object.entries(grouped).forEach(([groupKey, groupTransactions]: [string, any[]]) => {
        result.push({
          isGroupHeader: true,
          groupKey,
          groupCount: groupTransactions.length,
          groupTotal: groupTransactions.reduce((sum, t) => sum + t.amount, 0)
        });
        result.push(...groupTransactions);
      });

      return result;
    };
  }, [filters.groupBy]);

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    isTableView,
    getDateRange,
    filterTransactions,
    groupTransactions
  };
}