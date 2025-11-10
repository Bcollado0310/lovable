import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from './tabs/OverviewTab';
import { FinancialsTab } from './tabs/FinancialsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { UpdatesTab } from './tabs/UpdatesTab';
import { QATab } from './tabs/QATab';
import { LocationTab } from './tabs/LocationTab';
import { SponsorTab } from './tabs/SponsorTab';
import { TermsTab } from './tabs/TermsTab';
import { cn } from '@/lib/utils';

interface PropertyTabsProps {
  property: any;
  className?: string;
}

const tabItems = [
  { id: 'overview', label: 'Overview', hash: '#overview' },
  { id: 'financials', label: 'Financials', hash: '#financials' },
  { id: 'documents', label: 'Documents', hash: '#documents' },
  { id: 'updates', label: 'Updates', hash: '#updates' },
  { id: 'qa', label: 'Q&A', hash: '#qa' },
  { id: 'location', label: 'Location', hash: '#location' },
  { id: 'sponsor', label: 'Sponsor', hash: '#sponsor' },
  { id: 'terms', label: 'Terms', hash: '#terms' }
];

export function PropertyTabs({ property, className }: PropertyTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const tab = tabItems.find(t => t.hash === hash);
      if (tab) {
        setActiveTab(tab.id);
      }
    };

    // Set initial tab from hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const tab = tabItems.find(t => t.id === tabId);
    if (tab) {
      // Update URL hash without scrolling
      const url = new URL(window.location.href);
      url.hash = tab.hash;
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Sticky Tab Navigation */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-glass-border">
          <div className="max-w-7xl mx-auto px-6">
            <TabsList className="inline-flex h-12 items-center justify-start rounded-none bg-transparent p-0 w-full overflow-x-auto">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <TabsContent value="overview" className="mt-0 space-y-6">
            <OverviewTab property={property} />
          </TabsContent>

          <TabsContent value="financials" className="mt-0 space-y-6">
            <FinancialsTab property={property} />
          </TabsContent>

          <TabsContent value="documents" className="mt-0 space-y-6">
            <DocumentsTab property={property} />
          </TabsContent>

          <TabsContent value="updates" className="mt-0 space-y-6">
            <UpdatesTab property={property} />
          </TabsContent>

          <TabsContent value="qa" className="mt-0 space-y-6">
            <QATab property={property} />
          </TabsContent>

          <TabsContent value="location" className="mt-0 space-y-6">
            <LocationTab property={property} />
          </TabsContent>

          <TabsContent value="sponsor" className="mt-0 space-y-6">
            <SponsorTab property={property} />
          </TabsContent>

          <TabsContent value="terms" className="mt-0 space-y-6">
            <TermsTab property={property} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}