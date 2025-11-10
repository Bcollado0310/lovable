import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Eye, CreditCard, ChevronDown, ChevronUp, MapPin, Heart } from "lucide-react";
import { useDashboardCollapse } from "@/hooks/useDashboardCollapse";
import { useWishlist } from "@/hooks/useWishlist";
import { dashboardAnalytics } from "@/utils/analytics";

interface Commitment {
  id: string;
  investment: string;
  commitment_amount: number;
  funded_amount: number;
  funding_percentage: number;
  funding_deadline: string;
  status: "active" | "completed" | "expired";
}

interface WatchlistItem {
  id: string;
  property_name: string;
  funding_progress: number;
  days_left: number;
  target_funding: number;
  current_funding: number;
  city?: string;
  expected_return?: number;
  minimum_investment?: number;
  image?: string;
}

interface CommitmentsPipelineProps {
  commitments: Commitment[];
  watchlist: WatchlistItem[];
  mode?: "simple" | "pro";
}

const formatCurrency = (value: number): string => `$${value.toLocaleString()}`;

const formatStatus = (status: Commitment["status"]): string => {
  switch (status) {
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    case "expired":
      return "Expired";
    default:
      return status;
  }
};

const commitmentStatusColor = (status: Commitment["status"]): string => {
  switch (status) {
    case "active":
      return "bg-sky-500/15 text-sky-300";
    case "completed":
      return "bg-emerald-500/15 text-emerald-300";
    case "expired":
      return "bg-red-500/15 text-red-300";
    default:
      return "bg-muted/20 text-muted-foreground";
  }
};

const daysRemainingColor = (days: number): string => {
  if (days <= 7) return "text-red-300";
  if (days <= 30) return "text-amber-300";
  return "text-emerald-300";
};

export function CommitmentsPipeline({ commitments, watchlist, mode = "pro" }: CommitmentsPipelineProps) {
  const [activeView, setActiveView] = useState<"commitments" | "watchlist">("commitments");
  const { removeFromWishlist } = useWishlist();
  const { isCollapsed, toggleCollapse } = useDashboardCollapse(mode);

  const headerTitleClass = mode === "simple" ? "text-lg font-semibold" : "text-base";
  const toggleButtonClass = mode === "simple" ? "h-7 w-7" : "h-6 w-6";
  const accentIconClass = mode === "simple" ? "h-5 w-5" : "h-4 w-4";

  const renderCommitmentCard = (commitment: Commitment) => {
    const remaining = Math.max(commitment.commitment_amount - commitment.funded_amount, 0);

    return (
      <article
        key={commitment.id}
        className="flex h-full flex-col rounded-2xl border border-white/10 bg-background/40 p-6 shadow-lg md:h-[420px]"
      >
        <header className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <h3 className="max-w-[220px] text-[1.15rem] font-semibold leading-snug text-foreground line-clamp-2 break-words hyphens-auto">
                {commitment.investment}
              </h3>
              <Badge className={`${commitmentStatusColor(commitment.status)} border-transparent`}>
                {formatStatus(commitment.status)}
              </Badge>
            </div>
            <dl className="text-right text-sm text-muted-foreground">
              <dt className="text-xs uppercase tracking-wide">Funding deadline</dt>
              <dd className="font-semibold text-foreground">
                {new Date(commitment.funding_deadline).toLocaleDateString()}
              </dd>
            </dl>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wide">Commitment</dt>
              <dd className="text-base font-semibold text-foreground break-words hyphens-auto">
                {formatCurrency(commitment.commitment_amount)}
              </dd>
            </div>
            <div className="space-y-1 text-right">
              <dt className="text-xs uppercase tracking-wide">Status</dt>
              <dd className="text-sm font-semibold text-foreground">{commitment.funding_percentage.toFixed(0)}% funded</dd>
            </div>
          </dl>
        </header>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Funding progress</span>
            <span className="text-sm text-foreground">{commitment.funding_percentage.toFixed(0)}%</span>
          </div>
          <Progress
            value={commitment.funding_percentage}
            className="h-2.5 rounded-full bg-muted"
            aria-label={`Funding progress ${commitment.funding_percentage.toFixed(0)} percent`}
          />
          <dl className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="rounded-xl bg-background/50 px-3 py-2">
              <dt className="text-xs uppercase tracking-wide">Funded</dt>
              <dd className="text-base font-semibold text-foreground break-words hyphens-auto">
                {formatCurrency(commitment.funded_amount)}
              </dd>
            </div>
            <div className="rounded-xl bg-background/50 px-3 py-2 text-right">
              <dt className="text-xs uppercase tracking-wide">Remaining</dt>
              <dd className="text-base font-semibold text-foreground break-words hyphens-auto">
                {formatCurrency(remaining)}
              </dd>
            </div>
          </dl>
        </div>

        {commitment.status === "active" ? (
          <div className="mt-auto flex flex-col gap-3 pt-8 md:flex-row md:items-center">
            <Button
              size="sm"
              className="w-full bg-gradient-primary hover:shadow-neon md:w-auto"
              aria-label={`Add capital to ${commitment.investment}`}
            >
              <CreditCard className="mr-2 h-3.5 w-3.5" />
              Add Capital
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:text-primary md:w-auto"
              aria-label={`View details for ${commitment.investment}`}
            >
              View Details
            </Button>
          </div>
        ) : (
          <div className="mt-auto pt-6" />
        )}
      </article>
    );
  };

  const renderWatchlistCard = (item: WatchlistItem) => {
    const needed = Math.max(item.target_funding - item.current_funding, 0);

    return (
      <article
        key={item.id}
        className="flex h-full flex-col rounded-xl border border-white/10 bg-background/60 p-4 shadow-sm"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="text-base font-semibold text-foreground line-clamp-2 break-words hyphens-auto">
              {item.property_name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className={daysRemainingColor(item.days_left)}>{item.days_left} days remaining</span>
              </div>
              {item.city ? (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{item.city}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="uppercase tracking-wide">Target</div>
            <div className="text-sm font-semibold text-foreground">{formatCurrency(item.target_funding)}</div>
          </div>
        </header>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
            <span>Funding</span>
            <span className="font-medium text-foreground">{item.funding_progress.toFixed(0)}%</span>
          </div>
          <Progress value={item.funding_progress} className="h-2 rounded-full bg-muted" aria-label={`Funding progress ${item.funding_progress.toFixed(0)} percent`} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="space-y-1">
            <div className="uppercase tracking-wide">Raised</div>
            <div className="text-sm font-semibold text-foreground">{formatCurrency(item.current_funding)}</div>
          </div>
          <div className="text-right space-y-1">
            <div className="uppercase tracking-wide">Needed</div>
            <div className="text-sm font-semibold text-foreground">{formatCurrency(needed)}</div>
          </div>
        </div>

        {(item.expected_return !== undefined || item.minimum_investment !== undefined) && (
          <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            {item.expected_return !== undefined && (
              <div className="space-y-1">
                <div className="uppercase tracking-wide">Target IRR</div>
                <div className="text-sm font-semibold text-foreground">{item.expected_return}%</div>
              </div>
            )}
            {item.minimum_investment !== undefined && (
              <div className="text-right space-y-1">
                <div className="uppercase tracking-wide">Min Invest.</div>
                <div className="text-sm font-semibold text-foreground">{formatCurrency(item.minimum_investment)}</div>
              </div>
            )}
          </div>
        )}
      </article>
    );
  };
  const activeIcon = activeView === "commitments" ? <Target className={`text-primary ${accentIconClass}`} /> : <Eye className={`text-primary ${accentIconClass}`} />;
  const activeTitle = activeView === "commitments" ? "Your Commitments" : "Watchlist";

  return (
    <section className="grid grid-cols-1">
      <Card className="glass-card border-glass-border overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  toggleCollapse("commitments", (moduleKey, collapsed, collapseMode) => {
                    if (collapsed) {
                      dashboardAnalytics.moduleCollapsed(moduleKey, collapseMode);
                    } else {
                      dashboardAnalytics.moduleExpanded(moduleKey, collapseMode);
                    }
                  })
                }
                className={`p-1 hover:bg-muted rounded-sm transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-1 ${toggleButtonClass}`}
                aria-label={`${isCollapsed("commitments") ? "Expand" : "Collapse"} commitments section`}
                aria-expanded={!isCollapsed("commitments")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleCollapse("commitments", (moduleKey, collapsed, collapseMode) => {
                      if (collapsed) {
                        dashboardAnalytics.moduleCollapsed(moduleKey, collapseMode);
                      } else {
                        dashboardAnalytics.moduleExpanded(moduleKey, collapseMode);
                      }
                    });
                  }
                }}
              >
                {isCollapsed("commitments") ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
              {activeIcon}
              <CardTitle className={headerTitleClass}>{activeTitle}</CardTitle>
            </div>
            <div className="inline-flex rounded-full bg-muted/40 p-1">
              <Button
                type="button"
                variant={activeView === "commitments" ? "default" : "ghost"}
                size="sm"
                className="px-3"
                onClick={() => setActiveView("commitments")}
                aria-pressed={activeView === "commitments"}
              >
                Commitments
              </Button>
              <Button
                type="button"
                variant={activeView === "watchlist" ? "default" : "ghost"}
                size="sm"
                className="px-3"
                onClick={() => setActiveView("watchlist")}
                aria-pressed={activeView === "watchlist"}
              >
                Watchlist
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent
          className={`transition-all duration-200 ${
            isCollapsed("commitments") ? "h-0 overflow-hidden opacity-0 p-0" : "animate-fade-in p-0 pt-6"
          }`}
        >
          {activeView === "commitments" ? (
            commitments.length > 0 ? (
              <div className="space-y-6 px-6 pb-6">{commitments.slice(0, 1).map(renderCommitmentCard)}</div>
            ) : (
              <div className="px-6 pb-6 pt-10 text-center">
                <Target className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">No commitments yet</p>
                <Button variant="outline" size="sm" onClick={() => (window.location.href = "/properties")}>
                  Browse Opportunities
                </Button>
              </div>
            )
          ) : watchlist.length > 0 ? (
            <div className="px-6 pb-6">
              <div className="flex max-h-[540px] flex-col gap-4 overflow-y-auto pr-1">
                {watchlist.map(renderWatchlistCard)}
              </div>
            </div>
          ) : (
            <div className="px-6 pb-6 pt-10 text-center">
              <Eye className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">No items in watchlist</p>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/properties")}>
                Browse Properties
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
