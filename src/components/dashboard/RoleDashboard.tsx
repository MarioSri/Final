import React, { useState, useEffect } from 'react';
import { DynamicDashboard } from './DynamicDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { getDashboardConfig } from '@/config/roleConfigs';
import { cn } from '@/lib/utils';
import { PersonalInfoData } from '@/components/PersonalInformationForm';
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
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData | null>(null);

  // Load saved personal information
  useEffect(() => {
    const savedProfile = localStorage.getItem('user-profile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setPersonalInfo(parsedProfile);
      } catch (error) {
        console.error('Error loading saved profile:', error);
      }
    }
  }, []);

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
                Logged in as <span className="font-semibold">{personalInfo?.name || user.name}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-white/20 text-white border-white/30 font-medium">
                  Role: {dashboardConfig.displayName}
                </Badge>
                {(personalInfo?.department || user.department) && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {personalInfo?.department || user.department}
                  </Badge>
                )}
                {personalInfo?.designation && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {personalInfo.designation}
                  </Badge>
                )}
                {personalInfo?.employeeId && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    ID: {personalInfo.employeeId}
                  </Badge>
                )}
                {user.branch && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {user.branch}
                  </Badge>
                )}
              </div>
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
    </div>
  );
};
