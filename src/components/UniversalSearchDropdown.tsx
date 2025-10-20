import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Search,
  FileText,
  Clock,
  Users,
  Calendar,
  MessageSquare,
  CheckCircle,
  StickyNote,
  Hash,
  ArrowRight,
  History,
  X
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'approval' | 'meeting' | 'reminder' | 'note' | 'channel' | 'calendar';
  section: string;
  path: string;
  icon: React.ComponentType<any>;
  cardId?: string;
}

interface UniversalSearchDropdownProps {
  className?: string;
  placeholder?: string;
}

export const UniversalSearchDropdown: React.FC<UniversalSearchDropdownProps> = ({
  className,
  placeholder = "Search..."
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Dynamic search data fetcher
  const getSearchData = (): SearchResult[] => {
    const searchResults: SearchResult[] = [];
    
    // Add sample data for testing
    searchResults.push({
      id: 'qa-framework',
      title: 'Quality Assurance Framework - Implementation Plan',
      description: 'QA implementation strategy',
      type: 'document',
      section: 'Track Documents',
      path: '/track-documents#qa-framework',
      icon: FileText,
      cardId: 'qa-framework'
    });
    
    // Get Track Documents from localStorage or use sample data
    const trackDocuments = JSON.parse(localStorage.getItem('trackDocuments') || '[{"id":"qa-framework","title":"Quality Assurance Framework - Implementation Plan","description":"Comprehensive QA implementation strategy"}]');
    trackDocuments.forEach((doc: any) => {
      searchResults.push({
        id: doc.id,
        title: doc.title || doc.name,
        description: doc.description || doc.status || '',
        type: 'document',
        section: 'Track Documents',
        path: `/track-documents#${doc.id}`,
        icon: FileText,
        cardId: doc.id
      });
    });
    
    // Get Approval Center data
    const pendingApprovals = JSON.parse(localStorage.getItem('pendingApprovals') || '[{"id":"budget-approval","title":"Budget Approval Request","description":"Q1 budget allocation"}]');
    pendingApprovals.forEach((approval: any) => {
      searchResults.push({
        id: approval.id,
        title: approval.title || approval.name,
        description: approval.description || approval.status || '',
        type: 'approval',
        section: 'Pending Approvals',
        path: `/approvals#${approval.id}`,
        icon: CheckCircle,
        cardId: approval.id
      });
    });
    
    const approvalHistory = JSON.parse(localStorage.getItem('approvalHistory') || '[{"id":"completed-approval","title":"Marketing Campaign Approved","description":"Approved last week"}]');
    approvalHistory.forEach((approval: any) => {
      searchResults.push({
        id: approval.id,
        title: approval.title || approval.name,
        description: approval.description || approval.status || '',
        type: 'approval',
        section: 'Approval History',
        path: `/approvals#${approval.id}`,
        icon: CheckCircle,
        cardId: approval.id
      });
    });
    
    // Get LiveMeet+ meetings
    const meetings = JSON.parse(localStorage.getItem('meetings') || '[{"id":"team-standup","title":"Team Standup Meeting","description":"Daily sync at 9:00 AM"}]');
    meetings.forEach((meeting: any) => {
      searchResults.push({
        id: meeting.id,
        title: meeting.title || meeting.name,
        description: meeting.description || meeting.time || '',
        type: 'meeting',
        section: 'LiveMeet+',
        path: `/messages?tab=livemeet#${meeting.id}`,
        icon: Users,
        cardId: meeting.id
      });
    });
    
    // Get Notes & Reminders
    const reminders = JSON.parse(localStorage.getItem('reminders') || '[{"id":"project-deadline","title":"Project Deadline Reminder","description":"Due tomorrow"}]');
    reminders.forEach((reminder: any) => {
      searchResults.push({
        id: reminder.id,
        title: reminder.title || reminder.name,
        description: reminder.description || reminder.dueDate || '',
        type: 'reminder',
        section: 'Upcoming Reminders',
        path: `/messages?tab=notes#${reminder.id}`,
        icon: Clock,
        cardId: reminder.id
      });
    });
    
    const stickyNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[{"id":"review-notes","title":"Review contract terms","description":"Legal feedback needed"}]');
    stickyNotes.forEach((note: any) => {
      searchResults.push({
        id: note.id,
        title: note.title || note.content?.substring(0, 50),
        description: note.description || note.content || '',
        type: 'note',
        section: 'Sticky Notes',
        path: `/messages?tab=notes#${note.id}`,
        icon: StickyNote,
        cardId: note.id
      });
    });
    
    // Get Department Chat channels
    const channels = JSON.parse(localStorage.getItem('chatChannels') || '[{"id":"engineering","name":"Engineering Team","description":"24 members online"}]');
    channels.forEach((channel: any) => {
      searchResults.push({
        id: channel.id,
        title: channel.name || channel.title,
        description: channel.description || `${channel.memberCount || 0} members`,
        type: 'channel',
        section: 'Department Chat',
        path: `/messages?tab=chat#${channel.id}`,
        icon: Hash,
        cardId: channel.id
      });
    });
    
    // Get Calendar events
    const calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[{"id":"client-meeting","title":"Client Presentation","description":"Tomorrow 2:00 PM"}]');
    calendarEvents.forEach((event: any) => {
      searchResults.push({
        id: event.id,
        title: event.title || event.name,
        description: event.description || event.date || '',
        type: 'calendar',
        section: event.type === 'meeting' ? 'Upcoming Meetings' : 'Calendar Events',
        path: `/calendar#${event.id}`,
        icon: Calendar,
        cardId: event.id
      });
    });
    
    console.log('Search data:', searchResults.length, 'items');
    return searchResults;
  };

  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (isExpanded && !query.trim()) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, query]);

  useEffect(() => {
    if (query.trim()) {
      const searchData = getSearchData();
      const filtered = searchData.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.section.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setIsOpen(searchQuery.trim() !== '' || recentSearches.length > 0);
  };

  const handleResultClick = (result: SearchResult) => {
    const newRecentSearches = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recent-searches', JSON.stringify(newRecentSearches));
    
    // Navigate directly to specific card or section
    navigate(result.path);
    setIsOpen(false);
    setQuery('');
    
    // Scroll to specific card if hash is present
    if (result.path.includes('#')) {
      setTimeout(() => {
        const cardId = result.path.split('#')[1];
        const element = document.getElementById(cardId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
          }, 2000);
        }
      }, 100);
    }
  };

  const handleRecentClick = (recent: string) => {
    setQuery(recent);
    setIsOpen(true);
  };

  const handleMoreResultsClick = (section: string) => {
    const sectionPaths = {
      'Track Documents': '/track-documents',
      'Pending Approvals': '/approvals',
      'Approval History': '/approvals',
      'LiveMeet+': '/messages?tab=livemeet',
      'Upcoming Reminders': '/messages?tab=notes',
      'Sticky Notes': '/messages?tab=notes',
      'Department Chat': '/messages?tab=chat',
      'Upcoming Meetings': '/calendar',
      'Calendar Events': '/calendar'
    };
    const path = sectionPaths[section as keyof typeof sectionPaths] || '/dashboard';
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };
  
  const removeRecentSearch = (searchToRemove: string) => {
    const newRecentSearches = recentSearches.filter(s => s !== searchToRemove);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recent-searches', JSON.stringify(newRecentSearches));
  };
  
  const clearSearch = () => {
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      handleResultClick(results[0]);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      document: 'bg-blue-100 text-blue-800',
      approval: 'bg-green-100 text-green-800',
      meeting: 'bg-purple-100 text-purple-800',
      reminder: 'bg-orange-100 text-orange-800',
      note: 'bg-yellow-100 text-yellow-800',
      channel: 'bg-indigo-100 text-indigo-800',
      calendar: 'bg-red-100 text-red-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.section]) {
      acc[result.section] = [];
    }
    acc[result.section].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div ref={searchRef} className={cn("relative flex items-center justify-end", className)}>
      <div className={cn("transition-all duration-500 ease-in-out origin-right relative", isExpanded ? "w-96 mr-2" : "w-0 overflow-hidden")}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(query.trim() !== '' || recentSearches.length > 0)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!query.trim()) {
              setTimeout(() => setIsExpanded(false), 200);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 transition-all duration-500 ease-in-out"
          autoFocus={isExpanded}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {!isExpanded && (
        <div 
          className="flex items-center gap-2 cursor-pointer hover:text-gray-700 transition-colors text-black flex-shrink-0" 
          onClick={() => setIsExpanded(true)}
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Search</span>
        </div>
      )}

      {isOpen && (query.trim() !== '' || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-white shadow-lg border rounded-lg z-50 max-h-96 overflow-hidden">
          <ScrollArea className="max-h-96">
            <div className="p-4 max-h-96 overflow-y-auto">
              {query.trim() === '' && recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Recent Searches</span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((recent, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer group"
                      >
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm flex-1" onClick={() => handleRecentClick(recent)}>{recent}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(recent);
                          }}
                          className="w-4 h-4 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {query.trim() !== '' && results.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No results found for "{query}"</p>
                </div>
              )}

              {Object.entries(groupedResults).slice(0, 6).map(([section, sectionResults]) => (
                <div key={section} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{section}</span>
                    <Badge variant="outline" className="text-xs">
                      {sectionResults.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {sectionResults.slice(0, 3).map((result) => {
                      const IconComponent = result.icon;
                      return (
                        <div
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="flex items-center gap-3 p-3 hover:bg-muted rounded-md cursor-pointer group transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <IconComponent className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium truncate">{result.title}</span>
                              <Badge className={cn("text-xs", getTypeColor(result.type))}>
                                {result.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      );
                    })}
                    {sectionResults.length > 3 && (
                      <div 
                        onClick={() => handleMoreResultsClick(section)}
                        className="text-xs text-muted-foreground text-center py-2 cursor-pointer hover:text-foreground hover:bg-muted rounded-md transition-colors flex items-center justify-center gap-1"
                      >
                        +{sectionResults.length - 3} More Results
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              ))}


            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};