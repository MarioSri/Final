import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/smartdocs.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { 
  FileText, Save, Download, Upload, Users, Clock, 
  Sparkles, PenLine, FileEdit, MoreHorizontal,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Image, Table, MessageSquare
} from 'lucide-react';
import SmartDocsAIService from '@/services/SmartDocsAIService';
import { SmartDocument } from '@/types/smartdocs';
import { useToast } from '@/hooks/use-toast';

interface SmartDocsEditorProps {
  documentId?: string;
  initialContent?: string;
}

const SmartDocsEditor: React.FC<SmartDocsEditorProps> = ({ documentId, initialContent = '' }) => {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState('Untitled Document');
  const [isSaving, setIsSaving] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [aiResponse, setAiResponse] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>(['You']);
  const quillRef = useRef<ReactQuill>(null);
  const { toast } = useToast();

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  useEffect(() => {
    const autoSave = setInterval(() => {
      handleAutoSave();
    }, 30000);
    return () => clearInterval(autoSave);
  }, [content, title]);

  const handleAutoSave = async () => {
    if (!content) return;
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Document Saved",
      description: "Your document has been saved successfully.",
    });
    setIsSaving(false);
  };

  const handleAIPrompt = async (promptType: string) => {
    setIsAILoading(true);
    try {
      let result = '';
      switch (promptType) {
        case 'generate':
          result = await SmartDocsAIService.generateDocument('Create a new document', content);
          break;
        case 'help-write':
          result = await SmartDocsAIService.helpMeWrite(title);
          break;
        case 'meeting-notes':
          result = await SmartDocsAIService.generateMeetingNotes({});
          break;
      }
      setAiResponse(result);
      setShowAISidebar(true);
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to generate AI response",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleInsertAIContent = () => {
    if (aiResponse) {
      setContent(content + '\n\n' + aiResponse);
      setAiResponse('');
      toast({
        title: "Content Inserted",
        description: "AI-generated content has been added to your document.",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await SmartDocsAIService.parseUploadedDocument(file);
      setContent(parsed.content);
      setTitle(parsed.metadata.extractedData.title);
      toast({
        title: "Document Uploaded",
        description: `${file.name} has been parsed and loaded.`,
      });
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to parse document",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Menu Bar */}
        <div className="border-b bg-card">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-4">
              <FileText className="h-6 w-6 text-primary" />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 w-64"
                placeholder="Untitled Document"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {collaborators.map((user, idx) => (
                  <div key={idx} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    {user[0]}
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" disabled={isSaving}>
                <Clock className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Saved'}
              </Button>
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 px-4 py-2 border-t">
            <label htmlFor="file-upload">
              <Button variant="ghost" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".doc,.docx,.pdf,.txt"
              onChange={handleFileUpload}
            />
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button variant="ghost" size="sm" onClick={() => {
              const quill = quillRef.current?.getEditor();
              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.insertText(range.index, '\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n');
                }
              }
            }}>
              <Table className="h-4 w-4 mr-2" />
              Table
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowVersionHistory(!showVersionHistory)}>
              <Clock className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAISidebar(!showAISidebar)}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>

        {/* AI Prompt Buttons */}
        <div className="border-b bg-muted/30 px-4 py-3">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAIPrompt('generate')}
              disabled={isAILoading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Document
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAIPrompt('help-write')}
              disabled={isAILoading}
            >
              <PenLine className="h-4 w-4 mr-2" />
              Help Me Write
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAIPrompt('meeting-notes')}
              disabled={isAILoading}
            >
              <FileEdit className="h-4 w-4 mr-2" />
              Meeting Notes
            </Button>
            <Button variant="outline" size="sm" disabled={isAILoading}>
              <MoreHorizontal className="h-4 w-4 mr-2" />
              More Options
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto py-8 px-4">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                className="bg-white rounded-lg shadow-sm min-h-[600px]"
                placeholder="Start writing your document..."
              />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div className="w-80 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Comments
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowComments(false)}>
                ✕
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">No comments yet. Select text and add a comment.</p>
              <Button size="sm" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Version History Panel */}
      {showVersionHistory && (
        <div className="w-80 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Version History
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowVersionHistory(false)}>
                ✕
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((v) => (
                <Card key={v} className="p-3 hover:bg-accent cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">Version {v}</p>
                      <p className="text-xs text-muted-foreground">{new Date().toLocaleString()}</p>
                    </div>
                    <Button size="sm" variant="ghost">Restore</Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* AI Sidebar */}
      {showAISidebar && (
        <div className="w-80 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Assistant
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAISidebar(false)}>
                ✕
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* AI Gems */}
              <div>
                <h4 className="text-sm font-medium mb-3">AI Tools</h4>
                <div className="space-y-2">
                  {SmartDocsAIService.getAIGems().map((gem) => (
                    <Card key={gem.id} className="p-3 hover:bg-accent cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{gem.icon}</span>
                        <div>
                          <h5 className="font-medium text-sm">{gem.name}</h5>
                          <p className="text-xs text-muted-foreground">{gem.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* AI Response */}
              {aiResponse && (
                <div>
                  <h4 className="text-sm font-medium mb-3">AI Suggestion</h4>
                  <Card className="p-4">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm">{aiResponse}</pre>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" onClick={handleInsertAIContent}>
                        Insert
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAiResponse('')}>
                        Dismiss
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Create an outline for a pitch
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Summarize this document
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Brainstorm a list of ideas
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default SmartDocsEditor;
