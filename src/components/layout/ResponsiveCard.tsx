import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResponsiveCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  headerClassName?: string;
  contentClassName?: string;
}

export function ResponsiveCard({ 
  title, 
  children, 
  className, 
  headerActions, 
  headerClassName,
  contentClassName 
}: ResponsiveCardProps) {
  return (
    <Card className={cn("glass-card border-glass-border overflow-hidden", className)}>
      {(title || headerActions) && (
        <CardHeader className={cn("pb-4", headerClassName)}>
          <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
            {title && (
              <CardTitle className="text-lg font-semibold truncate min-w-0 flex-shrink">
                {title}
              </CardTitle>
            )}
            {headerActions && (
              <div className="flex flex-wrap items-center gap-2 shrink-0 max-w-full">
                {headerActions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn("overflow-hidden", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}