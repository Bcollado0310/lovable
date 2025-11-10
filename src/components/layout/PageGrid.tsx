import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageGridProps {
  children: ReactNode;
  className?: string;
  minCardWidth?: number;
}

export function PageGrid({ children, className, minCardWidth = 300 }: PageGridProps) {
  return (
    <div 
      className={cn(
        "grid gap-4 sm:gap-6 w-full overflow-hidden",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}px, 1fr))`
      }}
    >
      {children}
    </div>
  );
}