import { DashboardLayout } from "@/components/DashboardLayout";
import { DocumentTracker } from "@/components/DocumentTracker";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const TrackDocuments = () => {
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
    return null; // This should be handled by ProtectedRoute, but adding as safety
  }

  return (
    <DashboardLayout userRole={user.role} onLogout={handleLogout}>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Track Documents</h1>
          <p className="text-muted-foreground">Monitor the status and progress of your submitted documents</p>
        </div>

        <div className="space-y-6">
          <DocumentTracker userRole={user.role} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrackDocuments;
