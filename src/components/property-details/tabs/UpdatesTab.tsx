import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Calendar, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UpdatesTabProps {
  property: any;
}

export function UpdatesTab({ property }: UpdatesTabProps) {
  const [subscribed, setSubscribed] = useState(false);

  const updates = [
    {
      id: '1',
      title: 'Construction Progress Update - January 2024',
      type: 'milestone',
      date: '2024-01-20T10:00:00Z',
      author: 'Premium Real Estate Team',
      content: 'We are pleased to report that our capital improvement program is proceeding ahead of schedule. Phase 1 renovations (Units 101-120) have been completed and are now lease-ready. Early response has been positive with 15 of 20 units already pre-leased at target rents.',
      attachments: [
        { type: 'image', name: 'renovation_progress_jan.jpg' },
        { type: 'document', name: 'construction_report_q1.pdf' }
      ],
      milestone: 'Phase 1 Complete'
    },
    {
      id: '2',
      title: 'Quarterly Distribution Notice',
      type: 'distribution',
      date: '2024-01-15T14:30:00Z',
      author: 'Premium Real Estate Team',
      content: 'Q4 2023 distributions will be processed on January 31, 2024. The distribution represents a 7.8% annualized yield on invested capital, slightly ahead of our 7.5% target for Year 1.',
      attachments: [
        { type: 'document', name: 'q4_2023_distribution_statement.pdf' }
      ],
      milestone: 'Q4 Distribution'
    },
    {
      id: '3',
      title: 'Market Update & Rent Growth Analysis',
      type: 'market',
      date: '2024-01-08T09:15:00Z',
      author: 'Premium Real Estate Team',
      content: 'Local market conditions remain favorable with continued population growth and limited new supply. Average rents in our submarket have increased 4.2% over the past 12 months, supporting our underwriting assumptions.',
      attachments: [
        { type: 'document', name: 'market_analysis_jan_2024.pdf' }
      ],
      milestone: null
    },
    {
      id: '4',
      title: 'Property Acquisition Completed',
      type: 'milestone',
      date: '2023-12-15T16:45:00Z',
      author: 'Premium Real Estate Team',
      content: 'We successfully closed on the property acquisition on December 15, 2023. All due diligence items were satisfactorily resolved and we took possession of the asset. Initial property inspections confirm the condition meets our expectations.',
      attachments: [
        { type: 'image', name: 'closing_ceremony.jpg' },
        { type: 'document', name: 'closing_summary.pdf' }
      ],
      milestone: 'Property Acquired'
    },
    {
      id: '5',
      title: 'Funding Successfully Completed',
      type: 'milestone',
      date: '2023-11-30T12:00:00Z',
      author: 'Premium Real Estate Team',
      content: 'We have successfully raised the full $8.5M equity target with strong investor participation. Thank you to all investors for your confidence in this opportunity. The capital raise concluded 2 weeks ahead of the original deadline.',
      attachments: [],
      milestone: 'Funding Complete'
    }
  ];

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'distribution':
        return <Clock className="h-5 w-5 text-blue-400" />;
      case 'market':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getUpdateTypeBadge = (type: string) => {
    switch (type) {
      case 'milestone':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Milestone</Badge>;
      case 'distribution':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Distribution</Badge>;
      case 'market':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Market Update</Badge>;
      default:
        return <Badge variant="outline" className="glass border-glass-border">Update</Badge>;
    }
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Settings */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Update Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="update-notifications" className="text-sm font-medium">
                Subscribe to property updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications when new updates are posted
              </p>
            </div>
            <Switch
              id="update-notifications"
              checked={subscribed}
              onCheckedChange={setSubscribed}
            />
          </div>
        </CardContent>
      </Card>

      {/* Updates Timeline */}
      <div className="space-y-6">
        {updates.map((update, index) => (
          <Card key={update.id} className="glass-card border-glass-border">
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Timeline Icon */}
                <div className="shrink-0 relative">
                  {getUpdateIcon(update.type)}
                  {index < updates.length - 1 && (
                    <div className="absolute top-7 left-1/2 transform -translate-x-1/2 w-px h-16 bg-glass-border"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{update.title}</h3>
                      {getUpdateTypeBadge(update.type)}
                      {update.milestone && (
                        <Badge variant="outline" className="glass border-glass-border">
                          {update.milestone}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(update.date), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {update.content}
                  </p>

                  {/* Attachments */}
                  {update.attachments.length > 0 && (
                    <>
                      <Separator className="bg-glass-border" />
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Attachments</div>
                        <div className="flex flex-wrap gap-2">
                          {update.attachments.map((attachment, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="glass border-glass-border h-8"
                            >
                              {getAttachmentIcon(attachment.type)}
                              <span className="ml-2 text-xs">{attachment.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Posted by {update.author}</span>
                    <span>{new Date(update.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>Update Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{updates.length}</div>
              <div className="text-sm text-muted-foreground">Total Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {updates.filter(u => u.type === 'milestone').length}
              </div>
              <div className="text-sm text-muted-foreground">Milestones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {updates.filter(u => u.type === 'distribution').length}
              </div>
              <div className="text-sm text-muted-foreground">Distributions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {updates.reduce((acc, u) => acc + u.attachments.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Attachments</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}