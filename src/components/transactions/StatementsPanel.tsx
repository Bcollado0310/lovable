import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Calendar, Receipt, AlertCircle } from 'lucide-react';
import { format, subMonths, subQuarters } from 'date-fns';

interface StatementsPanelProps {
  onGenerateStatement: (period: string) => void;
  onDownloadTaxDoc: (docId: string) => void;
}

export default function StatementsPanel({ onGenerateStatement, onDownloadTaxDoc }: StatementsPanelProps) {
  const currentDate = new Date();
  
  const statementPeriods = [
    {
      id: 'current_month',
      label: format(currentDate, 'MMMM yyyy'),
      type: 'Monthly',
      startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      endDate: currentDate,
      available: true
    },
    {
      id: 'last_month',
      label: format(subMonths(currentDate, 1), 'MMMM yyyy'),
      type: 'Monthly',
      startDate: subMonths(currentDate, 1),
      endDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 0),
      available: true
    },
    {
      id: 'current_quarter',
      label: `Q${Math.ceil((currentDate.getMonth() + 1) / 3)} ${currentDate.getFullYear()}`,
      type: 'Quarterly',
      startDate: new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1),
      endDate: currentDate,
      available: true
    },
    {
      id: 'last_quarter',
      label: `Q${Math.ceil(subQuarters(currentDate, 1).getMonth() / 3)} ${subQuarters(currentDate, 1).getFullYear()}`,
      type: 'Quarterly',
      startDate: subQuarters(currentDate, 1),
      endDate: new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 0),
      available: true
    },
    {
      id: 'current_year',
      label: currentDate.getFullYear().toString(),
      type: 'Annual',
      startDate: new Date(currentDate.getFullYear(), 0, 1),
      endDate: currentDate,
      available: true
    },
    {
      id: 'last_year',
      label: (currentDate.getFullYear() - 1).toString(),
      type: 'Annual',
      startDate: new Date(currentDate.getFullYear() - 1, 0, 1),
      endDate: new Date(currentDate.getFullYear() - 1, 11, 31),
      available: true
    }
  ];

  const getPeriodRangeLabel = (period: typeof statementPeriods[number]) => {
    if (period.type === 'Monthly' || period.type === 'Annual') {
      return null;
    }

    if (period.type === 'Quarterly') {
      const quarterStart = new Date(period.startDate.getFullYear(), Math.floor(period.startDate.getMonth() / 3) * 3, 1);
      const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 2, 1);
      return `${format(quarterStart, 'MMMM')} - ${format(quarterEnd, 'MMMM')}`;
    }

    return `${format(period.startDate, 'MMM d')} - ${format(period.endDate, 'MMM d, yyyy')}`;
  };

  const taxDocuments = [
    {
      id: 'k1_2024',
      type: 'K-1',
      year: '2024',
      description: 'Schedule K-1 Partnership Income',
      status: 'coming_soon' as const,
      availableDate: '2025-03-15'
    },
    {
      id: '1099_2024',
      type: '1099-DIV',
      year: '2024',
      description: 'Dividends and Distributions',
      status: 'coming_soon' as const,
      availableDate: '2025-01-31'
    },
    {
      id: 'k1_2023',
      type: 'K-1',
      year: '2023',
      description: 'Schedule K-1 Partnership Income',
      status: 'available' as const,
      downloadUrl: '/documents/k1-2023.pdf'
    },
    {
      id: '1099_2023',
      type: '1099-DIV',
      year: '2023',
      description: 'Dividends and Distributions',
      status: 'available' as const,
      downloadUrl: '/documents/1099-2023.pdf'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Account Statements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {statementPeriods.map(period => {
            const rangeLabel = getPeriodRangeLabel(period);
            return (
              <div
                key={period.id}
                className="rounded-2xl border border-border/40 bg-muted/10 px-4 py-3 transition hover:border-border/70 hover:bg-muted/20"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold leading-tight">{period.label}</span>
                      <Badge
                        variant="secondary"
                        className="rounded-full border border-border/40 bg-background/50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {period.type}
                      </Badge>
                    </div>
                    {rangeLabel && (
                      <p className="text-sm text-muted-foreground">{rangeLabel}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onGenerateStatement(period.id)}
                    disabled={!period.available}
                    className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-background focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            );
          })}
          
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-dashed border-border/50 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </span>
            <span className="leading-snug">
              Statements are published within 5 business days after each period ends.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tax Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Tax Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {taxDocuments.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{doc.type} - {doc.year}</span>
                  <Badge 
                    variant={doc.status === 'available' ? 'default' : 'secondary'}
                    className={doc.status === 'available' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                  >
                    {doc.status === 'available' ? 'Available' : 'Coming Soon'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {doc.description}
                </p>
                {doc.status === 'coming_soon' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expected: {format(new Date(doc.availableDate), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant={doc.status === 'available' ? 'outline' : 'ghost'}
                onClick={() => doc.status === 'available' && onDownloadTaxDoc(doc.id)}
                disabled={doc.status !== 'available'}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {doc.status === 'available' ? 'Download' : 'Pending'}
              </Button>
            </div>
          ))}

          <Separator />
          
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-600">Tax Document Notice</p>
                <p className="text-amber-600/80 mt-1">
                  Tax documents are typically available by January 31st for 1099s and March 15th for K-1s. 
                  You'll receive an email notification when documents are ready.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
