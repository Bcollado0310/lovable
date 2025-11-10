// Analytics utility for tracking dashboard events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // In production, this would send to your analytics service (Mixpanel, GA, etc.)
  console.log('Analytics Event:', eventName, properties);
  
  // Example implementation for different analytics services:
  // mixpanel.track(eventName, properties);
  // gtag('event', eventName, properties);
  // amplitude.track(eventName, properties);
};

// Dashboard-specific analytics events
export const dashboardAnalytics = {
  rangeChanged: (range: string) => trackEvent('dashboard_range_changed', { range }),
  kpiTooltipOpened: (kpi: string) => trackEvent('kpi_tooltip_opened', { kpi }),
  chartSeriesToggled: (series: string) => trackEvent('chart_series_toggled', { series }),
  allocationTabChanged: (group: string) => trackEvent('allocation_tab_changed', { group }),
  commitmentCtaClicked: (id: string) => trackEvent('commitment_cta_clicked', { id }),
  activityExportCsv: () => trackEvent('activity_export_csv'),
  performanceRangeChanged: (range: string) => trackEvent('performance_range_changed', { range }),
  contributionsToggled: (shown: boolean) => trackEvent('contributions_toggled', { shown }),
  
  // New analytics events for dashboard interactions
  dashboardModeChanged: (mode: 'simple' | 'pro', previousMode?: 'simple' | 'pro') => 
    trackEvent('dashboard_mode_changed', { mode, previousMode }),
  moduleCollapsed: (module: string, mode: 'simple' | 'pro') => 
    trackEvent('module_collapsed', { module, mode }),
  moduleExpanded: (module: string, mode: 'simple' | 'pro') => 
    trackEvent('module_expanded', { module, mode }),
  viewDetailsClicked: (module: string, mode: 'simple' | 'pro', destination: string) => 
    trackEvent('view_details_clicked', { module, mode, destination })
};

// General analytics interface for investments page
export const analytics = {
  track: trackEvent
};