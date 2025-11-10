import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
  children: ReactNode;
  className?: string;
  height?: string | number;
  aspectRatio?: string;
  minHeight?: string | number;
  maxHeight?: string | number;
}

export function ChartContainer({ 
  children, 
  className,
  height = "clamp(220px, 40vh, 360px)",
  aspectRatio,
  minHeight,
  maxHeight 
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const getContainerStyle = () => {
    const style: React.CSSProperties = {
      width: '100%',
    };

    if (aspectRatio) {
      style.aspectRatio = aspectRatio;
    } else {
      style.height = typeof height === 'number' ? `${height}px` : height;
    }

    if (minHeight) {
      style.minHeight = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
    }

    if (maxHeight) {
      style.maxHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
    }

    return style;
  };

  return (
    <div 
      ref={containerRef}
      className={cn("overflow-hidden", className)}
      style={getContainerStyle()}
    >
      {children}
    </div>
  );
}