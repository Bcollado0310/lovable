import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Circle, 
  Shield, 
  CreditCard, 
  Smartphone, 
  FileCheck, 
  User,
  ArrowRight
} from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "pending" | "in-progress";
  icon: typeof CheckCircle;
  actionText?: string;
  actionUrl?: string;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  isVisible: boolean;
}

const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "kyc",
    title: "Complete KYC/AML Verification",
    description: "Verify your identity to comply with regulatory requirements",
    status: "pending",
    icon: Shield,
    actionText: "Start Verification",
    actionUrl: "/account/verification"
  },
  {
    id: "bank",
    title: "Link Bank Account",
    description: "Connect your bank account for seamless investments and withdrawals",
    status: "pending",
    icon: CreditCard,
    actionText: "Link Account",
    actionUrl: "/account/banking"
  },
  {
    id: "2fa",
    title: "Enable Two-Factor Authentication",
    description: "Add an extra layer of security to your account",
    status: "pending",
    icon: Smartphone,
    actionText: "Enable 2FA",
    actionUrl: "/account/security"
  },
  {
    id: "accreditation",
    title: "Confirm Accreditation Status",
    description: "Verify your accredited investor status for exclusive opportunities",
    status: "pending",
    icon: FileCheck,
    actionText: "Verify Status",
    actionUrl: "/account/accreditation"
  },
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Add investment preferences and personal information",
    status: "pending",
    icon: User,
    actionText: "Complete Profile",
    actionUrl: "/account/profile"
  }
];

export function OnboardingChecklist({ 
  items = DEFAULT_CHECKLIST_ITEMS, 
  completedCount = 0, 
  totalCount = 5, 
  isVisible = true 
}: OnboardingChecklistProps) {
  if (!isVisible) return null;

  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "in-progress":
        return <Circle className="h-5 w-5 text-yellow-400 fill-current" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400">Complete</Badge>;
      case "in-progress":
        return <Badge className="bg-yellow-500/20 text-yellow-400">In Progress</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="glass-card border-glass-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Account Setup</CardTitle>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-lg font-bold gradient-text">
              {completedCount}/{totalCount}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground">
            Complete your account setup to unlock all features
          </p>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => {
            const IconComponent = item.icon;
            
            return (
              <div 
                key={item.id} 
                className="flex items-start gap-4 p-4 border border-glass-border rounded-lg bg-muted/10"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <h4 className="font-medium">{item.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  {item.status !== "completed" && item.actionText && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => item.actionUrl && (window.location.href = item.actionUrl)}
                    >
                      {item.actionText}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-primary">Ready to invest?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Explore our curated selection of investment opportunities
              </p>
            </div>
            <Button 
              className="bg-gradient-primary hover:shadow-neon"
              onClick={() => window.location.href = '/properties'}
            >
              Browse Properties
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}