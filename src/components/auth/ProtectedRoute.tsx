import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'SUPER_ADMIN' | 'PRESIDENT' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'PARTICIPANT';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  minRoleLevel?: number;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  minRoleLevel,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading, isReady, hasRole, hasMinRoleLevel } = useAuth();
  const location = useLocation();

  if (loading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (minRoleLevel && !hasMinRoleLevel(minRoleLevel)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
