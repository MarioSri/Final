import { DashboardLayout } from "@/components/DashboardLayout";
import { AdvancedDigitalSignature } from "@/components/AdvancedDigitalSignature";
import { LiveMeetingRequestModal } from "@/components/LiveMeetingRequestModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, FileText, User, Calendar, MessageSquare, Video, Eye, ChevronRight, CircleAlert } from "lucide-react";
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

  const pendingApprovals = [];

  const recentApprovals = [
    {
      id: 6,
      title: "Research Grant Application",
      type: "Report",
      submitter: "Dr. Michael Anderson",
      submittedDate: "2024-01-10",
      status: "approved",
      priority: "high",
      approvedBy: "Principal",
      approvedDate: "2024-01-12",
      description: "Application for NSF research funding for AI in education project"
    },
    {
      id: 7,
      title: "Event Permission Request",
      type: "Letter",
      submitter: "Prof. Lisa Thompson",
      submittedDate: "2024-01-09",
      status: "rejected", 
      rejectedBy: "HOD - CSE",
      rejectedDate: "2024-01-11",
      priority: "medium",
      reason: "Insufficient documentation",
      description: "Permission request for annual tech symposium with external speakers"
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
                  {/* Faculty Meeting Minutes Card */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                Faculty Meeting Minutes – Q4 2024
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  Circular
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  Dr. Sarah Johnson
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  2024-01-15
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-yellow-600" />
                              <Badge variant="warning">Pending</Badge>
                              <Badge variant="outline" className="text-orange-600 font-semibold">High Priority</Badge>
                            </div>
                          </div>
                          
                          {/* Description */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm font-medium">Description</span>
                            </div>
                            <div className="bg-muted p-3 rounded text-sm">
                              <p>Add a risk-mitigation section to highlight potential delays or issues.</p>
                            </div>
                          </div>
                          
                          {/* Input Field */}
                          <div className="flex items-start border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors">
                            <textarea
                              className="flex-1 min-h-[40px] p-3 border-0 rounded-l-lg resize-none text-sm focus:outline-none"
                              placeholder="Add your comment..."
                              rows={1}
                              style={{ resize: 'none' }}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                            <button 
                              className="px-4 py-2 bg-gray-200 rounded-full m-2 flex items-center justify-center hover:bg-gray-300 transition-colors"
                              title="Save comment"
                            >
                              <ChevronRight className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[150px]">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-orange-500 text-orange-600 hover:bg-orange-50"
                            onClick={() => setShowLiveMeetingModal(true)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="relative w-4 h-4">
                                <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full"></div>
                                <div className="absolute inset-1 w-2 h-2 bg-red-500 rounded-full"></div>
                              </div>
                              LiveMeet+
                            </div>
                          </Button>
                          <Button variant="outline" size="sm">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm">
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Budget Request Card */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                Budget Request – Lab Equipment
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  Letter
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  Prof. David Brown
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  2024-01-13
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-yellow-600" />
                              <Badge variant="warning">Pending</Badge>
                              <Badge variant="outline" className="text-yellow-600">Medium Priority</Badge>
                            </div>
                          </div>
                          
                          {/* Description */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm font-medium">Description</span>
                            </div>
                            <div className="bg-muted p-3 rounded text-sm">
                              <p>Consider revising the scope to focus on priority items within this quarter's budget.</p>
                            </div>
                          </div>
                          
                          {/* Input Field */}
                          <div className="flex items-start border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors">
                            <textarea
                              className="flex-1 min-h-[40px] p-3 border-0 rounded-l-lg resize-none text-sm focus:outline-none"
                              placeholder="Add your comment..."
                              rows={1}
                              style={{ resize: 'none' }}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                            <button 
                              className="px-4 py-2 bg-gray-200 rounded-full m-2 flex items-center justify-center hover:bg-gray-300 transition-colors"
                              title="Save comment"
                            >
                              <ChevronRight className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[150px]">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-orange-500 text-orange-600 hover:bg-orange-50"
                            onClick={() => setShowLiveMeetingModal(true)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="relative w-4 h-4">
                                <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full"></div>
                                <div className="absolute inset-1 w-2 h-2 bg-red-500 rounded-full"></div>
                              </div>
                              LiveMeet+
                            </div>
                          </Button>
                          <Button variant="outline" size="sm">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm">
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>


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
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{doc.title}</h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    {doc.type}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {doc.submitter}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {doc.submittedDate}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc.status === "approved" ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <Badge variant="destructive">Rejected</Badge>
                                  </>
                                )}
                                <Badge variant="outline" className={
                                  doc.priority === "high" ? "text-orange-600 font-semibold" : 
                                  doc.priority === "medium" ? "text-yellow-600" : 
                                  "text-green-600"
                                }>
                                  {doc.priority.charAt(0).toUpperCase() + doc.priority.slice(1)} Priority
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Description */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm font-medium">Description</span>
                              </div>
                              <div className="bg-muted p-3 rounded text-sm">
                                <p>{doc.description}</p>
                              </div>
                            </div>
                            
                            {/* Status Information */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-medium">Status Details</span>
                              </div>
                              <div className="bg-muted p-3 rounded text-sm">
                                {doc.status === "approved" ? (
                                  <p>Approved by {doc.approvedBy} on {doc.approvedDate}</p>
                                ) : (
                                  <p>Rejected by {doc.rejectedBy} on {doc.rejectedDate} - {doc.reason}</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Comment Field for Historical Records */}
                            <div className="flex items-start border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors">
                              <textarea
                                className="flex-1 min-h-[40px] p-3 border-0 rounded-l-lg resize-none text-sm focus:outline-none"
                                placeholder="Add a note about this approval..."
                                rows={1}
                                style={{ resize: 'none' }}
                                onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = target.scrollHeight + 'px';
                                }}
                              />
                              <button 
                                className="px-4 py-2 bg-gray-200 rounded-full m-2 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                title="Save note"
                              >
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 min-w-[150px]">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            {doc.status === "approved" ? (
                              <Button variant="outline" size="sm" className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approved
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100">
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejected
                              </Button>
                            )}

                          </div>
                        </div>
                      </CardContent>
                    </Card>
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