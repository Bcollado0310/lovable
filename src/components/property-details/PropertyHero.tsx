import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Heart, 
  MapPin, 
  X,
  Target,
  Calendar,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';

interface PropertyHeroProps {
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    country: string;
    images?: string[];
    property_status: string;
    target_funding: number;
    current_funding: number;
    minimum_investment: number;
    funding_deadline?: string;
    expected_annual_return: number;
  };
  onInvestClick: () => void;
}

export function PropertyHero({ property, onInvestClick }: PropertyHeroProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(property.id);

  const fundingPercentage = (property.current_funding / property.target_funding) * 100;
  const remaining = property.target_funding - property.current_funding;
  
  const mockImages = property.images?.length ? property.images : [
    '/placeholder.svg',
    '/placeholder.svg', 
    '/placeholder.svg',
    '/placeholder.svg',
    '/placeholder.svg',
    '/placeholder.svg'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'funding': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'fully_funded': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-muted';
    }
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % mockImages.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + mockImages.length) % mockImages.length);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out this investment opportunity: ${property.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleWishlistToggle = () => {
    const wasWishlisted = isWishlisted;
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

    if (!wasWishlisted) {
      setHeartAnimating(true);
    } else {
      setHeartAnimating(false);
    }
  };

  const formatDeadline = () => {
    if (!property.funding_deadline) return 'TBD';
    const deadline = new Date(property.funding_deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expired';
    if (diffDays === 1) return '1 day left';
    if (diffDays <= 30) return `${diffDays} days left`;
    return deadline.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 h-[400px] lg:h-[500px]">
        {/* Main Image */}
        <div className="lg:col-span-2 relative cursor-pointer group" onClick={() => setLightboxOpen(true)}>
          <img
            src={mockImages[0]}
            alt={property.title}
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
          <Badge 
            className={`absolute top-4 right-4 ${getStatusColor(property.property_status)}`}
          >
            {property.property_status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Side Images Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-2">
          {mockImages.slice(1, 5).map((image, index) => (
            <div 
              key={index} 
              className="relative cursor-pointer group h-full"
              onClick={() => {
                setCurrentImage(index + 1);
                setLightboxOpen(true);
              }}
            >
              <img
                src={image}
                alt={`${property.title} ${index + 2}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
              {index === 3 && mockImages.length > 5 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                  <span className="text-white font-medium">+{mockImages.length - 5} more</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Property Info & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold gradient-text">{property.title}</h1>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            {property.address}, {property.city}, {property.country}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWishlistToggle}
            aria-pressed={isWishlisted}
            className={cn(
              "glass border-glass-border transition-colors",
              isWishlisted && "bg-primary/10 border-primary/30 text-primary"
            )}
          >
            <Heart
              className={cn(
                "mr-2 h-4 w-4 transition-all",
                isWishlisted && "fill-current text-primary",
                heartAnimating && "animate-heart-pop"
              )}
              onAnimationEnd={() => setHeartAnimating(false)}
            />
            {isWishlisted ? 'Saved' : 'Save'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="glass border-glass-border"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={onInvestClick}
            className="bg-gradient-primary hover:shadow-neon text-sm font-medium"
            size="sm"
          >
            Invest Now
          </Button>
        </div>
      </div>

      {/* Funding Widget */}
      <Card className="glass-card border-glass-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Funding Progress */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Funding Progress</span>
                  <span className="font-medium">{fundingPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={fundingPercentage} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>${property.current_funding.toLocaleString()} raised</span>
                  <span>${property.target_funding.toLocaleString()} target</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                  <div className="text-xl font-bold text-primary">
                    ${remaining.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Deadline</div>
                  <div className="text-lg font-medium">
                    {formatDeadline()}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Min Investment</div>
                  <div className="font-medium">${property.minimum_investment.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Target IRR</div>
                  <div className="font-medium text-primary">{property.expected_annual_return}%</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Distribution</div>
                  <div className="font-medium">Quarterly</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Hold Period</div>
                  <div className="font-medium">3-5 Years</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black border-0">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10"
              onClick={prevImage}
              disabled={mockImages.length <= 1}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10"
              onClick={nextImage}
              disabled={mockImages.length <= 1}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            <img
              src={mockImages[currentImage]}
              alt={`${property.title} ${currentImage + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {mockImages.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentImage ? "bg-white" : "bg-white/50"
                  )}
                  onClick={() => setCurrentImage(index)}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
