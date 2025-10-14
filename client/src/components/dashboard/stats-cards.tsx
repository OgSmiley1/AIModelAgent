import { Card, CardContent } from "@/components/ui/card";
import { Mail, Clock, TrendingUp, Star } from "lucide-react";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Today's Messages",
      value: String(stats?.todayMessages ?? 0),
      icon: Mail,
      trend: `+${stats?.messageGrowth ?? "0"}% from yesterday`,
      trendPositive: true,
      testId: "today-messages-card"
    },
    {
      title: "Response Time",
      value: String(stats?.avgResponseTime ?? "N/A"),
      icon: Clock,
      trend: "Avg AI response time",
      trendPositive: true,
      testId: "response-time-card"
    },
    {
      title: "Conversion Rate",
      value: `${stats?.conversionRate ?? 0}%`,
      icon: TrendingUp,
      trend: "+5% this week",
      trendPositive: true,
      testId: "conversion-rate-card"
    },
    {
      title: "Client Satisfaction",
      value: String(stats?.satisfaction ?? "N/A"),
      icon: Star,
      trend: "Based on sentiment analysis",
      trendPositive: true,
      testId: "satisfaction-card"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6" data-testid="stats-cards">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const iconColors = [
          "text-primary",
          "text-chart-1", 
          "text-chart-2",
          "text-chart-3"
        ];
        const bgColors = [
          "bg-primary/10",
          "bg-chart-1/10",
          "bg-chart-2/10", 
          "bg-chart-3/10"
        ];
        
        return (
          <Card key={card.title} data-testid={card.testId}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold" data-testid={`${card.testId}-value`}>
                    {card.value}
                  </p>
                </div>
                <div className={`w-8 h-8 ${bgColors[index]} rounded-lg flex items-center justify-center`}>
                  <Icon className={iconColors[index]} size={16} />
                </div>
              </div>
              <p className={`text-xs mt-2 ${card.trendPositive ? 'text-chart-1' : 'text-chart-3'}`}>
                {card.trend}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
