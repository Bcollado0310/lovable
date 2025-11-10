import { useState, useEffect } from 'react';

type DashboardMode = 'simple' | 'pro';
type ModuleKey = 'performance' | 'allocation' | 'distributions' | 'activity' | 'commitments' | 'watchlist';

interface CollapseState {
  simple: { [key in ModuleKey]?: boolean };
  pro: { [key in ModuleKey]?: boolean };
}

export function useDashboardCollapse(mode: DashboardMode) {
  const [collapsedState, setCollapsedState] = useState<CollapseState>({
    simple: {},
    pro: {}
  });

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dashboard.collapsed');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCollapsedState(parsed);
      }
    } catch (error) {
      console.error('Error loading dashboard collapse state:', error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('dashboard.collapsed', JSON.stringify(collapsedState));
    } catch (error) {
      console.error('Error saving dashboard collapse state:', error);
    }
  }, [collapsedState]);

  const isCollapsed = (moduleKey: ModuleKey): boolean => {
    return collapsedState[mode][moduleKey] || false;
  };

  const toggleCollapse = (moduleKey: ModuleKey, analyticsCallback?: (moduleKey: ModuleKey, isCollapsed: boolean, mode: DashboardMode) => void) => {
    const willBeCollapsed = !collapsedState[mode][moduleKey];
    
    setCollapsedState(prev => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [moduleKey]: willBeCollapsed
      }
    }));

    // Call analytics callback if provided
    if (analyticsCallback) {
      analyticsCallback(moduleKey, willBeCollapsed, mode);
    }
  };

  return {
    isCollapsed,
    toggleCollapse
  };
}