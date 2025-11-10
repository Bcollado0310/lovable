import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { DateRange } from '@/components/ui/range-selector';

interface PerformanceData {
  date: string;
  portfolio_value: number;
  net_return_pct: number;
  net_contribution: number;
}

// Mock data - in production this would come from Supabase with React Query
const getMockPerformanceData = (): PerformanceData[] => [
  { date: "2023-10-01", portfolio_value: 75000, net_return_pct: -2.5, net_contribution: 75000 },
  { date: "2023-11-01", portfolio_value: 82000, net_return_pct: 1.2, net_contribution: 80000 },
  { date: "2023-12-01", portfolio_value: 95000, net_return_pct: 3.8, net_contribution: 90000 },
  { date: "2024-01-01", portfolio_value: 100000, net_return_pct: 0, net_contribution: 100000 },
  { date: "2024-02-01", portfolio_value: 102000, net_return_pct: 2.0, net_contribution: 120000 },
  { date: "2024-03-01", portfolio_value: 125000, net_return_pct: 4.2, net_contribution: 120000 },
  { date: "2024-04-01", portfolio_value: 142000, net_return_pct: 6.8, net_contribution: 140000 },
  { date: "2024-05-01", portfolio_value: 155000, net_return_pct: 8.9, net_contribution: 150000 },
  { date: "2024-06-01", portfolio_value: 167000, net_return_pct: 11.3, net_contribution: 150000 },
  { date: "2024-07-01", portfolio_value: 175000, net_return_pct: 12.5, net_contribution: 160000 },
  { date: "2024-08-01", portfolio_value: 183000, net_return_pct: 14.2, net_contribution: 170000 },
  { date: "2024-09-01", portfolio_value: 189000, net_return_pct: 8.0, net_contribution: 175000 },
  { date: "2024-09-14", portfolio_value: 192000, net_return_pct: 9.7, net_contribution: 175000 }
];

function calculateWindow(range: DateRange, anchor: Date, firstActivityDate?: Date): { start: Date; end: Date } {
  const currentYear = anchor.getFullYear();
  const firstActivity = firstActivityDate || new Date(currentYear - 1, 0, 1);

  let start: Date;
  let end: Date;

  switch (range) {
    case "1m": {
      start = new Date(anchor);
      start.setDate(start.getDate() - 30);
      break;
    }
    case "3m": {
      start = new Date(anchor);
      start.setDate(start.getDate() - 90);
      break;
    }
    case "6m": {
      start = new Date(anchor);
      start.setDate(start.getDate() - 182);
      break;
    }
    case "1y": {
      start = new Date(anchor);
      start.setDate(start.getDate() - 365);
      break;
    }
    case "ytd": {
      start = new Date(anchor.getFullYear(), 0, 1);
      break;
    }
    case "all":
    default: {
      start = firstActivity;
      break;
    }
  }

  // Clamp start to first activity
  if (start < firstActivity) start = firstActivity;

  // Inclusive end with epsilon (+1 day)
  end = new Date(anchor.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

export function usePerformanceSeries(range: DateRange) {
  const { user } = useAuth();
  
  // Memoize with range in dependency array (simulates React Query cache key)
  const filteredData = useMemo(() => {
    const allData = getMockPerformanceData();
    
    if (!allData || allData.length === 0) return [];
    
    // Normalize to UTC timestamps and sort chronologically
    const sorted = [...allData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const firstActivityDate = new Date(sorted[0].date);
    const now = new Date();
    
    // Primary window anchored at now
    let { start, end } = calculateWindow(range, now, firstActivityDate);

    const withinWindow = (d: Date) => d >= start && d <= end;

    // Filter with inclusive end using epsilon
    let filtered = sorted.filter(item => {
      const itemDate = new Date(item.date);
      return withinWindow(itemDate) && isFinite(item.portfolio_value);
    });

    // Fallback: if no points in the now-anchored window, anchor to last available point
    if (filtered.length === 0 && range !== 'all') {
      const lastDate = new Date(sorted[sorted.length - 1].date);
      ({ start, end } = calculateWindow(range, lastDate, firstActivityDate));
      filtered = sorted.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end && isFinite(item.portfolio_value);
      });
    }

    // Final fallback to all-time if still empty (shouldn't happen with any data)
    if (filtered.length === 0) {
      const lastDate = new Date(sorted[sorted.length - 1].date);
      ({ start, end } = calculateWindow('all', lastDate, firstActivityDate));
      filtered = sorted.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end && isFinite(item.portfolio_value);
      });
    }

    // Always return data, even for single points - no guards that return []
    return filtered;
  }, [range, user?.id]); // Include range and userId in memo key
  
  return {
    data: filteredData,
    loading: false,
    error: null
  };
}