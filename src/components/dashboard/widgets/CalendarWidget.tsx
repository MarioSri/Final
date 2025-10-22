import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Video,
  Plus,
  Bell,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  attendees: string[];
  location: string;
  type: 'in-person' | 'virtual';
  status: 'confirmed' | 'pending' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  organizer: string;
  requiresApproval: boolean;
  linkedDocuments: string[];
}

interface CalendarWidgetProps {
  userRole: string;
  permissions: any;
  isCustomizing?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  userRole,
  permissions,
  isCustomizing,
  onSelect,
  isSelected
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch meetings
    const fetchMeetings = async () => {
      setLoading(true);
      
      const mockMeetings: Meeting[] = [
        {
          id: '1',
          title: 'Faculty Recruitment Review',
          description: 'Review applications for new CSE faculty positions',
          date: '2024-01-18',
          time: '10:00 AM',
          duration: 90,
          attendees: ['Principal', 'Registrar', 'HOD-CSE', 'HR Head'],
          location: 'Conference Room A',
          type: 'in-person',
          status: 'confirmed',
          priority: 'high',
          organizer: 'Principal',
          requiresApproval: false,
          linkedDocuments: ['DOC-2024-001']
        },
        {
          id: '2',
          title: 'Emergency Infrastructure Meeting',
          description: 'Urgent discussion about Block A electrical issues',
          date: '2024-01-17',
          time: '2:00 PM',
          duration: 60,
          attendees: ['Principal', 'Registrar', 'Maintenance Head', 'Finance Head'],
          location: 'Principal Office',
          type: 'in-person',
          status: 'confirmed',
          priority: 'emergency',
          organizer: 'Principal',
          requiresApproval: false,
          linkedDocuments: ['DOC-2024-003']
        },
        {
          id: '3',
          title: 'Monthly Academic Review - EEE',
          description: 'Review academic performance and curriculum updates',
          date: '2024-01-19',
          time: '11:00 AM',
          duration: 120,
          attendees: ['HOD-EEE', 'Program Heads', 'Academic Cell'],
          location: 'Virtual Meeting',
          type: 'virtual',
          status: 'pending',
          priority: 'medium',
          organizer: 'HOD-EEE',
          requiresApproval: userRole === 'principal' || userRole === 'registrar',
          linkedDocuments: ['DOC-2024-004']
        },
        {
          id: '4',
          title: 'Budget Planning Session',
          description: 'Q2 budget allocation and planning',
          date: '2024-01-20',
          time: '9:00 AM',
          duration: 180,
          attendees: ['Principal', 'Registrar', 'All HODs', 'Finance Team'],
          location: 'Auditorium',
          type: 'in-person',
          status: 'confirmed',
          priority: 'high',
          organizer: 'Registrar',
          requiresApproval: false,
          linkedDocuments: []
        }
      ];

      // Filter meetings based on role
      const filteredMeetings = mockMeetings.filter(meeting => {
        if (userRole === 'employee') {
          return meeting.attendees.includes('All Employees') || 
                 meeting.attendees.includes(user?.department || '');
        }
        if (userRole === 'hod') {
          return meeting.attendees.includes(`HOD-${user?.branch}`) ||
                 meeting.attendees.includes('All HODs') ||
                 meeting.organizer === `HOD-${user?.branch}`;
        }
        if (userRole === 'program-head') {
          return meeting.attendees.includes('Program Heads') ||
                 meeting.attendees.includes(`${user?.branch} Program Head`);
        }
        return true; // Principal and Registrar see all
      });

      setTimeout(() => {
        setMeetings(filteredMeetings);
        setLoading(false);
      }, 600);
    };

    fetchMeetings();
  }, [userRole, user]);

  const getUpcomingMeetings = () => {
    const today = new Date();
    return meetings
      .filter(meeting => new Date(meeting.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, isMobile ? 3 : 5);
  };

  const getTodaysMeetings = () => {
    const today = new Date().toISOString().split('T')[0];
    return meetings.filter(meeting => meeting.date === today);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: { variant: "success" as const, text: "Confirmed" },
      pending: { variant: "warning" as const, text: "Pending Approval" },
      cancelled: { variant: "destructive" as const, text: "Cancelled" }
    };
    return variants[status as keyof typeof variants] || { variant: "default" as const, text: status };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'text-red-600 animate-pulse';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const upcomingMeetings = getUpcomingMeetings();
  const todaysMeetings = getTodaysMeetings();
  const pendingApprovals = meetings.filter(m => m.requiresApproval && m.status === 'pending').length;

  if (loading) {
    return (
      <Card className={cn(
        "shadow-elegant",
        isSelected && "border-primary",
        isCustomizing && "cursor-pointer"
      )} onClick={onSelect}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Calendar & Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "shadow-elegant hover:shadow-glow transition-all duration-300",
      isSelected && "border-primary",
      isCustomizing && "cursor-pointer"
    )} onClick={onSelect}>
      <CardHeader className={cn(isMobile && "pb-3")}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "flex items-center gap-2",
            isMobile ? "text-lg" : "text-xl"
          )}>
            <CalendarIcon className="w-5 h-5 text-primary" />
            Calendar & Meetings
            {pendingApprovals > 0 && (
              <Badge variant="warning" className="animate-pulse">
                {pendingApprovals} pending
              </Badge>
            )}
          </CardTitle>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/calendar")}
            className={cn(isMobile && "text-xs")}
          >
            <Plus className="w-4 h-4 mr-1" />
            Schedule
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Today's Meetings */}
        {todaysMeetings.length > 0 && (
          <div>
            <h4 className={cn(
              "font-semibold mb-2 flex items-center gap-2",
              isMobile ? "text-sm" : "text-base"
            )}>
              <Clock className="w-4 h-4 text-primary" />
              Today's Meetings ({todaysMeetings.length})
            </h4>
            <div className="space-y-2">
              {todaysMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className={cn(
                    "p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer",
                    meeting.priority === 'emergency' && "border-destructive bg-red-50"
                  )}
                  onClick={() => navigate(`/calendar/${meeting.id}`)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h5 className={cn(
                      "font-medium",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {meeting.title}
                    </h5>
                    <Badge variant={getStatusBadge(meeting.status).variant} className="text-xs">
                      {getStatusBadge(meeting.status).text}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {meeting.time}
                    </div>
                    <div className="flex items-center gap-1">
                      {meeting.type === 'virtual' ? (
                        <Video className="w-3 h-3" />
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                      {meeting.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className={cn("w-3 h-3", getPriorityColor(meeting.priority))} />
                      <span className={getPriorityColor(meeting.priority)}>
                        {meeting.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Meetings */}
        <div>
          <h4 className={cn(
            "font-semibold mb-2 flex items-center gap-2",
            isMobile ? "text-sm" : "text-base"
          )}>
            <CalendarIcon className="w-4 h-4 text-primary" />
            Upcoming Meetings
          </h4>
          
          <div className="space-y-2">
            {upcomingMeetings.slice(0, isMobile ? 2 : 3).map((meeting, index) => (
              <div
                key={meeting.id}
                className={cn(
                  "p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer animate-fade-in",
                  meeting.priority === 'emergency' && "border-destructive bg-red-50",
                  meeting.requiresApproval && "border-l-4 border-l-warning"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/calendar/${meeting.id}`)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h5 className={cn(
                    "font-medium line-clamp-1",
                    isMobile ? "text-sm" : "text-base"
                  )}>
                    {meeting.title}
                  </h5>
                  <Badge variant={getStatusBadge(meeting.status).variant} className="text-xs">
                    {getStatusBadge(meeting.status).text}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {meeting.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {meeting.time}
                  </div>
                  <div className="flex items-center gap-1">
                    {meeting.type === 'virtual' ? (
                      <Video className="w-3 h-3" />
                    ) : (
                      <MapPin className="w-3 h-3" />
                    )}
                    <span className="truncate">{meeting.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {meeting.attendees.length} attendees
                  </div>
                </div>

                {/* Approval Required */}
                {meeting.requiresApproval && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-warning/10 rounded border border-warning/20">
                    <Bell className="w-3 h-3 text-warning" />
                    <span className="text-xs font-medium text-warning">
                      Approval Required
                    </span>
                  </div>
                )}

                {/* Linked Documents */}
                {meeting.linkedDocuments.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">Linked:</span>
                    {meeting.linkedDocuments.map((docId, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {docId}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {upcomingMeetings.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className={cn(isMobile ? "text-sm" : "text-base")}>
                  No upcoming meetings
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Calendar View */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className="text-center text-xs font-medium text-muted-foreground p-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i - 7);
              const dateStr = date.toISOString().split('T')[0];
              const dayMeetings = meetings.filter(m => m.date === dateStr);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              
              return (
                <div
                  key={i}
                  className={cn(
                    "p-1 text-center cursor-pointer rounded transition-colors",
                    isToday ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                    dayMeetings.length > 0 && "border border-primary/50"
                  )}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className={cn(
                    "text-xs font-medium",
                    isMobile && "text-xs"
                  )}>
                    {date.getDate()}
                  </div>
                  {dayMeetings.length > 0 && (
                    <div className="flex justify-center">
                      <div className={cn(
                        "w-1 h-1 rounded-full",
                        dayMeetings.some(m => m.priority === 'emergency') ? "bg-red-500" :
                        dayMeetings.some(m => m.priority === 'high') ? "bg-orange-500" : "bg-blue-500"
                      )} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Widget Footer */}
        <div className="flex items-center justify-center pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{meetings.length} meetings</span>
            {pendingApprovals > 0 && (
              <span className="text-warning font-medium">
                {pendingApprovals} need approval
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};