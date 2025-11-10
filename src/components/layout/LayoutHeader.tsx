import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';

interface LayoutHeaderProps {
  title: string;
  actions?: ReactNode;
  className?: string;
}

export function LayoutHeader({ title, actions, className }: LayoutHeaderProps) {
  const { isSidebarCollapsed, isMobile, toggleSidebar } = useLayout();

  const showToggle = isSidebarCollapsed || isMobile;

  return (
    <header className={cn(
      "h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "flex items-center gap-4 px-4",
      className
    )}>
      {/* Fixed toggle slot - always reserves space */}
      <div className="w-10 h-10 shrink-0 flex items-center justify-center">
        {showToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            aria-expanded={!isSidebarCollapsed}
            className={cn(
              "w-10 h-10 rounded-md",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors duration-200"
            )}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Title - truncates if needed */}
      <h1 className="text-xl font-semibold truncate flex-1">
        {title}
      </h1>

      {/* Actions slot */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}