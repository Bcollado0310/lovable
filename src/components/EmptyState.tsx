import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction 
}: EmptyStateProps) {
  return (
    <Card className="glass-card border-glass-border">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Icon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {description}
        </p>
        {actionText && onAction && (
          <Button onClick={onAction} className="bg-gradient-primary hover:shadow-neon">
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}