import { DashboardLayout } from "@/components/DashboardLayout";
import { NotesReminders } from "@/components/NotesReminders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/ChatInterface";
import { LiveMeetingRequestManager } from "@/components/LiveMeetingRequestManager";
import { DecentralizedChatService } from "@/services/DecentralizedChatService";
import { useAuth } from "@/contexts/AuthContext";
import { 
  MessageCircle, 
  Users, 
  BarChart3, 
  PenTool, 
  Zap, 
  MessageSquare,
  Hash,
  Lock,
  Video,
  FileText,
  Calendar,
  Clock,
  User,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Monitor,
  Building,
  Wifi,
  MapPin,
  Globe
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Messages = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [chatService] = useState(() => new DecentralizedChatService(
    import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
    import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  ));

  // Communication stats with real-time message counts
  const [stats, setStats] = useState({
    unreadMessages: 26, // Total from all channels
    pendingSignatures: 2,
    activePolls: 1,
    onlineUsers: 23,
    totalChannels: 5,
    notifications: 4,
    liveMeetingRequests: 3
  });

  // Channel message counts
  const [channelMessageCounts, setChannelMessageCounts] = useState({
    'Administrative Council': 9,
    'Faculty Board': 5,
    'General': 12
  });

  // LiveMeet+ requests state
  const [liveMeetRequests, setLiveMeetRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Simulate real-time message updates
    const messageInterval = setInterval(() => {
      setChannelMessageCounts(prev => {
        const channels = Object.keys(prev);
        const randomChannel = channels[Math.floor(Math.random() * channels.length)];
        const newCounts = { ...prev };
        newCounts[randomChannel] = prev[randomChannel] + 1;
        
        // Update total unread messages
        const totalMessages = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
        setStats(prevStats => ({ ...prevStats, unreadMessages: totalMessages }));
        
        return newCounts;
      });
    }, 5000); // Update every 5 seconds

    return () => {
      clearInterval(messageInterval);
    };

    // Load LiveMeet+ requests from localStorage
    const loadLiveMeetRequests = () => {
      const requests = JSON.parse(localStorage.getItem('livemeet-requests') || '[]');
      setLiveMeetRequests(requests);
      setStats(prev => ({ ...prev, liveMeetingRequests: requests.length }));
    };

    loadLiveMeetRequests();

    // Listen for storage changes to update requests in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'livemeet-requests') {
        loadLiveMeetRequests();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      chatService.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, chatService]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  if (!user) {
    return null; // This should be handled by ProtectedRoute, but adding as safety
  }

  return (
    <DashboardLayout userRole={user.role} onLogout={handleLogout}>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Communication Center</h1>
          <p className="text-muted-foreground">Messages, notes, and reminders for collaborative work</p>
        </div>

        <Tabs defaultValue="notes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes">Notes & Reminders</TabsTrigger>
            <TabsTrigger value="chat" className="relative">
              Department Chat
              {stats.unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                  {stats.unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="live-requests" className="relative">
              <div className="flex items-center space-x-2">
                <div className="relative w-4 h-4">
                  <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full"></div>
                  <div className="absolute inset-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <span>LiveMeet+</span>
              </div>
              {stats.liveMeetingRequests > 0 && (
                <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs animate-pulse">
                  {stats.liveMeetingRequests}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notes" className="space-y-6">
            <NotesReminders userRole={user.role} isMessagesPage={true} />
          </TabsContent>

          <TabsContent value="live-requests" className="space-y-6">
            <LiveMeetingRequestManager />
          </TabsContent>
          
          <TabsContent value="chat" className="space-y-6">
            {/* Communication Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Messages</p>
                      <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Online</p>
                      <p className="text-2xl font-bold">{stats.onlineUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Channels</p>
                      <p className="text-2xl font-bold">{stats.totalChannels}</p>
                    </div>
                    <Lock className="w-8 h-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Video Call</p>
                      <p className="text-2xl font-bold">{stats.pendingSignatures}</p>
                    </div>
                    <Video className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Polls</p>
                      <p className="text-2xl font-bold">{stats.activePolls}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Live</span>
                      </div>
                    </div>
                    <Zap className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Chat Interface */}
            <Card className="min-h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Department Communication Hub
                </CardTitle>
                <CardDescription>
                  Real-time chat, document workflows, and collaboration tools
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <ChatInterface channelMessageCounts={channelMessageCounts} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Messages;