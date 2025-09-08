import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Brain, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Clock,
  Users,
  Lightbulb,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Forecasting() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("monthly");
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing forecasts
  const { data: forecasts = [], isLoading: forecastsLoading } = useQuery({
    queryKey: ['/api/forecasts'],
  });

  // Fetch current clients for analytics
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Fetch current deals for pipeline analysis
  const { data: deals = [] } = useQuery({
    queryKey: ['/api/deals'],
  });

  // Generate forecast mutation
  const generateForecastMutation = useMutation({
    mutationFn: async (period: string) => {
      return apiRequest('POST', '/api/forecasts/generate', { period });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forecasts'] });
      setIsGenerating(false);
    },
  });

  const handleGenerateForecast = () => {
    setIsGenerating(true);
    generateForecastMutation.mutate(selectedPeriod);
  };

  // Calculate key metrics
  const totalPipelineValue = deals.reduce((sum: number, deal: any) => sum + deal.value, 0);
  const avgLeadScore = clients.length > 0 
    ? clients.reduce((sum: number, client: any) => sum + (client.leadScore || 0), 0) / clients.length 
    : 0;
  const highProbabilityDeals = deals.filter((deal: any) => deal.probability > 0.7).length;
  const currentMonthForecasts = forecasts.filter((f: any) => f.period === 'monthly');
  const latestForecast = currentMonthForecasts[0];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="Sales Forecasting"
          subtitle="AI-powered sales predictions and pipeline analysis"
        />
        
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header with Generate Forecast */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Sales Forecasting Dashboard</h2>
              <p className="text-muted-foreground">Advanced AI predictions for your sales pipeline</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleGenerateForecast}
                disabled={isGenerating || generateForecastMutation.isPending}
                data-testid="generate-forecast-btn"
              >
                <RefreshCw className={`mr-2 ${isGenerating ? 'animate-spin' : ''}`} size={16} />
                Generate Forecast
              </Button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pipeline Value</p>
                    <p className="text-2xl font-bold">${totalPipelineValue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total active deals</p>
                  </div>
                  <DollarSign className="text-green-500" size={24} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Lead Score</p>
                    <p className="text-2xl font-bold">{avgLeadScore.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Quality indicator</p>
                  </div>
                  <Brain className="text-purple-500" size={24} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">High-Prob Deals</p>
                    <p className="text-2xl font-bold">{highProbabilityDeals}</p>
                    <p className="text-xs text-muted-foreground">70%+ probability</p>
                  </div>
                  <Target className="text-blue-500" size={24} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">AI Confidence</p>
                    <p className="text-2xl font-bold">
                      {latestForecast ? Math.round(latestForecast.confidence * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Prediction accuracy</p>
                  </div>
                  <Zap className="text-yellow-500" size={24} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="forecast" className="space-y-6">
            <TabsList className="grid w-auto grid-cols-4">
              <TabsTrigger value="forecast">Current Forecast</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline Analysis</TabsTrigger>
              <TabsTrigger value="trends">Historical Trends</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            {/* Current Forecast Tab */}
            <TabsContent value="forecast" className="space-y-6">
              {latestForecast ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Forecast Card */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2" size={20} />
                        {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Forecast
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Predicted Revenue</p>
                          <p className="text-3xl font-bold text-green-600">
                            ${latestForecast.predictedRevenue.toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Expected Deals</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {latestForecast.predictedDeals}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Confidence Level</span>
                          <span className="text-sm font-medium">
                            {Math.round(latestForecast.confidence * 100)}%
                          </span>
                        </div>
                        <Progress value={latestForecast.confidence * 100} className="h-2" />
                      </div>

                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Methodology</p>
                        <Badge variant="outline" className="capitalize">
                          {latestForecast.methodology}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Forecast Factors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="mr-2" size={20} />
                        Key Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {latestForecast.factors && (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Pipeline Value</span>
                            <span className="text-sm font-medium">
                              ${latestForecast.factors.pipelineValue?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Conversion Rate</span>
                            <span className="text-sm font-medium">
                              {((latestForecast.factors.conversionRate || 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Avg Deal Size</span>
                            <span className="text-sm font-medium">
                              ${latestForecast.factors.averageDealSize?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Sales Velocity</span>
                            <span className="text-sm font-medium">
                              {latestForecast.factors.salesVelocity?.toFixed(0) || 0} days
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Lead Quality</span>
                            <span className="text-sm font-medium">
                              {latestForecast.factors.leadQuality || 0}/100
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Brain className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground mb-4">No forecast available</p>
                    <Button onClick={handleGenerateForecast} disabled={isGenerating}>
                      <RefreshCw className="mr-2" size={16} />
                      Generate Your First Forecast
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {latestForecast?.recommendations && latestForecast.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="mr-2" size={20} />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {latestForecast.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <Lightbulb className="text-blue-500 mt-0.5" size={16} />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Pipeline Analysis Tab */}
            <TabsContent value="pipeline" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Deal Stage Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['prospecting', 'qualification', 'proposal', 'negotiation'].map((stage) => {
                        const stageDeals = deals.filter((d: any) => d.stage === stage);
                        const stageValue = stageDeals.reduce((sum: number, deal: any) => sum + deal.value, 0);
                        const percentage = totalPipelineValue > 0 ? (stageValue / totalPipelineValue) * 100 : 0;
                        
                        return (
                          <div key={stage} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{stage}</span>
                              <span>{stageDeals.length} deals - ${stageValue.toLocaleString()}</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deals
                        .sort((a: any, b: any) => b.value - a.value)
                        .slice(0, 5)
                        .map((deal: any) => (
                        <div key={deal.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{deal.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {deal.probability * 100}% probability
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${deal.value.toLocaleString()}</p>
                            <Badge variant="outline" className="capitalize">
                              {deal.stage}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Historical Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Forecasts</p>
                        <p className="text-2xl font-bold">{forecasts.length}</p>
                      </div>
                      <Calendar className="text-blue-500" size={24} />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                        <p className="text-2xl font-bold">
                          {forecasts.length > 0 
                            ? Math.round(forecasts.reduce((acc: number, f: any) => acc + (f.confidence || 0), 0) / forecasts.length * 100)
                            : 0}%
                        </p>
                      </div>
                      <CheckCircle className="text-green-500" size={24} />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="text-2xl font-bold">
                          {latestForecast 
                            ? new Date(latestForecast.createdAt).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                      <Clock className="text-purple-500" size={24} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Forecasts</CardTitle>
                </CardHeader>
                <CardContent>
                  {forecasts.length > 0 ? (
                    <div className="space-y-4">
                      {forecasts.slice(0, 5).map((forecast: any) => (
                        <div key={forecast.id} className="flex items-center justify-between p-4 border rounded">
                          <div>
                            <p className="font-medium capitalize">{forecast.period} Forecast</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(forecast.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${forecast.predictedRevenue.toLocaleString()}</p>
                            <div className="flex items-center space-x-2">
                              <Progress value={forecast.confidence * 100} className="w-20 h-2" />
                              <span className="text-sm">{Math.round(forecast.confidence * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="mx-auto mb-4 text-muted-foreground" size={48} />
                      <p className="text-muted-foreground">No historical data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="mr-2" size={20} />
                      Sales Performance Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center">
                        <ArrowUp className="text-green-600 mr-2" size={16} />
                        <span className="font-medium text-green-800">Strong Pipeline</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Your pipeline value is above average with strong lead quality indicators.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center">
                        <Target className="text-blue-600 mr-2" size={16} />
                        <span className="font-medium text-blue-800">Conversion Opportunity</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        {highProbabilityDeals} deals have high conversion probability - focus on closing these first.
                      </p>
                    </div>
                    
                    {avgLeadScore < 50 && (
                      <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <div className="flex items-center">
                          <AlertTriangle className="text-yellow-600 mr-2" size={16} />
                          <span className="font-medium text-yellow-800">Lead Quality</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          Average lead score is below optimal. Consider refining lead qualification process.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="mr-2" size={20} />
                      Action Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Review High-Value Deals</p>
                        <p className="text-sm text-muted-foreground">
                          Focus on deals over $50K in negotiation stage
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Update Lead Scores</p>
                        <p className="text-sm text-muted-foreground">
                          Refresh AI lead scoring for better accuracy
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Pipeline Optimization</p>
                        <p className="text-sm text-muted-foreground">
                          Identify bottlenecks in qualification stage
                        </p>
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