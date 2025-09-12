import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DecentralizedChatService } from '@/services/DecentralizedChatService';
import { 
  ChatChannel, 
  ChatMessage, 
  ChatUser, 
  MessageType,
  ChatNotification,
  SignatureRequest,
  ChatPoll
} from '@/types/chat';
import { cn } from '@/lib/utils';
import {
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  Settings,
  Search,
  Hash,
  Lock,
  Users,
  Bell,
  BellOff,
  Pin,
  MoreVertical,
  Reply,
  Edit,
  Trash2,
  FileText,
  Image,
  Download,
  Eye,
  ThumbsUp,
  MessageSquare,
  PenTool,
  BarChart3,
  Zap,
  Shield,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface ChatInterfaceProps {
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Chat service
  const [chatService] = useState(() => new DecentralizedChatService(
    import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
    import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  ));

  // State
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  
  // UI State
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  // Initialize chat service
  useEffect(() => {
    if (!user) return;

    const initChat = async () => {
      // Initialize role-based channels
      await chatService.initializeRoleBasedChannels(user as ChatUser);
      
      // Load user channels
      const userChannels = await chatService.getChannels(user.id);
      setChannels(userChannels);
      
      if (userChannels.length > 0) {
        setActiveChannel(userChannels[0]);
      }
    };

    initChat();

    // Set up event listeners
    chatService.on('connected', () => {
      setConnectionStatus('connected');
      toast({
        title: 'Connected',
        description: 'Chat service connected successfully',
        variant: 'default'
      });
    });

    chatService.on('disconnected', () => {
      setConnectionStatus('disconnected');
    });

    chatService.on('offline-mode', () => {
      setConnectionStatus('offline');
      toast({
        title: 'Offline Mode',
        description: 'Chat is now in offline mode. Messages will sync when connection is restored.',
        variant: 'default'
      });
    });

    chatService.on('message-received', (message: ChatMessage) => {
      if (!activeChannel || message.channelId === activeChannel.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      
      // Show notification if not in active channel
      if (!activeChannel || message.channelId !== activeChannel.id) {
        showNotification({
          title: 'New Message',
          message: message.content,
          channelId: message.channelId
        });
      }
    });

    chatService.on('user-typing', (data: { userId: string, channelId: string }) => {
      if (activeChannel?.id === data.channelId) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }, 3000);
      }
    });

    chatService.on('notification', (notification: ChatNotification) => {
      setNotifications(prev => [notification, ...prev]);
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.priority === 'urgent' ? 'destructive' : 'default'
        });
      }
    });

    return () => {
      chatService.disconnect();
    };
  }, [user]);

  // Load messages when active channel changes
  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel.id);
    }
  }, [activeChannel]);

  const loadMessages = async (channelId: string) => {
    const channelMessages = await chatService.getMessages(channelId);
    setMessages(channelMessages);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChannel || !user) return;

    const messageData = {
      channelId: activeChannel.id,
      senderId: user.id,
      type: 'text' as MessageType,
      content: messageInput.trim(),
      parentMessageId: replyingTo?.id
    };

    try {
      const message = await chatService.sendMessage(messageData);
      setMessages(prev => [...prev, message]);
      setMessageInput('');
      setReplyingTo(null);
      scrollToBottom();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeChannel || !user) return;

    try {
      const fileUrl = await chatService.uploadFile(file, activeChannel.id);
      
      const messageData = {
        channelId: activeChannel.id,
        senderId: user.id,
        type: getFileType(file),
        content: `Shared ${file.name}`,
        attachments: [{
          id: Date.now().toString(),
          name: file.name,
          url: fileUrl,
          type: getFileType(file),
          size: file.size,
          mimeType: file.type
        }]
      };

      const message = await chatService.sendMessage(messageData);
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload file',
        variant: 'destructive'
      });
    }
  };

  const getFileType = (file: File): MessageType => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.includes('pdf') || file.type.includes('document')) return 'document';
    return 'file';
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await chatService.editMessage(messageId, newContent);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent, editedAt: new Date() }
          : msg
      ));
      setEditingMessage(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to edit message',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive'
      });
    }
  };

  const handleCreateSignatureRequest = async () => {
    if (!activeChannel || !user) return;

    const signatureRequest = {
      messageId: '',
      documentId: 'temp-doc-id',
      requestedBy: user.id,
      targetUsers: activeChannel.members,
      title: 'Signature Required',
      description: 'Please review and sign this document',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    try {
      const request = await chatService.createSignatureRequest(signatureRequest);
      
      const messageData = {
        channelId: activeChannel.id,
        senderId: user.id,
        type: 'signature-request' as MessageType,
        content: 'Signature request created',
        metadata: {
          signatureRequestId: request.id
        }
      };

      const message = await chatService.sendMessage(messageData);
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create signature request',
        variant: 'destructive'
      });
    }
  };

  const handleCreatePoll = async (title: string, options: string[]) => {
    if (!activeChannel || !user) return;

    const poll = {
      channelId: activeChannel.id,
      createdBy: user.id,
      title,
      options: options.map((option, index) => ({
        id: `option-${index}`,
        text: option,
        votes: []
      })),
      type: 'single-choice' as const
    };

    try {
      const createdPoll = await chatService.createPoll(poll);
      
      const messageData = {
        channelId: activeChannel.id,
        senderId: user.id,
        type: 'poll' as MessageType,
        content: `Poll created: ${title}`,
        metadata: {
          pollId: createdPoll.id
        }
      };

      const message = await chatService.sendMessage(messageData);
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create poll',
        variant: 'destructive'
      });
    }
  };

  const showNotification = (notification: Partial<ChatNotification>) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'New Message', {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-500" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="w-3 h-3 text-blue-500" />;
      case 'read': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-3 h-3 text-red-500" />;
      default: return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: Date | string | number) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const MessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isOwnMessage = message.senderId === user?.id;
    const sender = users.find(u => u.id === message.senderId);

    return (
      <div className={cn(
        "flex gap-3 p-2 hover:bg-muted/50 group",
        isOwnMessage && "flex-row-reverse"
      )}>
        <Avatar className="w-8 h-8">
          <AvatarImage src={sender?.avatar} />
          <AvatarFallback>
            {sender?.fullName?.substring(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className={cn("flex-1 min-w-0", isOwnMessage && "text-right")}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {isOwnMessage ? 'You' : sender?.fullName || 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(message.timestamp)}
            </span>
            {message.editedAt && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
            {getMessageStatusIcon(message.status)}
          </div>
          
          {message.parentMessageId && (
            <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted rounded">
              Replying to a message
            </div>
          )}
          
          <div className={cn(
            "inline-block max-w-[80%] p-3 rounded-lg",
            isOwnMessage 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          )}>
            {editingMessage?.id === message.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editingMessage.content}
                  onChange={(e) => setEditingMessage({...editingMessage, content: e.target.value})}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEditMessage(message.id, editingMessage.content)}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingMessage(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map(attachment => (
                      <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        {attachment.type === 'image' ? (
                          <Image className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        <span className="text-sm">{attachment.name}</span>
                        <Button size="sm" variant="ghost">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {message.metadata.signatureRequestId && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border">
                    <div className="flex items-center gap-2">
                      <PenTool className="w-4 h-4" />
                      <span className="text-sm font-medium">Signature Request</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please review and sign the attached document
                    </p>
                    <Button size="sm" className="mt-2">
                      View & Sign
                    </Button>
                  </div>
                )}
                
                {message.metadata.pollId && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded border">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm font-medium">Poll Created</span>
                    </div>
                    <Button size="sm" className="mt-2">
                      Vote Now
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          
          {message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1">
              {message.reactions.map(reaction => (
                <Button
                  key={reaction.emoji}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                >
                  {reaction.emoji} {reaction.count}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setReplyingTo(message)}>
                <Reply className="w-4 h-4 mr-2" />
                Reply
              </DropdownMenuItem>
              {isOwnMessage && (
                <>
                  <DropdownMenuItem onClick={() => setEditingMessage(message)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteMessage(message.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem>
                <ThumbsUp className="w-4 h-4 mr-2" />
                React
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const ChannelSidebar: React.FC = () => (
    <div className="w-64 border-r bg-muted/20 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Channels</h3>
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {channels.map(channel => (
            <Button
              key={channel.id}
              variant={activeChannel?.id === channel.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveChannel(channel)}
            >
              <div className="flex items-center gap-2">
                {channel.isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                <span className="truncate">{channel.name}</span>
                {notifications.filter(n => n.channelId === channel.id && !n.read).length > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {notifications.filter(n => n.channelId === channel.id && !n.read).length}
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className={cn("flex h-full bg-background", className)}>
      <ChannelSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        {activeChannel && (
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeChannel.isPrivate ? <Lock className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                <div>
                  <h2 className="font-semibold">{activeChannel.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {activeChannel.members.length} members
                    {typingUsers.length > 0 && (
                      <span className="ml-2">
                        • {typingUsers.length} typing...
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowSearch(!showSearch)}>
                  <Search className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Video className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Users className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleCreateSignatureRequest}>
                      <PenTool className="w-4 h-4 mr-2" />
                      Request Signature
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCreatePoll('Quick Poll', ['Yes', 'No'])}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Create Poll
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        {showSearch && (
          <div className="p-4 border-b bg-muted/20">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        )}
        
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {messages.map(message => (
              <MessageComponent key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Reply Bar */}
        {replyingTo && (
          <div className="p-2 bg-muted/50 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4" />
              <span className="text-sm">Replying to {replyingTo.content}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
              ×
            </Button>
          </div>
        )}
        
        {/* Message Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.xlsx,.xls"
              aria-label="Upload file"
            />
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 relative">
              <Textarea
                placeholder={`Message ${activeChannel?.name || 'channel'}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[40px] max-h-[120px] resize-none"
              />
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
