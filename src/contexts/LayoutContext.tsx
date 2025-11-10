import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutContextType {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
  isMobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebarCollapsed', false);
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useLocalStorage('mobileDrawerOpen', false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileDrawerOpen(!isMobileDrawerOpen);
    } else {
      setSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  // Close mobile drawer when switching to desktop
  useEffect(() => {
    if (!isMobile && isMobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile, isMobileDrawerOpen, setMobileDrawerOpen]);

  // Handle Escape key for mobile drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && isMobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, isMobileDrawerOpen, setMobileDrawerOpen]);

  return (
    <LayoutContext.Provider
      value={{
        isSidebarCollapsed,
        setSidebarCollapsed,
        isMobile,
        isMobileDrawerOpen,
        setMobileDrawerOpen,
        toggleSidebar,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}