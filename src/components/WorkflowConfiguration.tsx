import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BiDirectionalWorkflowEngine } from '@/services/BiDirectionalWorkflowEngine';
import { WorkflowRoute, WorkflowStep } from '@/types/workflow';
import { cn } from '@/lib/utils';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  ArrowRight,
  ArrowDown,
  Shield,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  Copy,
  RotateCcw
} from 'lucide-react';

interface WorkflowConfigurationProps {
  className?: string;
}

export const WorkflowConfiguration: React.FC<WorkflowConfigurationProps> = ({ className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflowEngine] = useState(() => new BiDirectionalWorkflowEngine());
  const [workflows, setWorkflows] = useState<WorkflowRoute[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRoute | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [activeTab, setActiveTab] = useState('workflows');

  // Form states
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowType, setWorkflowType] = useState<'sequential' | 'parallel'>('sequential');
  const [requiresCounterApproval, setRequiresCounterApproval] = useState(false);
  const [autoEscalation, setAutoEscalation] = useState(false);
  const [escalationTimeout, setEscalationTimeout] = useState(24);

  // Step form states
  const [stepName, setStepName] = useState('');
  const [stepDescription, setStepDescription] = useState('');
  const [stepRole, setStepRole] = useState('');
  const [stepRequiredApprovals, setStepRequiredApprovals] = useState(1);
  const [stepTimeoutHours, setStepTimeoutHours] = useState(24);
  const [stepEscalationRoles, setStepEscalationRoles] = useState<string[]>([]);
  const [stepRequiresCounterApproval, setStepRequiresCounterApproval] = useState(false);

  const availableRoles = ['principal', 'registrar', 'program-head', 'hod', 'employee'];

  useEffect(() => {
    if (user) {
      refreshWorkflows();
    }
  }, [user]);

  const refreshWorkflows = () => {
    const allWorkflows = workflowEngine.getAllWorkflowRoutes();
    setWorkflows(allWorkflows);
  };

  const resetForms = () => {
    setWorkflowName('');
    setWorkflowDescription('');
    setWorkflowType('sequential');
    setRequiresCounterApproval(false);
    setAutoEscalation(false);
    setEscalationTimeout(24);
    resetStepForm();
  };

  const resetStepForm = () => {
    setStepName('');
    setStepDescription('');
    setStepRole('');
    setStepRequiredApprovals(1);
    setStepTimeoutHours(24);
    setStepEscalationRoles([]);
    setStepRequiresCounterApproval(false);
  };

  const loadWorkflow = (workflow: WorkflowRoute) => {
    setSelectedWorkflow(workflow);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description);
    setWorkflowType(workflow.type);
    setRequiresCounterApproval(workflow.requiresCounterApproval);
    setAutoEscalation(workflow.autoEscalation.enabled);
    setEscalationTimeout(workflow.autoEscalation.timeoutHours);
  };

  const loadStep = (step: WorkflowStep) => {
    setEditingStep(step);
    setStepName(step.name);
    setStepDescription(step.description);
    setStepRole(step.approverRole);
    setStepRequiredApprovals(step.requiredApprovals);
    setStepTimeoutHours(step.timeoutHours || 24);
    setStepEscalationRoles(step.escalationRoles || []);
    setStepRequiresCounterApproval(step.requiresCounterApproval || false);
  };

  const handleSaveWorkflow = () => {
    if (!workflowName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Workflow name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!user) return;

    const workflow: WorkflowRoute = {
      id: selectedWorkflow?.id || `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      type: workflowType,
      documentType: 'general',
      steps: selectedWorkflow?.steps || [],
      escalationPaths: selectedWorkflow?.escalationPaths || [],
      requiresCounterApproval,
      autoEscalation: {
        enabled: autoEscalation,
        timeoutHours: escalationTimeout
      },
      isActive: true,
      createdBy: user.id,
      createdAt: selectedWorkflow?.createdAt || new Date(),
      updatedAt: new Date()
    };

    try {
      workflowEngine.createWorkflowRoute(workflow);
      
      toast({
        title: 'Success',
        description: `Workflow ${isCreating ? 'created' : 'updated'} successfully`,
        variant: 'default'
      });

      refreshWorkflows();
      setSelectedWorkflow(workflow);
      setIsEditing(false);
      setIsCreating(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive'
      });
    }
  };

  const handleSaveStep = () => {
    if (!stepName.trim() || !stepRole) {
      toast({
        title: 'Validation Error',
        description: 'Step name and approver role are required',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedWorkflow) return;

    const step: WorkflowStep = {
      id: editingStep?.id || `step-${Date.now()}`,
      name: stepName,
      description: stepDescription,
      roleRequired: [stepRole],
      approverRole: stepRole,
      requiredApprovals: stepRequiredApprovals,
      timeoutHours: stepTimeoutHours,
      escalationRoles: stepEscalationRoles.length > 0 ? stepEscalationRoles : undefined,
      requiresCounterApproval: stepRequiresCounterApproval,
      isOptional: false,
      order: editingStep?.order || selectedWorkflow.steps.length + 1
    };

    const updatedSteps = editingStep
      ? selectedWorkflow.steps.map(s => s.id === editingStep.id ? step : s)
      : [...selectedWorkflow.steps, step];

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: updatedSteps,
      updatedAt: new Date()
    };

    try {
      workflowEngine.createWorkflowRoute(updatedWorkflow);
      
      toast({
        title: 'Success',
        description: `Step ${editingStep ? 'updated' : 'added'} successfully`,
        variant: 'default'
      });

      refreshWorkflows();
      setSelectedWorkflow(updatedWorkflow);
      setEditingStep(null);
      resetStepForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save step',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteStep = (stepId: string) => {
    if (!selectedWorkflow) return;

    const updatedSteps = selectedWorkflow.steps
      .filter(s => s.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 }));

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: updatedSteps,
      updatedAt: new Date()
    };

    try {
      workflowEngine.createWorkflowRoute(updatedWorkflow);
      
      toast({
        title: 'Success',
        description: 'Step deleted successfully',
        variant: 'default'
      });

      refreshWorkflows();
      setSelectedWorkflow(updatedWorkflow);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete step',
        variant: 'destructive'
      });
    }
  };

  const handleCloneWorkflow = (workflow: WorkflowRoute) => {
    const clonedWorkflow: WorkflowRoute = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      name: `${workflow.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user?.id || ''
    };

    try {
      workflowEngine.createWorkflowRoute(clonedWorkflow);
      
      toast({
        title: 'Success',
        description: 'Workflow cloned successfully',
        variant: 'default'
      });

      refreshWorkflows();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clone workflow',
        variant: 'destructive'
      });
    }
  };

  const WorkflowCard: React.FC<{ workflow: WorkflowRoute }> = ({ workflow }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{workflow.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {workflow.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{workflow.type}</Badge>
            <Badge variant={workflow.requiresCounterApproval ? 'default' : 'secondary'}>
              {workflow.steps.length} steps
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {workflow.requiresCounterApproval && (
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Counter-Approval
              </div>
            )}
            {workflow.autoEscalation.enabled && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Auto-Escalation
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCloneWorkflow(workflow)}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                loadWorkflow(workflow);
                setIsEditing(true);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StepCard: React.FC<{ step: WorkflowStep; index: number }> = ({ step, index }) => (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
              {index + 1}
            </div>
            <div>
              <CardTitle className="text-base">{step.name}</CardTitle>
              {step.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadStep(step)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteStep(step.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Badge variant="outline">{step.approverRole}</Badge>
            <div className="text-sm text-muted-foreground">
              {step.requiredApprovals} approval{step.requiredApprovals > 1 ? 's' : ''} required
            </div>
          </div>
          
          {step.timeoutHours && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {step.timeoutHours}h timeout
            </div>
          )}
          
          {step.escalationRoles && step.escalationRoles.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
              Escalates to: {step.escalationRoles.join(', ')}
            </div>
          )}
          
          {step.requiresCounterApproval && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              Requires counter-approval
            </div>
          )}
        </div>
      </CardContent>
      
      {index < (selectedWorkflow?.steps.length || 0) - 1 && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
          <ArrowDown className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Configuration</h2>
          <p className="text-muted-foreground">
            Configure bi-directional approval routing workflows
          </p>
        </div>
        <Button
          onClick={() => {
            resetForms();
            setIsCreating(true);
            setIsEditing(true);
            setSelectedWorkflow(null);
            setActiveTab('designer');
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Workflow
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          {(selectedWorkflow || isCreating) && (
            <TabsTrigger value="designer">Workflow Designer</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Settings className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Workflows Configured</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first approval workflow to get started.
                </p>
                <Button
                  onClick={() => {
                    resetForms();
                    setIsCreating(true);
                    setIsEditing(true);
                    setSelectedWorkflow(null);
                    setActiveTab('designer');
                  }}
                >
                  Create Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflows.map(workflow => (
                <div key={workflow.id} onClick={() => setSelectedWorkflow(workflow)}>
                  <WorkflowCard workflow={workflow} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {(selectedWorkflow || isCreating) && (
          <TabsContent value="designer" className="space-y-6">
            {isEditing ? (
              /* Workflow Editor */
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isCreating ? 'Create New Workflow' : 'Edit Workflow'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Workflow Name</label>
                      <Input
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        placeholder="Enter workflow name"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select value={workflowType} onValueChange={(value: 'sequential' | 'parallel') => setWorkflowType(value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sequential">Sequential</SelectItem>
                          <SelectItem value="parallel">Parallel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                      placeholder="Enter workflow description"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={requiresCounterApproval}
                        onCheckedChange={setRequiresCounterApproval}
                      />
                      <label className="text-sm font-medium">Requires Counter-Approval</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={autoEscalation}
                        onCheckedChange={setAutoEscalation}
                      />
                      <label className="text-sm font-medium">Auto-Escalation</label>
                    </div>
                  </div>
                  
                  {autoEscalation && (
                    <div>
                      <label className="text-sm font-medium">Escalation Timeout (hours)</label>
                      <Input
                        type="number"
                        value={escalationTimeout}
                        onChange={(e) => setEscalationTimeout(Number(e.target.value))}
                        min={1}
                        max={168}
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveWorkflow}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Workflow
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        if (selectedWorkflow) {
                          loadWorkflow(selectedWorkflow);
                        } else {
                          resetForms();
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Workflow Display */
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedWorkflow.name}</CardTitle>
                      <p className="text-muted-foreground mt-1">
                        {selectedWorkflow.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <Badge variant="outline">{selectedWorkflow.type}</Badge>
                    {selectedWorkflow.requiresCounterApproval && (
                      <Badge variant="default">Counter-Approval</Badge>
                    )}
                    {selectedWorkflow.autoEscalation.enabled && (
                      <Badge variant="secondary">Auto-Escalation</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Steps Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Workflow Steps</h3>
                {!editingStep && (
                  <Button
                    variant="outline"
                    onClick={() => resetStepForm()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                  </Button>
                )}
              </div>

              {/* Step Editor */}
              {(editingStep || (!editingStep && stepName)) && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {editingStep ? 'Edit Step' : 'Add New Step'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Step Name</label>
                        <Input
                          value={stepName}
                          onChange={(e) => setStepName(e.target.value)}
                          placeholder="Enter step name"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Approver Role</label>
                        <Select value={stepRole} onValueChange={setStepRole}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map(role => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={stepDescription}
                        onChange={(e) => setStepDescription(e.target.value)}
                        placeholder="Enter step description"
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium">Required Approvals</label>
                        <Input
                          type="number"
                          value={stepRequiredApprovals}
                          onChange={(e) => setStepRequiredApprovals(Number(e.target.value))}
                          min={1}
                          max={10}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Timeout (hours)</label>
                        <Input
                          type="number"
                          value={stepTimeoutHours}
                          onChange={(e) => setStepTimeoutHours(Number(e.target.value))}
                          min={1}
                          max={168}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          checked={stepRequiresCounterApproval}
                          onCheckedChange={setStepRequiresCounterApproval}
                        />
                        <label className="text-sm font-medium">Counter-Approval</label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Escalation Roles (Optional)</label>
                      <Select
                        value=""
                        onValueChange={(role) => {
                          if (!stepEscalationRoles.includes(role)) {
                            setStepEscalationRoles([...stepEscalationRoles, role]);
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Add escalation role" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles
                            .filter(role => role !== stepRole && !stepEscalationRoles.includes(role))
                            .map(role => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      
                      {stepEscalationRoles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {stepEscalationRoles.map(role => (
                            <Badge key={role} variant="secondary" className="cursor-pointer">
                              {role}
                              <button
                                onClick={() => setStepEscalationRoles(stepEscalationRoles.filter(r => r !== role))}
                                className="ml-2 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveStep}>
                        <Save className="w-4 h-4 mr-2" />
                        {editingStep ? 'Update Step' : 'Add Step'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingStep(null);
                          resetStepForm();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Steps List */}
              {selectedWorkflow?.steps && selectedWorkflow.steps.length > 0 && (
                <div className="space-y-6">
                  {selectedWorkflow.steps
                    .sort((a, b) => a.order - b.order)
                    .map((step, index) => (
                      <StepCard key={step.id} step={step} index={index} />
                    ))}
                </div>
              )}
              
              {(!selectedWorkflow?.steps || selectedWorkflow.steps.length === 0) && !editingStep && !stepName && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <ArrowRight className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Steps Configured</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Add workflow steps to define the approval process.
                    </p>
                    <Button onClick={() => resetStepForm()}>
                      Add First Step
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
