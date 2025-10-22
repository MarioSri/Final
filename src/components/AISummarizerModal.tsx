import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  type: string;
  description: string;
  submittedBy: string;
  date: string;
}

interface AISummarizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

export const AISummarizerModal: React.FC<AISummarizerModalProps> = ({
  isOpen,
  onClose,
  document
}) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [animatedText, setAnimatedText] = useState('');

  const generateSummary = async () => {
    setLoading(true);
    setSummary('');
    setAnimatedText('');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyDC41PALf1ZZ4IxRBwUcQFK7p3lw93SIyE`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Please provide a concise summary of this document:

Title: ${document.title}
Type: ${document.type}
Submitted by: ${document.submittedBy}
Date: ${document.date}
Description: ${document.description}

Generate a professional summary highlighting key points, objectives, and any action items. Keep it under 150 words.`
            }]
          }]
        })
      });

      const data = await response.json();
      const generatedSummary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate summary at this time.';
      
      setSummary(generatedSummary);
      animateText(generatedSummary);
    } catch (error) {
      const fallbackSummary = `This ${document.type.toLowerCase()} titled "${document.title}" was submitted by ${document.submittedBy} on ${document.date}. ${document.description} The document requires review and appropriate action from the relevant authorities.`;
      setSummary(fallbackSummary);
      animateText(fallbackSummary);
    } finally {
      setLoading(false);
    }
  };

  const animateText = (text: string) => {
    const words = text.split(' ');
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setAnimatedText(prev => prev + (currentIndex === 0 ? '' : ' ') + words[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100);
  };

  useEffect(() => {
    if (isOpen) {
      generateSummary();
    }
  }, [isOpen, document]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border-0 p-0 overflow-hidden [&>button]:hidden">
        <div className="relative">
          <DialogHeader className="p-8 pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                AI Document Summarizer
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full hover:bg-white/50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 min-h-[200px]">
              <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                AI-Generated Summary
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-gray-600">Generating summary...</span>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {animatedText}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={generateSummary} 
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate Summary
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};