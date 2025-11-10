import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  DollarSign, 
  FileText, 
  MessageSquare, 
  User, 
  Download,
  ChevronRight,
  Building2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react";
import { useDashboardCollapse } from "@/hooks/useDashboardCollapse";
import { dashboardAnalytics } from "@/utils/analytics";

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

interface ActivityTimelineProps {
  activities: ActivityItem[];
  mode?: 'simple' | 'pro';
}

const ACTIVITY_ICONS = {
  investment: Building2,
  distribution: TrendingUp,
  document: FileText,
  message: MessageSquare,
  account: User
};

const FILTER_OPTIONS = [
  { key: "all", label: "All", count: 0 },
  { key: "investment", label: "Investments", count: 0 },
  { key: "distribution", label: "Distributions", count: 0 },
  { key: "document", label: "Documents", count: 0 },
  { key: "message", label: "Messages", count: 0 },
  { key: "account", label: "Account", count: 0 }
];

export function ActivityTimeline({ activities, mode = 'pro' }: ActivityTimelineProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const { isCollapsed, toggleCollapse } = useDashboardCollapse(mode);

  // Calculate counts for each filter
  const filterCounts = activities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredActivities = selectedFilter === "all" 
    ? activities 
    : activities.filter(activity => activity.type === selectedFilter);

  const displayedActivities = mode === 'simple' ? activities.slice(0, 3) : filteredActivities;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    const IconComponent = ACTIVITY_ICONS[type as keyof typeof ACTIVITY_ICONS] || Activity;
    return IconComponent;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "investment": return "text-blue-400";
      case "distribution": return "text-green-400";
      case "document": return "text-purple-400";
      case "message": return "text-yellow-400";
      case "account": return "text-orange-400";
      default: return "text-muted-foreground";
    }
  };

  const handleExportCSV = () => {
    dashboardAnalytics.activityExportCsv();
    // In production, this would generate and download a CSV file
    console.log("Exporting activity to CSV...");
  };

  return (
    <Card className="glass-card border-glass-border overflow-visible">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleCollapse('activity', (moduleKey, isCollapsed, mode) => {
                if (isCollapsed) {
                  dashboardAnalytics.moduleCollapsed(moduleKey, mode);
                } else {
                  dashboardAnalytics.moduleExpanded(moduleKey, mode);
                }
              })}
              className={`p-1 hover:bg-muted rounded-sm transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-1 ${mode === 'simple' ? 'h-7 w-7' : 'h-6 w-6'}`}
              aria-label={`${isCollapsed('activity') ? 'Expand' : 'Collapse'} activity section`}
              aria-expanded={!isCollapsed('activity')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCollapse('activity', (moduleKey, isCollapsed, mode) => {
                    if (isCollapsed) {
                      dashboardAnalytics.moduleCollapsed(moduleKey, mode);
                    } else {
                      dashboardAnalytics.moduleExpanded(moduleKey, mode);
                    }
                  });
                }
              }}
            >
              {isCollapsed('activity') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
            <Activity className={`text-primary ${mode === 'simple' ? 'h-5 w-5' : 'h-4 w-4'}`} />
            <CardTitle className={mode === 'simple' ? 'text-lg font-semibold' : 'text-base'}>Activity Timeline</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                dashboardAnalytics.viewDetailsClicked('activity', mode, '/activity');
                // Keep activity on dashboard for now since no dedicated route exists
              }}
              className={mode === 'simple' ? 'text-sm h-8 px-3' : 'text-xs h-7 px-2'}
            >
              <ExternalLink className={`mr-1 ${mode === 'simple' ? 'h-4 w-4' : 'h-3 w-3'}`} />
              View Details
            </Button>
            {mode === 'simple' && activities.length > 3 && (
              <Button variant="outline" size="sm">
                Open Activity
              </Button>
            )}
            {mode === 'pro' && (
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
        
        {/* Filter Chips - Hide in simple mode */}
        {mode === 'pro' && (
          <div className="flex flex-wrap gap-2 mt-4">
            {FILTER_OPTIONS.map((filter) => {
              const count = filterCounts[filter.key] || 0;
              return (
                <Button
                  key={filter.key}
                  variant={selectedFilter === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.key)}
                  className={`${selectedFilter === filter.key ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {filter.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </CardHeader>
      
      <CardContent className={`overflow-visible transition-all duration-200 ${
        isCollapsed('activity') ? 'h-0 overflow-hidden opacity-0 p-0' : 
        `animate-fade-in ${mode === 'simple' ? 'p-6 space-y-4' : 'p-4 space-y-3'}`
      }`}>
        {displayedActivities.length > 0 ? (
          <ScrollArea className={mode === 'simple' ? 'h-auto' : 'h-96'}>
            <div className="space-y-4">
              {displayedActivities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.type);
                const isLast = index === displayedActivities.length - 1;
                
                return (
                  <div key={activity.id} className="relative">
                    {/* Timeline connector */}
                    {!isLast && (
                      <div className="absolute left-5 top-10 w-px h-8 bg-border" />
                    )}
                    
                    <div className="flex gap-4 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center ${getTypeColor(activity.type)}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{activity.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(activity.date)}
                              </span>
                              {activity.amount && (
                                <span className="text-xs font-medium text-primary">
                                  ${activity.amount.toLocaleString()}
                                </span>
                              )}
                              {activity.status && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                  {activity.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {activity.link && (
                            <Button variant="ghost" size="sm" className="flex-shrink-0">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {mode === 'simple' ? "No recent activity." : (selectedFilter === "all" ? "No recent activity." : `No ${selectedFilter} activity.`)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}