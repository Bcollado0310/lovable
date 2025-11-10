import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Plus, Edit, Trash2, Eye, Send } from 'lucide-react';
import { formatDate } from '@/utils/developerHelpers';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';

interface UpdatesTabProps {
  offeringId: string;
}

export function UpdatesTab({ offeringId }: UpdatesTabProps) {
  const { hasPermission } = useDeveloperAuth();

  // Mock updates data - in real app this would be fetched from API
  const updates = [
    {
      id: '1',
      title: 'Construction Milestone Reached',
      content: 'We are pleased to announce that the foundation work has been completed ahead of schedule. The construction team has made excellent progress, and we are now moving on to the structural framework phase.',
      author: 'Project Manager',
      publishedAt: '2024-02-15',
      status: 'Published',
      views: 127,
      type: 'Progress Update'
    },
    {
      id: '2',
      title: 'Q1 Financial Report Available',
      content: 'The Q1 financial report is now available in the documents section. This report includes detailed breakdowns of expenses, timeline updates, and projected returns.',
      author: 'Financial Team',
      publishedAt: '2024-02-10',
      status: 'Published',
      views: 89,
      type: 'Financial Update'
    },
    {
      id: '3',
      title: 'Upcoming Property Tour',
      content: 'Join us for an exclusive property tour on March 1st, 2024. This will be a great opportunity to see the progress in person and meet the development team.',
      author: 'Marketing Team',
      publishedAt: '2024-02-05',
      status: 'Published',
      views: 156,
      type: 'Event'
    },
    {
      id: '4',
      title: 'Draft: Permit Update',
      content: 'We have received approval for the additional parking spaces requested by the city planning committee. This will increase the total parking capacity from 120 to 135 spaces.',
      author: 'Legal Team',
      publishedAt: '2024-02-20',
      status: 'Draft',
      views: 0,
      type: 'Legal Update'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'default';
      case 'Draft': return 'secondary';
      case 'Scheduled': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Progress Update': return 'default';
      case 'Financial Update': return 'destructive';
      case 'Event': return 'secondary';
      case 'Legal Update': return 'outline';
      default: return 'outline';
    }
  };

  const publishedUpdates = updates.filter(u => u.status === 'Published');
  const draftUpdates = updates.filter(u => u.status === 'Draft');

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      {hasPermission('write') && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Updates & Announcements</h3>
                <p className="text-sm text-muted-foreground">
                  Keep investors informed about project progress
                </p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Updates Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{updates.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedUpdates.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftUpdates.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {updates.reduce((sum, u) => sum + u.views, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Updates */}
      <Card>
        <CardHeader>
          <CardTitle>All Updates</CardTitle>
          <CardDescription>
            Updates and announcements for this offering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {updates.map((update) => (
              <div key={update.id} className="border-b pb-6 last:border-b-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{update.title}</h3>
                      <Badge variant={getStatusColor(update.status)}>
                        {update.status}
                      </Badge>
                      <Badge variant={getTypeColor(update.type)}>
                        {update.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {update.author.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>By {update.author}</span>
                      </div>
                      <span>•</span>
                      <span>{formatDate(update.publishedAt)}</span>
                      {update.status === 'Published' && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {update.views} views
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {hasPermission('write') && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-3 leading-relaxed">
                  {update.content}
                </p>
                
                {update.status === 'Draft' && hasPermission('write') && (
                  <Button size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    Publish Update
                  </Button>
                )}
              </div>
            ))}
          </div>

          {updates.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No updates yet</h3>
              <p className="text-muted-foreground mb-4">
                Keep your investors informed with regular updates
              </p>
              {hasPermission('write') && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Update
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}