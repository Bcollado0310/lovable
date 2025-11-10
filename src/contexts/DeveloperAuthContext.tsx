import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface DeveloperOrganization {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logo_url?: string;
}

interface DeveloperAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  organization: DeveloperOrganization | null;
  userRole: 'owner' | 'manager' | 'editor' | 'viewer' | null;
  signOut: () => Promise<void>;
  hasPermission: (action: 'read' | 'write' | 'manage') => boolean;
}

const DeveloperAuthContext = createContext<DeveloperAuthContextType | undefined>(undefined);

export function DeveloperAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState<DeveloperOrganization | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'manager' | 'editor' | 'viewer' | null>(null);

  useEffect(() => {
    // Check if we're in development mode with bypass enabled
    const isDev = import.meta.env.DEV;

    if (isDev) {
      // Use dev bypass - create mock user and org
      console.log('🔧 Using dev auth bypass for developer context');
      
      const mockUser: any = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'dev@bypass.local',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };
      
      setUser(mockUser);
      setOrganization({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Demo Development Company',
        description: 'A demo organization for development purposes',
        website: 'https://demo-dev.com'
      });
      setUserRole('owner');
      setLoading(false);
      return;
    }

    // Normal authentication flow
    setLoading(true);
    
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchOrganization(currentSession.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        fetchOrganization(newSession.user.id);
      } else {
        setOrganization(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchOrganization = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('developer_organization_members')
        .select(`
          role,
          developer_organizations (
            id,
            name,
            description,
            website,
            logo_url
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data?.developer_organizations) {
        setOrganization(data.developer_organizations as any);
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // Mock sign out for development
    console.log('Mock sign out');
  };

  const hasPermission = (action: 'read' | 'write' | 'manage'): boolean => {
    if (!userRole) return false;
    
    const permissions = {
      owner: ['read', 'write', 'manage'],
      manager: ['read', 'write', 'manage'],
      editor: ['read', 'write'],
      viewer: ['read']
    };
    
    return permissions[userRole].includes(action);
  };

  return (
    <DeveloperAuthContext.Provider value={{
      user,
      session,
      loading,
      organization,
      userRole,
      signOut,
      hasPermission
    }}>
      {children}
    </DeveloperAuthContext.Provider>
  );
}

export function useDeveloperAuth() {
  const context = useContext(DeveloperAuthContext);
  if (context === undefined) {
    throw new Error('useDeveloperAuth must be used within a DeveloperAuthProvider');
  }
  return context;
}