import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  MapPin, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Building2,
  Heart,
  BarChart3,
  Share2,
  Target,
  Percent,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deriveStatus, getStatusInfo } from "@/utils/propertyStatus";
import { useWishlist } from "@/hooks/useWishlist";

// Status Badge Component
function StatusBadge({ property }: { property: any }) {
  // Always derive and show exactly one status
  const status = deriveStatus(property);
  const statusInfo = getStatusInfo(status);

  const getStatusClasses = (variant: string) => {
    const baseClasses = "px-2.5 py-1 text-xs font-bold uppercase tracking-wide rounded-full border transition-all duration-200 hover:scale-102 focus:scale-102 focus:outline-none focus:ring-2 focus:ring-offset-1";
    
    switch (variant) {
      case "funding":
        return `${baseClasses} bg-status-funding-bg text-status-funding border-status-funding/30 hover:shadow-[0_0_12px_hsl(var(--status-funding)/0.4)] focus:ring-status-funding/50`;
      case "funded": 
        return `${baseClasses} bg-status-funded-bg text-status-funded border-status-funded/30 hover:shadow-[0_0_12px_hsl(var(--status-funded)/0.4)] focus:ring-status-funded/50`;
      case "closing":
        return `${baseClasses} bg-status-closing-bg text-status-closing border-status-closing/30 hover:shadow-[0_0_12px_hsl(var(--status-closing)/0.4)] focus:ring-status-closing/50`;
      case "waitlist":
        return `${baseClasses} bg-status-waitlist-bg text-status-waitlist border-status-waitlist/30 hover:shadow-[0_0_12px_hsl(var(--status-waitlist)/0.4)] focus:ring-status-waitlist/50`;
      default:
        return baseClasses;
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={`
            ${getStatusClasses(statusInfo.variant)} 
            ${statusInfo.pulse ? 'animate-pulse-gentle' : ''} 
            inline-flex items-center gap-1 cursor-help
          `}
          tabIndex={0}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
          {statusInfo.label}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        {statusInfo.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    property_type: string;
    property_status: string;
    total_value: number;
    target_funding: number;
    current_funding: number;
    expected_annual_return: number;
    minimum_investment: number;
    risk_rating: number;
    images?: string[];
    rental_yield?: number;
    funding_deadline?: string;
  };
  showInvestButton?: boolean;
  userInvestment?: {
    amount_invested: number;
    shares_owned: number;
    current_value: number;
    total_returns: number;
  };
  onCompare?: (property: any) => void;
  isInCompare?: boolean;
  canAddToCompare?: boolean;
  isLoading?: boolean;
}

export function PropertyCard({ 
  property, 
  showInvestButton = false, 
  userInvestment, 
  onCompare,
  isInCompare = false,
  canAddToCompare = true,
  isLoading = false
}: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const fundingPercentage = (property.current_funding / property.target_funding) * 100;
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(property.id);
  
  const getRiskColor = (rating: number) => {
    if (rating <= 3) return "text-green-400";
    if (rating <= 6) return "text-yellow-400";
    return "text-red-400";
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-glass-border">
        <CardHeader className="p-0">
          <Skeleton className="h-48 w-full rounded-t-xl" />
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleCardClick = () => {
    navigate(`/properties/${property.id}`);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCompare) {
      onCompare(property);
    }
  };

  const handleQuickAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (action === "save") {
      toggleWishlist({
        id: property.id,
        title: property.title,
        address: property.address,
        city: property.city,
        property_type: property.property_type,
        property_status: property.property_status,
        target_funding: property.target_funding,
        current_funding: property.current_funding,
        funding_deadline: property.funding_deadline,
        expected_annual_return: property.expected_annual_return,
        minimum_investment: property.minimum_investment,
        image: property.images?.[0]
      });
      return;
    }

    console.log(`${action} clicked for property:`, property.id);
  };

  return (
    <TooltipProvider>
      <Card 
        className="glass-card border-glass-border transition-all duration-300 group cursor-pointer transform hover:scale-[1.02]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <CardHeader className="p-0">
            <div className="relative overflow-hidden">
              <div className="h-48 bg-gradient-glass rounded-t-xl flex items-center justify-center">
                {property.images && property.images.length > 0 ? (
                  <>
                    {!imageLoaded && <Skeleton className="w-full h-full rounded-t-xl absolute inset-0" />}
                    <img 
                      src={property.images[0]} 
                      alt={property.title}
                      className={`w-full h-full object-cover rounded-t-xl transition-opacity duration-300 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => setImageLoaded(true)}
                      loading="lazy"
                    />
                  </>
                ) : (
                  <Building2 className="h-16 w-16 text-muted-foreground" />
                )}
              </div>

              {/* Quick Actions - Show on Hover */}
              {isHovered && (
                <div className="absolute top-3 left-3 flex gap-2 animate-fade-in">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm"
                          variant="outline"
                          className={`h-8 w-8 p-0 glass border-glass-border bg-background/80 backdrop-blur-sm transition-colors ${isWishlisted ? 'border-primary text-primary bg-primary/10' : ''}`}
                          aria-pressed={isWishlisted}
                          onClick={(e) => handleQuickAction(e, 'save')}
                        >
                          <Heart
                            className="h-4 w-4 transition-colors"
                            fill={isWishlisted ? "currentColor" : "none"}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isWishlisted ? "Remove from favorites" : "Save to favorites"}
                      </TooltipContent>
                    </Tooltip>

                  {onCompare && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-8 w-8 p-0 glass border-glass-border bg-background/80 backdrop-blur-sm ${
                            isInCompare ? 'bg-primary text-primary-foreground' : ''
                          }`}
                          onClick={handleCompareClick}
                          disabled={!canAddToCompare && !isInCompare}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isInCompare ? 'Remove from compare' : 'Add to compare'}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 glass border-glass-border bg-background/80 backdrop-blur-sm"
                        onClick={(e) => handleQuickAction(e, 'share')}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share property</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
        </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title and Status Badge */}
          <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2 break-words">
                {property.title}
              </h3>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge property={property} />
            </div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <MapPin className="h-3 w-3 mr-1 shrink-0" />
            <span className="truncate">{property.address}, {property.city}</span>
          </div>

          {/* Target KPIs Strip */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">Target IRR</span>
              </div>
              <div className="text-sm font-semibold text-primary">
                {property.expected_annual_return}%
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Percent className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">Target EM</span>
              </div>
              <div className="text-sm font-semibold text-primary">1.8x</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">Hold Period</span>
              </div>
              <div className="text-sm font-semibold">3-5Y</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">Distribution</span>
              </div>
              <div className="text-sm font-semibold">Quarterly</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <DollarSign className="h-3 w-3 mr-1 text-primary" />
              <span className="text-muted-foreground">Value:</span>
              <span className="ml-1 font-medium">
                ${property.total_value.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-primary" />
              <span className="text-muted-foreground">Return:</span>
              <span className="ml-1 font-medium">
                {property.expected_annual_return}%
              </span>
            </div>
          </div>

          {userInvestment ? (
            <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Investment:</span>
                <span className="font-medium">${userInvestment.amount_invested.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Value:</span>
                <span className="font-medium text-primary">
                  ${userInvestment.current_value.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Returns:</span>
                <span className={`font-medium ${userInvestment.total_returns >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${userInvestment.total_returns.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Min. Investment:</span>
                <span className="font-medium">${property.minimum_investment.toLocaleString()}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Funding Progress:</span>
                  <span className="font-medium">{fundingPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <span className="text-muted-foreground">Risk:</span>
              <span className={`ml-1 font-medium ${getRiskColor(property.risk_rating)}`}>
                {property.risk_rating}/10
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {property.property_type.replace('_', ' ')}
            </Badge>
          </div>

          {showInvestButton && (
            <Button 
              className="w-full mt-3 bg-gradient-primary hover:shadow-neon transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/properties/${property.id}`);
              }}
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
