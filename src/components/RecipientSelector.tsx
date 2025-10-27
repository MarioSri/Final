import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Users, 
  UserCheck, 
  Building, 
  Crown, 
  X,
  Check,
  Minus,
  ArrowRight,
  Plus
} from "lucide-react";

interface Recipient {
  id: string;
  name: string;
  role: string;
  department?: string;
  branch?: string;
  year?: string;
  email: string;
}

interface RecipientGroup {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  recipients: Recipient[];
  expanded?: boolean;
}

interface RecipientSelectorProps {
  userRole: 'Principal' | 'Registrar' | 'HOD' | 'Program Head' | 'Employee' | string;
  selectedRecipients: string[];
  onRecipientsChange: (recipients: string[]) => void;
  maxSelections?: number;
}

const branches = ['EEE', 'MECH', 'CSE', 'ECE', 'CSM', 'CSO', 'CSD', 'CSC'];
const years = ['1st', '2nd', '3rd', '4th'];

// Mock data generation
const generateRecipients = (userRole: string): RecipientGroup[] => {
  const createRecipient = (name: string, role: string, dept?: string, branch?: string, year?: string): Recipient => ({
    id: `${role.toLowerCase().replace(/\s+/g, '-')}-${name.toLowerCase().replace(/\s+/g, '-')}-${branch || ''}${year || ''}`.replace(/[-]+/g, '-'),
    name,
    role,
    department: dept,
    branch,
    year,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@hitam.org`
  });

  if (userRole === 'Principal') {
    return [
      {
        id: 'cdc-employees',
        title: 'CDC Department Employees',
        icon: Users,
        recipients: [
          createRecipient('Dr. CDC Head', 'CDC Head', 'Career Development Center'),
          createRecipient('Prof. CDC Coordinator', 'CDC Coordinator', 'Career Development Center'),
          createRecipient('Ms. CDC Executive', 'CDC Executive', 'Career Development Center')
        ]
      },
      {
        id: 'leadership',
        title: 'Leadership',
        icon: Crown,
        recipients: [
          createRecipient('Dr. Robert Principal', 'Principal', 'Administration'),
          createRecipient('Prof. Sarah Registrar', 'Registrar', 'Administration'),
          createRecipient('Dr. Maria Dean', 'Dean', 'Academic Affairs'),
          createRecipient('Mr. David Chairman', 'Chairman', 'Board'),
          createRecipient('Ms. Lisa Director', 'Director (For Information)', 'Operations'),
          createRecipient('Prof. Leadership Officer', 'Leadership', 'Administration')
        ]
      },
      {
        id: 'administrative',
        title: 'Administrative Roles',
        icon: UserCheck,
        recipients: [
          createRecipient('Dr. Robert Controller', 'Controller of Examinations', 'Examinations'),
          createRecipient('Prof. Asst Dean', 'Asst. Dean IIIC', 'Academic Affairs'),
          createRecipient('Mr. Michael Operations', 'Head Operations', 'Operations'),
          createRecipient('Ms. Jennifer Librarian', 'Librarian', 'Library'),
          createRecipient('Prof. William SSG', 'SSG', 'Student Services')
        ]
      },
      {
        id: 'faculty',
        title: 'Faculty (All Branches & Years)',
        icon: Users,
        recipients: branches.flatMap(branch => 
          years.map(year => createRecipient(`Dr. ${branch} Faculty`, 'Faculty', `${branch} Department`, branch, year))
        )
      },
      {
        id: 'program-heads',
        title: 'Program Department Heads (All Branches)',
        icon: UserCheck,
        recipients: branches.map(branch => 
          createRecipient(`Prof. ${branch} Head`, 'Program Department Head', `${branch} Department`, branch)
        )
      },
      {
        id: 'hods',
        title: 'HODs (All Branches)',
        icon: Building,
        recipients: branches.map(branch => 
          createRecipient(`Dr. ${branch} HOD`, 'HOD', `${branch} Department`, branch)
        )
      }
    ];
  } else if (userRole === 'Program Head' || userRole === 'program-head') {
    return [
      {
        id: 'cdc-employees',
        title: 'CDC Department Employees',
        icon: Users,
        recipients: [
          createRecipient('Dr. CDC Head', 'CDC Head', 'Career Development Center'),
          createRecipient('Prof. CDC Coordinator', 'CDC Coordinator', 'Career Development Center'),
          createRecipient('Ms. CDC Executive', 'CDC Executive', 'Career Development Center')
        ]
      },
      {
        id: 'leadership',
        title: 'Leadership',
        icon: Crown,
        recipients: [
          createRecipient('Dr. Robert Principal', 'Principal', 'Administration'),
          createRecipient('Prof. Sarah Registrar', 'Registrar', 'Administration'),
          createRecipient('Dr. Maria Dean', 'Dean', 'Academic Affairs'),
          createRecipient('Mr. David Chairman', 'Chairman', 'Board'),
          createRecipient('Ms. Lisa Director', 'Director (For Information)', 'Operations'),
          createRecipient('Prof. Leadership Officer', 'Leadership', 'Administration')
        ]
      },
      {
        id: 'administrative',
        title: 'Administrative Roles',
        icon: UserCheck,
        recipients: [
          createRecipient('Dr. Robert Controller', 'Controller of Examinations', 'Examinations'),
          createRecipient('Prof. Asst Dean', 'Asst. Dean IIIC', 'Academic Affairs'),
          createRecipient('Mr. Michael Operations', 'Head Operations', 'Operations'),
          createRecipient('Ms. Jennifer Librarian', 'Librarian', 'Library'),
          createRecipient('Prof. William SSG', 'SSG', 'Student Services')
        ]
      },
      {
        id: 'faculty',
        title: 'Faculty (All Branches & Years)',
        icon: Users,
        recipients: branches.flatMap(branch => 
          years.map(year => createRecipient(`Dr. ${branch} Faculty`, 'Faculty', `${branch} Department`, branch, year))
        )
      },
      {
        id: 'program-heads',
        title: 'Program Department Heads (All Branches)',
        icon: UserCheck,
        recipients: branches.map(branch => 
          createRecipient(`Prof. ${branch} Head`, 'Program Department Head', `${branch} Department`, branch)
        )
      },
      {
        id: 'hods',
        title: 'HODs (All Branches)',
        icon: Building,
        recipients: branches.map(branch => 
          createRecipient(`Dr. ${branch} HOD`, 'HOD', `${branch} Department`, branch)
        )
      }
    ];
  } else {
    // Employee view - comprehensive recipients
    return [
      {
        id: 'cdc-employees',
        title: 'CDC Department Employees',
        icon: Users,
        recipients: [
          createRecipient('Dr. CDC Head', 'CDC Head', 'Career Development Center'),
          createRecipient('Prof. CDC Coordinator', 'CDC Coordinator', 'Career Development Center'),
          createRecipient('Ms. CDC Executive', 'CDC Executive', 'Career Development Center')
        ]
      },
      {
        id: 'leadership',
        title: 'Leadership',
        icon: Crown,
        recipients: [
          createRecipient('Dr. Robert Principal', 'Principal', 'Administration'),
          createRecipient('Prof. Sarah Registrar', 'Registrar', 'Administration'),
          createRecipient('Dr. Maria Dean', 'Dean', 'Academic Affairs'),
          createRecipient('Mr. David Chairman', 'Chairman', 'Board'),
          createRecipient('Ms. Lisa Director', 'Director (For Information)', 'Operations'),
          createRecipient('Prof. Leadership Officer', 'Leadership', 'Administration')
        ]
      },
      {
        id: 'administrative',
        title: 'Administrative Roles',
        icon: UserCheck,
        recipients: [
          createRecipient('Dr. Robert Controller', 'Controller of Examinations', 'Examinations'),
          createRecipient('Prof. Asst Dean', 'Asst. Dean IIIC', 'Academic Affairs'),
          createRecipient('Mr. Michael Operations', 'Head Operations', 'Operations'),
          createRecipient('Ms. Jennifer Librarian', 'Librarian', 'Library'),
          createRecipient('Prof. William SSG', 'SSG', 'Student Services')
        ]
      },
      {
        id: 'faculty',
        title: 'Faculty (All Branches & Years)',
        icon: Users,
        recipients: branches.flatMap(branch => 
          years.map(year => createRecipient(`Dr. ${branch} Faculty`, 'Faculty', `${branch} Department`, branch, year))
        )
      },
      {
        id: 'program-heads',
        title: 'Program Department Heads (All Branches)',
        icon: UserCheck,
        recipients: branches.map(branch => 
          createRecipient(`Prof. ${branch} Head`, 'Program Department Head', `${branch} Department`, branch)
        )
      },
      {
        id: 'hods',
        title: 'HODs (All Branches)',
        icon: Building,
        recipients: branches.map(branch => 
          createRecipient(`Dr. ${branch} HOD`, 'HOD', `${branch} Department`, branch)
        )
      }
    ];
  }
};

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  userRole,
  selectedRecipients,
  onRecipientsChange,
  maxSelections
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'hods': true,
    'program-heads': true
  });

  const recipientGroups = useMemo(() => generateRecipients(userRole), [userRole]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return recipientGroups;

    return recipientGroups.map(group => ({
      ...group,
      recipients: group.recipients.filter(recipient =>
        recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient.department?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.recipients.length > 0);
  }, [recipientGroups, searchTerm]);

  const selectedRecipientsData = useMemo(() => {
    const allRecipients = recipientGroups.flatMap(group => group.recipients);
    return selectedRecipients.map(id => allRecipients.find(r => r.id === id)).filter(Boolean) as Recipient[];
  }, [recipientGroups, selectedRecipients]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const toggleRecipient = (recipientId: string) => {
    const isSelected = selectedRecipients.includes(recipientId);
    
    if (isSelected) {
      onRecipientsChange(selectedRecipients.filter(id => id !== recipientId));
    } else {
      if (maxSelections && selectedRecipients.length >= maxSelections) {
        return; // Don't add if max selections reached
      }
      onRecipientsChange([...selectedRecipients, recipientId]);
    }
  };

  const removeRecipient = (recipientId: string) => {
    onRecipientsChange(selectedRecipients.filter(id => id !== recipientId));
  };

  const selectAllInGroup = (group: RecipientGroup) => {
    const groupRecipientIds = group.recipients.map(r => r.id);
    const newSelections = [...new Set([...selectedRecipients, ...groupRecipientIds])];
    
    if (maxSelections && newSelections.length > maxSelections) {
      const remaining = maxSelections - selectedRecipients.length;
      const toAdd = groupRecipientIds.slice(0, remaining);
      onRecipientsChange([...selectedRecipients, ...toAdd]);
    } else {
      onRecipientsChange(newSelections);
    }
  };

  const deselectAllInGroup = (group: RecipientGroup) => {
    const groupRecipientIds = group.recipients.map(r => r.id);
    onRecipientsChange(selectedRecipients.filter(id => !groupRecipientIds.includes(id)));
  };

  const getGroupSelectionState = (group: RecipientGroup) => {
    const groupRecipientIds = group.recipients.map(r => r.id);
    const selectedInGroup = groupRecipientIds.filter(id => selectedRecipients.includes(id));
    
    if (selectedInGroup.length === 0) return 'none';
    if (selectedInGroup.length === groupRecipientIds.length) return 'all';
    return 'partial';
  };

  const clearAllSelections = () => {
    onRecipientsChange([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select Recipients
          {maxSelections && (
            <Badge variant="outline">
              {selectedRecipients.length}/{maxSelections}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipients by name, role, branch, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected Recipients Chips */}
        {selectedRecipients.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Selected Recipients ({selectedRecipients.length})</Label>
              <Button variant="outline" size="sm" onClick={clearAllSelections}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
            <ScrollArea className="max-h-32">
              <div className="flex flex-wrap gap-2 p-1">
                {selectedRecipientsData.map((recipient) => (
                  <Badge key={recipient.id} variant="secondary" className="flex items-center gap-1 pr-1 max-w-xs">
                    <span className="text-xs truncate">
                      {recipient.name}
                      {recipient.branch && ` (${recipient.branch})`}
                      {recipient.year && ` - ${recipient.year}`}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive/20 ml-1"
                      onClick={() => removeRecipient(recipient.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Separator />

        {/* Role Hierarchy Display */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Approval Flow Hierarchy</Label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg flex-wrap">
            <span className="font-medium">Employee</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium">Program Head</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium">HOD</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium">Registrar</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium">Principal</span>
          </div>
        </div>

        <Separator />

        {/* Recipient Groups */}
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {filteredGroups.map((group) => {
              const IconComponent = group.icon;
              const selectionState = getGroupSelectionState(group);
              
              return (
                <div key={group.id} className="border rounded-lg">
                  <Collapsible
                    open={expandedGroups[group.id]}
                    onOpenChange={() => toggleGroup(group.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5" />
                          <div>
                            <h4 className="font-semibold">{group.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {group.recipients.length} recipient(s)
                              {selectionState !== 'none' && (
                                <span className="ml-2">
                                  • {selectedRecipients.filter(id => group.recipients.some(r => r.id === id)).length} selected
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Group Selection Controls */}
                          <div className="flex gap-1">
                            {selectionState !== 'all' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAllInGroup(group);
                                }}
                                disabled={maxSelections && selectedRecipients.length >= maxSelections}
                                title="Select all in group"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {selectionState !== 'none' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deselectAllInGroup(group);
                                }}
                                title="Deselect all in group"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {expandedGroups[group.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-2">
                        {group.recipients.map((recipient) => (
                          <div
                            key={recipient.id}
                            className="flex items-center space-x-3 p-2 hover:bg-muted/30 rounded"
                          >
                            <Checkbox
                              id={recipient.id}
                              checked={selectedRecipients.includes(recipient.id)}
                              onCheckedChange={() => toggleRecipient(recipient.id)}
                              disabled={
                                maxSelections && 
                                selectedRecipients.length >= maxSelections && 
                                !selectedRecipients.includes(recipient.id)
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <Label
                                htmlFor={recipient.id}
                                className="flex flex-col gap-1 cursor-pointer"
                              >
                                <span className="font-medium">{recipient.name}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                  <span>{recipient.role}</span>
                                  {recipient.department && (
                                    <>
                                      <span>•</span>
                                      <span>{recipient.department}</span>
                                    </>
                                  )}
                                  {recipient.branch && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="outline" className="text-xs px-1 py-0">
                                        {recipient.branch}
                                      </Badge>
                                    </>
                                  )}
                                  {recipient.year && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="outline" className="text-xs px-1 py-0">
                                        {recipient.year}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">{recipient.email}</span>
                              </Label>
                            </div>
                          </div>
                        ))}
                        
                        {group.recipients.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No recipients found matching your search.
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {maxSelections && selectedRecipients.length >= maxSelections && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Maximum selection limit reached ({maxSelections} recipients).
            </p>
          </div>
        )}

        {filteredGroups.length === 0 && searchTerm && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recipients found matching "{searchTerm}"</p>
            <p className="text-sm">Try adjusting your search terms</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};