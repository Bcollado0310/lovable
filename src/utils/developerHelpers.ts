export interface DeveloperOffering {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  location: string;
  property_type: string;
  target_amount: number;
  raised_amount: number;
  minimum_investment: number;
  expected_annual_return?: number;
  status: 'coming_soon' | 'active' | 'funded' | 'closed';
  funding_deadline?: string;
  images?: string[];
  documents?: string[];
  investor_count: number;
  created_at: string;
  updated_at: string;
}

export interface DeveloperInvestor {
  id: string;
  organization_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  total_invested: number;
  investment_count: number;
  status: 'active' | 'inactive' | 'pending';
  investor_type: 'individual' | 'institutional' | 'accredited';
  created_at: string;
  updated_at: string;
}

export interface ContributionEvent {
  id: string;
  organization_id: string;
  offering_id: string;
  investor_id: string;
  amount: number;
  event_type: 'investment' | 'distribution' | 'refund';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface OfferingStatus {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  description: string;
}

export function deriveStatus(offering: DeveloperOffering): OfferingStatus {
  const { status, funding_deadline, raised_amount, target_amount } = offering;
  
  if (status === 'funded') {
    return {
      label: 'Fully Funded',
      variant: 'default',
      description: 'This offering has reached its funding target'
    };
  }
  
  if (status === 'closed') {
    return {
      label: 'Closed',
      variant: 'destructive',
      description: 'This offering is no longer accepting investments'
    };
  }
  
  if (status === 'coming_soon') {
    return {
      label: 'Coming Soon',
      variant: 'secondary',
      description: 'This offering will be available for investment soon'
    };
  }
  
  if (status === 'active') {
    const fundingProgress = computeFundingProgress(offering);
    const daysLeft = funding_deadline ? 
      Math.max(0, Math.ceil((new Date(funding_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
      null;
    
    if (daysLeft !== null && daysLeft <= 7) {
      return {
        label: 'Closing Soon',
        variant: 'destructive',
        description: `Only ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
      };
    }
    
    if (fundingProgress >= 90) {
      return {
        label: 'Nearly Funded',
        variant: 'default',
        description: `${fundingProgress.toFixed(1)}% funded`
      };
    }
    
    return {
      label: 'Active',
      variant: 'default',
      description: `${fundingProgress.toFixed(1)}% funded`
    };
  }
  
  return {
    label: 'Unknown',
    variant: 'outline',
    description: 'Status unclear'
  };
}

export function computeFundingProgress(offering: DeveloperOffering): number {
  if (offering.target_amount === 0) return 0;
  return Math.min(100, (offering.raised_amount / offering.target_amount) * 100);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function getDaysUntilDeadline(deadline?: string): number | null {
  if (!deadline) return null;
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

export interface DeveloperMetrics {
  totalRaised: number;
  totalInvestors: number;
  activeOfferings: number;
  completedOfferings: number;
  totalDistributions: number;
  avgInvestmentSize: number;
}

export interface DeveloperOverview {
  organization: {
    id: string;
    name: string;
    description?: string;
    website?: string;
  };
  metrics: DeveloperMetrics;
  recentActivity: ContributionEvent[];
}