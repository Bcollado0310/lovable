import { Outlet } from "react-router-dom";
import { DeveloperSidebar } from "@/components/developer/DeveloperSidebar";
import { LayoutHeader } from "@/components/layout/LayoutHeader";
import { useLayout } from "@/contexts/LayoutContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function DeveloperLayout() {
  const { isSidebarCollapsed, isMobile, setSidebarCollapsed } = useLayout();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <DeveloperSidebar />

      <main
        className={cn(
          "flex-1 overflow-hidden transition-all duration-200 ease-in-out",
          !isMobile && !isSidebarCollapsed && "lg:ml-[272px]",
          !isMobile && isSidebarCollapsed && "lg:ml-[72px]",
          isMobile && "ml-0"
        )}
      >
        <div className="flex h-screen flex-col overflow-hidden">
          <LayoutHeader
            title="Developer Portal"
            actions={
              !isMobile && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                  aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className="inline-flex"
                >
                  <ChevronLeft
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isSidebarCollapsed && "rotate-180"
                    )}
                  />
                </Button>
              )
            }
          />
          <div className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
