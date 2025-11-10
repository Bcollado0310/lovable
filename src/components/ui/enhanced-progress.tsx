import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EnhancedProgressProps {
  value: number;
  className?: string;
  raisedAmount: number;
  targetAmount: number;
  daysLeft: number | null;
  animate?: boolean;
}

const EnhancedProgress = React.forwardRef<HTMLDivElement, EnhancedProgressProps>(
  ({ value, className, raisedAmount, targetAmount, daysLeft, animate = true }, ref) => {
    const [animatedValue, setAnimatedValue] = React.useState(animate ? 0 : value);
    const [pulsingTick, setPulsingTick] = React.useState<number | null>(null);
    const [mobileTooltip, setMobileTooltip] = React.useState<number | null>(null);
    const isComplete = value >= 100;
    const milestones = [0.25, 0.5, 0.75];

    React.useEffect(() => {
      if (animate) {
        const timer = setTimeout(() => {
          setAnimatedValue(value);
          
          // Check if we crossed any milestones and pulse them
          milestones.forEach((milestone) => {
            const milestonePercent = milestone * 100;
            if (value >= milestonePercent && animatedValue < milestonePercent) {
              setPulsingTick(milestone);
              setTimeout(() => setPulsingTick(null), 150);
            }
          });
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [value, animate, animatedValue]);

    // Close mobile tooltip on outside click
    React.useEffect(() => {
      const handleClickOutside = () => setMobileTooltip(null);
      if (mobileTooltip !== null) {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      }
    }, [mobileTooltip]);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const getMilestoneTooltip = (milestone: number) => {
      const milestonePercent = milestone * 100;
      const milestoneAmount = targetAmount * milestone;
      const isReached = value >= milestonePercent;
      const missing = Math.max(milestoneAmount - raisedAmount, 0);
      
      return {
        title: `${milestonePercent}% milestone`,
        status: isReached ? "Reached" : `Missing ${formatCurrency(missing)}`,
        currentPercent: `${value.toFixed(1)}% Funded`
      };
    };

    const handleMilestoneClick = (milestone: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setMobileTooltip(mobileTooltip === milestone ? null : milestone);
      }
    };

    const tooltipText = `${formatCurrency(raisedAmount)} / ${formatCurrency(targetAmount)} • ${value.toFixed(1)}% Funded${daysLeft !== null ? ` • ${daysLeft} days left` : ''}`;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={ref}
              className={cn(
                "relative w-full h-2 bg-background/30 rounded-full overflow-visible",
                "shadow-[0_0_8px_rgba(34,197,94,0.15)] group-hover:shadow-[0_0_12px_rgba(34,197,94,0.25)]",
                "transition-shadow duration-300",
                className
              )}
            >
              {/* Progress fill */}
              <div
                className={cn(
                  "h-full bg-gradient-to-r from-cyan-400 to-primary rounded-full transition-all duration-300 ease-out relative z-10",
                  "group-hover:from-cyan-300 group-hover:to-primary/90"
                )}
                style={{ 
                  width: `${Math.min(animatedValue, 100)}%`,
                  transitionDuration: animate ? '300ms' : '150ms'
                }}
              />

              {/* Milestone ticks */}
              {milestones.map((milestone) => {
                const milestonePercent = milestone * 100;
                const isReached = animatedValue >= milestonePercent;
                const isPulsing = pulsingTick === milestone;
                const tooltip = getMilestoneTooltip(milestone);
                const ariaLabel = `${tooltip.title}, ${tooltip.status}`;

                return (
                  <Tooltip key={milestone}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => handleMilestoneClick(milestone, e)}
                        className={cn(
                          "absolute top-0 bottom-0 w-0.5 transition-all duration-150 focus:outline-none",
                          "focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full",
                          "hover:scale-y-110 hover:w-1",
                          isReached 
                            ? cn(
                                "bg-cyan-400/60 shadow-[0_0_4px_rgba(34,197,94,0.3)]",
                                isPulsing && "animate-pulse opacity-100"
                              )
                            : "bg-muted-foreground/24"
                        )}
                        style={{ left: `${milestonePercent}%`, transform: 'translateX(-50%)' }}
                        aria-label={ariaLabel}
                        type="button"
                      />
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className={cn(
                        "text-xs p-2 animate-in fade-in-0 zoom-in-95 duration-150",
                        mobileTooltip === milestone && "md:hidden"
                      )}
                      role="tooltip"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{tooltip.title}</div>
                        <div className={cn(
                          "text-xs",
                          isReached ? "text-green-400" : "text-muted-foreground"
                        )}>
                          {tooltip.status}
                        </div>
                        <div className="text-xs text-muted-foreground border-t border-border/50 pt-1 mt-1">
                          {tooltip.currentPercent}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Mobile tooltip overlay */}
              {mobileTooltip !== null && (
                <div 
                  className="absolute -top-16 bg-black/90 backdrop-blur-sm text-white text-xs rounded-md p-2 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 md:hidden"
                  style={{ 
                    left: `${mobileTooltip * 100}%`, 
                    transform: 'translateX(-50%)',
                    minWidth: '120px'
                  }}
                >
                  {(() => {
                    const tooltip = getMilestoneTooltip(mobileTooltip);
                    const isReached = value >= mobileTooltip * 100;
                    return (
                      <div className="space-y-1">
                        <div className="font-medium">{tooltip.title}</div>
                        <div className={cn(
                          "text-xs",
                          isReached ? "text-green-400" : "text-gray-300"
                        )}>
                          {tooltip.status}
                        </div>
                        <div className="text-xs text-gray-400 border-t border-gray-600 pt-1 mt-1">
                          {tooltip.currentPercent}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Completion check */}
              {isComplete && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 animate-scale-in z-20">
                  <Check className="w-3 h-3 text-white drop-shadow-sm" />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

EnhancedProgress.displayName = "EnhancedProgress";

export { EnhancedProgress };