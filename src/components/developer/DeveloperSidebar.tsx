import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Building2,
  Users,
  FileText,
  Megaphone,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDeveloperAuth } from "@/contexts/DeveloperAuthContext";
import { useLayout } from "@/contexts/LayoutContext";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

const menuItems = [
  { title: "Dashboard", url: "/dev", icon: BarChart3 },
  { title: "Offerings", url: "/dev/offerings", icon: Building2 },
  { title: "Investors", url: "/dev/investors", icon: Users },
  { title: "Analytics", url: "/dev/analytics", icon: TrendingUp },
  { title: "Settings", url: "/dev/settings", icon: Settings },
];

export function DeveloperSidebar() {
  const { organization, userRole, signOut } = useDeveloperAuth();
  const {
    isSidebarCollapsed,
    setSidebarCollapsed,
    isMobile,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
  } = useLayout();

  const handleItemClick = useCallback(
    () => {
      if (isMobile) {
        setMobileDrawerOpen(false);
      }
    },
    [isMobile, setMobileDrawerOpen]
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile, setMobileDrawerOpen, signOut]);

  const content = (
    <SidebarContent
      isCollapsed={isSidebarCollapsed}
      organizationName={organization?.name || "Developer Console"}
      organizationInitial={organization?.name?.charAt(0) || "D"}
      logoUrl={organization?.logo_url}
      userRole={userRole}
      isMobile={isMobile}
      onCollapse={() => setSidebarCollapsed(true)}
      onItemClick={handleItemClick}
      onSignOut={handleSignOut}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={isMobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="left" className="p-0 w-80 sm:w-96">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 h-screen bg-card border-r border-border overflow-hidden",
        "transition-[width] duration-200 ease-in-out",
        "motion-reduce:transition-none",
        isSidebarCollapsed ? "w-[72px]" : "w-[272px]"
      )}
    >
      {content}
    </aside>
  );
}

interface SidebarContentProps {
  isCollapsed: boolean;
  organizationName: string;
  organizationInitial: string;
  logoUrl?: string;
  userRole: string | null;
  isMobile: boolean;
  onCollapse?: () => void;
  onItemClick: () => void;
  onSignOut: () => void;
}

function SidebarContent({
  isCollapsed,
  organizationName,
  organizationInitial,
  logoUrl,
  userRole,
  isMobile,
  onCollapse,
  onItemClick,
  onSignOut,
}: SidebarContentProps) {
  const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "Developer";

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex flex-1 items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="text-primary-foreground h-5 w-5" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <span className="block truncate font-semibold text-lg" title={organizationName}>
                {organizationName}
              </span>
            </div>
          )}
        </div>

        {!isMobile && onCollapse && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            className="w-8 h-8 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={onItemClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive && "bg-accent text-accent-foreground",
                  isCollapsed && !isMobile && "justify-center"
                )
              }
              aria-label={isCollapsed && !isMobile ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {(!isCollapsed || isMobile) && (
                <span className="truncate">{item.title}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-border p-4 space-y-3">
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={logoUrl} alt={organizationName} />
              <AvatarFallback>{organizationInitial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{organizationName}</p>
              <Badge variant="secondary" className="text-xs mt-1">
                {roleLabel}
              </Badge>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={onSignOut}
          className={cn(
            "w-full justify-start gap-3 text-sm font-medium",
            "text-destructive hover:text-destructive hover:bg-destructive/10",
            isCollapsed && !isMobile && "justify-center"
          )}
          aria-label={isCollapsed && !isMobile ? "Sign Out" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {(!isCollapsed || isMobile) && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}
