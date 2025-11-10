import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from "@/hooks/useWishlist";

interface Portfolio {
  total_invested: number;
  current_value: number;
  total_returns: number;
  monthly_income: number;
  properties_count: number;
}

interface Investment {
  id: string;
  amount_invested: number;
  shares_owned: number;
  current_value: number;
  total_returns: number;
  investment_date: string;
  properties: {
    id: string;
    title: string;
    address: string;
    city: string;
    property_type: string;
    property_status: string;
    total_value: number;
    target_funding: number;
    current_funding: number;
    expected_annual_return: number;
    minimum_investment: number;
    risk_rating: number;
    images?: string[];
  };
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  payment_date?: string;
  processed_at?: string;
  created_at: string;
  properties?: {
    title: string;
  };
}

// Extended data structures for the new dashboard
interface KPIData {
  cash_available: number;
  total_invested: number;
  current_value: number;
  total_distributions: number;
  unfunded_commitments: number;
  active_investments: number;
}

interface PerformanceData {
  date: string;
  portfolio_value: number;
  net_return_pct: number;
  net_contribution: number;
}

interface AllocationData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface UpcomingPayout {
  id: string;
  date: string;
  investment: string;
  estimated_amount: number;
  status: "scheduled" | "processing" | "paid";
}

interface MonthlyDistribution {
  month: string;
  ordinary_income: number;
  return_of_capital: number;
  total: number;
}

interface Commitment {
  id: string;
  investment: string;
  commitment_amount: number;
  funded_amount: number;
  funding_percentage: number;
  funding_deadline: string;
  status: "active" | "completed" | "expired";
}

interface WatchlistItem {
  id: string;
  property_name: string;
  funding_progress: number;
  days_left: number;
  target_funding: number;
  current_funding: number;
  city?: string;
  expected_return?: number;
  minimum_investment?: number;
  image?: string;
}

interface ActivityItem {
  id: string;
  type: "investment" | "distribution" | "document" | "message" | "account";
  title: string;
  description: string;
  date: string;
  amount?: number;
  status?: string;
  link?: string;
}

export function usePortfolioData() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { wishlist } = useWishlist();

  const watchlistItems = useMemo<WatchlistItem[]>(() => {
    return wishlist.map((item) => {
      const progress =
        item.target_funding > 0
          ? Math.round((item.current_funding / item.target_funding) * 1000) / 10
          : 0;

      const deadline = item.funding_deadline ? new Date(item.funding_deadline) : null;
      const daysLeft =
        deadline && !Number.isNaN(deadline?.getTime())
          ? Math.max(
              Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
              0
            )
          : 0;

      return {
        id: item.id,
        property_name: item.title,
        funding_progress: progress,
        days_left: daysLeft,
        target_funding: item.target_funding,
        current_funding: item.current_funding,
        city: item.city,
        expected_return: item.expected_annual_return,
        minimum_investment: item.minimum_investment,
        image: item.image
      };
    });
  }, [wishlist]);

  // Mock data for development
  const getMockKPIData = (): KPIData => ({
    cash_available: 25000,
    total_invested: portfolio?.total_invested || 175000,
    current_value: portfolio?.current_value || 189000,
    total_distributions: 12500,
    unfunded_commitments: 50000,
    active_investments: portfolio?.properties_count || 4
  });

  const getMockPerformanceData = (): PerformanceData[] => [
    // Extended data for better filtering demonstration
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

  const getMockAllocationData = () => ({
    assetTypeData: [
      { name: "Residential", value: 89500, percentage: 47.4, color: "#8884d8" },
      { name: "Commercial", value: 56700, percentage: 30.0, color: "#82ca9d" },
      { name: "Development", value: 42800, percentage: 22.6, color: "#ffc658" }
    ],
    geographyData: [
      { name: "North America", value: 113400, percentage: 60.0, color: "#8884d8" },
      { name: "Europe", value: 47250, percentage: 25.0, color: "#82ca9d" },
      { name: "Asia Pacific", value: 28350, percentage: 15.0, color: "#ffc658" }
    ],
    riskBucketData: [
      { name: "Core", value: 75600, percentage: 40.0, color: "#8884d8" },
      { name: "Core Plus", value: 66150, percentage: 35.0, color: "#82ca9d" },
      { name: "Value Add", value: 47250, percentage: 25.0, color: "#ffc658" }
    ],
    sponsorData: [
      { name: "Aurora Capital", value: 56700, percentage: 30.0, color: "#8884d8" },
      { name: "Prime Developments", value: 47250, percentage: 25.0, color: "#82ca9d" },
      { name: "Metropolitan RE", value: 37800, percentage: 20.0, color: "#ffc658" },
      { name: "Others", value: 47250, percentage: 25.0, color: "#ff7300" }
    ]
  });

  const getMockUpcomingPayouts = (): UpcomingPayout[] => [
    {
      id: "1",
      date: "2024-10-15",
      investment: "Metropolitan Office Complex",
      estimated_amount: 2500,
      status: "scheduled"
    },
    {
      id: "2", 
      date: "2024-10-31",
      investment: "Riverside Apartments",
      estimated_amount: 1800,
      status: "processing"
    }
  ];

  const getMockMonthlyDistributions = (): MonthlyDistribution[] => [
    { month: "Jan", ordinary_income: 800, return_of_capital: 200, total: 1000 },
    { month: "Feb", ordinary_income: 950, return_of_capital: 250, total: 1200 },
    { month: "Mar", ordinary_income: 1200, return_of_capital: 300, total: 1500 },
    { month: "Apr", ordinary_income: 1100, return_of_capital: 400, total: 1500 },
    { month: "May", ordinary_income: 1300, return_of_capital: 200, total: 1500 },
    { month: "Jun", ordinary_income: 1400, return_of_capital: 350, total: 1750 },
    { month: "Jul", ordinary_income: 1250, return_of_capital: 250, total: 1500 },
    { month: "Aug", ordinary_income: 1350, return_of_capital: 400, total: 1750 },
    { month: "Sep", ordinary_income: 1500, return_of_capital: 300, total: 1800 }
  ];

  const getMockCommitments = (): Commitment[] => [
    {
      id: "1",
      investment: "Tech Campus Development",
      commitment_amount: 75000,
      funded_amount: 45000,
      funding_percentage: 60,
      funding_deadline: "2024-12-31",
      status: "active"
    }
  ];

  const getMockActivities = (): ActivityItem[] => [
    {
      id: "1",
      type: "investment",
      title: "Investment Completed",
      description: "Successfully invested in Riverside Apartments",
      date: "2024-09-10T10:30:00Z",
      amount: 25000,
      status: "completed"
    },
    {
      id: "2",
      type: "distribution",
      title: "Quarterly Distribution",
      description: "Received distribution from Metropolitan Office Complex",
      date: "2024-09-01T09:00:00Z",
      amount: 2500,
      status: "paid"
    },
    {
      id: "3",
      type: "document",
      title: "Annual Report Available",
      description: "2024 annual report for Downtown Retail Plaza",
      date: "2024-08-28T14:00:00Z",
      link: "/documents/annual-report-2024"
    }
  ];

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
    } else {
      // For development without auth - show sample data
      setLoading(false);
      console.warn("No authenticated user - showing empty data for development");
    }
  }, [user]);

  const fetchPortfolioData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [portfolioResponse, investmentsResponse, transactionsResponse] = await Promise.all([
        supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        
        supabase
          .from('investments')
          .select(`
            *,
            properties (
              id, title, address, city, property_type, property_status,
              total_value, target_funding, current_funding, 
              expected_annual_return, minimum_investment, risk_rating, images
            )
          `)
          .eq('user_id', user.id)
          .order('investment_date', { ascending: false }),
        
        supabase
          .from('transactions')
          .select(`
            *,
            properties (title)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      // Handle errors
      if (portfolioResponse.error) throw portfolioResponse.error;
      if (investmentsResponse.error) throw investmentsResponse.error;
      if (transactionsResponse.error) throw transactionsResponse.error;

      // Set data
      setPortfolio(portfolioResponse.data);
      setInvestments(investmentsResponse.data || []);
      setTransactions(transactionsResponse.data || []);

    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchPortfolioData();
  };

  return {
    portfolio,
    investments,
    transactions,
    loading,
    error,
    refreshData,
    // Extended data for new dashboard
    kpiData: getMockKPIData(),
    performanceData: getMockPerformanceData(),
    allocationData: getMockAllocationData(),
    upcomingPayouts: getMockUpcomingPayouts(),
    monthlyDistributions: getMockMonthlyDistributions(),
    totalIncome: 12500,
    totalROC: 3200,
    totalDistributions: 15700,
    commitments: getMockCommitments(),
    watchlist: watchlistItems,
    activities: getMockActivities()
  };
}
