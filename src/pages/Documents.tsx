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
    
    // Create tracking card data
    const trackingCard = {
      id: `DOC-${Date.now()}`,
      title: data.title,
      type: data.documentTypes[0]?.charAt(0).toUpperCase() + data.documentTypes[0]?.slice(1) || 'Document',
      submittedBy: user?.fullName || 'Current User',
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      priority: data.priority === 'normal' ? 'Normal Priority' : 
               data.priority === 'medium' ? 'Medium Priority' :
               data.priority === 'high' ? 'High Priority' : 'Urgent Priority',
      workflow: {
        currentStep: 'Submission',
        progress: 25,
        steps: [
          { name: 'Submission', status: 'completed', assignee: user?.fullName || 'Current User', completedDate: new Date().toISOString().split('T')[0] },
          { name: 'HOD Review', status: 'pending', assignee: 'Department Head' },
          { name: 'Registrar Review', status: 'pending', assignee: 'Registrar' },
          { name: 'Principal Approval', status: 'pending', assignee: 'Principal' },
        ]
      },
      requiresSignature: true,
      signedBy: [],
      description: data.description,
      recipients: data.recipients,
      files: data.files.map((file: File) => file.name),
      assignments: data.assignments,
      comments: []
    };
    
    // Save to localStorage for tracking
    const existingCards = JSON.parse(localStorage.getItem('submitted-documents') || '[]');
    existingCards.unshift(trackingCard);
    localStorage.setItem('submitted-documents', JSON.stringify(existingCards));
    
    toast({
      title: "Document Submitted",
      description: "Your document has been submitted for review and is now being tracked.",
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