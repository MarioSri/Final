import { DashboardLayout } from "@/components/DashboardLayout";
import { AdvancedDigitalSignature } from "@/components/AdvancedDigitalSignature";
import { LiveMeetingRequestModal } from "@/components/LiveMeetingRequestModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, FileText, User, Calendar, MessageSquare, Video } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Approvals = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showLiveMeetingModal, setShowLiveMeetingModal] = useState(false);

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

  const pendingApprovals = [
    {
      id: 1,
      title: "Faculty Development Program Request",
      submitter: "Dr. Rajesh Kumar",
      department: "Computer Science",
      type: "Letter",
      submittedDate: "2024-01-15",
      priority: "medium",
      description: "Request for attending international conference on AI"
    },
    {
      id: 2,
      title: "Infrastructure Upgrade Proposal",
      submitter: "Prof. Anita Sharma", 
      department: "Electrical Engineering",
      type: "Report",
      submittedDate: "2024-01-14",
      priority: "high",
      description: "Proposal for upgrading laboratory equipment"
    },
    {
      id: 3,
      title: "Student Exchange Program Circular",
      submitter: "Dr. Mohammed Ali",
      department: "Mechanical Engineering",
      type: "Circular",
      submittedDate: "2024-01-13",
      priority: "low",
      description: "Information about new student exchange opportunities"
    }
  ];

  const recentApprovals = [
    {
      id: 4,
      title: "Research Grant Application",
      status: "approved",
      approvedBy: "Principal",
      approvedDate: "2024-01-12"
    },
    {
      id: 5,
      title: "Event Permission Request",
      status: "rejected", 
      rejectedBy: "HOD - CSE",
      rejectedDate: "2024-01-11",
      reason: "Insufficient documentation"
    }
  ];

  return (
    <DashboardLayout userRole={user.role} onLogout={handleLogout}>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Approval Center</h1>
          <p className="text-muted-foreground">Review and approve pending documents with digital signatures</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingApprovals.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-sm text-muted-foreground">Approved This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">Rejected This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="signature">Advanced Signature</TabsTrigger>
            <TabsTrigger value="history">Approval History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents Awaiting Your Approval</CardTitle>
                <CardDescription>Review and approve or reject pending documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingApprovals.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{doc.title}</h3>
                        <Badge variant={doc.priority === "high" ? "destructive" : doc.priority === "medium" ? "default" : "secondary"}>
                          {doc.priority} priority
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {doc.submitter}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {doc.department}
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline">{doc.type}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {doc.submittedDate}
                        </div>
                      </div>
                      <p className="text-sm mb-4">{doc.description}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive">
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button size="sm" variant="outline">View Document</Button>
                        {/* NEW: LiveConnect+ Button */}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                          onClick={() => setShowLiveMeetingModal(true)}
                        >
                          🔴 LiveConnect+
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signature" className="space-y-6">
            <AdvancedDigitalSignature userRole={user.role} />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Approval History</CardTitle>
                <CardDescription>View your recent approval activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentApprovals.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{doc.title}</h3>
                        <Badge variant={doc.status === "approved" ? "default" : "destructive"}>
                          {doc.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {doc.status === "approved" ? (
                          <p>Approved by {doc.approvedBy} on {doc.approvedDate}</p>
                        ) : (
                          <p>Rejected by {doc.rejectedBy} on {doc.rejectedDate} - {doc.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <LiveMeetingRequestModal
          isOpen={showLiveMeetingModal}
          onClose={() => setShowLiveMeetingModal(false)}
          documentId="approval-request"
          documentType="letter"
          documentTitle="Approval Request"
        />
      </div>
    </DashboardLayout>
  );
};

export default Approvals;