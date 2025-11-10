import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

interface Commitment {
  id: string;
  property_title: string;
  commitment_amount: number;
  funded_amount: number;
  funded_percentage: number;
  deadline: string;
  status: 'pending' | 'active' | 'overdue';
}

interface CommitmentsSectionProps {
  commitments: Commitment[];
  currency: string;
  onCompleteFunding: (id: string) => void;
}

export function CommitmentsSection({ commitments, currency, onCompleteFunding }: CommitmentsSectionProps) {
  const formatCurrency = (amount: number) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getStatusBadge = (commitment: Commitment) => {
    const isOverdue = new Date(commitment.deadline) < new Date();
    const daysLeft = Math.ceil((new Date(commitment.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Due Soon</Badge>;
    } else {
      return <Badge variant="secondary">Active</Badge>;
    }
  };

  const getDaysLeft = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due Today';
    if (days <= 7) return `${days} days left`;
    return `${days} days left`;
  };

  if (commitments.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No active commitments"
        description="You don't have any unfunded commitments at this time."
      />
    );
  }

  return (
    <Card className="glass-card border-glass-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Unfunded Commitments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {commitments.map((commitment) => (
          <div key={commitment.id} className="border border-border/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold">{commitment.property_title}</h4>
                <div className="text-sm text-muted-foreground mt-1">
                  Commitment: {formatCurrency(commitment.commitment_amount)}
                </div>
              </div>
              {getStatusBadge(commitment)}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Funded: {formatCurrency(commitment.funded_amount)}</span>
                <span>{commitment.funded_percentage}%</span>
              </div>
              <Progress value={commitment.funded_percentage} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Remaining: {formatCurrency(commitment.commitment_amount - commitment.funded_amount)}</span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getDaysLeft(commitment.deadline)}
                </span>
              </div>
            </div>

            <Button 
              onClick={() => onCompleteFunding(commitment.id)}
              className="w-full"
              variant={new Date(commitment.deadline) < new Date() ? "destructive" : "default"}
            >
              Complete Funding
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}