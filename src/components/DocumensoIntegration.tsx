import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Camera, Upload, Undo2, CheckCircle, X, FileText, Signature } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumensoIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    content: string;
    type: string;
  };
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const DOCUMENSO_API_KEY = 'api_lr6uvchonev0drwc';
const DOCUMENSO_BASE_URL = 'https://api.documenso.com/v1';

export const DocumensoIntegration: React.FC<DocumensoIntegrationProps> = ({
  isOpen,
  onClose,
  document,
  user
}) => {
  const [signatureData, setSignatureData] = useState<string>('');
  const [signerName, setSignerName] = useState(user.name);
  const [signerEmail, setSignerEmail] = useState(user.email);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedSignature, setCapturedSignature] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize canvas for digital signature
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [isOpen]);

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureData('');
    setCapturedSignature('');
  };

  // Camera signature capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please try uploading an image instead.",
        variant: "destructive"
      });
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      setCapturedSignature(imageData);
      setSignatureData(imageData);
      
      // Stop camera
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  // File upload for signature
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCapturedSignature(result);
        setSignatureData(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Documenso API integration
  const processWithDocumenso = async () => {
    setIsProcessing(true);
    
    try {
      // 1. Create document in Documenso
      const createDocResponse = await fetch(`${DOCUMENSO_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DOCUMENSO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: document.title,
          content: document.content,
          type: document.type
        })
      });

      const docData = await createDocResponse.json();
      
      // 2. AI-powered signature placement
      const placementResponse = await fetch(`${DOCUMENSO_BASE_URL}/documents/${docData.id}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DOCUMENSO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enableAI: true,
          detectSignatureZones: true,
          patterns: ['Authorized Signatory', 'Signature', 'Sign Here', 'Principal Signature'],
          templateType: 'institutional_document'
        })
      });

      const placementData = await placementResponse.json();
      
      // 3. Add signature field with AI placement
      const signatureFieldResponse = await fetch(`${DOCUMENSO_BASE_URL}/documents/${docData.id}/fields`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DOCUMENSO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'signature',
          coordinates: placementData.suggestedCoordinates,
          signer: {
            name: signerName,
            email: signerEmail
          },
          signatureImage: signatureData || capturedSignature
        })
      });

      // 4. Complete signing process
      const signingResponse = await fetch(`${DOCUMENSO_BASE_URL}/documents/${docData.id}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DOCUMENSO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signerId: signerEmail,
          signatureData: signatureData || capturedSignature,
          timestamp: new Date().toISOString(),
          metadata: {
            iaoms_document_id: document.id,
            signer_role: user.role,
            approval_type: 'accept'
          }
        })
      });

      const signedDoc = await signingResponse.json();
      
      // Update IAOMS document status
      const approvalUpdate = {
        documentId: document.id,
        status: 'approved',
        signedBy: user.name,
        signedAt: new Date().toISOString(),
        documensoId: docData.id,
        signatureUrl: signedDoc.downloadUrl
      };
      
      localStorage.setItem(`approval-${document.id}`, JSON.stringify(approvalUpdate));
      
      toast({
        title: "Document Signed Successfully",
        description: "The document has been digitally signed and approved via Documenso.",
      });
      
      onClose();
      
    } catch (error) {
      console.error('Documenso integration error:', error);
      toast({
        title: "Signing Error",
        description: "Failed to process document signature. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
        <div className="flex h-[85vh]">
          {/* Left Column - Document Viewer */}
          <div className="w-1/2 p-6 border-r border-gray-200">
            <div className="bg-white rounded-lg shadow-sm h-full p-6 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">The Pledge</h3>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <h4 className="text-base font-medium mb-3">{document.title}</h4>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {document.content || `
I, ${signerName}, in my capacity as ${user.role}, hereby approve and digitally sign this document.

This approval signifies my agreement with the contents and my authorization for the proposed actions outlined in this document.

By signing this document electronically, I acknowledge that this digital signature has the same legal effect as a handwritten signature.

Document ID: ${document.id}
Approval Date: ${currentDate}
Approved By: ${signerName}
Role: ${user.role}

This document has been processed through the Institutional Academic Operations Management System (IAOMS) and secured with Documenso's AI-powered signature placement technology.
                  `}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Signature Interaction */}
          <div className="w-1/2 p-6 flex flex-col">
            <Card className="flex-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
                <DialogHeader className="mb-4 flex-shrink-0">
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Signature className="h-6 w-6 text-green-600" />
                    Digital Signature
                  </DialogTitle>
                </DialogHeader>

                {/* Form Fields */}
                <div className="space-y-3 mb-4 flex-shrink-0">
                  <div>
                    <Label htmlFor="signerName" className="text-sm">Full Name</Label>
                    <Input
                      id="signerName"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="signerEmail" className="text-sm">Email Address</Label>
                    <Input
                      id="signerEmail"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currentDate" className="text-sm">Date</Label>
                    <Input
                      id="currentDate"
                      type="date"
                      value={currentDate}
                      onChange={(e) => setCurrentDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Signature Area */}
                <div className="flex-1 mb-4 overflow-y-auto min-h-0">
                  <Label className="text-sm font-medium mb-3 block">Signature</Label>
                  
                  {!showCamera ? (
                    <div className="space-y-4">
                      {/* Canvas for drawing signature */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        <canvas
                          ref={canvasRef}
                          width={400}
                          height={150}
                          className="w-full border border-gray-200 rounded bg-white cursor-crosshair"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Draw your signature above
                        </p>
                      </div>

                      {/* Signature capture options */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={startCamera}
                          className="flex-1"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Camera
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearSignature}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      {/* Captured signature preview */}
                      {capturedSignature && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Captured Signature:</p>
                          <img 
                            src={capturedSignature} 
                            alt="Captured signature" 
                            className="max-h-20 border border-gray-200 rounded"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Camera view */
                    <div className="space-y-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg border"
                      />
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1">
                          <Camera className="h-4 w-4 mr-2" />
                          Capture Signature
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCamera(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 mt-auto border-t flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={processWithDocumenso}
                    disabled={isProcessing || (!signatureData && !capturedSignature)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit & Sign
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};