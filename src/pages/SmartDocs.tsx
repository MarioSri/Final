import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import SmartDocsEditor from '@/components/SmartDocsEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SmartDocs: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout userRole={user.role} onLogout={handleLogout}>
      <div className="h-[calc(100vh-4rem)]">
        <SmartDocsEditor />
      </div>
    </DashboardLayout>
  );
};

export default SmartDocs;
