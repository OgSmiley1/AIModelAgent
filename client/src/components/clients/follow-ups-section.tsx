import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Plus,
  Check,
  X,
  AlertCircle,
  Phone,
  Mail,
  MessageCircle,
  Users,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FollowUp {
  id: string;
  clientId: string;
  type: string;
  title: string;
  description?: string;
  scheduledFor: string;
  completed: boolean;
  completedAt?: string;
  priority: string;
  automatedAction?: string;
  metadata?: any;
  createdAt: string;
}

interface FollowUpsSectionProps {
  clientId: string;
  clientName: string;
}

export function FollowUpsSection({ clientId, clientName }: FollowUpsSectionProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({
    type: "reminder",
    title: "",
    description: "",
    scheduledFor: "",
    priority: "medium",
  });

  const queryClient = useQueryClient();

  // Fetch follow-ups for this client
  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['/api/followups', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/followups?clientId=${clientId}`);
      return response.json();
    }
  });

  // Create follow-up mutation
  const createFollowUpMutation = useMutation({
    mutationFn: async (followUpData: any) => {
      return apiRequest('POST', '/api/followups', {
        ...followUpData,
        clientId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/followups', clientId] });
      setIsCreateDialogOpen(false);
      setNewFollowUp({
        type: "reminder",
        title: "",
        description: "",
        scheduledFor: "",
        priority: "medium",
      });
    },
  });

  // Complete follow-up mutation
  const completeFollowUpMutation = useMutation({
    mutationFn: async (followUpId: string) => {
      return apiRequest('PUT', `/api/followups/${followUpId}`, {
        completed: true,
        completedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/followups', clientId] });
    },
  });

  const handleCreateFollowUp = () => {
    if (!newFollowUp.title || !newFollowUp.scheduledFor) return;
    createFollowUpMutation.mutate(newFollowUp);
  };

  const handleCompleteFollowUp = (followUpId: string) => {
    completeFollowUpMutation.mutate(followUpId);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={14} className="text-blue-500" />;
      case 'email': return <Mail size={14} className="text-purple-500" />;
      case 'meeting': return <Users size={14} className="text-green-500" />;
      case 'task': return <AlertCircle size={14} className="text-orange-500" />;
      default: return <Calendar size={14} className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const sortedFollowUps = [...followUps].sort((a, b) => 
    new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
  );

  const pendingFollowUps = sortedFollowUps.filter(f => !f.completed);
  const completedFollowUps = sortedFollowUps.filter(f => f.completed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="mr-2" size={20} />
            Follow-ups ({pendingFollowUps.length} pending)
          </CardTitle>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="create-followup">
                <Plus size={16} className="mr-1" />
                Schedule Follow-up
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Follow-up for {clientName}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={newFollowUp.type} onValueChange={(value) => 
                      setNewFollowUp({ ...newFollowUp, type: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={newFollowUp.priority} onValueChange={(value) => 
                      setNewFollowUp({ ...newFollowUp, priority: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Follow-up title..."
                    value={newFollowUp.title}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Scheduled Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={newFollowUp.scheduledFor}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, scheduledFor: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Additional details..."
                    value={newFollowUp.description}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, description: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handleCreateFollowUp}
                    disabled={!newFollowUp.title || !newFollowUp.scheduledFor}
                    className="flex-1"
                  >
                    Schedule Follow-up
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading follow-ups...
          </div>
        ) : (
          <>
            {/* Pending Follow-ups */}
            {pendingFollowUps.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 text-orange-600">
                  Pending Follow-ups ({pendingFollowUps.length})
                </h4>
                <div className="space-y-3">
                  {pendingFollowUps.map((followUp) => (
                    <div 
                      key={followUp.id} 
                      className="border rounded-lg p-3 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getTypeIcon(followUp.type)}
                            <span className="font-medium text-sm">{followUp.title}</span>
                            <Badge className={`text-xs ${getPriorityColor(followUp.priority)}`}>
                              {followUp.priority}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-2">
                            <div className="flex items-center space-x-4">
                              <span>📅 {new Date(followUp.scheduledFor).toLocaleDateString()}</span>
                              <span>🕐 {new Date(followUp.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          
                          {followUp.description && (
                            <p className="text-xs text-gray-600 mb-2">{followUp.description}</p>
                          )}
                          
                          <div className="text-xs">
                            {(() => {
                              const now = new Date();
                              const scheduled = new Date(followUp.scheduledFor);
                              const diffHours = Math.round((scheduled.getTime() - now.getTime()) / (1000 * 60 * 60));
                              
                              if (diffHours < 0) {
                                return <span className="text-red-600 font-medium">⚠️ Overdue by {Math.abs(diffHours)} hours</span>;
                              } else if (diffHours < 2) {
                                return <span className="text-orange-600 font-medium">🔥 Due very soon</span>;
                              } else if (diffHours < 24) {
                                return <span className="text-yellow-600">⏰ Due in {diffHours} hours</span>;
                              } else {
                                const days = Math.ceil(diffHours / 24);
                                return <span className="text-green-600">📅 Due in {days} days</span>;
                              }
                            })()}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCompleteFollowUp(followUp.id)}
                          className="text-green-600 hover:bg-green-50"
                          data-testid={`complete-followup-${followUp.id}`}
                        >
                          <Check size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Follow-ups */}
            {completedFollowUps.length > 0 && (
              <>
                {pendingFollowUps.length > 0 && <Separator />}
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-green-600">
                    Completed Follow-ups ({completedFollowUps.length})
                  </h4>
                  <div className="space-y-2">
                    {completedFollowUps.slice(0, 3).map((followUp) => (
                      <div 
                        key={followUp.id} 
                        className="border rounded-lg p-3 bg-green-50 opacity-75"
                      >
                        <div className="flex items-center space-x-2">
                          <Check size={14} className="text-green-500" />
                          {getTypeIcon(followUp.type)}
                          <span className="text-sm">{followUp.title}</span>
                          <span className="text-xs text-muted-foreground">
                            • Completed {new Date(followUp.completedAt!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {completedFollowUps.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center py-2">
                        +{completedFollowUps.length - 3} more completed
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {followUps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="mb-2">No follow-ups scheduled</p>
                <p className="text-xs">Schedule your first follow-up to stay organized</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}