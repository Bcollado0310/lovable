import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDate } from "@/utils/developerHelpers";
import { ExternalLink } from "lucide-react";

interface ActiveOffering {
  id: string;
  title: string;
  raised_amount: number;
  target_amount: number;
  funding_deadline: string;
  status: string;
}

interface ActiveOfferingsTableProps {
  offerings: ActiveOffering[];
  loading?: boolean;
}

export const ActiveOfferingsTable = memo(function ActiveOfferingsTable({
  offerings,
  loading = false,
}: ActiveOfferingsTableProps) {
  const navigate = useNavigate();
  
  const activeOfferings = offerings
    .filter(offering => offering.status === 'funding' || offering.status === 'coming_soon')
    .slice(0, 5);

  const getFundingPercentage = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funding':
        return 'text-status-funding';
      case 'coming_soon':
        return 'text-status-waitlist';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Offerings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 w-full animate-pulse bg-muted/20 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeOfferings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Offerings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No active offerings</p>
            <Button
              variant="outline" 
              size="sm"
              className="mt-2"
              onClick={() => navigate('/dev/offerings')}
            >
              Create Offering
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Active Offerings</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dev/offerings')}
          className="text-xs"
        >
          See all
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeOfferings.map((offering) => {
            const fundingPercentage = getFundingPercentage(offering.raised_amount, offering.target_amount);
            
            return (
              <div key={offering.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border/50 hover:border-border transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm truncate">{offering.title}</h4>
                    <span className={`text-xs ${getStatusColor(offering.status)}`}>
                      {offering.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={fundingPercentage} className="h-2.5" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatCurrency(offering.raised_amount)} / {formatCurrency(offering.target_amount)}
                      </span>
                      <span>{fundingPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Closes: {formatDate(offering.funding_deadline)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => navigate(`/dev/offerings/${offering.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});