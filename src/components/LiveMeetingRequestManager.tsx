import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, Search, TrendingUp, Clock, Users, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
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
            🔴 LiveMeet+
            {filteredRequests.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {filteredRequests.filter(r => r.status === 'pending').length} pending
              </Badge>
            )}
          </h3>
          <p className="text-gray-600 mt-1">
            Real-time communication requests for document workflows
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
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search requests by title, requester, or purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="immediate">🔥 Immediate</SelectItem>
              <SelectItem value="urgent">⚡ Urgent</SelectItem>
              <SelectItem value="today">📅 Today</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl">📭</div>
                <h3 className="text-lg font-medium text-gray-900">No live meeting requests</h3>
                <p className="text-gray-500">
                  {searchTerm || filter !== 'all' 
                    ? 'No requests match your current filters' 
                    : 'No active live meeting requests at the moment'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map(request => (
            <LiveMeetingRequestCard
              key={request.id}
              request={request}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          ))
        )}
      </div>

      {/* Quick Actions */}
      {filteredRequests.filter(r => r.status === 'pending').length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Quick Actions</h4>
              <p className="text-sm text-blue-700">
                {filteredRequests.filter(r => r.status === 'pending').length} requests awaiting your response
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Accept All Normal
              </Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                Review Urgent First
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
