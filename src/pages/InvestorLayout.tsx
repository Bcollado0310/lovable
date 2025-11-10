import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { cn } from "@/lib/utils";

export default function InvestorLayout() {
  const { isSidebarCollapsed, isMobile } = useLayout();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      
      <main 
        className={cn(
          "flex-1 overflow-hidden transition-all duration-200 ease-in-out",
          // Desktop sidebar spacing
          !isMobile && !isSidebarCollapsed && "lg:ml-[272px]",
          !isMobile && isSidebarCollapsed && "lg:ml-[72px]",
          // Mobile takes full width
          isMobile && "ml-0"
        )}
      >
        <div className="h-screen overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}