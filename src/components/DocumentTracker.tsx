import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye, 
  Download, 
  MessageSquare,
  Calendar,
  User,
  PenTool,
  Signature,
  Shield,
  FileClock
} from "lucide-react";
import { DigitalSignature } from "./DigitalSignature";
import { useToast } from "@/hooks/use-toast";

interface DocumentTrackerProps {
  userRole: string;
}

interface Document {
  id: string;
  title: string;
  type: 'Letter' | 'Circular' | 'Report';
  submittedBy: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  workflow: {
    currentStep: string;
    progress: number;
    steps: Array<{
      name: string;
      status: 'completed' | 'current' | 'pending';
      assignee: string;
      completedDate?: string;
    }>;
  };
  requiresSignature: boolean;
  signedBy?: string[];
  comments?: Array<{
    author: string;
    date: string;
    message: string;
  }>;
}

const mockDocuments: Document[] = [
  {
    id: 'DOC-001',
    title: 'Faculty Meeting Minutes - Q4 2024',
    type: 'Report',
    submittedBy: 'Dr. Sarah Johnson',
    submittedDate: '2024-01-15',
    status: 'pending',
    priority: 'High Priority',
    workflow: {
      currentStep: 'Principal Approval',
      progress: 75,
      steps: [
        { name: 'Submission', status: 'completed', assignee: 'Dr. Sarah Johnson', completedDate: '2024-01-15' },
        { name: 'HOD Review', status: 'completed', assignee: 'Prof. Michael Chen', completedDate: '2024-01-16' },
        { name: 'Registrar Review', status: 'completed', assignee: 'Ms. Lisa Wang', completedDate: '2024-01-17' },
        { name: 'Principal Approval', status: 'current', assignee: 'Dr. Robert Smith' },
      ]
    },
    requiresSignature: true,
    signedBy: ['Prof. Michael Chen', 'Ms. Lisa Wang'],
    comments: [
      { author: 'Prof. Michael Chen', date: '2024-01-16', message: 'Minutes look comprehensive. Approved for next level.' },
      { author: 'Ms. Lisa Wang', date: '2024-01-18', message: 'Minutes are well-structured. Suggest adding attendance details for completeness.' }
    ]
  },
  {
    id: 'DOC-002',
    title: 'New Course Proposal - Data Science',
    type: 'Circular',
    submittedBy: 'Dr. Emily Davis',
    submittedDate: '2024-01-14',
    status: 'approved',
    priority: 'Urgent Priority',
    workflow: {
      currentStep: 'Complete',
      progress: 100,
      steps: [
        { name: 'Submission', status: 'completed', assignee: 'Dr. Emily Davis', completedDate: '2024-01-14' },
        { name: 'Department Review', status: 'completed', assignee: 'Prof. James Wilson', completedDate: '2024-01-15' },
        { name: 'Academic Committee', status: 'completed', assignee: 'Dr. Maria Garcia', completedDate: '2024-01-16' },
        { name: 'Principal Approval', status: 'completed', assignee: 'Dr. Robert Smith', completedDate: '2024-01-17' },
      ]
    },
    requiresSignature: true,
    signedBy: ['Prof. James Wilson', 'Dr. Maria Garcia', 'Dr. Robert Smith'],
    comments: [
      { author: 'Prof. James Wilson', date: '2024-01-15', message: 'Please attach vendor quotations for the requested equipment to justify costs.' },
      { author: 'Dr. Maria Garcia', date: '2024-01-18', message: 'Follow-up tasks should include timelines for each item discussed.' },
      { author: 'Dr. Robert Smith', date: '2024-01-15', message: 'Ensure the proposed purchase aligns with the department\'s annual procurement plan.' }
    ]
  },
  {
    id: 'DOC-003',
    title: 'Budget Request - Lab Equipment',
    type: 'Letter',
    submittedBy: 'Prof. David Brown',
    submittedDate: '2024-01-13',
    status: 'rejected',
    priority: 'Medium Priority',
    workflow: {
      currentStep: 'Rejected',
      progress: 50,
      steps: [
        { name: 'Submission', status: 'completed', assignee: 'Prof. David Brown', completedDate: '2024-01-13' },
        { name: 'Finance Review', status: 'completed', assignee: 'Ms. Jennifer Lee', completedDate: '2024-01-14' },
        { name: 'Principal Review', status: 'completed', assignee: 'Dr. Robert Smith', completedDate: '2024-01-15' },
      ]
    },
    requiresSignature: true,
    signedBy: ['Ms. Jennifer Lee'],
    comments: [
      { author: 'Ms. Jennifer Lee', date: '2024-01-14', message: 'Budget allocation exceeded. Please revise and resubmit with detailed justification.' },
      { author: 'Dr. Robert Smith', date: '2024-01-15', message: 'Consider phasing the purchase over two quarters to stay within the current budget.' }
    ]
  }
];

export const DocumentTracker: React.FC<DocumentTrackerProps> = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [comment, setComment] = useState('');
  const { toast } = useToast();

  const getStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in-review': return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string): "success" | "warning" | "default" | "destructive" => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      case 'pending': return 'warning';
      case 'in-review': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
      case 'urgent priority':
      case 'Urgent Priority': return 'text-red-600 font-bold';
      case 'high':
      case 'high priority':
      case 'High Priority': return 'text-orange-600 font-semibold';
      case 'medium':
      case 'medium priority':
      case 'Medium Priority': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleApprove = (docId: string) => {
    if (selectedDocument?.requiresSignature) {
      setShowSignatureDialog(true);
    } else {
      toast({
        title: "Document Approved",
        description: `Document ${docId} has been approved`,
      });
    }
  };

  const handleReject = (docId: string) => {
    toast({
      title: "Document Rejected",
      description: `Document ${docId} has been rejected`,
      variant: "destructive"
    });
  };

  const handleSignatureCapture = (signatureData: string) => {
    toast({
      title: "Signature Captured",
      description: "Digital signature has been applied to the document",
    });
    setShowSignatureDialog(false);
  };



  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Document Tracking & Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents by title or submitter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    All Status
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value="in-review">
                  <div className="flex items-center gap-2">
                    <FileClock className="h-4 w-4 text-blue-600" />
                    In Review
                  </div>
                </SelectItem>
                <SelectItem value="approved">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Approved
                  </div>
                </SelectItem>
                <SelectItem value="rejected">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Rejected
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
                <SelectItem value="Circular">Circular</SelectItem>
                <SelectItem value="Report">Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      <div className="space-y-4">
        {filteredDocuments.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Document Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{document.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {document.type}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {document.submittedBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {document.submittedDate}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(document.status)}
                      <Badge variant={getStatusBadge(document.status)}>
                        {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(document.priority)}>
                        {document.priority.charAt(0).toUpperCase() + document.priority.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {/* Workflow Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Workflow Progress</span>
                      <span>{document.workflow.progress}%</span>
                    </div>
                    <Progress value={document.workflow.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Current Step: {document.workflow.currentStep}
                    </p>
                  </div>

                  {/* Workflow Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    {document.workflow.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {step.status === 'current' && <Clock className="h-4 w-4 text-blue-600" />}
                        {step.status === 'pending' && <div className="h-4 w-4 rounded-full border border-gray-300" />}
                        <div>
                          <div className={`${step.status === 'current' ? 'font-semibold' : ''}`}>
                            {step.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{step.assignee}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Signature Status */}
                  {document.requiresSignature && (
                    <div className="flex items-center gap-2 text-sm">
                      <Signature className="h-4 w-4" />
                      <span>Digital Signature Required</span>
                      {document.signedBy && (
                        <Badge variant="outline">
                          Signed by {document.signedBy.length} Recipients
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Comments */}
                  {document.comments && document.comments.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">Comments</span>
                      </div>
                      {document.comments.map((comment, index) => (
                        <div key={index} className="bg-muted p-3 rounded text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{comment.author}</span>
                            <span className="text-muted-foreground">{comment.date}</span>
                          </div>
                          <p>{comment.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 min-w-[150px]">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400">
                    <Shield className="h-4 w-4 mr-2" />
                    Approval Chain with Bypass
                  </Button>
                  
                  {userRole === 'Principal' || userRole === 'Registrar' || userRole === 'HOD' ? (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedDocument(document)}
                            disabled={document.status === 'approved' || document.status === 'rejected'}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Review & Approve Document</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label>Document</Label>
                                <p>{document.title}</p>
                              </div>
                              <div>
                                <Label>Type</Label>
                                <p>{document.type}</p>
                              </div>
                              <div>
                                <Label>Submitted By</Label>
                                <p>{document.submittedBy}</p>
                              </div>
                              <div>
                                <Label>Date</Label>
                                <p>{document.submittedDate}</p>
                              </div>
                            </div>

                            {document.requiresSignature && (
                              <div>
                                <Label className="text-base font-semibold">Digital Signature Required</Label>
                                <DigitalSignature 
                                  userRole={userRole}
                                  userName="Current User"
                                  onSignatureCapture={handleSignatureCapture}
                                />
                              </div>
                            )}

                            <div>
                              <Label htmlFor="comment">Add Comment (Optional)</Label>
                              <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add your review comments here..."
                                className="mt-2"
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="outline" 
                                onClick={() => handleReject(document.id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button onClick={() => handleApprove(document.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
              <p className="text-muted-foreground">
                No documents match your current search and filter criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>


    </div>
  );
};