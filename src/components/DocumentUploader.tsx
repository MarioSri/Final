import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Send,
  Eye,
  Settings
} from "lucide-react";
import { LoadingState } from "@/components/ui/loading-states";
import { RecipientSelector } from "@/components/RecipientSelector";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocumentUploaderProps {
  userRole: string;
  onSubmit: (data: any) => void;
}

export function DocumentUploader({ userRole, onSubmit }: DocumentUploaderProps) {
  const { toast } = useToast();
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [documentTitle, setDocumentTitle] = useState("");
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [documentAssignments, setDocumentAssignments] = useState<{[key: string]: string[]}>({});

  const documentTypeOptions = [
    { id: "letter", label: "Letter", icon: FileText },
    { id: "circular", label: "Circular", icon: File },
    { id: "report", label: "Report", icon: FileText },
  ];

  const handleDocumentTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setDocumentTypes([...documentTypes, typeId]);
    } else {
      setDocumentTypes(documentTypes.filter(id => id !== typeId));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleViewFile = (file: File) => {
    // Create a temporary URL for the file
    const fileUrl = URL.createObjectURL(file);
    // Open the file in a new tab
    window.open(fileUrl, '_blank');
  };

  const handleSubmit = () => {
    if (!documentTitle.trim() || documentTypes.length === 0 || uploadedFiles.length === 0 || selectedRecipients.length === 0) {
      // Provide specific feedback on what's missing
      const missing = [];
      if (!documentTitle.trim()) missing.push("Document Title");
      if (documentTypes.length === 0) missing.push("Document Type");
      if (uploadedFiles.length === 0) missing.push("Files to upload");  
      if (selectedRecipients.length === 0) missing.push("Recipients");
      
      toast({
        title: "Missing Required Fields",
        description: `Please provide: ${missing.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    submitDocuments();
  };

  const submitDocuments = () => {
    setIsUploading(true);
    
    // Simulate upload process with loading animation
    setTimeout(() => {
      const data = {
        title: documentTitle,
        documentTypes,
        files: uploadedFiles,
        recipients: selectedRecipients,
        description,
        priority,
        timestamp: new Date().toISOString(),
        assignments: documentAssignments
      };
      
      toast({
        title: "Document Submitted Successfully",
        description: `Submitted ${uploadedFiles.length} file(s) to ${selectedRecipients.length} recipient(s)`,
        variant: "default"
      });
      
      onSubmit(data);
      setIsUploading(false);
      
      // Reset form after successful submission
      setDocumentTitle("");
      setDocumentTypes([]);
      setUploadedFiles([]);
      setSelectedRecipients([]);
      setDescription("");
      setPriority("normal");
      setDocumentAssignments({});
    }, 2000);
  };

  const handleAssignmentChange = (fileName: string, recipientId: string, assigned: boolean) => {
    setDocumentAssignments(prev => {
      const current = prev[fileName] || [];
      if (assigned) {
        return { ...prev, [fileName]: [...current, recipientId] };
      } else {
        return { ...prev, [fileName]: current.filter(id => id !== recipientId) };
      }
    });
  };

  const handleAssignmentSave = () => {
    setShowAssignmentModal(false);
    toast({
      title: "Assignment Saved",
      description: "Document assignments have been saved successfully.",
      variant: "default"
    });
  };

  const isSubmitDisabled = !documentTitle.trim() || documentTypes.length === 0 || uploadedFiles.length === 0 || selectedRecipients.length === 0;

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Submit Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Title */}
          <div className="space-y-3">
            <Label htmlFor="documentTitle" className="text-base font-medium">Document Title</Label>
            <Input
              id="documentTitle"
              type="text"
              placeholder="Enter document title..."
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Document Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Document Type</Label>
            <div className="grid grid-cols-3 gap-3">
              {documentTypeOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={option.id}
                    checked={documentTypes.includes(option.id)}
                    onCheckedChange={(checked) => handleDocumentTypeChange(option.id, !!checked)}
                  />
                  <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Upload Documents</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                title="Upload document files"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG
                  </p>
                </div>
              </Label>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Uploaded Files</Label>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-accent rounded-md">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-primary" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs cursor-pointer hover:bg-primary/10"
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
            )}
          </div>

          {/* Assignment Preview */}
          {uploadedFiles.length > 1 && selectedRecipients.length > 1 && (
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

          {/* Document Management Recipients */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Document Management Recipients</Label>
            <RecipientSelector
              userRole={userRole}
              selectedRecipients={selectedRecipients}
              onRecipientsChange={setSelectedRecipients}
            />
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Priority Level</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Normal Priority
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    Medium Priority
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-warning" />
                    High Priority
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    Urgent Priority
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-medium">
              Document Description / Comments
            </Label>
            <Textarea
              id="description"
              placeholder="Provide additional context or instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col gap-2 pt-4">
            {/* Validation feedback */}
            {isSubmitDisabled && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <p className="font-medium mb-1">Required to submit:</p>
                <ul className="space-y-1">
                  {!documentTitle.trim() && <li>• Enter a document title</li>}
                  {documentTypes.length === 0 && <li>• Select at least one document type</li>}
                  {uploadedFiles.length === 0 && <li>• Upload at least one file</li>}
                  {selectedRecipients.length === 0 && <li>• Select at least one recipient</li>}
                </ul>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              {isUploading ? (
                <LoadingState 
                  type="spinner" 
                  message="Uploading document..." 
                  className="py-4"
                />
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDocumentTitle("");
                      setDocumentTypes([]);
                      setUploadedFiles([]);
                      setSelectedRecipients([]);
                      setDescription("");
                      setPriority("normal");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitDisabled}
                    variant={isSubmitDisabled ? "secondary" : "gradient"}
                    size="lg"
                    className="min-w-32"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitDisabled ? "Complete Form to Submit" : "Submit Document"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
            {uploadedFiles.map((file, fileIndex) => (
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
                          onCheckedChange={(checked) => handleAssignmentChange(file.name, recipientId, !!checked)}
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
            <Button onClick={handleAssignmentSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}