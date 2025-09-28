import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Clock, 
  Calendar, 
  MessageSquare, 
  Zap, 
  AlertTriangle, 
  Activity, 
  Monitor, 
  MapPin, 
  Wifi, 
  ChevronDown,
  Send,
  Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
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
  const [purposeDropdownOpen, setPurposeDropdownOpen] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');

  const { toast } = useToast();

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

  const handleAddParticipant = () => {
    if (newParticipantName.trim() && newParticipantEmail.trim()) {
      const newParticipant: Participant = {
        id: `custom_${Date.now()}`,
        name: newParticipantName.trim(),
        role: 'external',
        email: newParticipantEmail.trim(),
        department: 'External'
      };
      
      setAvailableParticipants(prev => [...prev, newParticipant]);
      setSelectedParticipants(prev => [...prev, newParticipant.id]);
      setNewParticipantName('');
      setNewParticipantEmail('');
      setShowAddParticipant(false);
      
      toast({
        title: "Participant Added",
        description: `${newParticipant.name} has been added to the meeting`,
        variant: "default"
      });
    }
  };

  const purposeOptions = [
    'Need Clarification',
    'Document Review',
    'Project Discussion',
    'Status Update',
    'Approval Required'
  ];

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'immediate': return <Zap className="w-4 h-4" />;
      case 'urgent': return <AlertTriangle className="w-4 h-4" />;
      case 'normal': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'immediate': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'online': return <Monitor className="w-4 h-4" />;
      case 'in_person': return <MapPin className="w-4 h-4" />;
      case 'hybrid': return <Wifi className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
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
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-6xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg h-[75vh] p-0 bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white relative rounded-t-lg overflow-hidden">
          <button 
            className="absolute right-6 top-6 text-white hover:text-gray-200 transition-colors"
            onClick={handleClose}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">LiveMeet+</h1>
              <p className="text-indigo-100 text-sm">Request Immediate Clarification Meeting for Document Review and Discussion</p>
            </div>
          </div>
        </div>

        <div className="flex bg-white shadow-xl h-[calc(75vh-100px)] overflow-hidden">

          {/* Main Form Section */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Meeting Purpose */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 text-lg font-semibold text-gray-800 mb-4">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span>Meeting Purpose</span>
              </label>
              
              <div className="relative">
                <button
                  onClick={() => setPurposeDropdownOpen(!purposeDropdownOpen)}
                  className="w-full bg-white border-2 border-emerald-300 rounded-xl px-4 py-4 text-left flex items-center justify-between hover:border-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-medium text-gray-800">{purposeOptions.find(p => p.toLowerCase().replace(' ', '_') === purpose) || 'Need Clarification'}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${purposeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {purposeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                    {purposeOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setPurpose(option.toLowerCase().replace(' ', '_') as any);
                          setPurposeDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mt-2">Requires Clarification on Document Content</p>
            </div>

            {/* Urgency Level */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 text-lg font-semibold text-gray-800 mb-4">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>Urgency Level</span>
              </label>
              
              <div className="space-y-3">
                {['normal', 'urgent', 'immediate'].map((level) => (
                  <label key={level} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="urgency"
                      value={level}
                      checked={urgency === level}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all group-hover:shadow-md ${
                      urgency === level 
                        ? getUrgencyColor(level) + ' border-current' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        urgency === level ? 'bg-white bg-opacity-50' : 'bg-gray-100'
                      }`}>
                        {getUrgencyIcon(level)}
                      </div>
                      <span className="font-medium">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Meeting Format */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 text-lg font-semibold text-gray-800 mb-4">
                <Monitor className="w-5 h-5 text-indigo-600" />
                <span>Meeting Format</span>
              </label>
              
              <div className="space-y-3">
                {[{value: 'online', label: 'Online'}, {value: 'in_person', label: 'In-Person'}, {value: 'hybrid', label: 'Hybrid (Online + In-Person)'}].map((format) => (
                  <label key={format.value} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="format"
                      value={format.value}
                      checked={meetingFormat === format.value}
                      onChange={(e) => setMeetingFormat(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all group-hover:shadow-md ${
                      meetingFormat === format.value 
                        ? 'text-indigo-600 bg-indigo-50 border-indigo-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        meetingFormat === format.value ? 'bg-white bg-opacity-50' : 'bg-gray-100'
                      }`}>
                        {getFormatIcon(format.value)}
                      </div>
                      <span className="font-medium">{format.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Location (for in-person meetings) */}
            {(meetingFormat === 'in_person' || meetingFormat === 'hybrid') && (
              <div className="space-y-2 mb-6">
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

            {/* Date & Time */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 text-lg font-semibold text-gray-800 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Preferred Date & Time</span>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={requestedDate}
                      onChange={(e) => setRequestedDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={requestedTimeSlot}
                      onChange={(e) => setRequestedTimeSlot(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button 
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                onClick={handleSubmitRequest}
                disabled={loading || selectedParticipants.length === 0}
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Sending...' : 'Send Live Request'}</span>
              </button>
            </div>
          </div>

          {/* Participants Section */}
          <div className="w-72 bg-gray-50 p-4 border-l border-gray-200 overflow-y-auto">
            <div className="mb-4">
              <label className="flex items-center space-x-2 text-lg font-semibold text-gray-800 mb-4">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Select Participants</span>
              </label>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableParticipants.map((participant) => (
                  <label key={participant.id} className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(participant.id)}
                      onChange={() => handleParticipantToggle(participant.id)}
                      className="sr-only"
                    />
                    <div className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all w-full group-hover:shadow-sm ${
                      selectedParticipants.includes(participant.id) 
                        ? 'border-indigo-200 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        selectedParticipants.includes(participant.id) 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {participant.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{participant.name}</p>
                        <p className="text-xs text-gray-500 truncate">{participant.role.toUpperCase()} • {participant.department.toUpperCase()}</p>
                      </div>
                      {selectedParticipants.includes(participant.id) && (
                        <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              
              <button 
                className="mt-4 flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium"
                onClick={() => setShowAddParticipant(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Add participant</span>
              </button>
              
              {/* Add Participant Form */}
              {showAddParticipant && (
                <div className="mt-4 p-4 bg-white border-2 border-indigo-200 rounded-xl">
                  <h4 className="font-medium text-gray-800 mb-3">Add New Participant</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Full Name"
                      value={newParticipantName}
                      onChange={(e) => setNewParticipantName(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Email Address"
                      type="email"
                      value={newParticipantEmail}
                      onChange={(e) => setNewParticipantEmail(e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddParticipant}
                        disabled={!newParticipantName.trim() || !newParticipantEmail.trim()}
                        className="flex-1"
                      >
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAddParticipant(false);
                          setNewParticipantName('');
                          setNewParticipantEmail('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Agenda Section */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 text-lg font-semibold text-gray-800 mb-4">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span>Agenda/Context</span>
                <span className="text-sm text-gray-500 font-normal">(Optional)</span>
              </label>
              
              <textarea
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="Brief description of what needs to be discussed..."
                className="w-full h-16 px-3 py-2 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
              />
            </div>
          </div>
        </div>


        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
};
