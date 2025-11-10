import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';
import { Loader2 } from 'lucide-react';

interface DeveloperProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: 'read' | 'write' | 'manage';
  requireRole?: 'owner' | 'manager' | 'editor' | 'viewer';
}

const DeveloperProtectedRoute = ({ 
  children, 
  requiredPermission = 'read',
  requireRole
}: DeveloperProtectedRouteProps) => {
  const { user, organization, userRole, loading, hasPermission } = useDeveloperAuth();

  // Check for dev bypass mode
  const isDev = import.meta.env.DEV;
  const devBypassToken = import.meta.env.VITE_DEV_BYPASS_TOKEN;
  const isDevBypass = isDev && devBypassToken;

  if (loading && !isDevBypass) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // In dev bypass mode, always allow access
  if (isDevBypass) {
    return <>{children}</>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!organization) {
    return <Navigate to="/dev/setup" replace />;
  }

  if (requireRole && userRole !== requireRole) {
    return <Navigate to="/dev/unauthorized" replace />;
  }

  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/dev/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default DeveloperProtectedRoute;