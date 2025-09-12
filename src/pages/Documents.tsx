import { DashboardLayout } from "@/components/DashboardLayout";
import { DocumentUploader } from "@/components/DocumentUploader";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Documents = () => {
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

  const handleDocumentSubmit = (data: any) => {
    console.log("Document submitted:", data);
    toast({
      title: "Document Submitted",
      description: "Your document has been submitted for review.",
    });
  };

  return (
    <DashboardLayout userRole={user.role} onLogout={handleLogout}>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Document Management</h1>
          <p className="text-muted-foreground">Submit your permission reports, letters, and circulars</p>
        </div>

        <div className="space-y-6">
          <DocumentUploader userRole={user.role} onSubmit={handleDocumentSubmit} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Documents;