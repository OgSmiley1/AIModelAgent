import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  DollarSign, 
  Target,
  Clock,
  Heart,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DashboardStats } from "@/types";

export default function Analytics() {
  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/analytics/dashboard'],
  });

  // Mock analytics data
  const messageVolumeData = [
    { date: '2024-01-01', messages: 45, sentiment: 0.6 },
    { date: '2024-01-02', messages: 52, sentiment: 0.7 },
    { date: '2024-01-03', messages: 38, sentiment: 0.5 },
    { date: '2024-01-04', messages: 65, sentiment: 0.8 },
    { date: '2024-01-05', messages: 58, sentiment: 0.6 },
    { date: '2024-01-06', messages: 72, sentiment: 0.9 },
    { date: '2024-01-07', messages: 69, sentiment: 0.7 },
  ];

  const clientStatusData = [
    { status: 'VIP', count: 45, value: 30 },
    { status: 'Active', count: 128, value: 40 },
    { status: 'Prospect', count: 74, value: 25 },
    { status: 'Inactive', count: 23, value: 5 },
  ];

  const responseTimeData = [
    { hour: '00:00', avgTime: 1.2 },
    { hour: '06:00', avgTime: 0.8 },
    { hour: '12:00', avgTime: 2.1 },
    { hour: '18:00', avgTime: 1.5 },
    { hour: '24:00', avgTime: 1.0 },
  ];

  const conversionFunnelData = [
    { stage: 'Prospects', count: 1000, percentage: 100 },
    { stage: 'Engaged', count: 650, percentage: 65 },
    { stage: 'Qualified', count: 400, percentage: 40 },
    { stage: 'Proposals', count: 200, percentage: 20 },
    { stage: 'Closed', count: 120, percentage: 12 },
  ];

  const sentimentTrendsData = [
    { date: '2024-01-01', positive: 65, neutral: 25, negative: 10 },
    { date: '2024-01-02', positive: 70, neutral: 20, negative: 10 },
    { date: '2024-01-03', positive: 60, neutral: 30, negative: 10 },
    { date: '2024-01-04', positive: 80, neutral: 15, negative: 5 },
    { date: '2024-01-05', positive: 75, neutral: 20, negative: 5 },
    { date: '2024-01-06', positive: 85, neutral: 12, negative: 3 },
    { date: '2024-01-07', positive: 78, neutral: 18, negative: 4 },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const kpiCards = [
    {
      title: "Total Revenue",
      value: "$1,245,680",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-chart-1"
    },
    {
      title: "Client Satisfaction",
      value: "4.8/5.0",
      change: "+0.3",
      trend: "up",
      icon: Heart,
      color: "text-chart-2"
    },
    {
      title: "Conversion Rate",
      value: "68.4%",
      change: "+5.2%",
      trend: "up",
      icon: Target,
      color: "text-chart-3"
    },
    {
      title: "Avg Response Time",
      value: "2.3s",
      change: "-0.5s",
      trend: "down",
      icon: Clock,
      color: "text-primary"
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="Business Analytics"
          subtitle="Comprehensive insights and performance metrics"
        />
        
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Select defaultValue="7days">
                <SelectTrigger className="w-40" data-testid="time-range-filter">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="all">
                <SelectTrigger className="w-40" data-testid="client-segment-filter">
                  <SelectValue placeholder="Client Segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="vip">VIP Clients</SelectItem>
                  <SelectItem value="active">Active Clients</SelectItem>
                  <SelectItem value="prospects">Prospects</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Badge className="bg-chart-1 text-white">
              Real-time Data
            </Badge>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;
              const TrendIcon = kpi.trend === 'up' ? ArrowUp : ArrowDown;
              
              return (
                <Card key={kpi.title} data-testid={`kpi-${kpi.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {kpi.title}
                        </p>
                        <p className="text-2xl font-bold">{kpi.value}</p>
                        <div className={`flex items-center space-x-1 text-xs mt-1 ${
                          kpi.trend === 'up' ? 'text-chart-1' : 'text-chart-3'
                        }`}>
                          <TrendIcon size={12} />
                          <span>{kpi.change}</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                        <Icon className={kpi.color} size={16} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview" data-testid="overview-tab">Overview</TabsTrigger>
              <TabsTrigger value="clients" data-testid="clients-tab">Client Analytics</TabsTrigger>
              <TabsTrigger value="conversations" data-testid="conversations-tab">Conversations</TabsTrigger>
              <TabsTrigger value="performance" data-testid="performance-tab">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Message Volume Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Message Volume Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={messageVolumeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="messages" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Client Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Client Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={clientStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ status, value }) => `${status} (${value}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {clientStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sales Conversion Funnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {conversionFunnelData.map((stage, index) => (
                        <div key={stage.stage} className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{stage.stage}</span>
                            <span className="text-sm text-muted-foreground">
                              {stage.count} ({stage.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${stage.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Response Time Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Response Time by Hour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={responseTimeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="avgTime" fill="hsl(var(--chart-2))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clients" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Growth */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Client Growth Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={messageVolumeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="messages" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Client Lifetime Value */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Client Lifetime Value Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">$0 - $10K</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div className="w-16 h-2 rounded-full bg-chart-1" />
                          </div>
                          <span className="text-sm text-muted-foreground">45%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">$10K - $50K</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div className="w-24 h-2 rounded-full bg-chart-2" />
                          </div>
                          <span className="text-sm text-muted-foreground">35%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">$50K+</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div className="w-8 h-2 rounded-full bg-chart-3" />
                          </div>
                          <span className="text-sm text-muted-foreground">20%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="conversations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sentiment Analysis Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={sentimentTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="positive" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="neutral" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="negative" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">AI Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Response Accuracy</span>
                        <span className="text-sm font-medium">94.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Processing Speed</span>
                        <span className="text-sm font-medium">2.3s avg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Auto-Resolution Rate</span>
                        <span className="text-sm font-medium">76.8%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Uptime</span>
                        <span className="text-sm font-medium text-chart-1">99.9%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">API Response Time</span>
                        <span className="text-sm font-medium">245ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Error Rate</span>
                        <span className="text-sm font-medium text-chart-3">0.1%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Business Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Time Saved</span>
                        <span className="text-sm font-medium text-chart-1">28.5 hrs/week</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Cost Reduction</span>
                        <span className="text-sm font-medium text-chart-1">$12,450/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Client Satisfaction</span>
                        <span className="text-sm font-medium text-chart-1">+15.2%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
