import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  flag_name: string;
  enabled: boolean;
  environment: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CacheInvalidationLog {
  id: string;
  cache_key: string;
  invalidation_reason: string;
  invalidated_at: string;
  organization_id?: string;
  offering_id?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  resource_id?: string;
  created_at: string;
  admin_user_id: string;
}

class FeatureFlagManager {
  private environment: string;

  constructor(environment: string = 'production') {
    this.environment = environment;
  }

  async checkFeatureFlag(flagName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('feature-flag-manager', {
        body: {
          action: 'check_feature_flags',
          environment: this.environment
        }
      });

      if (error) {
        console.error('Error checking feature flag:', error);
        return false;
      }

      const flag = data.flags.find((f: FeatureFlag) => f.flag_name === flagName);
      return flag?.enabled || false;
    } catch (error) {
      console.error('Feature flag check failed:', error);
      return false;
    }
  }

  async toggleFeatureFlag(
    flagName: string, 
    enabled: boolean, 
    organizationId?: string, 
    offeringId?: string
  ): Promise<{ success: boolean; cache_purged?: boolean }> {
    try {
      const { data, error } = await supabase.functions.invoke('feature-flag-manager', {
        body: {
          action: 'toggle_feature_flag',
          flagName,
          enabled,
          organizationId,
          offeringId,
          environment: this.environment
        }
      });

      if (error) {
        console.error('Error toggling feature flag:', error);
        return { success: false };
      }

      return {
        success: data.success,
        cache_purged: data.cache_purged
      };
    } catch (error) {
      console.error('Feature flag toggle failed:', error);
      return { success: false };
    }
  }

  async purgeCache(organizationId: string, offeringId?: string): Promise<{ success: boolean; purged_count?: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('feature-flag-manager', {
        body: {
          action: 'purge_cache',
          organizationId,
          offeringId,
          environment: this.environment
        }
      });

      if (error) {
        console.error('Error purging cache:', error);
        return { success: false };
      }

      return {
        success: data.success,
        purged_count: data.purged_count
      };
    } catch (error) {
      console.error('Cache purge failed:', error);
      return { success: false };
    }
  }

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const { data, error } = await supabase.functions.invoke('feature-flag-manager', {
        body: {
          action: 'check_feature_flags',
          environment: this.environment
        }
      });

      if (error) {
        console.error('Error getting feature flags:', error);
        return [];
      }

      return data.flags || [];
    } catch (error) {
      console.error('Failed to get feature flags:', error);
      return [];
    }
  }

  async getAccessDenials(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase.functions.invoke('feature-flag-manager', {
        body: {
          action: 'monitor_access_denials',
          environment: this.environment
        }
      });

      if (error) {
        console.error('Error getting access denials:', error);
        return [];
      }

      return data.denials || [];
    } catch (error) {
      console.error('Failed to get access denials:', error);
      return [];
    }
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase.functions.invoke('feature-flag-manager', {
        body: {
          action: 'audit_logs',
          environment: this.environment
        }
      });

      if (error) {
        console.error('Error getting audit logs:', error);
        return [];
      }

      return data.audit_logs || [];
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  async getCacheInvalidationLogs(): Promise<CacheInvalidationLog[]> {
    try {
      const { data, error } = await supabase.functions.invoke('feature-flag-manager', {
        body: {
          action: 'cache_invalidation_logs',
          environment: this.environment
        }
      });

      if (error) {
        console.error('Error getting cache logs:', error);
        return [];
      }

      return data.cache_logs || [];
    } catch (error) {
      console.error('Failed to get cache logs:', error);
      return [];
    }
  }

  // Utility method to check if PII redaction is enabled
  async isPiiRedactionEnabled(): Promise<boolean> {
    return this.checkFeatureFlag('developer_pii_redaction');
  }

  // Utility method to check if enhanced search is enabled
  async isEnhancedSearchEnabled(): Promise<boolean> {
    return this.checkFeatureFlag('enhanced_search_aliases');
  }

  // Method to enable PII redaction with cache purge
  async enablePiiRedaction(organizationId: string, offeringId?: string): Promise<boolean> {
    const result = await this.toggleFeatureFlag(
      'developer_pii_redaction', 
      true, 
      organizationId, 
      offeringId
    );
    
    if (result.success) {
      console.log('PII redaction enabled successfully');
      if (result.cache_purged) {
        console.log('Cache automatically purged');
      }
    }
    
    return result.success;
  }
}

// Export singleton instances for different environments
export const stagingFeatureFlags = new FeatureFlagManager('staging');
export const productionFeatureFlags = new FeatureFlagManager('production');

// Default export for production
export default productionFeatureFlags;