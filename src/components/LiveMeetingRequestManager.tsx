import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, Search, TrendingUp, Clock, Users, AlertTriangle, FileText, User, Calendar, CheckCircle, XCircle, Eye, Download, ChevronRight, Zap, Activity, MessageSquare, Settings, Monitor, MapPin, Globe, CircleAlert, Building, Wifi, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useToast } from '../hooks/use-toast';
import { LiveMeetingRequestCard } from './LiveMeetingRequestCard';
import { liveMeetingService } from '../services/LiveMeetingService';
import { LiveMeetingRequest, LiveMeetingStats, LiveMeetingResponse } from '../types/liveMeeting';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, description }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className={`p-2 bg-${color}-100 rounded-lg`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);



export const LiveMeetingRequestManager: React.FC = () => {
  const [activeRequests, setActiveRequests] = useState<LiveMeetingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LiveMeetingRequest[]>([]);
  const [stats, setStats] = useState<LiveMeetingStats | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadLiveMeetingRequests();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activeRequests, filter, searchTerm]);

  const loadLiveMeetingRequests = async () => {
    try {
      setLoading(true);
      const requests = await liveMeetingService.getMyRequests();
      setActiveRequests(requests);
    } catch (error) {
      console.error('Error loading live meeting requests:', error);
      toast({
        title: "Error",
        description: "Failed to load live meeting requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await liveMeetingService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadLiveMeetingRequests(), loadStats()]);
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Live meeting requests updated",
      variant: "default"
    });
  };

  const applyFilters = () => {
    let filtered = activeRequests;

    // Apply status/urgency filter
    if (filter !== 'all') {
      filtered = filtered.filter(request => {
        switch (filter) {
          case 'pending':
            return request.status === 'pending';
          case 'urgent':
            return request.urgency === 'urgent';
          case 'immediate':
            return request.urgency === 'immediate';
          case 'today':
            const today = new Date().toDateString();
            return new Date(request.createdAt).toDateString() === today;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.purpose.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response: LiveMeetingResponse = {
        requestId,
        response: 'accept',
        message: 'Request accepted'
      };

      await liveMeetingService.respondToRequest(response);
      
      // Update local state
      setActiveRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'accepted' as const, responseTime: new Date() }
            : req
        )
      );

      toast({
        title: "Meeting Accepted",
        description: "Meeting request accepted successfully. Meeting link will be generated.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error accepting meeting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept meeting request",
        variant: "destructive"
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const response: LiveMeetingResponse = {
        requestId,
        response: 'decline',
        message: 'Request declined'
      };

      await liveMeetingService.respondToRequest(response);
      
      // Update local state
      setActiveRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected' as const, responseTime: new Date() }
            : req
        )
      );

      toast({
        title: "Meeting Declined",
        description: "Meeting request declined successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error declining meeting request:', error);
      toast({
        title: "Error",
        description: "Failed to decline meeting request",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full"></div>
              <div className="absolute inset-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            LiveMeet+
            {filteredRequests.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {filteredRequests.filter(r => r.status === 'pending').length} pending
              </Badge>
            )}
          </h3>
          <p className="text-gray-600 mt-1">
            Real-Time Communication Requests for Document Workflows
          </p>
        </div>
        
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Pending LiveMeet+"
            value={stats.pendingRequests}
            icon={<Clock className="h-5 w-5 text-yellow-600" />}
            color="yellow"
            description="Awaiting response"
          />
          <StatsCard
            title="Immediate"
            value={stats.immediateRequests}
            icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
            color="red"
            description="Within 15 minutes"
          />
          <StatsCard
            title="Today's LiveMeet+"
            value={stats.todaysMeetings}
            icon={<Users className="h-5 w-5 text-blue-600" />}
            color="blue"
            description="Scheduled today"
          />
          <StatsCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            color="green"
            description="Acceptance rate"
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search requests by title, requester, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">All Pendings</SelectItem>
              <SelectItem value="normal">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Normal</span>
                </div>
              </SelectItem>
              <SelectItem value="urgent">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span>Urgent</span>
                </div>
              </SelectItem>
              <SelectItem value="immediate">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-600" />
                  <span>Immediate</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>



      {/* Requests List */}
      <div className="space-y-4">
        {/* All LiveMeet+ Request Cards - Properly positioned below search bar */}
        <div className="space-y-4">
          {/* Dynamic LiveMeet+ Request Cards from localStorage */}
          {JSON.parse(localStorage.getItem('livemeet-requests') || '[]').map((request: any) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-0">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <div className="relative w-4 h-4">
                              <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full"></div>
                              <div className="absolute inset-1 w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                            {request.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              request.type === 'circular' ? 'bg-blue-100 text-blue-800' :
                              request.type === 'letter' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              <FileText className="h-3 w-3" />
                              {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                              <Calendar className="h-3 w-3" />
                              {request.submittedDate} {request.submittedTime}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <Badge variant="warning">Pending</Badge>
                        <Badge variant="outline" className={`font-semibold flex items-center gap-1 ${
                          request.priority === 'immediate' ? 'text-red-600' :
                          request.priority === 'urgent' ? 'text-orange-600' :
                          'text-blue-600'
                        }`}>
                          {request.priority === 'immediate' && <Zap className="w-3 h-3" />}
                          {request.priority === 'urgent' && <AlertTriangle className="w-3 h-3" />}
                          {request.priority === 'normal' && <Activity className="w-3 h-3" />}
                          {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span className="font-medium">From:</span> {request.submitter}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Date:</span> {request.requestedDate || new Date().toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">Meeting Purpose:</span> 
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {request.purpose}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Time: From:</span> {request.startTime || '10:00 AM'} — To: {request.endTime || '11:00 AM'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">Meeting Format:</span> 
                          <div className="flex items-center gap-1">
                            {request.meetingFormat === 'online' && <><Monitor className="h-4 w-4" /> Online</>}
                            {request.meetingFormat === 'in_person' && <><Building className="h-4 w-4" /> In-Person</>}
                            {request.meetingFormat === 'hybrid' && <><Wifi className="h-4 w-4" /> Hybrid</>}
                          </div>
                        </div>
                        {request.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">Meeting Location:</span> 
                            <div className="flex items-center gap-1">
                              <Globe className="h-4 w-4" />
                              {request.location}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">Description & Agenda</span>
                      </div>
                      <div className="bg-muted p-3 rounded text-sm">
                        <p>{request.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[150px]">
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button variant="outline" size="sm">
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Original Dynamic Live Meeting Request Cards */}
          {filteredRequests.map(request => (
            <LiveMeetingRequestCard
              key={request.id}
              request={request}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          ))}
            
            {/* Additional Static Cards from Approval Center */}
            {/* Faculty Meeting Minutes – Q4 2024 Card */}
            {((!searchTerm || 
              'Faculty Meeting Minutes – Q4 2024'.toLowerCase().includes(searchTerm.toLowerCase()) ||
              'Prof. Michael Chen'.toLowerCase().includes(searchTerm.toLowerCase()) ||
              'Need Clarification'.toLowerCase().includes(searchTerm.toLowerCase())
            ) && (
              filter === 'all' || 
              filter === 'pending' || 
              filter === 'immediate'
            )) && (
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-0">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <div className="relative w-4 h-4">
                              <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full"></div>
                              <div className="absolute inset-1 w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                            Faculty Meeting Minutes – Q4 2024
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              <FileText className="h-3 w-3" />
                              Circular
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                              <Calendar className="h-3 w-3" />
                              2024-01-15
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <Badge variant="warning">Pending</Badge>
                        <Badge variant="outline" className="text-red-600 font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Immediate
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span className="font-medium">From:</span> Prof. Michael Chen • HOD
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Date:</span> 09/26/2025
                        </div>
                        <div className="flex items-center gap-1">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">Meeting Purpose:</span> 
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Need Clarification
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Time: From:</span> 10:56 AM — To: 11:56 AM
                        </div>
                        <div className="md:col-span-2 flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">Meeting Format:</span> 
                          <div className="flex items-center gap-1">
                            <Monitor className="h-4 w-4" />
                            Online
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">Description & Agenda</span>
                      </div>
                      <div className="bg-muted p-3 rounded text-sm">
                        <p>Add a risk-mitigation section to highlight potential delays or issues.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[150px]">
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button variant="outline" size="sm">
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Budget Request – Lab Equipment Card */}
            {((!searchTerm || 
              'Budget Request – Lab Equipment'.toLowerCase().includes(searchTerm.toLowerCase()) ||
              'Prof. David Brown'.toLowerCase().includes(searchTerm.toLowerCase()) ||
              'Need Clarification'.toLowerCase().includes(searchTerm.toLowerCase())
            ) && (
              filter === 'all' || 
              filter === 'pending' || 
              filter === 'urgent'
            )) && (
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-0">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <div className="relative w-4 h-4">
                              <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full"></div>
                              <div className="absolute inset-1 w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                            Budget Request – Lab Equipment
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              <FileText className="h-3 w-3" />
                              Letter
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                              <Calendar className="h-3 w-3" />
                              2024-01-13
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <Badge variant="warning">Pending</Badge>
                        <Badge variant="outline" className="text-orange-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Urgent
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span className="font-medium">From:</span> Prof. Michael Chen • HOD
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Date:</span> 09/26/2025
                        </div>
                        <div className="flex items-center gap-1">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">Meeting Purpose:</span> 
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Need Clarification
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Time: From:</span> 10:56 AM — To: 11:56 AM
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">Meeting Format:</span> 
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            In-Person
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">Meeting Location:</span> 
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            Conference Room A
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">Description & Agenda</span>
                      </div>
                      <div className="bg-muted p-3 rounded text-sm">
                        <p>Consider revising the scope to focus on priority items within this quarter's budget.</p>
                      </div>
                    </div>
                    

                  </div>
                  <div className="flex flex-col gap-2 min-w-[150px]">
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button variant="outline" size="sm">
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
        </div>
      </div>
    </div>
  );
};
