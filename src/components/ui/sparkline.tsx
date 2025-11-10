import * as React from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  className?: string;
  data?: number[];
}

const Sparkline = React.forwardRef<HTMLDivElement, SparklineProps>(
  ({ className, data }, ref) => {
    // Generate mock trending data for demo purposes
    const mockData = React.useMemo(() => {
      if (data) return data;
      return Array.from({ length: 30 }, (_, i) => 
        Math.sin(i * 0.3) * 20 + 50 + Math.random() * 10
      );
    }, [data]);

    const points = React.useMemo(() => {
      const width = 100;
      const height = 20;
      const max = Math.max(...mockData);
      const min = Math.min(...mockData);
      const range = max - min || 1;

      return mockData
        .map((value, i) => {
          const x = (i / (mockData.length - 1)) * width;
          const y = height - ((value - min) / range) * height;
          return `${x},${y}`;
        })
        .join(' ');
    }, [mockData]);

    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-30 group-focus-within:opacity-30",
          "transition-opacity duration-300 pointer-events-none",
          className
        )}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 20"
          className="overflow-visible"
        >
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            className="text-cyan-400"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  }
);

Sparkline.displayName = "Sparkline";

export { Sparkline };