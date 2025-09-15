import React, { useState, useEffect } from 'react';
import { X, Clock, Users, MapPin, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';
import { liveMeetingService } from '../services/LiveMeetingService';
import { CreateLiveMeetingRequestDto, PURPOSE_CONFIGS, URGENCY_CONFIGS } from '../types/liveMeeting';

interface LiveMeetingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentType: 'letter' | 'circular' | 'report';
  documentTitle: string;
}

interface Participant {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  avatar?: string;
}

export const LiveMeetingRequestModal: React.FC<LiveMeetingRequestModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentType,
  documentTitle
}) => {
  const [meetingFormat, setMeetingFormat] = useState<'in_person' | 'online' | 'hybrid'>('online');
  const [urgency, setUrgency] = useState<'immediate' | 'urgent' | 'normal'>('normal');
  const [purpose, setPurpose] = useState<'clarification' | 'approval_discussion' | 'document_review' | 'urgent_decision'>('clarification');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([]);
  const [agenda, setAgenda] = useState('');
  const [location, setLocation] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTimeSlot, setRequestedTimeSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  const { toast } = useToast();

  // Time slots for meeting scheduling
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    if (isOpen) {
      loadAvailableParticipants();
    }
  }, [isOpen]);

  const loadAvailableParticipants = async () => {
    try {
      setLoadingParticipants(true);
      const currentUserRole = 'employee'; // This would come from auth context
      const participants = await liveMeetingService.getAvailableParticipants(currentUserRole);
      setAvailableParticipants(participants);
    } catch (error) {
      console.error('Error loading participants:', error);
      toast({
        title: "Error",
        description: "Failed to load available participants",
        variant: "destructive"
      });
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleParticipantToggle = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleSubmitRequest = async () => {
    if (selectedParticipants.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one participant",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const requestData: CreateLiveMeetingRequestDto = {
        documentId,
        documentType,
        documentTitle,
        targetUserIds: selectedParticipants,
        urgency,
        meetingFormat,
        purpose,
        agenda: agenda.trim() || undefined,
        requestedTime: requestedDate && requestedTimeSlot ? new Date(`${requestedDate}T${requestedTimeSlot}:00`) : undefined,
        location: meetingFormat === 'in_person' ? location : undefined
      };

      await liveMeetingService.createRequest(requestData);

      toast({
        title: "Request Sent!",
        description: `Live meeting request sent successfully. ${URGENCY_CONFIGS[urgency].description} response expected.`,
        variant: "default"
      });

      // Reset form and close modal
      handleClose();
    } catch (error) {
      console.error('Error creating live meeting request:', error);
      toast({
        title: "Error",
        description: "Failed to send live meeting request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setMeetingFormat('online');
    setUrgency('normal');
    setPurpose('clarification');
    setSelectedParticipants([]);
    setAgenda('');
    setLocation('');
    setRequestedTime('');
    setRequestedDate('');
    setRequestedTimeSlot('');
    onClose();
  };

  const urgencyConfig = URGENCY_CONFIGS[urgency];
  const purposeConfig = PURPOSE_CONFIGS[purpose];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            🔴 LiveConnect+
          </DialogTitle>
          <DialogDescription>
            Request immediate clarification meeting for document review and discussion
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left Column - Meeting Details */}
          <div className="space-y-6">
            {/* Meeting Purpose */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Meeting Purpose</Label>
              <Select value={purpose} onValueChange={(value: any) => setPurpose(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PURPOSE_CONFIGS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{(config as any).icon}</span>
                        <span>{(config as any).label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">{purposeConfig.description}</p>
            </div>

            {/* Urgency Level */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Urgency Level</Label>
              <RadioGroup value={urgency} onValueChange={(value: any) => setUrgency(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="flex items-center gap-2 text-red-600">
                    <span>🔥</span>
                    <span className="font-medium">Immediate</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent" className="flex items-center gap-2 text-orange-600">
                    <span>⚡</span>
                    <span className="font-medium">Urgent</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="flex items-center gap-2 text-blue-600">
                    <span>📅</span>
                    <span className="font-medium">Normal</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Meeting Format */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Meeting Format</Label>
              <RadioGroup value={meetingFormat} onValueChange={(value: any) => setMeetingFormat(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="flex items-center gap-2">
                    💻 Online
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in_person" id="in_person" />
                  <Label htmlFor="in_person" className="flex items-center gap-2">
                    🏢 In-Person
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="hybrid" />
                  <Label htmlFor="hybrid" className="flex items-center gap-2">
                    🔄 Hybrid (Online + In-Person)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Location (for in-person meetings) */}
            {(meetingFormat === 'in_person' || meetingFormat === 'hybrid') && (
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Meeting Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Principal's Office, Conference Room A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            )}

            {/* Preferred Time */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Preferred Time
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requestedDate">Date</Label>
                  <Input
                    id="requestedDate"
                    type="date"
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requestedTimeSlot">Time</Label>
                  <Select value={requestedTimeSlot} onValueChange={setRequestedTimeSlot}>
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
            </div>
          </div>

          {/* Right Column - Participants & Agenda */}
          <div className="space-y-6">
            {/* Participant Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Participants
              </Label>
              
              {loadingParticipants ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="w-24 h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="w-32 h-3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
                  {availableParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedParticipants.includes(participant.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-transparent'
                      } border`}
                      onClick={() => handleParticipantToggle(participant.id)}
                    >
                      <Checkbox
                        checked={selectedParticipants.includes(participant.id)}
                        onChange={() => handleParticipantToggle(participant.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback>
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{participant.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {participant.role} • {participant.department}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedParticipants.length > 0 && (
                <p className="text-sm text-green-600">
                  {selectedParticipants.length} participant(s) selected
                </p>
              )}
            </div>

            {/* Agenda */}
            <div className="space-y-2">
              <Label htmlFor="agenda" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Agenda/Context (Optional)
              </Label>
              <Textarea
                id="agenda"
                placeholder="Brief description of what needs to be discussed..."
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRequest} 
            disabled={loading || selectedParticipants.length === 0}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Sending...
              </>
            ) : (
              <>🔴 Send Live Request</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
