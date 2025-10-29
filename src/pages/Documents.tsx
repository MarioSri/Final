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

  const handleDocumentSubmit = async (data: any) => {
    console.log("Document submitted:", data);
    
    // Load user profile from Personal Information
    const userProfile = JSON.parse(localStorage.getItem('user-profile') || '{}');
    const currentUserName = userProfile.name || user?.fullName || user?.name || 'User';
    const currentUserDept = userProfile.department || user?.department || 'Department';
    const currentUserDesignation = userProfile.designation || user?.role || 'Employee';
    
    // Convert files to base64 for localStorage storage
    const convertFilesToBase64 = async (files: File[]) => {
      const filePromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              data: reader.result // base64 data URL
            });
          };
          reader.readAsDataURL(file);
        });
      });
      return Promise.all(filePromises);
    };
    
    // Serialize uploaded files
    const serializedFiles = data.files && data.files.length > 0 
      ? await convertFilesToBase64(data.files)
      : [];
    
    // Map recipient IDs to names for workflow steps
    const getRecipientName = (recipientId: string) => {
      const recipientMap: { [key: string]: string } = {
        'principal-dr-robert-principal': 'Dr. Robert Smith',
        'registrar-prof-sarah-registrar': 'Prof. Sarah Registrar',
        'hod-dr-cse-hod-cse': 'Dr. Michael Chen',
        'hod-dr-eee-hod-eee': 'Dr. Mohammed Ali',
        'hod-dr-mech-hod-mech': 'Dr. MECH HOD',
        'hod-dr-ece-hod-ece': 'Dr. ECE HOD',
        'program-department-head-prof-cse-head-cse': 'Prof. CSE Head',
        'program-department-head-prof-eee-head-eee': 'Prof. EEE Head',
        'dean-dr-maria-dean': 'Dr. Maria Garcia',
        'controller-of-examinations-dr-robert-controller': 'Dr. Robert Controller'
      };
      return recipientMap[recipientId] || recipientId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    // Create workflow steps based on selected recipients
    const workflowSteps = [
      { name: 'Submission', status: 'completed', assignee: currentUserName, completedDate: new Date().toISOString().split('T')[0] }
    ];
    
    // Add recipient-based workflow steps in sequence
    data.recipients.forEach((recipientId: string, index: number) => {
      const recipientName = getRecipientName(recipientId);
      const stepName = recipientId.includes('hod') ? 'HOD Review' :
                      recipientId.includes('principal') ? 'Principal Approval' :
                      recipientId.includes('registrar') ? 'Registrar Review' :
                      recipientId.includes('dean') ? 'Dean Review' :
                      recipientId.includes('controller') ? 'Controller Review' :
                      'Department Review';
      
      workflowSteps.push({
        name: stepName,
        status: index === 0 ? 'current' : 'pending',
        assignee: recipientName,
        recipientId: recipientId
      });
    });
    
    // Create tracking card data
    const trackingCard = {
      id: `DOC-${Date.now()}`,
      title: data.title,
      type: data.documentTypes[0]?.charAt(0).toUpperCase() + data.documentTypes[0]?.slice(1) || 'Document',
      submittedBy: currentUserName,
      submittedByDepartment: currentUserDept,
      submittedByDesignation: currentUserDesignation,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      priority: data.priority === 'normal' ? 'Normal Priority' : 
               data.priority === 'medium' ? 'Medium Priority' :
               data.priority === 'high' ? 'High Priority' : 'Urgent Priority',
      workflow: {
        currentStep: workflowSteps.length > 1 ? workflowSteps[1].name : 'Complete',
        progress: 0,
        steps: workflowSteps,
        recipients: data.recipients
      },
      requiresSignature: true,
      signedBy: [],
      description: data.description,
      files: serializedFiles, // Store base64 serialized files for preview
      assignments: data.assignments,
      comments: []
    };
    
    // Save to localStorage for tracking
    const existingCards = JSON.parse(localStorage.getItem('submitted-documents') || '[]');
    existingCards.unshift(trackingCard);
    localStorage.setItem('submitted-documents', JSON.stringify(existingCards));
    
    // Create approval card for Approval Center
    const approvalCard = {
      id: trackingCard.id,
      title: data.title,
      type: data.documentTypes[0]?.charAt(0).toUpperCase() + data.documentTypes[0]?.slice(1) || 'Document',
      submitter: currentUserName,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      priority: data.priority,
      description: data.description,
      recipients: data.recipients.map((id: string) => getRecipientName(id))
    };
    
    // Save to localStorage for approvals
    const existingApprovals = JSON.parse(localStorage.getItem('pending-approvals') || '[]');
    existingApprovals.unshift(approvalCard);
    localStorage.setItem('pending-approvals', JSON.stringify(existingApprovals));
    
    // Create channel for document collaboration
    const channelName = `${data.title.substring(0, 30)}${data.title.length > 30 ? '...' : ''}`;
    const newChannel = {
      id: `doc-${trackingCard.id}`,
      name: channelName,
      members: [user?.id, ...data.recipients],
      isPrivate: true,
      createdAt: new Date().toISOString(),
      createdBy: user?.id,
      documentId: trackingCard.id,
      documentTitle: data.title
    };
    
    // Save channel to localStorage
    const existingChannels = JSON.parse(localStorage.getItem('document-channels') || '[]');
    existingChannels.unshift(newChannel);
    localStorage.setItem('document-channels', JSON.stringify(existingChannels));
    
    toast({
      title: "Document Submitted",
      description: `Your document has been submitted to ${data.recipients.length} recipient(s) and is now being tracked. A collaboration channel has been created.`,
    });
  };

  return (
    <DashboardLayout userRole={user.role} onLogout={handleLogout}>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Document Management</h1>
          <p className="text-muted-foreground">Submit Your Permission Reports, Letters, and Circulars</p>
        </div>

        <div className="space-y-6">
          <DocumentUploader userRole={user.role} onSubmit={handleDocumentSubmit} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Documents;