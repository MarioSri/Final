import { DashboardLayout } from "@/components/DashboardLayout";
import { AdvancedDigitalSignature } from "@/components/AdvancedDigitalSignature";
import { LiveMeetingRequestModal } from "@/components/LiveMeetingRequestModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, FileText, User, Calendar, MessageSquare, Video, Eye, ChevronRight, CircleAlert, Undo2, SquarePen, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Approvals = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showLiveMeetingModal, setShowLiveMeetingModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({ id: '', type: 'letter', title: '' });
  const [comments, setComments] = useState<{[key: string]: string[]}>({});
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  
  useEffect(() => {
    const savedInputs = JSON.parse(localStorage.getItem('comment-inputs') || '{}');
    setCommentInputs(savedInputs);
    
    const savedComments = JSON.parse(localStorage.getItem('approval-comments') || '{}');
    setComments(savedComments);
  }, []);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const handleAddComment = (cardId: string) => {
    const comment = commentInputs[cardId]?.trim();
    if (comment) {
      const newComment = {
        author: user?.fullName || user?.name || 'Reviewer',
        date: new Date().toISOString().split('T')[0],
        message: comment
      };
      
      // Save to localStorage for Track Documents
      const existingComments = JSON.parse(localStorage.getItem('document-comments') || '{}');
      existingComments[cardId] = [...(existingComments[cardId] || []), newComment];
      localStorage.setItem('document-comments', JSON.stringify(existingComments));
      
      const newComments = {
        ...comments,
        [cardId]: [...(comments[cardId] || []), comment]
      };
      setComments(newComments);
      
      // Save comments to localStorage for persistence
      localStorage.setItem('approval-comments', JSON.stringify(newComments));
      
      // Clear input field after submission
      const clearedInputs = { ...commentInputs, [cardId]: '' };
      setCommentInputs(clearedInputs);
      localStorage.setItem('comment-inputs', JSON.stringify(clearedInputs));
    }
  };

  const handleUndoComment = (cardId: string, index: number) => {
    // Remove from comments state
    const newComments = {
      ...comments,
      [cardId]: comments[cardId]?.filter((_, i) => i !== index) || []
    };
    setComments(newComments);
    
    // Save updated comments to localStorage
    localStorage.setItem('approval-comments', JSON.stringify(newComments));
    
    // Remove from localStorage comments for Track Documents
    const existingComments = JSON.parse(localStorage.getItem('document-comments') || '{}');
    if (existingComments[cardId]) {
      existingComments[cardId] = existingComments[cardId].filter((_: any, i: number) => i !== index);
      localStorage.setItem('document-comments', JSON.stringify(existingComments));
    }
    
    // Trigger real-time update for Track Documents
    window.dispatchEvent(new CustomEvent('approval-comments-changed'));
  };

  const handleEditComment = (cardId: string, index: number) => {
    const comment = comments[cardId]?.[index];
    if (comment) {
      const newInputs = { ...commentInputs, [cardId]: comment };
      setCommentInputs(newInputs);
      localStorage.setItem('comment-inputs', JSON.stringify(newInputs));
      handleUndoComment(cardId, index);
      
      // Trigger real-time update for Track Documents
      window.dispatchEvent(new CustomEvent('approval-comments-changed'));
    }
  };

  if (!user) {
    return null; // This should be handled by ProtectedRoute, but adding as safety
  }

  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  
  useEffect(() => {
    const loadPendingApprovals = () => {
      const stored = JSON.parse(localStorage.getItem('pending-approvals') || '[]');
      setPendingApprovals(stored);
    };
    loadPendingApprovals();
    
    const handleStorageChange = () => loadPendingApprovals();
    
    // Listen for document removal from Track Documents
    const handleDocumentRemoval = (event: any) => {
      const { docId } = event.detail;
      setPendingApprovals(prev => prev.filter(doc => doc.id !== docId));
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('document-removed', handleDocumentRemoval);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('document-removed', handleDocumentRemoval);
    };
  }, []);

  const recentApprovals = [
    {
      id: 10,
      title: "Academic Standards Review Report",
      type: "Letter",
      submitter: "Prof. Jessica Chen",
      submittedDate: "2024-01-18",
      status: "approved",
      priority: "normal",
      approvedBy: "Principal",
      approvedDate: "2024-01-19",
      description: "Comprehensive review of academic standards and quality assurance measures across all departments",
      comment: "Academic standards review approved. Implementation timeline is realistic and quality metrics are well-defined."
    },
    {
      id: 9,
      title: "Infrastructure Upgrade Request",
      type: "Proposal",
      submitter: "IT Department",
      submittedDate: "2024-01-16",
      status: "approved",
      priority: "high",
      approvedBy: "Principal",
      approvedDate: "2024-01-17",
      description: "Request for upgrading campus network infrastructure and server capacity to support increased digital learning initiatives",
      comment: "Critical infrastructure upgrade approved. The proposed timeline and phased implementation approach will minimize disruption to ongoing activities. Budget allocation confirmed from IT modernization fund."
    },
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
      description: "Application for NSF research funding for AI in education project",
      comment: "Excellent proposal with clear objectives and realistic timeline. The budget allocation is well-justified and the expected outcomes align with institutional goals."
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
      description: "Permission request for annual tech symposium with external speakers",
      comment: "Please provide detailed speaker profiles, venue safety certificates, and revised budget breakdown before resubmission."
    },
    {
      id: 8,
      title: "Course Curriculum Update",
      type: "Circular",
      submitter: "Dr. Emily Chen",
      submittedDate: "2024-01-08",
      status: "approved",
      priority: "normal",
      approvedBy: "Academic Committee",
      approvedDate: "2024-01-10",
      description: "Proposal to update computer science curriculum with modern AI and machine learning modules",
      comment: "Well-structured curriculum update that addresses current industry needs. Implementation timeline is reasonable and faculty training plan is comprehensive."
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
                  <p className="text-2xl font-bold">{pendingApprovals.length + 3}</p>
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
                  {/* Dynamic Submitted Documents */}
                  {pendingApprovals.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                  {doc.title}
                                </h3>
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
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <Badge variant="warning">Pending</Badge>
                                <Badge variant="outline" className={`${
                                  doc.priority === 'high' ? 'text-orange-600 font-semibold' :
                                  doc.priority === 'medium' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`}>
                                  {doc.priority === 'high' ? 'High Priority' :
                                   doc.priority === 'medium' ? 'Medium Priority' :
                                   'Normal Priority'}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm font-medium">Description</span>
                              </div>
                              <div className="bg-muted p-3 rounded text-sm">
                                <p>{doc.description}</p>
                              </div>
                            </div>
                            
                            {comments[doc.id]?.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="text-sm font-medium">Your Comments</span>
                                </div>
                                <div className="space-y-2">
                                  {comments[doc.id].map((comment, index) => (
                                    <div key={index} className="bg-muted p-3 rounded-lg text-sm flex justify-between items-start">
                                      <p className="flex-1">{comment}</p>
                                      <div className="flex gap-1 ml-2">
                                        <button 
                                          className="px-4 py-2 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                          onClick={() => handleEditComment(doc.id, index)}
                                          title="Edit"
                                        >
                                          <SquarePen className="h-4 w-4 text-gray-600" />
                                        </button>
                                        <button 
                                          className="px-4 py-2 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                          onClick={() => handleUndoComment(doc.id, index)}
                                          title="Undo"
                                        >
                                          <Undo2 className="h-4 w-4 text-gray-600" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {!comments[doc.id]?.length && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm font-medium">Your Comments</span>
                              </div>
                            )}
                            
                            <div className="flex items-start border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors bg-white">
                              <textarea
                                className="flex-1 min-h-[40px] p-3 border-0 rounded-l-lg resize-none text-sm focus:outline-none bg-white"
                                placeholder="Add your comment..."
                                rows={1}
                                style={{ resize: 'none' }}
                                value={commentInputs[doc.id] || ''}
                                onChange={(e) => {
                                const newInputs = { ...commentInputs, [doc.id]: e.target.value };
                                setCommentInputs(newInputs);
                                localStorage.setItem('comment-inputs', JSON.stringify(newInputs));
                              }}
                                onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = target.scrollHeight + 'px';
                                }}
                              />
                              <button 
                                className="px-4 py-2 bg-gray-200 rounded-full m-2 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                title="Save comment"
                                onClick={() => handleAddComment(doc.id)}
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
                              onClick={() => {
                                setSelectedDocument({ id: doc.id, type: doc.type.toLowerCase(), title: doc.title });
                                setShowLiveMeetingModal(true);
                              }}
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
                  ))}
                  
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
                          
                          {/* Your Comments */}
                          {comments['faculty-meeting']?.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm font-medium">Your Comments</span>
                              </div>
                              <div className="space-y-2">
                                {comments['faculty-meeting'].map((comment, index) => (
                                  <div key={index} className="bg-muted p-3 rounded-lg text-sm flex justify-between items-start">
                                    <p className="flex-1">{comment}</p>
                                    <div className="flex gap-1 ml-2">
                                      <button 
                                        className="px-4 py-2 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                        onClick={() => handleEditComment('faculty-meeting', index)}
                                        title="Edit"
                                      >
                                        <SquarePen className="h-4 w-4 text-gray-600" />
                                      </button>
                                      <button 
                                        className="px-4 py-2 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                        onClick={() => handleUndoComment('faculty-meeting', index)}
                                        title="Undo"
                                      >
                                        <Undo2 className="h-4 w-4 text-gray-600" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Your Comments Header - only when no comments exist */}
                          {!comments['faculty-meeting']?.length && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm font-medium">Your Comments</span>
                            </div>
                          )}
                          
                          {/* Input Field */}
                          <div className="flex items-start border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors bg-white">
                            <textarea
                              className="flex-1 min-h-[40px] p-3 border-0 rounded-l-lg resize-none text-sm focus:outline-none bg-white"
                              placeholder="Add your comment..."
                              rows={1}
                              style={{ resize: 'none' }}
                              value={commentInputs['faculty-meeting'] || ''}
                              onChange={(e) => {
                                const newInputs = { ...commentInputs, 'faculty-meeting': e.target.value };
                                setCommentInputs(newInputs);
                                localStorage.setItem('comment-inputs', JSON.stringify(newInputs));
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                            <button 
                              className="px-4 py-2 bg-gray-200 rounded-full m-2 flex items-center justify-center hover:bg-gray-300 transition-colors"
                              title="Save comment"
                              onClick={() => handleAddComment('faculty-meeting')}
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
                            onClick={() => {
                              setSelectedDocument({ id: 'faculty-meeting', type: 'circular', title: 'Faculty Meeting Minutes – Q4 2024' });
                              setShowLiveMeetingModal(true);
                            }}
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
                          
                          {/* Your Comments */}
                          {comments['budget-request']?.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm font-medium">Your Comments</span>
                              </div>
                              <div className="space-y-2">
                                {comments['budget-request'].map((comment, index) => (
                                  <div key={index} className="bg-muted p-3 rounded-lg text-sm flex justify-between items-start">
                                    <p className="flex-1">{comment}</p>
                                    <div className="flex gap-1 ml-2">
                                      <button 
                                        className="px-4 py-2 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                        onClick={() => handleEditComment('budget-request', index)}
                                        title="Edit"
                                      >
                                        <SquarePen className="h-4 w-4 text-gray-600" />
                                      </button>
                                      <button 
                                        className="px-4 py-2 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                        onClick={() => handleUndoComment('budget-request', index)}
                                        title="Undo"
                                      >
                                        <Undo2 className="h-4 w-4 text-gray-600" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Your Comments Header - only when no comments exist */}
                          {!comments['budget-request']?.length && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm font-medium">Your Comments</span>
                            </div>
                          )}
                          
                          {/* Input Field */}
                          <div className="flex items-start border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors bg-white">
                            <textarea
                              className="flex-1 min-h-[40px] p-3 border-0 rounded-l-lg resize-none text-sm focus:outline-none bg-white"
                              placeholder="Add your comment..."
                              rows={1}
                              style={{ resize: 'none' }}
                              value={commentInputs['budget-request'] || ''}
                              onChange={(e) => {
                                const newInputs = { ...commentInputs, 'budget-request': e.target.value };
                                setCommentInputs(newInputs);
                                localStorage.setItem('comment-inputs', JSON.stringify(newInputs));
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                            <button 
                              className="px-4 py-2 bg-gray-200 rounded-full m-2 flex items-center justify-center hover:bg-gray-300 transition-colors"
                              title="Save comment"
                              onClick={() => handleAddComment('budget-request')}
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
                            onClick={() => {
                              setSelectedDocument({ id: 'budget-request', type: 'letter', title: 'Budget Request – Lab Equipment' });
                              setShowLiveMeetingModal(true);
                            }}
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

                  {/* Student Event Proposal Card */}
                  <Card className="hover:shadow-md transition-shadow border-destructive bg-red-50 animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                Student Event Proposal – Tech Fest 2024
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  EMERGENCY
                                </Badge>
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  Circular
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  Dr. Emily Davis
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  2024-01-14
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-yellow-600" />
                              <Badge variant="warning">Pending</Badge>
                              <Badge variant="outline" className="text-yellow-600">Medium Priority</Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm font-medium">Description</span>
                            </div>
                            <div className="bg-muted p-3 rounded text-sm">
                              <p>Annual technology festival proposal including budget allocation, venue requirements, and guest speaker arrangements.</p>
                            </div>
                          </div>
                          
                          {comments['student-event']?.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm font-medium">Your Comments</span>
                              </div>
                              <div className="space-y-2">
                                {comments['student-event'].map((comment, index) => (
                                  <div key={index} className="bg-muted p-3 rounded-lg text-sm flex justify-between items-start">
                                    <p className="flex-1">{comment}</p>
                                    <div className="flex gap-1 ml-2">
                                      <button 
                                        className="px-4 py-2 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                        onClick={() => handleEditComment('student-event', index)}
                                        title="Edit"
                                      >
                                        <SquarePen className="h-4 w-4 text-gray-600" />
                                      </button>
                                      <button 
                                        className="px-4 py-2 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                        onClick={() => handleUndoComment('student-event', index)}
                                        title="Undo"
                                      >
                                        <Undo2 className="h-4 w-4 text-gray-600" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {!comments['student-event']?.length && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm font-medium">Your Comments</span>
                            </div>
                          )}
                          
                          <div className="flex items-start border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors bg-white">
                            <textarea
                              className="flex-1 min-h-[40px] p-3 border-0 rounded-l-lg resize-none text-sm focus:outline-none bg-white"
                              placeholder="Add your comment..."
                              rows={1}
                              style={{ resize: 'none' }}
                              value={commentInputs['student-event'] || ''}
                              onChange={(e) => {
                                const newInputs = { ...commentInputs, 'student-event': e.target.value };
                                setCommentInputs(newInputs);
                                localStorage.setItem('comment-inputs', JSON.stringify(newInputs));
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                            <button 
                              className="px-4 py-2 bg-gray-200 rounded-full m-2 flex items-center justify-center hover:bg-gray-300 transition-colors"
                              title="Save comment"
                              onClick={() => handleAddComment('student-event')}
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
                            onClick={() => {
                              setSelectedDocument({ id: 'student-event', type: 'circular', title: 'Student Event Proposal – Tech Fest 2024' });
                              setShowLiveMeetingModal(true);
                            }}
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

                  {/* Demo Card - Pending Approvals */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                Research Methodology Guidelines – Academic Review
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  Report
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  Prof. Jessica Chen
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  2024-01-20
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-yellow-600" />
                              <Badge variant="warning">Pending</Badge>
                              <Badge variant="outline" className="text-blue-600">Normal Priority</Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm font-medium">Description</span>
                            </div>
                            <div className="bg-muted p-3 rounded text-sm">
                              <p>Comprehensive guidelines for research methodology standards and academic review processes.</p>
                            </div>
                          </div>
                          
                          {comments['research-methodology']?.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm font-medium">Your Comments</span>
                              </div>
                              <div className="space-y-2">
                                {comments['research-methodology'].map((comment, index) => (
                                  <div key={index} className="bg-muted p-3 rounded-lg text-sm flex justify-between items-start">
                                    <p className="flex-1">{comment}</p>
                                    <div className="flex gap-1 ml-2">
                                      <button 
                                        className="px-4 py-2 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                        onClick={() => handleEditComment('research-methodology', index)}
                                        title="Edit"
                                      >
                                        <SquarePen className="h-4 w-4 text-gray-600" />
                                      </button>
                                      <button 
                                        className="px-4 py-2 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                                        onClick={() => handleUndoComment('research-methodology', index)}
                                        title="Undo"
                                      >
                                        <Undo2 className="h-4 w-4 text-gray-600" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {!comments['research-methodology']?.length && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm font-medium">Your Comments</span>
                            </div>
                          )}
                          
                          <div className="flex items-start border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors bg-white">
                            <textarea
                              className="flex-1 min-h-[40px] p-3 border-0 rounded-l-lg resize-none text-sm focus:outline-none bg-white"
                              placeholder="Add your comment..."
                              rows={1}
                              style={{ resize: 'none' }}
                              value={commentInputs['research-methodology'] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, 'research-methodology': e.target.value }))}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                            <button 
                              className="px-4 py-2 bg-gray-200 rounded-full m-2 flex items-center justify-center hover:bg-gray-300 transition-colors"
                              title="Save comment"
                              onClick={() => handleAddComment('research-methodology')}
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
                    <Card key={doc.id} className={`hover:shadow-md transition-shadow ${doc.title === 'Course Curriculum Update' ? 'border-destructive bg-red-50 animate-pulse' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                  {doc.title}
                                  {doc.title === 'Course Curriculum Update' && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      EMERGENCY
                                    </Badge>
                                  )}
                                </h3>
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
                                  doc.title === 'Course Curriculum Update' ? "text-yellow-600" :
                                  "text-blue-600"
                                }>
                                  {doc.title === 'Course Curriculum Update' ? 'Medium Priority' : 
                                   doc.priority.charAt(0).toUpperCase() + doc.priority.slice(1) + ' Priority'}
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
                            
                            {/* Your Comments */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm font-medium">Your Comments</span>
                              </div>
                              <div className="bg-muted p-3 rounded text-sm">
                                <p>{doc.comment}</p>
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
          documentId={selectedDocument.id}
          documentType={selectedDocument.type as 'letter' | 'circular' | 'report'}
          documentTitle={selectedDocument.title}
        />
      </div>
    </DashboardLayout>
  );
};

export default Approvals;