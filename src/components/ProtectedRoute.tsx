import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HITAMTreeLoading } from '@/components/ui/loading-animation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermissions = [] 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <HITAMTreeLoading size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Check if user has required permissions
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission => {
      switch (permission) {
        case 'canApprove':
          return user.permissions.canApprove;
        case 'canViewAllDepartments':
          return user.permissions.canViewAllDepartments;
        case 'canManageWorkflows':
          return user.permissions.canManageWorkflows;
        case 'canViewAnalytics':
          return user.permissions.canViewAnalytics;
        case 'canManageUsers':
          return user.permissions.canManageUsers;
        default:
          return false;
      }
    });

    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
