import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { FileText, Droplets, Shuffle, Lock, Eye, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  user
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
  const { toast } = useToast();

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

  const handleSubmit = () => {
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
      title: "Watermark Applied",
      description: "The watermark has been successfully applied to your document.",
    });
    
    onClose();
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
        <div className="flex h-[85vh]">
          {/* Left Column - Document Viewer */}
          <div className="w-1/2 p-6 border-r border-gray-200">
            <div className="bg-white rounded-lg shadow-sm h-full p-6 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Document Preview</h3>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <h4 className="text-base font-medium mb-3">{document.title}</h4>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {document.content || `
This is a sample document that will receive the watermark treatment.

The watermark will be applied according to your specifications on the right panel.

You can preview how the watermark will appear on your document before applying it.

Document ID: ${document.id}
Document Type: ${document.type}
Created for: ${user.name}

This document is part of the Institutional Academic Operations Management System (IAOMS) and will be processed with your custom watermark settings.
                  `}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Watermark Controls */}
          <div className="w-1/2 p-6 flex flex-col">
            <Card className="flex-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
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

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                  {renderTabContent()}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t flex-shrink-0">
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isLocked && !generatedStyle}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Apply Watermark
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="px-6"
                  >
                    Cancel
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