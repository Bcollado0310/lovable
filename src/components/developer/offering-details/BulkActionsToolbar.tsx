import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Trash2 } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDelete,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg animate-slide-in-right">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </span>
          {selectedCount < totalCount && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              Select all ({totalCount})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-primary-foreground hover:bg-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
