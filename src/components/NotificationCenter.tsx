import { useState, useEffect } from "react";
import { notificationService, type Notification } from "../services/NotificationService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Calendar, 
  AlertTriangle,
  X,
  Settings,
  Mail,
  Smartphone,
  MessageCircle,
  Phone
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NotificationCenterProps {
  userRole: string;
}

export function NotificationCenter({ userRole }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Initialize with mock data
    const mockNotifications = [
      {
        id: "1",
        title: "Document Approved",
        message: "Your Faculty Recruitment Authorization has been approved by Principal",
        type: "approval" as const,
        timestamp: "2 minutes ago",
        read: false,
        urgent: false,
        documentId: "DOC-2024-001"
      },
      {
        id: "2", 
        title: "New Document Submission",
        message: "Dr. Sharma has submitted a new report for your review",
        type: "submission" as const,
        timestamp: "15 minutes ago",
        read: false,
        urgent: true,
        documentId: "DOC-2024-002"
      },
      {
        id: "3",
        title: "Meeting Reminder",
        message: "Faculty meeting scheduled for tomorrow at 10:00 AM",
        type: "meeting" as const,
        timestamp: "1 hour ago",
        read: true,
        urgent: false
      },
      {
        id: "4",
        title: "Emergency Document",
        message: "Urgent circular requires immediate attention",
        type: "emergency" as const,
        timestamp: "2 hours ago",
        read: false,
        urgent: true,
        documentId: "DOC-2024-003"
      }
    ];
    
    // Get dynamic notifications and merge with mock data
    const dynamicNotifications = notificationService.getNotifications();
    setNotifications([...dynamicNotifications, ...mockNotifications]);

    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications([...updatedNotifications, ...mockNotifications]);
    });

    return unsubscribe;
  }, []);

  const [settings, setSettings] = useState({
    immediateAlerts: true,
    dailyDigest: false,
    weeklyReport: true
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approval": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "submission": return <FileText className="w-4 h-4 text-primary" />;
      case "reminder": return <Clock className="w-4 h-4 text-warning" />;
      case "emergency": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "meeting": return <Calendar className="w-4 h-4 text-info" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
  };

  const deleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== id);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
  };

  const clearAll = () => {
    localStorage.setItem('notifications', JSON.stringify([]));
    setNotifications([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-xs text-primary-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Notification Settings</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <Label>Immediate Alerts</Label>
                          </div>
                          <Switch
                            checked={settings.immediateAlerts}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, immediateAlerts: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Daily Digest</Label>
                          <Switch
                            checked={settings.dailyDigest}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, dailyDigest: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Weekly Report</Label>
                          <Switch
                            checked={settings.weeklyReport}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, weeklyReport: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
            
            {notifications.length > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{notifications.length} total notifications</span>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear all
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div 
                        className={`p-4 hover:bg-muted/50 cursor-pointer ${
                          !notification.read ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                                {notification.urgent && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    Urgent
                                  </Badge>
                                )}
                              </h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {notification.timestamp}
                              </span>
                              {notification.documentId && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.documentId}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}