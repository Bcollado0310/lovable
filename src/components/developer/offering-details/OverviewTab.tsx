import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp, 
  Play, 
  Pause, 
  X, 
  Copy,
  Eye,
  Clock,
  MessageCircle,
  HelpCircle,
  FileText,
  Mail
} from 'lucide-react';
import { DeveloperOffering, computeFundingProgress, formatCurrency, formatDate, getDaysUntilDeadline } from '@/utils/developerHelpers';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';
import { DailyContributionsChart } from './DailyContributionsChart';

interface OverviewTabProps {
  offering: DeveloperOffering;
}

export function OverviewTab({ offering }: OverviewTabProps) {
  const { hasPermission } = useDeveloperAuth();
  const progress = computeFundingProgress(offering);
  const daysLeft = getDaysUntilDeadline(offering.funding_deadline);

  // Mock data for top sources - in real app this would come from API
  const topSources = [
    { source: 'Direct Traffic', amount: 125000, percentage: 45 },
    { source: 'Email Campaign', amount: 89000, percentage: 32 },
    { source: 'Social Media', amount: 45000, percentage: 16 },
    { source: 'Referrals', amount: 19000, percentage: 7 }
  ];

  const timeline = [
    { date: '2024-01-15', event: 'Offering Created', status: 'completed' },
    { date: '2024-01-20', event: 'Due Diligence Started', status: 'completed' },
    { date: '2024-02-01', event: 'Marketing Launch', status: 'completed' },
    { date: '2024-02-15', event: '50% Funding Milestone', status: offering.raised_amount >= offering.target_amount * 0.5 ? 'completed' : 'pending' },
    { date: offering.funding_deadline || '2024-04-01', event: 'Funding Deadline', status: 'pending' }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(offering.target_amount)}</div>
            <p className="text-xs text-muted-foreground">Funding goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Raised</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(offering.raised_amount)}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground">{progress.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offering.investor_count}</div>
            <p className="text-xs text-muted-foreground">Total backers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysLeft !== null ? daysLeft : 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {offering.funding_deadline ? formatDate(offering.funding_deadline) : 'No deadline set'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily Contributions Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Contributions</CardTitle>
            <CardDescription>Investment activity over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <DailyContributionsChart offeringId={offering.id} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="overflow-hidden bg-gradient-to-br from-background to-background/50 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription className="text-sm text-muted-foreground/80">
              Manage this offering
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-full pb-6">
            {/* Main Actions - Evenly Spaced */}
            <div className="flex flex-col gap-3 flex-1">
              <Button 
                className="w-full h-11 hover:bg-primary/8 hover:border-primary/20 border-border/40 transition-colors duration-200 group" 
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-3 group-hover:scale-105 group-hover:text-primary/90 transition-all duration-200" />
                <span className="font-medium group-hover:text-primary/90">Preview Public Page</span>
              </Button>
              
              <Button 
                className="w-full h-10 hover:bg-primary/8 hover:border-primary/20 border-border/30 transition-colors duration-200 group" 
                variant="outline"
                size="sm"
              >
                <MessageCircle className="w-4 h-4 mr-3 group-hover:scale-105 group-hover:text-primary/90 transition-all duration-200" />
                <span className="text-sm group-hover:text-primary/90">Request to Pause Offering</span>
              </Button>
              
              <Button 
                className="w-full h-10 hover:bg-primary/8 hover:border-primary/20 border-border/30 transition-colors duration-200 group" 
                variant="outline"
                size="sm"
              >
                <Mail className="w-4 h-4 mr-3 group-hover:scale-105 group-hover:text-primary/90 transition-all duration-200" />
                <span className="text-sm group-hover:text-primary/90">Request to Close Offering</span>
              </Button>
            </div>
            
            <div className="pt-4 mt-2 border-t border-border/30 space-y-2">
              
              <Button 
                className="w-full h-9 hover:bg-primary/8 text-muted-foreground hover:text-primary/90 transition-colors duration-200 group" 
                variant="ghost"
                size="sm"
              >
                <FileText className="w-3.5 h-3.5 mr-3 group-hover:scale-105 transition-transform duration-200" />
                <span className="text-xs font-medium">Export Offering Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Key milestones and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === 'completed' ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.event}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                  </div>
                  <Badge variant={item.status === 'completed' ? 'default' : 'outline'}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Top Investment Sources</CardTitle>
            <CardDescription>Where your investments are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{source.source}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-muted rounded-full h-1.5 max-w-[100px]">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{source.percentage}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(source.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}