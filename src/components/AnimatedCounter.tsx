import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  className?: string;
  'aria-label'?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  formatFn = (v) => v.toLocaleString(),
  className = '',
  'aria-label': ariaLabel
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setShouldAnimate(!prefersReducedMotion);
  }, []);

  useEffect(() => {
    if (!shouldAnimate) {
      setCount(value);
      return;
    }

    let startTime: number | null = null;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(value * easeOutQuart));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [value, duration, shouldAnimate]);

  return (
    <span className={className} aria-label={ariaLabel}>
      {formatFn(count)}
    </span>
  );
}