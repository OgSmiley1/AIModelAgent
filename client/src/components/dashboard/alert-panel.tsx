import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemAlert } from "@/types";

interface AlertPanelProps {
  alerts: SystemAlert[];
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error':
        return XCircle;
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      case 'info':
      default:
        return Info;
    }
  };

  const getAlertStyles = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error':
        return {
          container: "bg-destructive/10 border-destructive/20",
          icon: "text-destructive",
          title: "text-destructive"
        };
      case 'warning':
        return {
          container: "bg-chart-2/10 border-chart-2/20", 
          icon: "text-chart-2",
          title: "text-chart-2"
        };
      case 'success':
        return {
          container: "bg-chart-1/10 border-chart-1/20",
          icon: "text-chart-1", 
          title: "text-chart-1"
        };
      case 'info':
      default:
        return {
          container: "bg-primary/10 border-primary/20",
          icon: "text-primary",
          title: "text-primary"
        };
    }
  };

  if (alerts.length === 0) {
    return (
      <Card data-testid="alert-panel">
        <CardHeader>
          <CardTitle className="text-sm">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent alerts
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="alert-panel">
      <CardHeader>
        <CardTitle className="text-sm">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const styles = getAlertStyles(alert.type);
            
            return (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg border text-sm",
                  styles.container
                )}
                data-testid={`alert-${alert.type}`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Icon size={14} className={styles.icon} />
                  <span className={cn("font-medium", styles.title)}>
                    {alert.title}
                  </span>
                </div>
                <p className="text-xs text-foreground/80" data-testid="alert-message">
                  {alert.message}
                </p>
                {alert.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
