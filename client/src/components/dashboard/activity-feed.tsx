import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock, User, CheckCircle } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";

interface ActivityLogItem {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  details: string | null;
  userId: string | null;
  source: string | null;
  createdAt: Date;
}

export function ActivityFeed() {
  const [recentActivities, setRecentActivities] = useState<ActivityLogItem[]>([]);
  const { connected, on } = useWebSocket();

  // Fetch initial activities
  const { data: activities } = useQuery<ActivityLogItem[]>({
    queryKey: ['/api/activities/recent'],
    refetchInterval: 30000, // Refresh every 30 seconds as fallback
  });

  // Update local state when data arrives
  useEffect(() => {
    if (activities) {
      setRecentActivities(activities);
    }
  }, [activities]);

  // Listen for real-time activity updates via WebSocket
  useEffect(() => {
    if (connected) {
      on('activity_update', (newActivity: ActivityLogItem) => {
        setRecentActivities(prev => [newActivity, ...prev].slice(0, 20)); // Keep last 20
      });
    }
  }, [connected, on]);

  const getActivityIcon = (action: string) => {
    if (action.includes('updated')) return <CheckCircle className="h-4 w-4 text-blue-400" />;
    if (action.includes('created')) return <Activity className="h-4 w-4 text-green-400" />;
    if (action.includes('deleted')) return <Activity className="h-4 w-4 text-red-400" />;
    return <Activity className="h-4 w-4 text-gray-400" />;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card className="border-purple-500/20 bg-gradient-to-r from-purple-950/20 to-background" data-testid="activity-feed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-400">
          <Activity className="h-5 w-5" />
          Live Activity Feed
          {connected && <span className="ml-auto text-xs text-green-400">● Live</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-start gap-3 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                  data-testid={`activity-item-${index}`}
                >
                  <div className="mt-0.5">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {activity.userId && activity.userId !== 'system' && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activity.userId}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(activity.createdAt)}
                      </span>
                      {activity.source && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {activity.source}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
