import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedProgress } from "@/components/ui/enhanced-progress";
import { Sparkline } from "@/components/ui/sparkline";
import { useDeveloperAuth } from "@/contexts/DeveloperAuthContext";
import { useDeveloperOfferings } from "@/hooks/useDeveloperData";
import { deriveStatus, computeFundingProgress, formatCurrency, getDaysUntilDeadline } from "@/utils/developerHelpers";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CreateOfferingDialog } from "@/components/developer/CreateOfferingDialog";
import { Building2, Plus, MapPin, DollarSign, Calendar, Users, Check, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function DeveloperOfferings() {
  const { organization, hasPermission } = useDeveloperAuth();
  const { data: offerings, loading, error, addOffering } = useDeveloperOfferings(organization?.id || null);
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleOfferingSuccess = (newOffering: any) => {
    addOffering(newOffering);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Offerings</h1>
            <p className="text-muted-foreground">
              Manage your investment opportunities
            </p>
          </div>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            New Offering
          </Button>
        </div>
        
        <div 
          className="grid gap-6 w-full"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))'
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card border-glass-border overflow-hidden">
              <div className="relative">
                <AspectRatio ratio={16/9}>
                  <Skeleton className="w-full h-full" />
                </AspectRatio>
              </div>
              <CardContent className="p-4 min-h-[150px] flex flex-col">
                {/* Row 1: Title skeleton */}
                <Skeleton className="h-7 w-3/4 mb-2" />
                
                {/* Row 2: Meta skeleton */}
                <Skeleton className="h-6 w-1/2 mb-2" />
                
                {/* Row 3: Chips skeleton */}
                <div className="flex gap-1.5 h-8 items-center mb-auto">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                
                {/* Row 4: Bottom bar skeleton */}
                <div className="flex items-center justify-between h-9">
                  <Skeleton className="h-2 flex-1 mr-3 rounded-full" />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error loading offerings: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offerings</h1>
          <p className="text-muted-foreground">
            Manage your investment opportunities
          </p>
        </div>
        {hasPermission('write') && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Offering
          </Button>
        )}
      </div>

      <div 
        className="grid gap-6 w-full"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))'
        }}
      >
        {offerings.map((offering) => {
          const progress = computeFundingProgress(offering);
          const daysLeft = getDaysUntilDeadline(offering.funding_deadline);
          const statusInfo = deriveStatus(offering);
          const isFunded = progress >= 100;
          
          const getStatusVariant = (status: string) => {
            switch (status.toLowerCase()) {
              case 'funding': return 'default';
              case 'closing soon': return 'destructive';
              case 'funded': return 'secondary';
              case 'waitlist': return 'outline';
              default: return 'outline';
            }
          };

          return (
            <Card 
              key={offering.id} 
              className="glass-card border-glass-border overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/20 cursor-pointer"
            >
              {/* Image Section with Overlays */}
              <div className="relative overflow-hidden">
                <AspectRatio ratio={16/9}>
                  {offering.images?.[0] ? (
                    <img 
                      src={offering.images[0]} 
                      alt={offering.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/30 ${offering.images?.[0] ? 'hidden' : ''}`} />
                  
                  {/* Sparkline overlay - only appears on hover */}
                  <Sparkline className="absolute inset-0" />
                  
                  {/* Bottom gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Status pill - top right */}
                  <div className="absolute top-3 right-3">
                    <Badge 
                      variant={getStatusVariant(statusInfo.label)}
                      className="bg-black/60 text-white border-white/20 backdrop-blur-sm group-hover:bg-black/80 transition-colors"
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                  
                  {/* Progress percent - bottom left */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white text-sm font-semibold bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </AspectRatio>
              </div>

              {/* Content Section - Fixed 4-row grid */}
              <CardContent className="p-4 min-h-[150px] flex flex-col">
                {/* Row 1: Title - fixed height */}
                <h3 className="font-semibold text-lg leading-tight truncate h-7 flex items-center" title={offering.title}>
                  {offering.title}
                </h3>
                
                {/* Row 2: Location + Type - fixed height */}
                <div className="text-sm text-muted-foreground flex items-center gap-2 min-w-0 h-6">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate whitespace-nowrap">{offering.location}</span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="flex-shrink-0 whitespace-nowrap">{offering.property_type}</span>
                </div>

                {/* Row 3: Stats Strip - fixed height */}
                <div className="flex gap-1.5 text-xs h-8 items-center">
                  {/* Raised vs Goal */}
                  <div className="flex items-center gap-1.5 bg-background/30 border border-border/30 rounded-full px-2.5 py-1 min-w-0">
                    <DollarSign className="w-3 h-3 text-muted-foreground/70 flex-shrink-0" />
                    <span className="font-semibold text-cyan-400 whitespace-nowrap">
                      {formatCurrency(offering.raised_amount)}
                    </span>
                    <span className="text-muted-foreground/40">|</span>
                    <span className="text-muted-foreground/70 whitespace-nowrap">
                      {formatCurrency(offering.target_amount)}
                    </span>
                  </div>

                  {/* Investors */}
                  <div className="flex items-center gap-1.5 bg-background/30 border border-border/30 rounded-full px-2.5 py-1 flex-shrink-0">
                    <Users className="w-3 h-3 text-muted-foreground/70" />
                    <span className="font-semibold text-cyan-400 whitespace-nowrap">{offering.investor_count}</span>
                  </div>

                  {/* Days Left or Funded */}
                  <div className="flex items-center gap-1.5 bg-background/30 border border-border/30 rounded-full px-2.5 py-1 flex-shrink-0">
                    {isFunded ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="font-semibold text-green-400 whitespace-nowrap">Funded</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3 h-3 text-muted-foreground/70" />
                        <span className="font-semibold text-cyan-400 whitespace-nowrap">{daysLeft !== null ? daysLeft : 'N/A'}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Row 4: Bottom bar - fixed height */}
                <div className="flex items-center justify-between h-9 mt-auto">
                  {/* Left: Progress Bar */}
                  <div className="flex-1 min-w-0 mr-3">
                    <EnhancedProgress 
                      value={Math.min(progress, 100)}
                      raisedAmount={offering.raised_amount}
                      targetAmount={offering.target_amount}
                      daysLeft={daysLeft}
                      className="h-2"
                    />
                  </div>

                  {/* Right: Status pill + Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Status pill - always reserve space */}
                    <div className="min-w-[80px] flex justify-end">
                      <Badge 
                        variant={getStatusVariant(statusInfo.label)}
                        className="text-xs px-2 py-0.5"
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Desktop buttons */}
                    <div className="hidden sm:flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/dev/offerings/${offering.id}`)}
                        className="text-xs h-7 px-2"
                      >
                        View
                      </Button>
                      {hasPermission('write') && (
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/dev/offerings/${offering.id}`)}
                          className="text-xs h-7 px-2"
                        >
                          Manage
                        </Button>
                      )}
                    </div>

                    {/* Mobile menu */}
                    <div className="sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/dev/offerings/${offering.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          {hasPermission('write') && (
                            <DropdownMenuItem onClick={() => navigate(`/dev/offerings/${offering.id}`)}>
                              Manage
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateOfferingDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onSuccess={handleOfferingSuccess}
      />
    </div>
  );
}