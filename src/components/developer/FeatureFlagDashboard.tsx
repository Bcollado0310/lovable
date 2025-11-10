import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Trash2, Shield, AlertTriangle, CheckCircle, Settings, Monitor } from 'lucide-react';
import { stagingFeatureFlags, productionFeatureFlags, FeatureFlag, AuditLog, CacheInvalidationLog } from '@/utils/featureFlagManager';
import { useToast } from '@/hooks/use-toast';

export function FeatureFlagDashboard() {
  const { toast } = useToast();
  
  // Mock admin status for demo - in real implementation, check actual user role
  const isAdmin = true; // This would come from authentication context
  
  const [stagingFlags, setStagingFlags] = useState<FeatureFlag[]>([]);
  const [productionFlags, setProductionFlags] = useState<FeatureFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cacheLog, setCacheLog] = useState<CacheInvalidationLog[]>([]);
  const [accessDenials, setAccessDenials] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staging, production, audit, cache, denials] = await Promise.all([
        stagingFeatureFlags.getFeatureFlags(),
        productionFeatureFlags.getFeatureFlags(),
        productionFeatureFlags.getAuditLogs(),
        productionFeatureFlags.getCacheInvalidationLogs(),
        productionFeatureFlags.getAccessDenials()
      ]);

      setStagingFlags(staging);
      setProductionFlags(production);
      setAuditLogs(audit);
      setCacheLog(cache);
      setAccessDenials(denials);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load feature flag dashboard',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagName: string, enabled: boolean, environment: 'staging' | 'production') => {
    const manager = environment === 'staging' ? stagingFeatureFlags : productionFeatureFlags;
    
    try {
      const result = await manager.toggleFeatureFlag(
        flagName, 
        enabled, 
        'mock-org-id' // In real implementation, use organization?.id
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: `Feature flag ${enabled ? 'enabled' : 'disabled'} in ${environment}${result.cache_purged ? ' (cache purged)' : ''}`,
        });
        loadData();
      } else {
        throw new Error('Failed to toggle feature flag');
      }
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      toast({
        title: 'Error',
        description: `Failed to ${enabled ? 'enable' : 'disable'} feature flag`,
        variant: 'destructive'
      });
    }
  };

  const purgeCache = async () => {
    const mockOrgId = 'mock-org-id'; // In real implementation, use organization?.id
    if (!mockOrgId) return;

    try {
      const result = await productionFeatureFlags.purgeCache(mockOrgId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Cache purged successfully (${result.purged_count} entries)`,
        });
        loadData();
      } else {
        throw new Error('Cache purge failed');
      }
    } catch (error) {
      console.error('Error purging cache:', error);
      toast({
        title: 'Error',
        description: 'Failed to purge cache',
        variant: 'destructive'
      });
    }
  };

  const enablePiiRedactionStaging = async () => {
    const mockOrgId = 'mock-org-id'; // In real implementation, use organization?.id
    if (!mockOrgId) return;

    try {
      const success = await stagingFeatureFlags.enablePiiRedaction(mockOrgId);
      
      if (success) {
        toast({
          title: 'PII Redaction Enabled',
          description: 'PII redaction is now active in staging environment',
        });
        loadData();
      } else {
        throw new Error('Failed to enable PII redaction');
      }
    } catch (error) {
      console.error('Error enabling PII redaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable PII redaction in staging',
        variant: 'destructive'
      });
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Admin access required to view feature flag dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  const renderFlags = (flags: FeatureFlag[], environment: 'staging' | 'production') => (
    <div className="space-y-4">
      {flags.map((flag) => (
        <Card key={flag.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{flag.flag_name}</h4>
                  <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {environment === 'production' && (
                    <Badge variant="destructive">PROD</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{flag.description}</p>
                <p className="text-xs text-muted-foreground">
                  Updated: {new Date(flag.updated_at).toLocaleString()}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={(enabled) => toggleFlag(flag.flag_name, enabled, environment)}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feature Flag Dashboard</h1>
          <p className="text-muted-foreground">
            Manage PII redaction rollout and monitor system behavior
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={enablePiiRedactionStaging} variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            Enable in Staging
          </Button>
          <Button onClick={purgeCache} variant="outline">
            <Trash2 className="w-4 h-4 mr-2" />
            Purge Cache
          </Button>
          <Button onClick={loadData} variant="outline" disabled={loading}>
            <Monitor className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staging Flags</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stagingFlags.filter(f => f.enabled).length}/{stagingFlags.length}
            </div>
            <p className="text-xs text-muted-foreground">enabled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Flags</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productionFlags.filter(f => f.enabled).length}/{productionFlags.length}
            </div>
            <p className="text-xs text-muted-foreground">enabled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Denials</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessDenials.length}</div>
            <p className="text-xs text-muted-foreground">in last 50 events</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Purges</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheLog.length}</div>
            <p className="text-xs text-muted-foreground">total entries</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="staging" className="space-y-4">
        <TabsList>
          <TabsTrigger value="staging">Staging Environment</TabsTrigger>
          <TabsTrigger value="production">Production Environment</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>
        
        <TabsContent value="staging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staging Feature Flags</CardTitle>
              <CardDescription>
                Test PII redaction features in staging before production rollout
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderFlags(stagingFlags, 'staging')}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="production" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Production environment changes affect live users. Proceed with caution.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Production Feature Flags</CardTitle>
              <CardDescription>
                Live feature flags affecting user experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderFlags(productionFlags, 'production')}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Access Denials</CardTitle>
                <CardDescription>
                  PII access attempts that were blocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {accessDenials.map((denial) => (
                    <div key={denial.id} className="text-sm p-2 border rounded">
                      <div className="font-medium text-red-600">{denial.action}</div>
                      <div className="text-muted-foreground">
                        {denial.table_name} • {new Date(denial.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cache Invalidation Log</CardTitle>
                <CardDescription>
                  Recent cache purge operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cacheLog.map((log) => (
                    <div key={log.id} className="text-sm p-2 border rounded">
                      <div className="font-medium">{log.cache_key}</div>
                      <div className="text-muted-foreground">
                        {log.invalidation_reason} • {new Date(log.invalidated_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}