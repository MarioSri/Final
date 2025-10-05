import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecipientSelector } from "@/components/RecipientSelector";
import { 
  AlertTriangle, 
  Siren, 
  Zap, 
  Clock, 
  Users, 
  FileText, 
  Send,
  Shield,
  Bell,
  CheckCircle2,
  XCircle,
  Eye,
  History,
  Upload,
  X,
  File,
  AlertCircle,
  Settings
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface EmergencySubmission {
  id: string;
  title: string;
  description: string;
  reason: string;
  urgencyLevel: 'medium' | 'urgent' | 'high' | 'critical';
  recipients: string[];
  submittedBy: string;
  submittedAt: Date;
  status: 'submitted' | 'acknowledged' | 'resolved';
  responseTime?: number;
  escalationLevel: number;
}

interface EmergencyWorkflowInterfaceProps {
  userRole: string;
}

export const EmergencyWorkflowInterface: React.FC<EmergencyWorkflowInterfaceProps> = ({ userRole }) => {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [emergencyData, setEmergencyData] = useState({
    title: '',
    description: '',
    reason: '',
    urgencyLevel: 'medium' as const,
    documentTypes: [] as string[],
    uploadedFiles: [] as File[],
    attachments: [] as File[],
    autoEscalation: false,
    escalationTimeout: 24,
    escalationTimeUnit: 'hours' as 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months'
  });
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [documentAssignments, setDocumentAssignments] = useState<{[key: string]: string[]}>({});
  const [showRecipientSelection, setShowRecipientSelection] = useState(false);
  const [finalSelectedRecipients, setFinalSelectedRecipients] = useState<string[]>([]);
  const [useSmartDelivery, setUseSmartDelivery] = useState(false);
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencySubmission[]>([
    {
      id: '1',
      title: 'Infrastructure Damage - Block A',
      description: 'Severe water leakage affecting electrical systems in Block A',
      reason: 'Infrastructure failure requiring immediate attention',
      urgencyLevel: 'critical',
      recipients: ['principal', 'registrar', 'maintenance-head'],
      submittedBy: 'Maintenance Team',
      submittedAt: new Date('2024-01-10T08:30:00'),
      status: 'resolved',
      responseTime: 45,
      escalationLevel: 2
    },
    {
      id: '2',
      title: 'Student Medical Emergency Protocol',
      description: 'Updated emergency response procedures for medical incidents',
      reason: 'Policy update requiring immediate implementation',
      urgencyLevel: 'high',
      recipients: ['all-hods', 'health-center', 'security'],
      submittedBy: 'Health Center',
      submittedAt: new Date('2024-01-08T14:15:00'),
      status: 'acknowledged',
      responseTime: 12,
      escalationLevel: 1
    }
  ]);

  const { toast } = useToast();

  const urgencyLevels = {
    medium: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Clock,
      description: ''
    },
    urgent: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertTriangle,
      description: ''
    },
    high: {
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: AlertTriangle,
      description: ''
    },
    critical: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: Siren,
      description: ''
    }
  };

  const documentTypeOptions = [
    { id: "letter", label: "Letter", icon: FileText },
    { id: "circular", label: "Circular", icon: File },
    { id: "report", label: "Report", icon: FileText },
  ];

  const handleDocumentTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setEmergencyData({...emergencyData, documentTypes: [...emergencyData.documentTypes, typeId]});
    } else {
      setEmergencyData({...emergencyData, documentTypes: emergencyData.documentTypes.filter(id => id !== typeId)});
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setEmergencyData({...emergencyData, uploadedFiles: [...emergencyData.uploadedFiles, ...files]});
  };

  const removeFile = (index: number) => {
    setEmergencyData({
      ...emergencyData, 
      uploadedFiles: emergencyData.uploadedFiles.filter((_, i) => i !== index)
    });
  };

  const handleViewFile = (file: File) => {
    // Create a URL for the file and open it in a new tab for viewing
    const fileUrl = URL.createObjectURL(file);
    window.open(fileUrl, '_blank');
    
    // Cleanup the URL after a delay to free memory
    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  };

  const handleEmergencySubmit = () => {
    const recipientsToSend = useSmartDelivery && showRecipientSelection ? finalSelectedRecipients : selectedRecipients;
    
    if (!emergencyData.title || !emergencyData.description || selectedRecipients.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select recipients",
        variant: "destructive"
      });
      return;
    }

    if (useSmartDelivery && showRecipientSelection && finalSelectedRecipients.length === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one recipient from your chosen subset",
        variant: "destructive"
      });
      return;
    }

    const newSubmission: EmergencySubmission = {
      id: Date.now().toString(),
      title: emergencyData.title,
      description: emergencyData.description,
      reason: '', // No longer captured from user input
      urgencyLevel: emergencyData.urgencyLevel,
      recipients: recipientsToSend,
      submittedBy: userRole,
      submittedAt: new Date(),
      status: 'submitted',
      escalationLevel: 0
    };

    setEmergencyHistory([newSubmission, ...emergencyHistory]);
    
    // Reset form
    setEmergencyData({
      title: '',
      description: '',
      reason: '',
      urgencyLevel: 'medium',
      documentTypes: [],
      uploadedFiles: [],
      attachments: [],
      autoEscalation: false,
      escalationTimeout: 24,
      escalationTimeUnit: 'hours' as 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months'
    });
    setSelectedRecipients([]);
    setFinalSelectedRecipients([]);
    setShowRecipientSelection(false);
    setUseSmartDelivery(false);
    setIsEmergencyMode(false);

    // Simulate immediate batch notifications
    toast({
      title: "EMERGENCY SUBMITTED",
      description: `Emergency document sent immediately to ${recipientsToSend.length} recipient(s) at once`,
      duration: 10000,
    });

    // Show batch sending confirmation
    setTimeout(() => {
      toast({
        title: "Batch Delivery Confirmed",
        description: `All documents successfully delivered to ${recipientsToSend.length} recipients simultaneously`,
        variant: "default"
      });
    }, 2000);

    // Simulate escalation after delay
    setTimeout(() => {
      toast({
        title: "Emergency Escalated",
        description: "Emergency has been escalated to higher authorities",
        variant: "destructive"
      });
    }, 5000);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      submitted: { variant: "destructive" as const, text: "Submitted", icon: Siren },
      acknowledged: { variant: "warning" as const, text: "Acknowledged", icon: Eye },
      resolved: { variant: "success" as const, text: "Resolved", icon: CheckCircle2 }
    };
    return variants[status as keyof typeof variants] || { variant: "default" as const, text: status, icon: AlertTriangle };
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime <= 15) return 'text-success';
    if (responseTime <= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Emergency Header */}
      <Card className={`shadow-elegant ${isEmergencyMode ? 'border-destructive bg-red-50' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Siren className={`w-6 h-6 ${isEmergencyMode ? 'text-destructive animate-pulse' : 'text-primary'}`} />
              Emergency Workflow
            </CardTitle>
            
            <Button
              onClick={() => setIsEmergencyMode(!isEmergencyMode)}
              variant={isEmergencyMode ? "destructive" : "outline"}
              size="lg"
              className={`font-bold ${isEmergencyMode ? 'animate-pulse shadow-glow' : ''}`}
            >
              {isEmergencyMode ? (
                <>
                  <XCircle className="w-5 h-5 mr-2" />
                  Cancel Emergency
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  ACTIVATE EMERGENCY
                </>
              )}
            </Button>
          </div>
          
          {isEmergencyMode && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                <Siren className="w-5 h-5" />
                EMERGENCY MODE ACTIVE
              </div>
              <p className="text-red-700 text-sm">
                This will bypass normal approval workflows and send directly to all selected recipients.
                Use only for genuine emergencies requiring immediate attention.
              </p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Emergency Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-elegant border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Siren className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">
                  {emergencyHistory.filter(e => e.status === 'submitted').length}
                </p>
                <p className="text-sm text-muted-foreground">Active Emergencies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">
                  {emergencyHistory.length > 0 
                    ? Math.round(emergencyHistory.reduce((acc, e) => acc + (e.responseTime || 0), 0) / emergencyHistory.length)
                    : 0
                  }m
                </p>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">
                  {emergencyHistory.filter(e => e.status === 'resolved').length}
                </p>
                <p className="text-sm text-muted-foreground">Resolved This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">98.5%</p>
                <p className="text-sm text-muted-foreground">Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Submission Form */}
      {isEmergencyMode && (
        <Card className="shadow-elegant border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Emergency Document Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency-title">Emergency Title</Label>
                <Input
                  id="emergency-title"
                  value={emergencyData.title}
                  onChange={(e) => setEmergencyData({...emergencyData, title: e.target.value})}
                  placeholder="Brief emergency title"
                  className="border-destructive focus:ring-destructive"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority-level">Priority Level</Label>
                <Select
                  value={emergencyData.urgencyLevel}
                  onValueChange={(value: any) => setEmergencyData({...emergencyData, urgencyLevel: value})}
                >
                  <SelectTrigger className="border-destructive focus:ring-destructive">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <Siren className="w-4 h-4 text-red-600" />
                        Critical Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        High Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        Urgent Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        Medium Priority
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Document Management Integration */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Details
              </h3>
              
              {/* Document Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Document Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {documentTypeOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <div key={option.id} className="flex items-center space-x-2 p-3 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                        <Checkbox
                          id={option.id}
                          checked={emergencyData.documentTypes.includes(option.id)}
                          onCheckedChange={(checked) => handleDocumentTypeChange(option.id, !!checked)}
                        />
                        <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer text-red-800">
                          <IconComponent className="w-4 h-4 text-red-600" />
                          {option.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Upload Documents</Label>
                <div className="border-2 border-dashed border-red-300 bg-red-50 rounded-lg p-6">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="emergency-file-upload"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                  />
                  <label htmlFor="emergency-file-upload" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-red-700 mb-1 font-medium">
                        Drag and drop emergency files or click to upload
                      </p>
                      <p className="text-xs text-red-600">
                        PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB each)
                      </p>
                    </div>
                  </label>
                </div>

                {/* Uploaded Files Display */}
                {emergencyData.uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Files ({emergencyData.uploadedFiles.length})</Label>
                    <div className="space-y-2">
                      {emergencyData.uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-accent rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => handleViewFile(file)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment Preview */}
              {emergencyData.uploadedFiles.length > 1 && selectedRecipients.length > 1 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Document Assignment</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAssignmentModal(true)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Customize Assignment
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                    <p>Multiple files and recipients detected. You can customize which documents go to which recipients.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-Escalation Feature */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={emergencyData.autoEscalation || false}
                  onCheckedChange={(checked) => setEmergencyData({...emergencyData, autoEscalation: checked})}
                />
                <label className="text-sm font-medium">Auto-Escalation</label>
              </div>
            </div>
            
            {emergencyData.autoEscalation && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Escalation Timeout</label>
                  <Input
                    type="number"
                    value={emergencyData.escalationTimeout || 24}
                    onChange={(e) => setEmergencyData({...emergencyData, escalationTimeout: Number(e.target.value)})}
                    min={1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Time Unit</label>
                  <Select
                    value={emergencyData.escalationTimeUnit}
                    onValueChange={(value: any) => setEmergencyData({...emergencyData, escalationTimeUnit: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Seconds</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Expanded Recipient Selection */}
            <div className="space-y-4">
              <Label>Emergency Management Recipients</Label>
              <RecipientSelector
                userRole={userRole}
                selectedRecipients={selectedRecipients}
                onRecipientsChange={setSelectedRecipients}
              />
              
              {/* Smart Recipient Delivery Option */}
              {selectedRecipients.length > 1 && (
                <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={useSmartDelivery}
                        onCheckedChange={setUseSmartDelivery}
                      />
                      <Label className="text-base font-medium cursor-pointer" onClick={() => setUseSmartDelivery(!useSmartDelivery)}>
                        Use Smart Recipient Delivery Option
                      </Label>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedRecipients.length} Recipients Selected
                    </Badge>
                  </div>
                  
                  {useSmartDelivery && (
                    <>
                      <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-md">
                        <p className="font-medium mb-1">Purpose:</p>
                        <p className="mb-2">This feature allows users to control how emergency documents are distributed to multiple recipients efficiently and instantly. It ensures that documents are sent simultaneously to selected users without any delay or sequential sending.</p>
                        <p className="font-medium mb-1">User Benefit:</p>
                        <p>This feature helps users save time, ensures faster emergency communication, and allows targeted delivery of urgent documents to the right people when every second matters.</p>
                      </div>
                      <div className="space-y-3 mt-3">
                    <div className="flex items-start space-x-2">
                      <input
                        type="radio"
                        id="send-all"
                        name="recipient-option"
                        checked={!showRecipientSelection}
                        onChange={() => {
                          setShowRecipientSelection(false);
                          setFinalSelectedRecipients(selectedRecipients);
                        }}
                        className="w-4 h-4 text-blue-600 mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="send-all" className="text-sm cursor-pointer font-medium">
                          Batch Send to All Recipients ({selectedRecipients.length})
                        </Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Instantly sends documents to all {selectedRecipients.length} selected recipients simultaneously. Fast and efficient for urgent emergencies.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <input
                        type="radio"
                        id="send-subset"
                        name="recipient-option"
                        checked={showRecipientSelection}
                        onChange={() => {
                          setShowRecipientSelection(true);
                          setFinalSelectedRecipients([]);
                        }}
                        className="w-4 h-4 text-blue-600 mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="send-subset" className="text-sm cursor-pointer font-medium">
                          Selective Batch Send (Custom Recipients)
                        </Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Choose specific recipients from your selection. Documents will be sent simultaneously to only your chosen subset.
                        </p>
                      </div>
                    </div>
                      </div>
                      
                      {/* Subset Selection Interface */}
                      {showRecipientSelection && (
                        <div className="space-y-3 p-3 border rounded bg-white">
                          <Label className="text-sm font-medium">Choose Recipients for Batch Document Delivery:</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedRecipients.map((recipientId) => (
                              <div key={recipientId} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                                <Checkbox
                                  id={`final-${recipientId}`}
                                  checked={finalSelectedRecipients.includes(recipientId)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFinalSelectedRecipients(prev => [...prev, recipientId]);
                                    } else {
                                      setFinalSelectedRecipients(prev => prev.filter(id => id !== recipientId));
                                    }
                                  }}
                                />
                                <Label htmlFor={`final-${recipientId}`} className="text-sm cursor-pointer">
                                  {recipientId.replace('-', ' ').toUpperCase()}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {finalSelectedRecipients.length > 0 && (
                            <div className="text-sm text-blue-600 bg-blue-100 p-2 rounded flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Ready to batch send documents to {finalSelectedRecipients.length} selected recipient(s) simultaneously
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-description">Emergency Description / Comments</Label>
              <Textarea
                id="emergency-description"
                value={emergencyData.description}
                onChange={(e) => setEmergencyData({...emergencyData, description: e.target.value})}
                placeholder="Detailed description of the emergency situation"
                rows={4}
                className="border-destructive focus:ring-destructive"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEmergencyMode(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEmergencySubmit}
                variant="destructive"
                className="font-bold animate-pulse"
              >
                <Send className="w-4 h-4 mr-2" />
                SUBMIT EMERGENCY
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Assignment Modal */}
      <Dialog open={showAssignmentModal} onOpenChange={setShowAssignmentModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Documents to Recipients</DialogTitle>
            <DialogDescription>
              Select which documents should be sent to each recipient. By default, all documents will be sent to all recipients.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {emergencyData.uploadedFiles.map((file, fileIndex) => (
              <Card key={fileIndex}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <File className="w-4 h-4" />
                    {file.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedRecipients.map((recipientId) => (
                      <div key={recipientId} className="flex items-center space-x-2 p-2 border rounded">
                        <Checkbox
                          id={`${file.name}-${recipientId}`}
                          checked={documentAssignments[file.name]?.includes(recipientId) ?? true}
                          onCheckedChange={(checked) => {
                            setDocumentAssignments(prev => {
                              const current = prev[file.name] || [];
                              if (checked) {
                                return { ...prev, [file.name]: [...current, recipientId] };
                              } else {
                                return { ...prev, [file.name]: current.filter(id => id !== recipientId) };
                              }
                            });
                          }}
                        />
                        <Label htmlFor={`${file.name}-${recipientId}`} className="text-sm cursor-pointer">
                          {recipientId.replace('-', ' ').toUpperCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignmentModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowAssignmentModal(false);
              toast({
                title: "Assignment Saved",
                description: "Document assignments have been saved successfully.",
                variant: "default"
              });
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Contacts - Only show when not in emergency mode */}
      {!isEmergencyMode && (
        <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { role: 'Principal', name: 'Dr. Rajesh Kumar', phone: '+91-9876543210', available: true },
              { role: 'Registrar', name: 'Prof. Anita Sharma', phone: '+91-9876543211', available: true },
              { role: 'Security Head', name: 'Mr. Ramesh Singh', phone: '+91-9876543212', available: true },
              { role: 'Medical Officer', name: 'Dr. Priya Patel', phone: '+91-9876543213', available: false },
              { role: 'Maintenance Head', name: 'Mr. Suresh Kumar', phone: '+91-9876543214', available: true },
              { role: 'IT Head', name: 'Ms. Kavya Reddy', phone: '+91-9876543215', available: true }
            ].map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${contact.available ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
                  <div>
                    <h4 className="font-medium text-sm">{contact.name}</h4>
                    <p className="text-xs text-muted-foreground">{contact.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium">{contact.phone}</p>
                  <Badge 
                    variant={contact.available ? "success" : "secondary"} 
                    className="text-xs"
                  >
                    {contact.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
};