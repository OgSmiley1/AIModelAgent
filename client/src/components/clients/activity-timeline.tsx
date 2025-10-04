import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Activity as ActivityIcon, 
  Edit, 
  CheckCircle2, 
  Clock, 
  XCircle,
  History,
  BellOff,
  Bell,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  clientId: string;
  actorId: string | null;
  type: string;
  payload: any;
  createdAt: Date;
}

interface ActivityTimelineProps {
  clientId: string;
}

export function ActivityTimeline({ clientId }: ActivityTimelineProps) {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/clients', clientId, 'activities'],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/activities`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    }
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_changed':
        return <ActivityIcon size={16} className="text-blue-500" />;
      case 'field_edited':
        return <Edit size={16} className="text-purple-500" />;
      case 'follow_up_completed':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'reminder_snoozed':
        return <Clock size={16} className="text-yellow-500" />;
      case 'reminder_dismissed':
        return <XCircle size={16} className="text-gray-500" />;
      case 'follow_up_auto_closed':
        return <BellOff size={16} className="text-orange-500" />;
      default:
        return <History size={16} className="text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'status_changed':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950';
      case 'field_edited':
        return 'bg-purple-50 border-purple-200 dark:bg-purple-950';
      case 'follow_up_completed':
        return 'bg-green-50 border-green-200 dark:bg-green-950';
      case 'reminder_snoozed':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950';
      case 'reminder_dismissed':
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900';
      case 'follow_up_auto_closed':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900';
    }
  };

  const formatActivityDescription = (activity: Activity) => {
    const { type, payload } = activity;

    switch (type) {
      case 'status_changed':
        return (
          <div>
            Status changed from{' '}
            <Badge variant="outline" className="mx-1">
              {payload.from?.replace(/_/g, ' ') || 'unknown'}
            </Badge>
            to{' '}
            <Badge variant="outline" className="mx-1">
              {payload.to?.replace(/_/g, ' ')}
            </Badge>
          </div>
        );
      
      case 'field_edited':
        return (
          <div>
            Updated <strong>{payload.field?.replace(/([A-Z])/g, ' $1').toLowerCase()}</strong>
            {payload.from !== undefined && payload.to !== undefined && (
              <>
                {' '}from <span className="text-muted-foreground">"{String(payload.from)}"</span>
                {' '}to <span className="text-muted-foreground">"{String(payload.to)}"</span>
              </>
            )}
          </div>
        );

      case 'follow_up_completed':
        return <div>Completed a follow-up task</div>;

      case 'reminder_snoozed':
        return (
          <div>
            Snoozed reminder for{' '}
            <strong>{payload.snoozedByMinutes || 15} minutes</strong>
          </div>
        );

      case 'reminder_dismissed':
        return <div>Dismissed a reminder</div>;

      case 'follow_up_auto_closed':
        return (
          <div>
            Automatically closed follow-up
            {payload.reason && (
              <div className="text-xs text-muted-foreground mt-1">
                Reason: {payload.reason}
              </div>
            )}
          </div>
        );

      default:
        return <div>{type.replace(/_/g, ' ')}</div>;
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="activity-timeline-loading">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <History size={18} className="mr-2" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card data-testid="activity-timeline-empty">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <History size={18} className="mr-2" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activities yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="activity-timeline">
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <History size={18} className="mr-2" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={activity.id}>
              <div 
                className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                data-testid={`activity-${activity.type}-${activity.id}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    {formatActivityDescription(activity)}
                  </div>
                  <div className="flex items-center space-x-2 mt-1.5 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span data-testid={`activity-time-${activity.id}`}>
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                    {activity.actorId && (
                      <>
                        <span>•</span>
                        <User size={12} />
                        <span>Actor ID: {activity.actorId.substring(0, 8)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {index < activities.length - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
