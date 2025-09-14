import React from 'react';
import { DynamicDashboard } from './DynamicDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { getDashboardConfig } from '@/config/roleConfigs';
import { cn } from '@/lib/utils';
import {
  Crown,
  Shield,
  Users,
  Building,
  User,
  Settings,
  Zap
} from 'lucide-react';

export const RoleDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isMobile } = useResponsive();

  if (!user) return null;

  const dashboardConfig = getDashboardConfig(user.role, user.department, user.branch);
  
  const getRoleIcon = () => {
    switch (user.role) {
      case 'principal': return Crown;
      case 'registrar': return Shield;
      case 'program-head': return Users;
      case 'hod': return Building;
      default: return User;
    }
  };

  const RoleIcon = getRoleIcon();

  const getRoleDescription = () => {
    switch (user.role) {
      case 'principal':
        return 'Complete institutional oversight with full administrative control, mass distribution capabilities, and system-wide analytics.';
      case 'registrar':
        return 'Academic administration with document approval authority, workflow management, and cross-departmental coordination.';
      case 'program-head':
        return `Program-specific management for ${user.branch || 'department'} with focused approval workflows and academic scheduling.`;
      case 'hod':
        return `Department leadership for ${user.department} with faculty management, document approvals, and departmental analytics.`;
      default:
        return 'Document submission and tracking with personal task management and communication tools.';
    }
  };

  const getEnabledFeatures = () => {
    return Object.entries(dashboardConfig.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
  };

  const enabledFeatures = getEnabledFeatures();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Role Welcome Banner */}
      <Card className="shadow-elegant bg-gradient-primary text-primary-foreground border-0">
        <CardContent className={cn("p-6", isMobile && "p-4")}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "rounded-full bg-white/20 flex items-center justify-center shadow-lg",
              isMobile ? "w-12 h-12" : "w-16 h-16"
            )}>
              <RoleIcon className={cn(
                "text-white",
                isMobile ? "w-6 h-6" : "w-8 h-8"
              )} />
            </div>
            
            <div className="flex-1">
              <h1 className={cn(
                "font-bold",
                isMobile ? "text-xl" : "text-2xl"
              )}>
                Welcome to IAOMS Dashboard
              </h1>
              <p className={cn(
                "opacity-90 mt-1",
                isMobile ? "text-sm" : "text-base"
              )}>
                Logged in as <span className="font-semibold">{user.name}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-white/20 text-white border-white/30 font-medium">
                  Role: {dashboardConfig.displayName}
                </Badge>
                {user.department && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {user.department}
                  </Badge>
                )}
                {user.branch && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {user.branch}
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5" />
                <span className={cn(
                  "font-bold",
                  isMobile ? "text-lg" : "text-xl"
                )}>
                  {enabledFeatures.length}
                </span>
              </div>
              <p className={cn(
                "opacity-90",
                isMobile ? "text-xs" : "text-sm"
              )}>
                Features Available
              </p>
            </div>
          </div>
          
          {/* Role Description */}
          <div className="mt-4 p-4 bg-white/10 rounded-lg">
            <p className={cn(
              "opacity-90",
              isMobile ? "text-sm" : "text-base"
            )}>
              {getRoleDescription()}
            </p>
          </div>
        </CardContent>
      </Card>



      {/* Dynamic Dashboard */}
      <DynamicDashboard />

      {/* Role-Specific Help */}
      <Card className="shadow-elegant border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isMobile ? "text-lg" : "text-xl"
          )}>
            <Settings className="w-5 h-5 text-primary" />
            Dashboard Help
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className={cn(
                  "font-medium",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  Customize Your Dashboard
                </p>
                <p className={cn(
                  "text-muted-foreground mt-1",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Use the dashboard customization options to arrange widgets according to your workflow preferences.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className={cn(
                  "font-medium",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  Role-Based Features
                </p>
                <p className={cn(
                  "text-muted-foreground mt-1",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Your dashboard shows features specific to your role. Contact IT support if you need access to additional features.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className={cn(
                  "font-medium",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  Navigation Tips
                </p>
                <p className={cn(
                  "text-muted-foreground mt-1",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Use the sidebar navigation to access different modules. On mobile, use the bottom navigation bar for quick access.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
