import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Bell, 
  Clock, 
  X, 
  CheckCircle2,
  User,
  Calendar
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FollowUp {
  id: string;
  clientId: string;
  type: string;
  title: string;
  description?: string;
  scheduledFor: Date;
  completed: boolean;
  priority: string;
  reminderState?: string;
  channel?: string;
}

interface ReminderWithClient extends FollowUp {
  clientName?: string;
}

export function ReminderNotifications() {
  const [activeReminders, setActiveReminders] = useState<ReminderWithClient[]>([]);
  const [snoozeTime, setSnoozeTime] = useState<{ [key: string]: string }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch pending reminders that need to be shown
  const { data: pendingReminders } = useQuery<FollowUp[]>({
    queryKey: ['/api/followups', 'pending'],
    queryFn: async () => {
      const response = await fetch('/api/followups?pending=true');
      if (!response.ok) throw new Error('Failed to fetch pending reminders');
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Filter reminders that should be shown now
  useEffect(() => {
    if (!pendingReminders) return;

    const now = new Date();
    const remindersToShow = pendingReminders.filter((reminder) => {
      const scheduledTime = new Date(reminder.scheduledFor);
      const timeDiff = scheduledTime.getTime() - now.getTime();
      
      // Show if scheduled time is within the past or next 5 minutes
      // And not already dismissed or snoozed
      return (
        timeDiff <= 5 * 60 * 1000 && 
        timeDiff >= -5 * 60 * 1000 &&
        !reminder.completed &&
        reminder.reminderState !== 'dismissed' &&
        reminder.reminderState !== 'snoozed'
      );
    });

    // Fetch client names for reminders
    const enrichReminders = async () => {
      const enriched = await Promise.all(
        remindersToShow.map(async (reminder) => {
          try {
            const response = await fetch(`/api/clients/${reminder.clientId}`);
            const client = await response.json();
            return { ...reminder, clientName: client.name };
          } catch {
            return { ...reminder, clientName: 'Unknown Client' };
          }
        })
      );
      setActiveReminders(enriched);
    };

    enrichReminders();
  }, [pendingReminders]);

  // Snooze mutation
  const snoozeMutation = useMutation({
    mutationFn: async ({ id, minutes }: { id: string; minutes: number }) => {
      return apiRequest('PUT', `/api/followups/${id}/snooze`, { minutes });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/followups'] });
      setActiveReminders((prev) => prev.filter((r) => r.id !== id));
      toast({
        title: "Reminder Snoozed",
        description: "You'll be reminded again later.",
      });
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('PUT', `/api/followups/${id}/dismiss`, {});
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/followups'] });
      setActiveReminders((prev) => prev.filter((r) => r.id !== id));
      toast({
        title: "Reminder Dismissed",
        description: "This reminder has been dismissed.",
      });
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('PUT', `/api/followups/${id}/complete`, {});
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/followups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setActiveReminders((prev) => prev.filter((r) => r.id !== id));
      toast({
        title: "Follow-up Completed",
        description: "Great job! The follow-up has been marked as complete.",
        variant: "default",
      });
    },
  });

  const handleSnooze = (reminderId: string) => {
    const minutes = parseInt(snoozeTime[reminderId] || '15');
    snoozeMutation.mutate({ id: reminderId, minutes });
  };

  const handleDismiss = (reminderId: string) => {
    dismissMutation.mutate(reminderId);
  };

  const handleComplete = (reminderId: string) => {
    completeMutation.mutate(reminderId);
  };

  if (activeReminders.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md" data-testid="reminder-notifications">
      {activeReminders.map((reminder) => (
        <Card 
          key={reminder.id} 
          className="p-4 shadow-lg border-2 border-blue-500 bg-white dark:bg-gray-900 animate-in slide-in-from-bottom"
          data-testid={`reminder-notification-${reminder.id}`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Bell className="h-6 w-6 text-blue-500 animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm" data-testid={`reminder-title-${reminder.id}`}>
                  {reminder.title}
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mt-1 -mr-1"
                  onClick={() => handleDismiss(reminder.id)}
                  data-testid={`reminder-close-${reminder.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground mb-3">
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3" />
                  <span data-testid={`reminder-client-${reminder.id}`}>{reminder.clientName}</span>
                </div>
                
                {reminder.description && (
                  <p className="text-xs" data-testid={`reminder-description-${reminder.id}`}>
                    {reminder.description}
                  </p>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(reminder.scheduledFor), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Snooze Time Selector */}
              <div className="mb-3">
                <label className="text-xs font-medium mb-1 block">Snooze for:</label>
                <Select 
                  value={snoozeTime[reminder.id] || '15'} 
                  onValueChange={(value) => setSnoozeTime({ ...snoozeTime, [reminder.id]: value })}
                >
                  <SelectTrigger className="h-8 text-xs" data-testid={`snooze-selector-${reminder.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={() => handleSnooze(reminder.id)}
                  disabled={snoozeMutation.isPending}
                  data-testid={`reminder-snooze-${reminder.id}`}
                >
                  <Clock className="mr-1 h-3 w-3" />
                  Snooze
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={() => handleDismiss(reminder.id)}
                  disabled={dismissMutation.isPending}
                  data-testid={`reminder-dismiss-${reminder.id}`}
                >
                  <X className="mr-1 h-3 w-3" />
                  Dismiss
                </Button>
                
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                  onClick={() => handleComplete(reminder.id)}
                  disabled={completeMutation.isPending}
                  data-testid={`reminder-complete-${reminder.id}`}
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Complete
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
