import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LiveMeetingRequestModal } from "./LiveMeetingRequestModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { meetingAPI } from "@/services/MeetingAPIService";
import {
  Meeting,
  MeetingAttendee,
  MeetingType,
  MeetingPlatform,
  MeetingStatus,
  MeetingPriority,
  MeetingCategory,
  ConflictCheck,
  AISchedulingSuggestion,
  CreateMeetingResponse,
  ApprovalWorkflow,
  RecurringPattern,
  NotificationSettings
} from "@/types/meeting";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  Video,
  MapPin,
  Bell,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  ExternalLink,
  Zap,
  Brain,
  AlertTriangle,
  Shield,
  FileText,
  Download,
  Upload,
  Repeat,
  Mail,
  MessageSquare,
  Phone,
  Smartphone,
  Wifi,
  Monitor,
  Calendar,
  Settings,
  Star,
  BarChart3,
  TrendingUp,
  Filter,
  Search,
  Copy,
  Share,
  Archive,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  ScreenShare,
  UserPlus,
  UserMinus,
  Timer,
  Target,
  Lightbulb,
  BookOpen,
  Award,
  Globe,
  Lock,
  Unlock,
  RefreshCw,
  Save,
  Send,
  Eye,
  EyeOff,
  Heart,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MeetingSchedulerProps {
  userRole: string;
  className?: string;
}

export function MeetingScheduler({ userRole, className }: MeetingSchedulerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State Management
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictCheck | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISchedulingSuggestion | null>(null);
  const [showNewMeetingDialog, setShowNewMeetingDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showAISuggestionsDialog, setShowAISuggestionsDialog] = useState(false);
  const [showLiveMeetingModal, setShowLiveMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'live-requests'>('calendar');
  const [filterBy, setFilterBy] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // New Meeting Form State
  const [newMeeting, setNewMeeting] = useState<Partial<Meeting>>({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: 60,
    attendees: [],
    location: "",
    type: "online",
    status: "scheduled",
    priority: "medium",
    category: "academic",
    isRecurring: false,
    tags: [],
    department: user?.department || "",
    notifications: {
      email: true,
      push: true,
      sms: false,
      whatsapp: false,
      reminders: [
        { type: 'email', timing: 1440, enabled: true }, // 24h
        { type: 'push', timing: 60, enabled: true }, // 1h
        { type: 'email', timing: 10, enabled: true } // 10m
      ],
      escalation: {
        enabled: false,
        escalateAfterHours: 24,
        escalateTo: [],
        autoApprove: false
      }
    }
  });
  
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>({
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
    endDate: undefined,
    occurrences: undefined,
    exceptions: []
  });
  
  const [approvalWorkflow, setApprovalWorkflow] = useState<ApprovalWorkflow>({
    isRequired: false,
    approvers: [],
    currentStep: 0,
    status: 'pending',
    requestedAt: new Date(),
    comments: []
  });

  // Mock data for development - replace with API calls
  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      // Mock meetings data - replace with actual API call
      const mockMeetings: Meeting[] = [
        {
          id: "meeting-001",
          title: "Faculty Recruitment Board Meeting",
          description: "Review applications for new faculty positions in Computer Science Department",
          date: "2024-01-18",
          time: "10:00",
          duration: 90,
          attendees: [
            { id: "1", name: "Dr. Principal", email: "principal@iaoms.edu", role: "Principal", status: "accepted", isRequired: true, canEdit: false },
            { id: "2", name: "Prof. Registrar", email: "registrar@iaoms.edu", role: "Registrar", status: "accepted", isRequired: true, canEdit: false },
            { id: "3", name: "Dr. HOD-CSE", email: "hod.cse@iaoms.edu", role: "HOD", department: "Computer Science", status: "no-response" as const, isRequired: true, canEdit: true }
          ],
          location: "Conference Room A",
          type: "hybrid",
          status: "confirmed",
          documents: ["recruitment-policy-2024.pdf", "application-summary.xlsx"],
          createdBy: user?.id || "user-1",
          createdAt: new Date("2024-01-15T09:00:00Z"),
          updatedAt: new Date("2024-01-16T14:30:00Z"),
          priority: "high",
          category: "recruitment",
          isRecurring: false,
          tags: ["recruitment", "faculty", "urgent"],
          department: "Computer Science",
          meetingLinks: {
            googleMeet: {
              meetingId: "meet-123",
              joinUrl: "https://meet.google.com/abc-defg-hij",
              hangoutLink: "https://meet.google.com/abc-defg-hij",
              conferenceId: "abc-defg-hij",
              requestId: "req-123",
              status: "success",
              createdAt: new Date()
            },
            primary: "google-meet"
          },
          notifications: {
            email: true,
            push: true,
            sms: false,
            whatsapp: false,
            reminders: [
              { type: 'email', timing: 1440, enabled: true },
              { type: 'push', timing: 60, enabled: true },
              { type: 'email', timing: 10, enabled: true }
            ],
            escalation: {
              enabled: true,
              escalateAfterHours: 48,
              escalateTo: ["dean@iaoms.edu"],
              autoApprove: false
            }
          },
          approvalWorkflow: {
            isRequired: true,
            approvers: [
              {
                id: "approval-1",
                approverId: "dean-001",
                approverName: "Dr. Dean",
                approverRole: "Dean",
                order: 1,
                status: "approved",
                responseTime: new Date("2024-01-16T10:00:00Z"),
                comments: "Approved for recruitment process",
                isRequired: true
              }
            ],
            currentStep: 1,
            status: "approved",
            requestedAt: new Date("2024-01-15T09:00:00Z"),
            approvedAt: new Date("2024-01-16T10:00:00Z"),
            comments: []
          }
        },
        {
          id: "meeting-002",
          title: "Budget Review - Q1 2024",
          description: "Quarterly budget analysis and financial planning for upcoming semester",
          date: "2024-01-19",
          time: "14:00",
          duration: 120,
          attendees: [
            { id: "1", name: "Dr. Principal", email: "principal@iaoms.edu", role: "Principal", status: "accepted", isRequired: true, canEdit: false },
            { id: "4", name: "Mr. Finance Head", email: "finance@iaoms.edu", role: "Finance Head", status: "accepted", isRequired: true, canEdit: false },
            { id: "2", name: "Prof. Registrar", email: "registrar@iaoms.edu", role: "Registrar", status: "tentative", isRequired: true, canEdit: false }
          ],
          location: "zoom",
          type: "online",
          status: "scheduled",
          documents: ["budget-report-q1.pdf", "financial-analysis.xlsx"],
          createdBy: user?.id || "user-1",
          createdAt: new Date("2024-01-12T11:00:00Z"),
          updatedAt: new Date("2024-01-17T16:45:00Z"),
          priority: "high",
          category: "financial",
          isRecurring: true,
          recurringPattern: {
            frequency: "monthly",
            interval: 3,
            endDate: new Date("2024-12-31"),
            exceptions: []
          },
          tags: ["budget", "financial", "quarterly"],
          department: "Administration",
          meetingLinks: {
            zoom: {
              meetingId: "zoom-456",
              joinUrl: "https://zoom.us/j/123456789",
              startUrl: "https://zoom.us/s/123456789",
              password: "budget2024",
              meetingNumber: "123456789",
              status: "waiting",
              createdAt: new Date()
            },
            primary: "zoom"
          },
          notifications: {
            email: true,
            push: true,
            sms: false,
            whatsapp: false,
            reminders: [
              { type: 'email', timing: 2880, enabled: true }, // 48h
              { type: 'push', timing: 60, enabled: true }
            ],
            escalation: {
              enabled: false,
              escalateAfterHours: 24,
              escalateTo: [],
              autoApprove: false
            }
          }
        }
      ];
      
      setMeetings(mockMeetings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load meetings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  const availableAttendees = [
    { id: "principal", name: "Dr. Principal", email: "principal@iaoms.edu", role: "Principal" },
    { id: "registrar", name: "Prof. Registrar", email: "registrar@iaoms.edu", role: "Registrar" },
    { id: "hod-cse", name: "Dr. HOD-CSE", email: "hod.cse@iaoms.edu", role: "HOD", department: "Computer Science" },
    { id: "hod-eee", name: "Dr. HOD-EEE", email: "hod.eee@iaoms.edu", role: "HOD", department: "Electrical Engineering" },
    { id: "hod-ece", name: "Dr. HOD-ECE", email: "hod.ece@iaoms.edu", role: "HOD", department: "Electronics Engineering" },
    { id: "hod-mech", name: "Dr. HOD-MECH", email: "hod.mech@iaoms.edu", role: "HOD", department: "Mechanical Engineering" },
    { id: "dean", name: "Dr. Dean", email: "dean@iaoms.edu", role: "Dean" },
    { id: "finance", name: "Mr. Finance Head", email: "finance@iaoms.edu", role: "Finance Head" },
    { id: "academic", name: "Dr. Academic Cell", email: "academic@iaoms.edu", role: "Academic Cell" },
    { id: "librarian", name: "Ms. Librarian", email: "library@iaoms.edu", role: "Librarian" }
  ];

  const meetingPlatforms: { value: MeetingPlatform; label: string; icon: React.ReactNode }[] = [
    { value: "google-meet", label: "Google Meet", icon: <Video className="w-4 h-4" /> },
    { value: "zoom", label: "Zoom", icon: <Monitor className="w-4 h-4" /> },
    { value: "teams", label: "Microsoft Teams", icon: <MessageSquare className="w-4 h-4" /> },
    { value: "physical", label: "Physical Room", icon: <MapPin className="w-4 h-4" /> }
  ];

  const getStatusBadge = (status: MeetingStatus) => {
    const variants = {
      scheduled: { variant: "secondary" as const, text: "Scheduled", icon: <Clock className="w-3 h-3" /> },
      confirmed: { variant: "default" as const, text: "Confirmed", icon: <CheckCircle className="w-3 h-3" /> },
      "in-progress": { variant: "default" as const, text: "In Progress", icon: <Zap className="w-3 h-3" /> },
      completed: { variant: "default" as const, text: "Completed", icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { variant: "destructive" as const, text: "Cancelled", icon: <XCircle className="w-3 h-3" /> },
      postponed: { variant: "secondary" as const, text: "Postponed", icon: <Calendar className="w-3 h-3" /> }
    };
    return variants[status] || { variant: "default" as const, text: status, icon: <Clock className="w-3 h-3" /> };
  };

  const getPriorityBadge = (priority: MeetingPriority) => {
    const variants = {
      low: { variant: "secondary" as const, text: "Low Priority" },
      medium: { variant: "default" as const, text: "Medium Priority" },
      high: { variant: "default" as const, text: "High Priority" },
      urgent: { variant: "destructive" as const, text: "Urgent" }
    };
    return variants[priority] || { variant: "default" as const, text: priority };
  };

  const getTypeIcon = (type: MeetingType) => {
    switch (type) {
      case "online": return <Video className="w-4 h-4" />;
      case "physical": return <MapPin className="w-4 h-4" />;
      case "hybrid": return <Globe className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Event handlers
  const handleCreateMeeting = async () => {
    if (!newMeeting.title || !newMeeting.date || !newMeeting.time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Check for conflicts first
      const conflictCheck = await meetingAPI.checkConflicts(newMeeting);
      
      if (conflictCheck.hasConflict && conflictCheck.conflicts.length > 0) {
        setConflicts(conflictCheck);
        setShowConflictDialog(true);
        return;
      }

      // Create the meeting
      const response: CreateMeetingResponse = await meetingAPI.createMeeting({
        ...newMeeting,
        createdBy: user?.id || 'unknown',
        createdAt: new Date(),
        updatedAt: new Date(),
        id: `meeting-${Date.now()}`,
        approvalWorkflow: approvalWorkflow.isRequired ? approvalWorkflow : undefined,
        recurringPattern: newMeeting.isRecurring ? recurringPattern : undefined
      } as Meeting);

      setMeetings(prev => [response.meeting, ...prev]);
      setShowNewMeetingDialog(false);
      resetNewMeetingForm();

      toast({
        title: "Meeting Created",
        description: `${response.meeting.title} has been scheduled successfully`,
        variant: "default"
      });

      // Show meeting links if online meeting
      if (response.meetingLinks && (newMeeting.type === 'online' || newMeeting.type === 'hybrid')) {
        const platform = response.meetingLinks.primary;
        const link = response.meetingLinks[platform];
        if (link && 'joinUrl' in link) {
          toast({
            title: "Meeting Link Generated",
            description: `${platform} link: ${link.joinUrl}`,
            variant: "default"
          });
        }
      }

    } catch (error) {
      console.error('Meeting creation failed:', error);
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetAISuggestions = async () => {
    if (!newMeeting.title || !newMeeting.attendees?.length) {
      toast({
        title: "Information Needed",
        description: "Please provide meeting title and select attendees for AI suggestions",
        variant: "default"
      });
      return;
    }

    setLoading(true);
    try {
      const suggestions = await meetingAPI.getAISchedulingSuggestions(newMeeting);
      setAiSuggestions(suggestions);
      setShowAISuggestionsDialog(true);
    } catch (error) {
      console.error('AI suggestions failed:', error);
      toast({
        title: "AI Suggestions Unavailable",
        description: "Unable to get AI suggestions at this time",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetNewMeetingForm = () => {
    setNewMeeting({
      title: "",
      description: "",
      date: "",
      time: "",
      duration: 60,
      attendees: [],
      location: "",
      type: "online",
      status: "scheduled",
      priority: "medium",
      category: "academic",
      isRecurring: false,
      tags: [],
      department: user?.department || "",
      notifications: {
        email: true,
        push: true,
        sms: false,
        whatsapp: false,
        reminders: [
          { type: 'email', timing: 1440, enabled: true },
          { type: 'push', timing: 60, enabled: true },
          { type: 'email', timing: 10, enabled: true }
        ],
        escalation: {
          enabled: false,
          escalateAfterHours: 24,
          escalateTo: [],
          autoApprove: false
        }
      }
    });
  };

  const addAttendee = (attendeeData: any) => {
    const attendee: MeetingAttendee = {
      id: attendeeData.id,
      name: attendeeData.name,
      email: attendeeData.email,
      role: attendeeData.role,
      department: attendeeData.department,
      status: "invited",
      isRequired: true,
      canEdit: false
    };

    setNewMeeting(prev => ({
      ...prev,
      attendees: [...(prev.attendees || []), attendee]
    }));
  };

  const removeAttendee = (attendeeId: string) => {
    setNewMeeting(prev => ({
      ...prev,
      attendees: prev.attendees?.filter(a => a.id !== attendeeId) || []
    }));
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    if (!meeting.meetingLinks) return;

    const platform = meeting.meetingLinks.primary;
    const link = meeting.meetingLinks[platform];
    
    if (link && 'joinUrl' in link) {
      window.open(link.joinUrl, '_blank');
      
      toast({
        title: "Joining Meeting",
        description: `Opening ${platform} meeting...`,
        variant: "default"
      });
    }
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeetings = meetings.filter(m => m.date === dateStr);
      
      days.push({
        date: i,
        fullDate: dateStr,
        meetings: dayMeetings,
        isToday: i === today.getDate(),
        isSelected: dateStr === selectedDate.toISOString().split('T')[0]
      });
    }
    
    return days;
  };

  return (
    <TooltipProvider>
      <div className={`space-y-6 animate-fade-in ${className}`}>
        {/* Header with Stats */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="gap-1">
                <Calendar className="w-3 h-3" />
                {meetings.length} Meetings
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {meetings.filter(m => m.status === 'scheduled').length} Scheduled
              </Badge>
            </div>
            
            <Button variant="gradient" onClick={() => setShowNewMeetingDialog(true)} className="animate-scale-in">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <Users className="w-4 h-4" />
                List View
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={loadMeetings}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Grid */}
              <Card className="lg:col-span-2 shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {generateCalendarDays().map((day) => (
                      <div
                        key={day.date}
                        className={`p-2 rounded-lg cursor-pointer transition-all hover:bg-accent ${
                          day.isToday ? 'bg-primary text-primary-foreground' :
                          day.isSelected ? 'bg-accent' : ''
                        }`}
                        onClick={() => setSelectedDate(new Date(day.fullDate))}
                      >
                        <div className="text-sm font-medium">{day.date}</div>
                        {day.meetings.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {day.meetings.slice(0, 2).map((meeting, idx) => (
                              <Tooltip key={idx}>
                                <TooltipTrigger>
                                  <div className={`w-2 h-2 rounded-full ${
                                    meeting.status === 'confirmed' ? 'bg-green-500' : 
                                    meeting.status === 'scheduled' ? 'bg-blue-500' :
                                    'bg-yellow-500'
                                  }`} />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{meeting.title}</p>
                                  <p className="text-xs">{formatTime(meeting.time)}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {day.meetings.length > 2 && (
                              <span className="text-xs">+{day.meetings.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Meetings Sidebar */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Upcoming Meetings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {meetings.slice(0, 5).map((meeting) => (
                        <div key={meeting.id} className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer" onClick={() => setSelectedMeeting(meeting)}>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm line-clamp-2">{meeting.title}</h4>
                            <Badge variant={getStatusBadge(meeting.status).variant} className="text-xs shrink-0 ml-2">
                              {getStatusBadge(meeting.status).icon}
                              {getStatusBadge(meeting.status).text}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {meeting.date} at {formatTime(meeting.time)}
                            </div>
                            <div className="flex items-center gap-1">
                              {getTypeIcon(meeting.type)}
                              {meeting.type === 'online' ? 
                                meetingPlatforms.find(p => p.value === meeting.meetingLinks?.primary)?.label || 'Online' 
                                : meeting.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {meeting.attendees.length} attendees
                            </div>
                          </div>
                          
                          {(meeting.type === 'online' || meeting.type === 'hybrid') && meeting.meetingLinks && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinMeeting(meeting);
                              }}
                            >
                              <Video className="w-3 h-3 mr-1" />
                              Join Meeting
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            {/* Meeting Statistics */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Meeting Statistics</CardTitle>
                <CardDescription>Overview of your scheduled meetings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Meetings</p>
                          <p className="text-2xl font-bold">2</p>
                        </div>
                        <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">This Week</p>
                          <p className="text-2xl font-bold">0</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Online Meetings</p>
                          <p className="text-2xl font-bold">2</p>
                        </div>
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Duration</p>
                          <p className="text-2xl font-bold">105m</p>
                        </div>
                        <Timer className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>All Meetings</CardTitle>
                <CardDescription>Manage and track all scheduled meetings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{meeting.title}</h3>
                            <Badge variant={getPriorityBadge(meeting.priority).variant} className="text-xs">
                              {meeting.priority.toUpperCase()}
                            </Badge>
                            {meeting.isRecurring && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Repeat className="w-3 h-3" />
                                Recurring
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{meeting.description}</p>
                          
                          {/* Tags */}
                          {meeting.tags && meeting.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {meeting.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant={getStatusBadge(meeting.status).variant} className="gap-1">
                            {getStatusBadge(meeting.status).icon}
                            {getStatusBadge(meeting.status).text}
                          </Badge>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelectedMeeting(meeting)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Meeting
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel Meeting
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span>{meeting.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{formatTime(meeting.time)} ({meeting.duration}m)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(meeting.type)}
                          <span>
                            {meeting.type === 'online' ? 
                              meetingPlatforms.find(p => p.value === meeting.meetingLinks?.primary)?.label || 'Online'
                              : meeting.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{meeting.attendees.length} attendees</span>
                        </div>
                      </div>
                      
                      {/* Attendees */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Attendees</Label>
                        <div className="flex flex-wrap gap-2">
                          {meeting.attendees.slice(0, 5).map((attendee, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-sm">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${attendee.name}`} />
                                <AvatarFallback className="text-xs">
                                  {attendee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{attendee.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {attendee.status}
                              </Badge>
                            </div>
                          ))}
                          {meeting.attendees.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{meeting.attendees.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-2">
                          {(meeting.type === 'online' || meeting.type === 'hybrid') && meeting.meetingLinks && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleJoinMeeting(meeting)}
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Join Meeting
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Bell className="w-4 h-4 mr-1" />
                            Remind
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share className="w-4 h-4 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>

        {/* New Meeting Dialog */}
        <Dialog open={showNewMeetingDialog} onOpenChange={setShowNewMeetingDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Schedule New Meeting
              </DialogTitle>
              <DialogDescription>
                Create a new meeting with advanced scheduling options and integrations
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="attendees">Attendees</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="approval">Approval</TabsTrigger>
              </TabsList>
              
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Meeting Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter meeting title"
                      value={newMeeting.title}
                      onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newMeeting.category} onValueChange={(value: MeetingCategory) => setNewMeeting({...newMeeting, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="recruitment">Recruitment</SelectItem>
                        <SelectItem value="disciplinary">Disciplinary</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Select value={newMeeting.time} onValueChange={(value) => setNewMeeting({...newMeeting, time: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{formatTime(time)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={newMeeting.duration?.toString()} onValueChange={(value) => setNewMeeting({...newMeeting, duration: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Meeting Type</Label>
                    <Select value={newMeeting.type} onValueChange={(value: MeetingType) => setNewMeeting({...newMeeting, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online Only</SelectItem>
                        <SelectItem value="physical">Physical Only</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newMeeting.priority} onValueChange={(value: MeetingPriority) => setNewMeeting({...newMeeting, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {(newMeeting.type === 'online' || newMeeting.type === 'hybrid') && (
                  <div className="space-y-2">
                    <Label>Meeting Platform</Label>
                    <Select value={newMeeting.location} onValueChange={(value) => setNewMeeting({...newMeeting, location: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {meetingPlatforms.filter(p => p.value !== 'physical').map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            <div className="flex items-center gap-2">
                              {platform.icon}
                              {platform.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description & Agenda</Label>
                  <Textarea
                    id="description"
                    placeholder="Meeting agenda, objectives, and important notes..."
                    value={newMeeting.description}
                    onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                    rows={4}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="recurring" 
                    checked={newMeeting.isRecurring}
                    onCheckedChange={(checked) => setNewMeeting({...newMeeting, isRecurring: !!checked})}
                  />
                  <Label htmlFor="recurring" className="flex items-center gap-2">
                    <Repeat className="w-4 h-4" />
                    Make this a recurring meeting
                  </Label>
                </div>
              </TabsContent>
              
              {/* Attendees Tab */}
              <TabsContent value="attendees" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Select Attendees</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Available Staff</Label>
                    <ScrollArea className="h-64 border rounded-md p-2">
                      {availableAttendees.map((person) => (
                        <div key={person.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${person.name}`} />
                              <AvatarFallback className="text-xs">
                                {person.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{person.name}</p>
                              <p className="text-xs text-muted-foreground">{person.role}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addAttendee(person)}
                            disabled={newMeeting.attendees?.some(a => a.id === person.id)}
                          >
                            <UserPlus className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Selected Attendees ({newMeeting.attendees?.length || 0})</Label>
                    <ScrollArea className="h-64 border rounded-md p-2">
                      {newMeeting.attendees?.map((attendee) => (
                        <div key={attendee.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${attendee.name}`} />
                              <AvatarFallback className="text-xs">
                                {attendee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{attendee.name}</p>
                              <p className="text-xs text-muted-foreground">{attendee.role}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeAttendee(attendee.id)}
                          >
                            <UserMinus className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Meeting Settings</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <Label className="text-sm font-medium">Email Notifications</Label>
                          <p className="text-xs text-muted-foreground">Receive updates via email</p>
                        </div>
                      </div>
                      <Switch 
                        checked={newMeeting.notifications?.email} 
                        onCheckedChange={(checked) => setNewMeeting({
                          ...newMeeting, 
                          notifications: {...newMeeting.notifications!, email: checked}
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <Label className="text-sm font-medium">Push Notifications</Label>
                          <p className="text-xs text-muted-foreground">Browser and mobile notifications</p>
                        </div>
                      </div>
                      <Switch 
                        checked={newMeeting.notifications?.push} 
                        onCheckedChange={(checked) => setNewMeeting({
                          ...newMeeting, 
                          notifications: {...newMeeting.notifications!, push: checked}
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <Label className="text-sm font-medium">SMS Alerts</Label>
                          <p className="text-xs text-muted-foreground">Critical updates via SMS</p>
                        </div>
                      </div>
                      <Switch 
                        checked={newMeeting.notifications?.sms} 
                        onCheckedChange={(checked) => setNewMeeting({
                          ...newMeeting, 
                          notifications: {...newMeeting.notifications!, sms: checked}
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        <div>
                          <Label className="text-sm font-medium">WhatsApp Notifications</Label>
                          <p className="text-xs text-muted-foreground">Receive updates via WhatsApp</p>
                        </div>
                      </div>
                      <Switch 
                        checked={newMeeting.notifications?.whatsapp} 
                        onCheckedChange={(checked) => setNewMeeting({
                          ...newMeeting, 
                          notifications: {...newMeeting.notifications!, whatsapp: checked}
                        })}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Reminder Settings</Label>
                    <div className="space-y-2">
                      {newMeeting.notifications?.reminders?.map((reminder, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            <span className="text-sm">
                              {reminder.timing >= 1440 ? `${reminder.timing / 1440} day(s)` : 
                               reminder.timing >= 60 ? `${reminder.timing / 60} hour(s)` : 
                               `${reminder.timing} minute(s)`} before
                            </span>
                          </div>
                          <Switch checked={reminder.enabled} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Approval Tab */}
              <TabsContent value="approval" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Approval Workflow</h3>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Require Approval</Label>
                    <p className="text-xs text-muted-foreground">Meeting needs approval before sending invites</p>
                  </div>
                  <Switch 
                    checked={approvalWorkflow.isRequired}
                    onCheckedChange={(checked) => setApprovalWorkflow({
                      ...approvalWorkflow, 
                      isRequired: checked
                    })}
                  />
                </div>
                
                {approvalWorkflow.isRequired && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Approval Required</AlertTitle>
                    <AlertDescription>
                      This meeting will be sent to the appropriate authorities for approval before invites are sent.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowNewMeetingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMeeting} disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Conflict Resolution Dialog */}
        <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Scheduling Conflicts Detected
              </DialogTitle>
              <DialogDescription>
                The selected time conflicts with existing meetings. Review conflicts and suggestions below.
              </DialogDescription>
            </DialogHeader>
            
            {conflicts && (
              <div className="space-y-4">
                {conflicts.conflicts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Conflicts:</h4>
                    <div className="space-y-2">
                      {conflicts.conflicts.map((conflict, index) => (
                        <div key={index} className="p-2 border rounded-md bg-red-50">
                          <p className="text-sm font-medium">{conflict.attendeeName}</p>
                          <p className="text-xs text-muted-foreground">
                            Has meeting "{conflict.meetingTitle}" at the same time
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {conflicts.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Suggested Alternative Times:</h4>
                    <div className="space-y-2">
                      {conflicts.suggestions.slice(0, 3).map((suggestion, index) => (
                        <div key={index} className="p-2 border rounded-md bg-green-50 cursor-pointer hover:bg-green-100"
                             onClick={() => {
                               setNewMeeting({...newMeeting, date: suggestion.date, time: suggestion.time});
                               setShowConflictDialog(false);
                             }}>
                          <p className="text-sm font-medium">
                            {suggestion.date} at {formatTime(suggestion.time)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Availability Score: {Math.round(suggestion.availabilityScore * 100)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConflictDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowConflictDialog(false);
                handleCreateMeeting();
              }}>
                Schedule Anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Suggestions Dialog */}
        <Dialog open={showAISuggestionsDialog} onOpenChange={setShowAISuggestionsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                AI Scheduling Suggestions
              </DialogTitle>
              <DialogDescription>
                Smart recommendations based on attendee availability and preferences
              </DialogDescription>
            </DialogHeader>
            
            {aiSuggestions && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiSuggestions.recommendedSlots.slice(0, 4).map((slot, index) => (
                    <div key={index} className="p-3 border rounded-lg cursor-pointer hover:bg-accent"
                         onClick={() => {
                           setNewMeeting({...newMeeting, date: slot.date, time: slot.time, duration: slot.duration});
                           setShowAISuggestionsDialog(false);
                         }}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{slot.date}</h4>
                        <Badge variant="outline">{Math.round(slot.availabilityScore * 100)}% available</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(slot.time)} • {slot.duration} minutes
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {slot.conflictCount} conflicts
                      </p>
                    </div>
                  ))}
                </div>
                
                {aiSuggestions.conflictAnalysis && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Conflict Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Best time range: {aiSuggestions.conflictAnalysis.bestTimeRange.start} - {aiSuggestions.conflictAnalysis.bestTimeRange.end}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reason: {aiSuggestions.conflictAnalysis.bestTimeRange.reason}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAISuggestionsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Live Meeting Request Modal */}
        <LiveMeetingRequestModal
          isOpen={showLiveMeetingModal}
          onClose={() => setShowLiveMeetingModal(false)}
          documentId="meeting-scheduler"
          documentType="report"
          documentTitle="LiveConnect+ Request"
        />
      </div>
    </TooltipProvider>
  );
}