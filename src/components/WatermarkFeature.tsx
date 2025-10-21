import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { FileText, Droplets, Shuffle, Lock, Eye, Save, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Download, Loader2, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface WatermarkFeatureProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    content: string;
    type: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  files?: File[];  // NEW - Array of uploaded files
}

type TabType = 'basic' | 'style' | 'preview' | 'generate';

interface WatermarkStyle {
  font: string;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  location: string;
  xOffset: number;
  yOffset: number;
}

export const WatermarkFeature: React.FC<WatermarkFeatureProps> = ({
  isOpen,
  onClose,
  document,
  user,
  files = []  // NEW - Default to empty array
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [location, setLocation] = useState('Centered');
  const [opacity, setOpacity] = useState([0.3]);
  const [rotation, setRotation] = useState(297);
  const [font, setFont] = useState('Helvetica');
  const [fontSize, setFontSize] = useState(49);
  const [color, setColor] = useState('#ff0000');
  const [previewPage, setPreviewPage] = useState(1);
  const [pageRange, setPageRange] = useState('1-10');
  const [isLocked, setIsLocked] = useState(false);
  const [generatedStyle, setGeneratedStyle] = useState<WatermarkStyle | null>(null);
  const [viewingFile, setViewingFile] = useState<File | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileContent, setFileContent] = useState<any>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileZoom, setFileZoom] = useState(100);
  const [fileRotation, setFileRotation] = useState(0);
  const { toast } = useToast();

  // Debug: Log files prop
  useEffect(() => {
    console.log('WatermarkFeature - files prop:', files);
    console.log('WatermarkFeature - files length:', files?.length);
  }, [files]);

  // Set initial viewing file when files prop changes
  useEffect(() => {
    console.log('Setting initial file, files:', files);
    if (files && files.length > 0) {
      console.log('Setting viewingFile to:', files[0]);
      setViewingFile(files[0]);
      setCurrentFileIndex(0);
    } else {
      console.log('No files available, clearing viewingFile');
      setViewingFile(null);
      setCurrentFileIndex(0);
    }
  }, [files]);

  // Load file content when viewingFile changes
  useEffect(() => {
    if (!viewingFile) {
      setFileContent(null);
      setFileError(null);
      return;
    }

    const loadFile = async () => {
      setFileLoading(true);
      setFileError(null);
      
      try {
        const fileType = viewingFile.type;
        const fileName = viewingFile.name.toLowerCase();

        if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
          await loadPDF(viewingFile);
        } else if (fileType.includes('image')) {
          await loadImage(viewingFile);
        } else if (fileType.includes('word') || fileName.endsWith('.docx')) {
          await loadWord(viewingFile);
        } else if (fileType.includes('sheet') || fileName.endsWith('.xlsx')) {
          await loadExcel(viewingFile);
        } else {
          setFileContent({ type: 'unsupported' });
        }
      } catch (error) {
        console.error('Error loading file:', error);
        setFileError(error instanceof Error ? error.message : 'Failed to load file');
      } finally {
        setFileLoading(false);
      }
    };

    loadFile();
  }, [viewingFile]);

  const loadPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCanvases: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvasEl = window.document.createElement('canvas');
      const context = canvasEl.getContext('2d');
      
      if (!context) throw new Error('Could not get canvas context');
      
      canvasEl.height = viewport.height;
      canvasEl.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport: viewport } as any).promise;
      pageCanvases.push(canvasEl.toDataURL());
    }

    setFileContent({ type: 'pdf', pageCanvases, totalPages: pdf.numPages });
  };

  const loadWord = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    setFileContent({ type: 'word', html: result.value });
  };

  const loadExcel = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const html = XLSX.utils.sheet_to_html(firstSheet);
    setFileContent({ type: 'excel', html, sheetNames: workbook.SheetNames });
  };

  const loadImage = async (file: File) => {
    const url = URL.createObjectURL(file);
    setFileContent({ type: 'image', url });
  };

  const handleSelectFile = (index: number) => {
    if (files && files[index]) {
      setCurrentFileIndex(index);
      setViewingFile(files[index]);
      setFileZoom(100);
      setFileRotation(0);
    }
  };

  const generateUniqueWatermark = () => {
    const seed = `${watermarkText}|${location}|${document.id}|${user.id}`;
    const hash = btoa(seed).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const style: WatermarkStyle = {
      font: ['Helvetica', 'Arial', 'Times New Roman'][Math.abs(hash) % 3],
      size: 30 + (Math.abs(hash) % 40),
      color: `hsl(${Math.abs(hash) % 360}, ${50 + (Math.abs(hash) % 30)}%, ${30 + (Math.abs(hash) % 40)}%)`,
      opacity: 0.15 + ((Math.abs(hash) % 45) / 100),
      rotation: -45 + (Math.abs(hash) % 90),
      location,
      xOffset: -10 + (Math.abs(hash) % 20),
      yOffset: -10 + (Math.abs(hash) % 20)
    };
    
    setGeneratedStyle(style);
    setFont(style.font);
    setFontSize(style.size);
    setColor(style.color);
    setOpacity([style.opacity]);
    setRotation(style.rotation);
  };

  const regenerateVariant = () => {
    const timestamp = Date.now();
    const seed = `${watermarkText}|${location}|${document.id}|${user.id}|${timestamp}`;
    const hash = btoa(seed).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const style: WatermarkStyle = {
      font: ['Helvetica', 'Arial', 'Times New Roman', 'Georgia', 'Verdana'][Math.abs(hash) % 5],
      size: 25 + (Math.abs(hash) % 50),
      color: `hsl(${Math.abs(hash) % 360}, ${40 + (Math.abs(hash) % 40)}%, ${25 + (Math.abs(hash) % 50)}%)`,
      opacity: 0.12 + ((Math.abs(hash) % 48) / 100),
      rotation: -90 + (Math.abs(hash) % 180),
      location,
      xOffset: -15 + (Math.abs(hash) % 30),
      yOffset: -15 + (Math.abs(hash) % 30)
    };
    
    setGeneratedStyle(style);
    setFont(style.font);
    setFontSize(style.size);
    setColor(style.color);
    setOpacity([style.opacity]);
    setRotation(style.rotation);
  };

  const lockWatermark = () => {
    setIsLocked(!isLocked);
  };

  // Helper function to get watermark position styles
  const getWatermarkPositionStyles = () => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      pointerEvents: 'none',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      color: color,
      opacity: opacity[0],
      fontSize: `${fontSize}px`,
      fontFamily: font,
      fontWeight: 'bold',
      transform: `rotate(${rotation}deg)`,
      textShadow: '0 0 2px rgba(255,255,255,0.5)',
    };

    switch (location) {
      case 'Top Left':
        return { ...baseStyles, top: '10%', left: '10%', transformOrigin: 'top left' };
      case 'Top Center':
        return { ...baseStyles, top: '10%', left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)`, transformOrigin: 'center' };
      case 'Top Right':
        return { ...baseStyles, top: '10%', right: '10%', transformOrigin: 'top right' };
      case 'Middle Left':
        return { ...baseStyles, top: '50%', left: '10%', transform: `translateY(-50%) rotate(${rotation}deg)`, transformOrigin: 'left center' };
      case 'Centered':
        return { ...baseStyles, top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${rotation}deg)`, transformOrigin: 'center' };
      case 'Middle Right':
        return { ...baseStyles, top: '50%', right: '10%', transform: `translateY(-50%) rotate(${rotation}deg)`, transformOrigin: 'right center' };
      case 'Bottom Left':
        return { ...baseStyles, bottom: '10%', left: '10%', transformOrigin: 'bottom left' };
      case 'Bottom Center':
        return { ...baseStyles, bottom: '10%', left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)`, transformOrigin: 'center' };
      case 'Bottom Right':
        return { ...baseStyles, bottom: '10%', right: '10%', transformOrigin: 'bottom right' };
      default:
        return { ...baseStyles, top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${rotation}deg)`, transformOrigin: 'center' };
    }
  };

  // Watermark Overlay Component
  const WatermarkOverlay = () => {
    if (!watermarkText.trim()) return null;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-10">
        <span style={getWatermarkPositionStyles()}>
          {watermarkText}
        </span>
      </div>
    );
  };

  // Apply watermark to canvas (for PDF pages and images)
  const applyWatermarkToCanvas = (sourceCanvas: HTMLCanvasElement): string => {
    const canvas = window.document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return sourceCanvas.toDataURL();

    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;

    // Draw original content
    ctx.drawImage(sourceCanvas, 0, 0);

    // Apply watermark
    ctx.save();
    ctx.globalAlpha = opacity[0];
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize * 2}px ${font}`; // Scale up for canvas resolution
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate position based on location
    let x = canvas.width / 2;
    let y = canvas.height / 2;

    switch (location) {
      case 'Top Left':
        x = canvas.width * 0.1;
        y = canvas.height * 0.1;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        break;
      case 'Top Center':
        y = canvas.height * 0.1;
        ctx.textBaseline = 'top';
        break;
      case 'Top Right':
        x = canvas.width * 0.9;
        y = canvas.height * 0.1;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        break;
      case 'Middle Left':
        x = canvas.width * 0.1;
        ctx.textAlign = 'left';
        break;
      case 'Middle Right':
        x = canvas.width * 0.9;
        ctx.textAlign = 'right';
        break;
      case 'Bottom Left':
        x = canvas.width * 0.1;
        y = canvas.height * 0.9;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        break;
      case 'Bottom Center':
        y = canvas.height * 0.9;
        ctx.textBaseline = 'bottom';
        break;
      case 'Bottom Right':
        x = canvas.width * 0.9;
        y = canvas.height * 0.9;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        break;
    }

    // Apply rotation
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillText(watermarkText, 0, 0);
    ctx.restore();

    return canvas.toDataURL('image/png');
  };

  // Apply watermark to PDF and download
  const applyWatermarkToPDF = async () => {
    if (!viewingFile || fileContent?.type !== 'pdf') return null;

    try {
      const arrayBuffer = await viewingFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const watermarkedPages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher resolution

        const canvas = window.document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: ctx, viewport: viewport } as any).promise;
        
        // Apply watermark to this page
        const watermarkedDataUrl = applyWatermarkToCanvas(canvas);
        watermarkedPages.push(watermarkedDataUrl);
      }

      return watermarkedPages;
    } catch (error) {
      console.error('Error applying watermark to PDF:', error);
      return null;
    }
  };

  // Apply watermark to image and download
  const applyWatermarkToImage = async (): Promise<string | null> => {
    if (!viewingFile || fileContent?.type !== 'image') return null;

    try {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = window.document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const watermarkedDataUrl = applyWatermarkToCanvas(canvas);
          resolve(watermarkedDataUrl);
        };
        img.onerror = () => resolve(null);
        img.src = fileContent.url;
      });
    } catch (error) {
      console.error('Error applying watermark to image:', error);
      return null;
    }
  };

  // Download watermarked file
  const downloadWatermarkedFile = (dataUrls: string[], filename: string) => {
    if (dataUrls.length === 1) {
      // Single image
      const link = window.document.createElement('a');
      link.href = dataUrls[0];
      link.download = `watermarked_${filename}`;
      link.click();
    } else {
      // Multiple pages - download as ZIP or individual images
      dataUrls.forEach((dataUrl, index) => {
        setTimeout(() => {
          const link = window.document.createElement('a');
          link.href = dataUrl;
          link.download = `watermarked_${filename.replace(/\.[^/.]+$/, '')}_page${index + 1}.png`;
          link.click();
        }, index * 500); // Stagger downloads
      });
    }
  };

  const handleSubmit = async () => {
    if (!viewingFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to apply watermark.",
        variant: "destructive"
      });
      return;
    }

    if (!watermarkText.trim()) {
      toast({
        title: "No Watermark Text",
        description: "Please enter watermark text.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Applying Watermark...",
      description: "Processing your document. This may take a moment.",
    });

    try {
      let watermarkedData: string[] | string | null = null;

      if (fileContent?.type === 'pdf') {
        watermarkedData = await applyWatermarkToPDF();
        if (watermarkedData) {
          downloadWatermarkedFile(watermarkedData, viewingFile.name);
          toast({
            title: "Watermark Applied Successfully!",
            description: `Downloaded ${watermarkedData.length} watermarked pages.`,
          });
        }
      } else if (fileContent?.type === 'image') {
        watermarkedData = await applyWatermarkToImage();
        if (watermarkedData) {
          downloadWatermarkedFile([watermarkedData], viewingFile.name);
          toast({
            title: "Watermark Applied Successfully!",
            description: "Downloaded watermarked image.",
          });
        }
      } else {
        // For Word/Excel/other types, just save settings
        const watermarkData = {
          documentId: document.id,
          text: watermarkText,
          location,
          opacity: opacity[0],
          rotation,
          font,
          fontSize,
          color,
          pageRange,
          generatedStyle,
          isLocked,
          createdBy: user.id,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(`watermark-${document.id}`, JSON.stringify(watermarkData));
        
        toast({
          title: "Watermark Settings Saved",
          description: `Watermark configuration saved for ${viewingFile.name}. Full embedding available for PDF and images.`,
        });
      }

      if (!watermarkedData && fileContent?.type !== 'word' && fileContent?.type !== 'excel') {
        toast({
          title: "Error",
          description: "Failed to apply watermark. Please try again.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "An error occurred while applying the watermark.",
        variant: "destructive"
      });
    }
  };

  const tabs = [
    { id: 'basic' as TabType, label: 'Basic Settings' },
    { id: 'style' as TabType, label: 'Style Options' },
    { id: 'preview' as TabType, label: 'Preview & Apply' },
    { id: 'generate' as TabType, label: 'Generate Unique' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Watermark Text</Label>
              <Textarea
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Click to edit watermark text..."
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Location on Page</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Centered">Centered</SelectItem>
                  <SelectItem value="Custom Left">Custom Left</SelectItem>
                  <SelectItem value="Custom Right">Custom Right</SelectItem>
                  <SelectItem value="Top">Top</SelectItem>
                  <SelectItem value="Bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Opacity: {Math.round(opacity[0] * 100)}%</Label>
              <Slider
                value={opacity}
                onValueChange={setOpacity}
                max={1}
                min={0.1}
                step={0.05}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Rotation Angle</Label>
              <Input
                type="number"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        );
      
      case 'style':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Font</Label>
              <Select value={font} onValueChange={setFont}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Font Size</Label>
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-10 p-1 border rounded-md"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        );
      
      case 'preview':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Preview Page</Label>
              <Input
                type="number"
                value={previewPage}
                onChange={(e) => setPreviewPage(Number(e.target.value))}
                className="mt-1"
                min={1}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Apply to Pages</Label>
              <Input
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g., 1-10, 13, 14, 100-"
                className="mt-1"
              />
            </div>
            <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] relative overflow-hidden">
              <div className="text-xs text-gray-500 mb-2">Preview (Page {previewPage})</div>
              <div className="relative w-full h-48 bg-white border rounded shadow-sm">
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    opacity: opacity[0],
                    color: color,
                    fontSize: `${fontSize * 0.3}px`,
                    fontFamily: font
                  }}
                >
                  {watermarkText}
                </div>
                <div className="p-4 text-xs text-gray-600">
                  Sample document content appears here...
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'generate':
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Generate a unique watermark style based on your text and chosen location. The style is reproducible and adjustable.
            </div>
            <div className="space-y-3">
              <Button 
                onClick={generateUniqueWatermark}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Droplets className="w-4 h-4 mr-2" />
                Generate Unique Watermark
              </Button>
              <Button 
                onClick={regenerateVariant}
                variant="outline"
                className="w-full"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Regenerate Variant
              </Button>
              <Button 
                onClick={lockWatermark}
                variant={isLocked ? "destructive" : "secondary"}
                className="w-full"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isLocked ? 'Unlock' : 'Lock'} Watermark
              </Button>
            </div>
            {generatedStyle && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border">
                <div className="text-sm font-medium text-blue-800 mb-2">Generated Style:</div>
                <div className="text-xs text-blue-600 space-y-1">
                  <div>Font: {generatedStyle.font}</div>
                  <div>Size: {generatedStyle.size}px</div>
                  <div>Color: {generatedStyle.color}</div>
                  <div>Opacity: {Math.round(generatedStyle.opacity * 100)}%</div>
                  <div>Rotation: {generatedStyle.rotation}°</div>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
        <div className="h-[88vh] overflow-hidden flex flex-col">
          {/* Two-Column Layout with Overflow Protection */}
          <div className="grid grid-cols-2 gap-4 p-6 flex-1 overflow-hidden">
            {/* LEFT COLUMN - Document Viewer */}
            <div className="flex flex-col h-full min-w-0">
              <Card className="flex-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
                  <div className="mb-4 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Document Preview
                    </h3>
                    <div className="flex items-center gap-2">
                      {files && files.length > 0 ? (
                        <Badge variant="secondary">
                          {currentFileIndex + 1} / {files.length}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-500">
                          No files (files prop: {files ? 'exists' : 'undefined'})
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Embedded Document Preview - Enhanced Scrolling with Increased Height */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden border rounded-lg bg-gray-50 scroll-smooth" style={{ maxHeight: 'calc(88vh - 240px)', minHeight: '500px' }}>
                    {fileLoading ? (
                      <div className="flex items-center justify-center h-full p-8 min-h-[400px]">
                        <div className="text-center">
                          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                          <p className="text-sm text-gray-600">Loading document...</p>
                        </div>
                      </div>
                    ) : fileError ? (
                      <div className="flex items-center justify-center h-full p-8 min-h-[400px]">
                        <div className="text-center">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                          <p className="text-sm font-medium text-red-600 mb-2">Error Loading File</p>
                          <p className="text-xs text-gray-500 break-words">{fileError}</p>
                        </div>
                      </div>
                    ) : viewingFile && fileContent ? (
                      <div className="p-4 pb-8 w-full">
                        {/* Zoom and Rotation Controls */}
                        <div className="flex items-center justify-center gap-2 mb-4 sticky top-0 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-sm z-10">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFileZoom(Math.max(50, fileZoom - 10))}
                            disabled={fileZoom <= 50}
                            title="Zoom Out"
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <Badge variant="secondary" className="px-3 font-mono">
                            {fileZoom}%
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFileZoom(Math.min(200, fileZoom + 10))}
                            disabled={fileZoom >= 200}
                            title="Zoom In"
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFileRotation((fileRotation + 90) % 360)}
                            title="Rotate 90°"
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                          {fileContent.type === 'pdf' && fileContent.totalPages && (
                            <Badge variant="outline" className="ml-2">
                              {fileContent.totalPages} {fileContent.totalPages === 1 ? 'page' : 'pages'}
                            </Badge>
                          )}
                        </div>

                        {/* File Content Rendering with Overflow Protection */}
                        <div className="space-y-4 pb-4 w-full">
                          {fileContent.type === 'pdf' && fileContent.pageCanvases?.map((pageDataUrl: string, index: number) => (
                            <div key={index} className="relative mb-6 overflow-hidden">
                              {/* Live Watermark Preview Overlay */}
                              <WatermarkOverlay />
                              <img
                                src={pageDataUrl}
                                alt={`Page ${index + 1}`}
                                style={{
                                  transform: `scale(${fileZoom / 100}) rotate(${fileRotation}deg)`,
                                  transformOrigin: 'center',
                                  transition: 'transform 0.3s ease',
                                  maxWidth: '100%',
                                  height: 'auto',
                                }}
                                className="border shadow-lg rounded mx-auto block"
                              />
                              <Badge variant="secondary" className="absolute top-2 right-2 bg-background/95 backdrop-blur z-20">
                                Page {index + 1} of {fileContent.totalPages}
                              </Badge>
                            </div>
                          ))}

                          {fileContent.type === 'word' && (
                            <div className="w-full overflow-hidden relative">
                              {/* Live Watermark Preview Overlay */}
                              <WatermarkOverlay />
                              <div
                                className="prose prose-sm max-w-none p-6 bg-white rounded shadow-sm min-h-[300px] break-words"
                                style={{
                                  transform: `scale(${fileZoom / 100}) rotate(${fileRotation}deg)`,
                                  transformOrigin: 'top center',
                                  transition: 'transform 0.3s ease',
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  maxWidth: '100%',
                                }}
                                dangerouslySetInnerHTML={{ __html: fileContent.html }}
                              />
                            </div>
                          )}

                          {fileContent.type === 'excel' && (
                            <div className="w-full overflow-hidden relative">
                              {/* Live Watermark Preview Overlay */}
                              <WatermarkOverlay />
                              <div
                                className="overflow-auto bg-white rounded shadow-sm p-4 min-h-[300px] max-h-[600px]"
                                style={{
                                  transform: `scale(${fileZoom / 100}) rotate(${fileRotation}deg)`,
                                  transformOrigin: 'top left',
                                  transition: 'transform 0.3s ease',
                                  maxWidth: '100%',
                                }}
                                dangerouslySetInnerHTML={{ __html: fileContent.html }}
                              />
                            </div>
                          )}

                          {fileContent.type === 'image' && (
                            <div className="flex justify-center relative">
                              {/* Live Watermark Preview Overlay */}
                              <WatermarkOverlay />
                              <img
                                src={fileContent.url}
                                alt={viewingFile.name}
                                style={{
                                  maxWidth: '100%',
                                  height: 'auto',
                                  transform: `scale(${fileZoom / 100}) rotate(${fileRotation}deg)`,
                                  transition: 'transform 0.3s ease',
                                  transformOrigin: 'center',
                                }}
                                className="rounded shadow-lg"
                              />
                            </div>
                          )}

                          {fileContent.type === 'unsupported' && (
                            <div className="text-center py-12">
                              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                              <p className="text-sm font-medium text-gray-600 mb-2">{viewingFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(viewingFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <Badge variant="secondary" className="mt-2">
                                ✓ File ready for watermarking
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full p-8">
                        <div className="text-center text-gray-400">
                          <FileText className="h-16 w-16 mx-auto mb-3 opacity-50" />
                          <p className="text-sm font-medium mb-1">No documents uploaded</p>
                          <p className="text-xs">Upload files to apply watermark</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File Navigation - Fixed Footer */}
                  {files && files.length > 1 && (
                    <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2 flex-shrink-0 bg-white/50 backdrop-blur-sm rounded-lg p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectFile(currentFileIndex - 1)}
                        disabled={currentFileIndex === 0}
                        className="shadow-sm"
                        title="Previous File"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <div className="flex-1 text-center">
                        <p className="text-sm text-gray-600 font-medium truncate">
                          {viewingFile?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {currentFileIndex + 1} of {files.length}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectFile(currentFileIndex + 1)}
                        disabled={currentFileIndex === files.length - 1}
                        className="shadow-sm"
                        title="Next File"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN - Watermark Settings */}
            <div className="flex flex-col h-full min-w-0">
              <Card className="flex-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <DialogHeader className="mb-4 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <Droplets className="h-6 w-6 text-blue-600" />
                      Watermark Settings
                    </DialogTitle>
                  </DialogHeader>

                  {/* Tab Navigation */}
                  <div className="mb-6 flex-shrink-0">
                    <div className="bg-gray-100 rounded-full p-1 flex">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex-1 text-center ${
                            activeTab === tab.id
                              ? 'bg-black text-white'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content - Scrollable Area */}
                  <div className="flex-1 overflow-y-auto pr-2 mb-4">
                    {renderTabContent()}
                  </div>

                  {/* Action Buttons - Fixed Footer */}
                  <div className="flex gap-3 pt-4 border-t flex-shrink-0 bg-white/50 backdrop-blur-sm rounded-lg p-3">
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 bg-green-600 hover:bg-green-700 shadow-md whitespace-nowrap"
                      disabled={isLocked && !generatedStyle}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Apply Watermark
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="shadow-sm flex-shrink-0"
                      title="Cancel"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};