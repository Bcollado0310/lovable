import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  DollarSign, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Download,
  Filter
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { analytics } from '@/utils/analytics';

interface ActivityItem {
  id: string;
  type: 'investment' | 'distribution' | 'document' | 'message' | 'account';
  title: string;
  description: string;
  date: string;
  amount?: number;
  status?: string;
  link?: string;
}

interface InvestmentActivityFeedProps {
  activities: ActivityItem[];
  currency: string;
}

const filterOptions = [
  { value: 'all', label: 'All', icon: Activity },
  { value: 'investment', label: 'Investments', icon: TrendingUp },
  { value: 'distribution', label: 'Distributions', icon: DollarSign },
  { value: 'document', label: 'Documents', icon: FileText },
  { value: 'message', label: 'Messages', icon: MessageSquare },
];

export function InvestmentActivityFeed({ activities, currency }: InvestmentActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      investment: TrendingUp,
      distribution: DollarSign,
      document: FileText,
      message: MessageSquare,
      account: Activity
    };
    const Icon = icons[type] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const filteredActivities = activeFilter === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === activeFilter);

  const handleExportCSV = () => {
    analytics.track('activity_export_csv');
    // Export logic would go here
    console.log('Exporting activity feed as CSV...');
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    analytics.track('activity_filter_changed', { filter });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card className="glass-card border-glass-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Investment Activity
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Badge
                key={option.value}
                variant={activeFilter === option.value ? "default" : "outline"}
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleFilterChange(option.value)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {option.label}
              </Badge>
            );
          })}
        </div>

        {/* Activity Feed */}
        {filteredActivities.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No recent activity"
            description="Activity related to your investments will appear here."
          />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredActivities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start gap-3 p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                      {activity.amount && (
                        <div className="text-sm font-medium text-primary mt-1">
                          {formatCurrency(activity.amount)}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.date)}
                      </div>
                      {activity.status && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {activity.link && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 h-auto p-0 text-xs hover:text-primary"
                    >
                      View Details →
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredActivities.length > 0 && (
          <Button 
            variant="outline" 
            className="w-full" 
            disabled={isLoading}
            onClick={() => {
              setIsLoading(true);
              // Simulate loading more activities
              setTimeout(() => setIsLoading(false), 1000);
            }}
          >
            {isLoading ? 'Loading...' : 'Load More Activity'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}