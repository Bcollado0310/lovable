import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Archive, Trash2, AlertTriangle } from 'lucide-react';
import { DeveloperOffering, formatDate } from '@/utils/developerHelpers';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';

interface SettingsTabProps {
  offering: DeveloperOffering;
}

export function SettingsTab({ offering }: SettingsTabProps) {
  const { hasPermission } = useDeveloperAuth();

  const settings = {
    allowPublicViewing: true,
    requireAccreditation: false,
    enableAutoApproval: false,
    sendEmailUpdates: true,
    allowPartialInvestments: true,
    enableWaitlist: true
  };

  return (
    <div className="space-y-6">
      {/* Offering Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Core details about this offering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Offering Title</Label>
              <Input 
                id="title"
                defaultValue={offering.title}
                disabled={!hasPermission('manage')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="property-type">Property Type</Label>
              <Input 
                id="property-type"
                defaultValue={offering.property_type}
                disabled={!hasPermission('manage')}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location"
              defaultValue={offering.location}
              disabled={!hasPermission('manage')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              defaultValue={offering.description}
              disabled={!hasPermission('manage')}
              rows={4}
            />
          </div>
          
          {hasPermission('manage') && (
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Offering Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Offering Settings</CardTitle>
          <CardDescription>
            Configure how this offering behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Viewing</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone to view this offering publicly
              </p>
            </div>
            <Switch 
              checked={settings.allowPublicViewing}
              disabled={!hasPermission('manage')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Accreditation</Label>
              <p className="text-sm text-muted-foreground">
                Only allow accredited investors to invest
              </p>
            </div>
            <Switch 
              checked={settings.requireAccreditation}
              disabled={!hasPermission('manage')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Approve Investments</Label>
              <p className="text-sm text-muted-foreground">
                Automatically approve investment applications
              </p>
            </div>
            <Switch 
              checked={settings.enableAutoApproval}
              disabled={!hasPermission('manage')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Send Email Updates</Label>
              <p className="text-sm text-muted-foreground">
                Email investors when updates are published
              </p>
            </div>
            <Switch 
              checked={settings.sendEmailUpdates}
              disabled={!hasPermission('manage')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Partial Investments</Label>
              <p className="text-sm text-muted-foreground">
                Allow investments below the minimum amount
              </p>
            </div>
            <Switch 
              checked={settings.allowPartialInvestments}
              disabled={!hasPermission('manage')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Waitlist</Label>
              <p className="text-sm text-muted-foreground">
                Allow investors to join a waitlist when full
              </p>
            </div>
            <Switch 
              checked={settings.enableWaitlist}
              disabled={!hasPermission('manage')}
            />
          </div>
          
          {hasPermission('manage') && (
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Offering Status */}
      <Card>
        <CardHeader>
          <CardTitle>Offering Status</CardTitle>
          <CardDescription>
            Current status and metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Current Status</Label>
              <Badge variant="default">{offering.status.toUpperCase()}</Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Created Date</Label>
              <p className="text-sm">{formatDate(offering.created_at)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Last Updated</Label>
              <p className="text-sm">{formatDate(offering.updated_at)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Offering ID</Label>
              <p className="text-sm font-mono">{offering.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {hasPermission('manage') && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that will affect this offering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <h4 className="font-medium">Archive Offering</h4>
                <p className="text-sm text-muted-foreground">
                  Hide this offering from public view while preserving data
                </p>
              </div>
              <Button variant="outline">
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <h4 className="font-medium">Delete Offering</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this offering and all associated data
                </p>
              </div>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}