export interface SmartDocument {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  collaborators: string[];
  version: number;
  type?: 'letter' | 'circular' | 'report' | 'memo' | 'other';
  department?: string;
}

export interface AIPrompt {
  id: string;
  label: string;
  icon: string;
  action: (context?: string) => Promise<string>;
}

export interface AIGem {
  id: string;
  name: string;
  description: string;
  icon: string;
  action: (text: string) => Promise<string>;
}

export interface CollaborationSession {
  documentId: string;
  users: Array<{
    id: string;
    name: string;
    color: string;
    cursor?: { line: number; column: number };
  }>;
}
