import { AIPrompt, AIGem } from '@/types/smartdocs';

class SmartDocsAIService {
  private apiEndpoint = '/api/ai';

  async generateDocument(prompt: string, context?: string): Promise<string> {
    // Simulate AI document generation
    await this.delay(1500);
    return `# Generated Document\n\n${prompt}\n\nThis is an AI-generated document based on your request. The content has been structured and formatted automatically.\n\n## Key Points\n- Point 1\n- Point 2\n- Point 3`;
  }

  async helpMeWrite(topic: string): Promise<string> {
    await this.delay(1000);
    return `Let me help you write about ${topic}. Here's a starting point:\n\n${topic} is an important topic that requires careful consideration...`;
  }

  async generateMeetingNotes(meetingData: any): Promise<string> {
    await this.delay(1200);
    return `# Meeting Notes\n\n**Date:** ${new Date().toLocaleDateString()}\n\n## Attendees\n- Participant 1\n- Participant 2\n\n## Agenda\n1. Topic 1\n2. Topic 2\n\n## Discussion Points\n- Key discussion point 1\n- Key discussion point 2\n\n## Action Items\n- [ ] Action item 1\n- [ ] Action item 2`;
  }

  async summarizeDocument(content: string): Promise<string> {
    await this.delay(1000);
    const wordCount = content.split(' ').length;
    return `**Summary:** This document contains approximately ${wordCount} words. Key themes include document management, collaboration, and automation.`;
  }

  async improveWriting(text: string): Promise<string> {
    await this.delay(800);
    return text.replace(/\b(very|really|just)\b/gi, '').trim();
  }

  async brainstorm(topic: string): Promise<string> {
    await this.delay(1000);
    return `**Brainstorming Ideas for "${topic}":**\n\n1. Innovative approach to ${topic}\n2. Traditional methods revisited\n3. Future trends in ${topic}\n4. Case studies and examples\n5. Best practices and recommendations`;
  }

  async createCopy(style: 'professional' | 'marketing' | 'academic', content: string): Promise<string> {
    await this.delay(1000);
    const styles = {
      professional: 'This professionally crafted content maintains formal tone and structure.',
      marketing: 'Engaging and persuasive content designed to capture attention!',
      academic: 'Scholarly content with proper citations and rigorous analysis.'
    };
    return `${styles[style]}\n\n${content}`;
  }

  async parseUploadedDocument(file: File): Promise<{ content: string; metadata: any }> {
    await this.delay(1500);
    return {
      content: `Parsed content from ${file.name}`,
      metadata: {
        type: this.detectDocumentType(file.name),
        extractedData: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          date: new Date(),
          keywords: ['document', 'parsed', 'automated']
        }
      }
    };
  }

  private detectDocumentType(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.includes('letter')) return 'letter';
    if (lower.includes('circular')) return 'circular';
    if (lower.includes('report')) return 'report';
    if (lower.includes('memo')) return 'memo';
    return 'other';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAIPrompts(): AIPrompt[] {
    return [
      {
        id: 'generate',
        label: 'Generate Document',
        icon: '✨',
        action: async (context) => await this.generateDocument('Generate a new document', context)
      },
      {
        id: 'help-write',
        label: 'Help Me Write',
        icon: '✍️',
        action: async (context) => await this.helpMeWrite(context || 'this topic')
      },
      {
        id: 'meeting-notes',
        label: 'Meeting Notes',
        icon: '📝',
        action: async () => await this.generateMeetingNotes({})
      }
    ];
  }

  getAIGems(): AIGem[] {
    return [
      {
        id: 'editor',
        name: 'Writing Editor',
        description: 'Grammar, clarity, and tone adjustments',
        icon: '📝',
        action: async (text) => await this.improveWriting(text)
      },
      {
        id: 'brainstormer',
        name: 'Brainstormer',
        description: 'Idea expansion and phrasing improvements',
        icon: '💡',
        action: async (text) => await this.brainstorm(text)
      },
      {
        id: 'copy-creator',
        name: 'Copy Creator',
        description: 'Professional, marketing, or academic writing',
        icon: '✨',
        action: async (text) => await this.createCopy('professional', text)
      }
    ];
  }
}

export default new SmartDocsAIService();
