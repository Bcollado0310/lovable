import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useDeveloperOffering } from '@/hooks/useDeveloperData';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';
import { deriveStatus, formatCurrency } from '@/utils/developerHelpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';

import { OverviewTab } from '@/components/developer/offering-details/OverviewTab';
import { InvestorsTab } from '@/components/developer/offering-details/InvestorsTab';
import { DocumentsTab } from '@/components/developer/offering-details/DocumentsTab';
import { MediaTab } from '@/components/developer/offering-details/MediaTab';
import { PricingTab } from '@/components/developer/offering-details/PricingTab';
import { UpdatesTab } from '@/components/developer/offering-details/UpdatesTab';
import { SettingsTab } from '@/components/developer/offering-details/SettingsTab';

export default function OfferingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useDeveloperAuth();
  const { data: offering, loading, error } = useDeveloperOffering(id || null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !offering) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {error || 'Offering not found'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dev/offerings')}
              className="mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Offerings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = deriveStatus(offering);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dev/offerings')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-3xl font-bold tracking-tight">{offering.title}</h1>
            <Badge variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>{offering.location}</span>
            <span>•</span>
            <span>{offering.property_type}</span>
            <span>•</span>
            <span>{formatCurrency(offering.target_amount)} target</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Public Page
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          {hasPermission('manage') && (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab offering={offering} />
        </TabsContent>

        <TabsContent value="investors">
          <InvestorsTab offeringId={offering.id} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab offering={offering} />
        </TabsContent>

        <TabsContent value="media">
          <MediaTab offering={offering} />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingTab offering={offering} />
        </TabsContent>

        <TabsContent value="updates">
          <UpdatesTab offeringId={offering.id} />
        </TabsContent>

        {hasPermission('manage') && (
          <TabsContent value="settings">
            <SettingsTab offering={offering} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}