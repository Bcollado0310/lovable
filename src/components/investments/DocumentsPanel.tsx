import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'statement' | 'tax' | 'report' | 'legal';
  date: string;
  isNew: boolean;
}

interface DocumentsPanelProps {
  documents: Document[];
  unreadCount: number;
  onViewAll: () => void;
}

export function DocumentsPanel({ documents, unreadCount, onViewAll }: DocumentsPanelProps) {
  const getDocumentIcon = (type: string) => {
    return <FileText className="h-4 w-4" />;
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      statement: 'Statement',
      tax: 'Tax Document',
      report: 'Report',
      legal: 'Legal'
    };
    return labels[type] || type;
  };

  // Show only the 3 most recent documents
  const recentDocuments = documents.slice(0, 3);

  return (
    <Card className="glass-card border-glass-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents & Tax
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onViewAll}>
          View All
          <ExternalLink className="h-3 w-3 ml-2" />
        </Button>
      </CardHeader>
      <CardContent>
        {recentDocuments.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentDocuments.map((document) => (
              <div 
                key={document.id} 
                className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getDocumentIcon(document.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{document.name}</h4>
                      {document.isNew && (
                        <Badge variant="destructive" className="text-xs">New</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{getDocumentTypeLabel(document.type)}</span>
                      <span>•</span>
                      <span>{new Date(document.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="shrink-0">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {documents.length > 3 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" onClick={onViewAll}>
                  {documents.length - 3} more documents
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t border-border/50 mt-4">
          <Button variant="outline" size="sm" className="flex-1">
            Tax Center
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Statements
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}