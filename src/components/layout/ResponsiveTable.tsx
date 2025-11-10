import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string | number;
}

export function ResponsiveTable({ children, className, maxHeight = "400px" }: ResponsiveTableProps) {
  return (
    <div className="w-full overflow-hidden">
      <ScrollArea 
        className={cn("w-full", className)}
        style={{ 
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight 
        }}
      >
        <div className="overflow-x-auto min-w-full">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}