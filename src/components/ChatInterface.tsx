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
  SendHorizontal,
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
  AlertTriangle,
  Mic,
  MicOff,
  Menu,
  PanelRightOpen,
  PanelLeftOpen,
  X,
  Plus,
  UserPlus,
  UserRoundPlus
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
  const [showMembers, setShowMembers] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelRecipients, setNewChannelRecipients] = useState<string[]>([]);
  const [isPrivateChannel, setIsPrivateChannel] = useState(false);
  const [showAddRecipientsModal, setShowAddRecipientsModal] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

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

  const handleVoiceRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioFile = new File([audioBlob], `voice-${Date.now()}.wav`, { type: 'audio/wav' });
          
          if (activeChannel && user) {
            try {
              const fileUrl = await chatService.uploadFile(audioFile, activeChannel.id);
              
              const messageData = {
                channelId: activeChannel.id,
                senderId: user.id,
                type: 'audio' as MessageType,
                content: 'Voice message',
                attachments: [{
                  id: Date.now().toString(),
                  name: audioFile.name,
                  url: fileUrl,
                  type: 'audio' as MessageType,
                  size: audioFile.size,
                  mimeType: audioFile.type
                }]
              };

              const message = await chatService.sendMessage(messageData);
              setMessages(prev => [...prev, message]);
              scrollToBottom();
              
              toast({
                title: 'Voice message sent',
                description: 'Your voice message has been sent successfully',
                variant: 'default'
              });
            } catch (error) {
              toast({
                title: 'Upload Failed',
                description: 'Failed to send voice message',
                variant: 'destructive'
              });
            }
          }
          
          stream.getTracks().forEach(track => track.stop());
        };

        setMediaRecorder(recorder);
        recorder.start();
        setIsRecording(true);
        
        toast({
          title: 'Recording started',
          description: 'Click the mic again to stop recording',
          variant: 'default'
        });
      } catch (error) {
        toast({
          title: 'Recording failed',
          description: 'Could not access microphone',
          variant: 'destructive'
        });
      }
    } else {
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
        setMediaRecorder(null);
      }
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
      default: return <Lock className="w-4 h-4 text-yellow-500" />;
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
            "inline-block p-3 rounded-lg",
            message.metadata.pollId ? "max-w-full" : "max-w-[80%]",
            isOwnMessage 
              ? "bg-gray-200 text-gray-900" 
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
                  <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold text-base">{message.content.replace('Poll created: ', '')}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">Select one</p>
                      
                      <div className="space-y-2">
                        {['Option 1', 'Option 2', 'Option 3'].map((option, idx) => {
                          const voteCount = Math.floor(Math.random() * 10);
                          const percentage = Math.floor(Math.random() * 100);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center gap-2 cursor-pointer hover:bg-white/50 p-2 rounded">
                                <div className="w-4 h-4 border-2 border-blue-600 rounded-full flex items-center justify-center">
                                  {idx === 0 && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                                </div>
                                <span className="text-sm flex-1">{option}</span>
                                <span className="text-xs text-muted-foreground">{voteCount}</span>
                              </div>
                              <div className="ml-6">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${percentage}%`}}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <Button size="sm" variant="outline" className="w-full mt-3">
                        View votes
                      </Button>
                    </div>
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
    <div className={cn(
      "border-r bg-muted/20 flex flex-col transition-all duration-300 ease-in-out",
      showSidebar ? "w-64" : "w-0 overflow-hidden"
    )}>
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
      
      <div className="p-2 border-t">
        <Button
          size="sm"
          variant="ghost"
          className="w-full justify-center"
          onClick={() => setShowSidebar(false)}
        >
          <PanelLeftOpen className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn("flex h-full bg-background", className)}>
      <ChannelSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Members Panel */}
        {showMembers && activeChannel && (
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold mb-3">Channel Members ({activeChannel.members.length})</h3>
            <div className="flex flex-wrap gap-2">
              {activeChannel.members.map(memberId => {
                const member = users.find(u => u.id === memberId) || { id: memberId, fullName: 'Unknown User', role: 'member' };
                return (
                  <div key={memberId} className="flex items-center gap-2 p-2 bg-background rounded border">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {member.fullName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.fullName}</span>
                    <Badge variant="outline" className="text-xs">{member.role}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Channel Header */}
        {activeChannel && (
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeChannel.isPrivate ? (
                  <>
                    {!showSidebar && (
                      <Button size="sm" variant="ghost" onClick={() => setShowSidebar(true)}>
                        <PanelRightOpen className="w-5 h-5" />
                      </Button>
                    )}
                    <Lock className="w-5 h-5" />
                  </>
                ) : (
                  <Hash className="w-5 h-5" />
                )}
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
                <Button size="sm" variant="ghost" onClick={() => setShowNewChannelModal(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddRecipientsModal(true)}>
                  <UserPlus className="w-4 h-4" />
                </Button>
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
            {messages
              .filter(message => 
                !searchQuery || 
                message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (users.find(u => u.id === message.senderId)?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(message => (
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
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPollModal(true)}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-4 h-4" />
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
                className="min-h-[40px] max-h-[120px] resize-none pr-10"
              />
              <Button
                size="sm"
                variant={isRecording ? "destructive" : "ghost"}
                onClick={handleVoiceRecording}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 ${isRecording ? "animate-pulse" : ""}`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 p-3 bg-background border rounded-lg shadow-lg z-10">
                  <div className="grid grid-cols-8 gap-1 w-64">
                    {['👍','👎','😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setMessageInput(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="p-1 hover:bg-muted rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <SendHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* New Channel Modal */}
      <AlertDialog open={showNewChannelModal} onOpenChange={setShowNewChannelModal}>
        <AlertDialogContent className="max-w-2xl">
          <button
            onClick={() => setShowNewChannelModal(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-500" />
              Create New Channel
            </AlertDialogTitle>
            <AlertDialogDescription>
              Create a new chat channel and add recipients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Channel Name</label>
              <Input
                placeholder="Enter channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Add Recipients</label>
              <ScrollArea className="h-64 border rounded-md p-2">
                {[{id: 'principal', name: 'Dr. Principal', role: 'Principal'}, {id: 'registrar', name: 'Prof. Registrar', role: 'Registrar'}, {id: 'hod-cse', name: 'Dr. HOD-CSE', role: 'HOD'}].map((person) => (
                  <div key={person.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
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
                      onClick={() => {
                        if (newChannelRecipients.includes(person.id)) {
                          setNewChannelRecipients(newChannelRecipients.filter(id => id !== person.id));
                        } else {
                          setNewChannelRecipients([...newChannelRecipients, person.id]);
                        }
                      }}
                    >
                      {newChannelRecipients.includes(person.id) ? 'Remove' : 'Add'}
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </div>
            {newChannelRecipients.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Selected Recipients ({newChannelRecipients.length})</label>
                <div className="flex flex-wrap gap-2">
                  {newChannelRecipients.map(id => (
                    <div key={id} className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full">
                      <UserRoundPlus className="w-4 h-4" />
                      <span className="text-sm font-medium">{id.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setNewChannelName('');
              setNewChannelRecipients([]);
              setIsPrivateChannel(false);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (newChannelName.trim() && newChannelRecipients.length > 0) {
                  toast({
                    title: 'Channel Created',
                    description: `${newChannelName} has been created successfully`,
                    variant: 'default'
                  });
                  setNewChannelName('');
                  setNewChannelRecipients([]);
                  setIsPrivateChannel(false);
                  setShowNewChannelModal(false);
                }
              }}
              disabled={!newChannelName.trim() || newChannelRecipients.length === 0}
            >
              Create Channel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Recipients Modal */}
      <AlertDialog open={showAddRecipientsModal} onOpenChange={setShowAddRecipientsModal}>
        <AlertDialogContent className="max-w-2xl">
          <button
            onClick={() => setShowAddRecipientsModal(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              Add Recipients
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select recipients to start a direct chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Available Staff</label>
              <ScrollArea className="h-64 border rounded-md p-2">
                {[{id: 'principal', name: 'Dr. Principal', role: 'Principal'}, {id: 'registrar', name: 'Prof. Registrar', role: 'Registrar'}, {id: 'hod-cse', name: 'Dr. HOD-CSE', role: 'HOD'}, {id: 'hod-eee', name: 'Dr. HOD-EEE', role: 'HOD'}, {id: 'dean', name: 'Dr. Dean', role: 'Dean'}].map((person) => (
                  <div key={person.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
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
                      onClick={() => {
                        if (selectedRecipients.includes(person.id)) {
                          setSelectedRecipients(selectedRecipients.filter(id => id !== person.id));
                        } else {
                          setSelectedRecipients([...selectedRecipients, person.id]);
                        }
                      }}
                    >
                      {selectedRecipients.includes(person.id) ? 'Remove' : 'Add'}
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </div>
            {selectedRecipients.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Selected Recipients ({selectedRecipients.length})</label>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipients.map(id => (
                    <div key={id} className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full">
                      <UserRoundPlus className="w-4 h-4" />
                      <span className="text-sm font-medium">{id.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedRecipients([]);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (selectedRecipients.length > 0 && user) {
                  const newChannel: ChatChannel = {
                    id: `dm-${Date.now()}`,
                    name: selectedRecipients.map(id => id.toUpperCase()).join(', '),
                    members: [user.id, ...selectedRecipients],
                    isPrivate: true,
                    createdAt: new Date(),
                    createdBy: user.id
                  };
                  setChannels(prev => [newChannel, ...prev]);
                  setActiveChannel(newChannel);
                  toast({
                    title: 'Chat Started',
                    description: `Started chat with ${selectedRecipients.length} recipient(s)`,
                    variant: 'default'
                  });
                  setSelectedRecipients([]);
                  setShowAddRecipientsModal(false);
                }
              }}
              disabled={selectedRecipients.length === 0}
            >
              Start Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Poll Creation Modal */}
      <AlertDialog open={showPollModal} onOpenChange={setShowPollModal}>
        <AlertDialogContent>
          <button
            onClick={() => setShowPollModal(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Poll</AlertDialogTitle>
            <AlertDialogDescription>
              Create a poll for the channel members to vote on.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Poll Question</label>
              <Input
                placeholder="What's your question?"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                className="px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Options</label>
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...pollOptions];
                      newOptions[index] = e.target.value;
                      setPollOptions(newOptions);
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="mt-2"
              >
                + Add Option
              </Button>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPollTitle('');
              setPollOptions(['', '']);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const validOptions = pollOptions.filter(opt => opt.trim());
                if (pollTitle.trim() && validOptions.length >= 2) {
                  handleCreatePoll(pollTitle.trim(), validOptions);
                  setPollTitle('');
                  setPollOptions(['', '']);
                  setShowPollModal(false);
                }
              }}
              disabled={!pollTitle.trim() || pollOptions.filter(opt => opt.trim()).length < 2}
            >
              Create Poll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
