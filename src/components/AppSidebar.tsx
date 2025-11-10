import { useAuth } from "@/contexts/AuthContext";
import { useLayout } from "@/contexts/LayoutContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Building,
  Receipt,
  User,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  Home,
} from "lucide-react";

const investorMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Investments", url: "/investments", icon: TrendingUp },
  { title: "Browse Properties", url: "/properties", icon: Building },
  { title: "Transactions", url: "/transactions", icon: Receipt },
  { title: "Account", url: "/account", icon: User },
];

const adminMenuItems = [
  { title: "Admin Panel", url: "/admin", icon: Settings },
  { title: "Main Site", url: "/", icon: Home },
];

export function AppSidebar() {
  const { user, isAdmin, signOut } = useAuth();
  const { isSidebarCollapsed, setSidebarCollapsed, isMobile, isMobileDrawerOpen, setMobileDrawerOpen } = useLayout();
  const navigate = useNavigate();

  const menuItems = isAdmin ? adminMenuItems : investorMenuItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleItemClick = () => {
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  if (isMobile) {
    return (
      <Sheet open={isMobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent 
          side="left" 
          className="p-0 w-80"
          onEscapeKeyDown={() => setMobileDrawerOpen(false)}
        >
          <SidebarContent
            isCollapsed={false}
            menuItems={menuItems}
            user={user}
            isAdmin={isAdmin}
            onSignOut={handleSignOut}
            onItemClick={handleItemClick}
            isMobile={true}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 h-screen bg-card border-r border-border",
        "transition-[width] duration-200 ease-in-out",
        "motion-reduce:transition-none",
        isSidebarCollapsed ? "w-[72px]" : "w-[272px]"
      )}
    >
      <SidebarContent
        isCollapsed={isSidebarCollapsed}
        menuItems={menuItems}
        user={user}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
        onItemClick={handleItemClick}
        onCollapse={() => setSidebarCollapsed(true)}
      />
    </aside>
  );
}

interface SidebarContentProps {
  isCollapsed: boolean;
  menuItems: typeof investorMenuItems;
  user: any;
  isAdmin: boolean;
  onSignOut: () => void;
  onItemClick?: () => void;
  onCollapse?: () => void;
  isMobile?: boolean;
}

function SidebarContent({ 
  isCollapsed, 
  menuItems, 
  user, 
  isAdmin, 
  onSignOut, 
  onItemClick,
  onCollapse,
  isMobile = false 
}: SidebarContentProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className={cn("flex items-center gap-3", isCollapsed && !isMobile && "justify-center")}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">R</span>
          </div>
          {(!isCollapsed || isMobile) && (
            <span className="font-semibold text-lg">RealtyFlow</span>
          )}
        </div>
        
        {/* Desktop Collapse Toggle */}
        {!isMobile && onCollapse && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            className={cn(
              "w-8 h-8",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={onItemClick}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && "bg-accent text-accent-foreground",
                isCollapsed && !isMobile && "justify-center"
              )}
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

      {/* Footer */}
      <div className="border-t border-border p-4">
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