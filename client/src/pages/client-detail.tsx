import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { EnhancedProfileCard } from "@/components/clients/enhanced-profile-card";
import { FollowUpsSection } from "@/components/clients/follow-ups-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  Star,
  Brain,
  Target,
} from "lucide-react";
import { Link } from "wouter";

export default function ClientDetailPage() {
  const { clientId } = useParams();

  const { data: client, isLoading } = useQuery({
    queryKey: ['/api/clients', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}`);
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar title="Client Details" subtitle="Loading client information..." />
          <div className="flex-1 overflow-auto p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar title="Client Details" subtitle="Client not found" />
          <div className="flex-1 overflow-auto p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Client Not Found</h2>
              <p className="text-muted-foreground mb-6">The client you're looking for doesn't exist.</p>
              <Link href="/clients">
                <Button>
                  <ArrowLeft className="mr-2" size={16} />
                  Back to Clients
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="Client Details"
          subtitle={`Detailed view for ${client.name}`}
        />
        
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between">
            <Link href="/clients">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2" size={16} />
                Back to Clients
              </Button>
            </Link>
            
            <div className="flex items-center space-x-2">
              <Badge 
                className={
                  client.status === 'vip' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                  client.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                  client.status === 'inactive' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                  'bg-blue-100 text-blue-800 border-blue-200'
                }
              >
                {client.status}
              </Badge>
              <Badge 
                className={
                  client.priority === 'vip' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                  client.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                  client.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  'bg-green-100 text-green-800 border-green-200'
                }
              >
                {client.priority} priority
              </Badge>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Client Profile */}
            <div className="lg:col-span-2 space-y-6">
              {/* Client Overview Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{client.name}</CardTitle>
                      <p className="text-muted-foreground">{client.location || 'Location not specified'}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {client.phone && (
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <Phone size={16} className="text-blue-600" />
                          <div>
                            <div className="text-xs text-muted-foreground">Phone</div>
                            <div className="font-medium">{client.phone}</div>
                          </div>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                          <Mail size={16} className="text-purple-600" />
                          <div>
                            <div className="text-xs text-muted-foreground">Email</div>
                            <div className="font-medium">{client.email}</div>
                          </div>
                        </div>
                      )}
                      {client.whatsappNumber && (
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <MessageSquare size={16} className="text-green-600" />
                          <div>
                            <div className="text-xs text-muted-foreground">WhatsApp</div>
                            <div className="font-medium">{client.whatsappNumber}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* AI Insights */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center">
                      <Brain className="mr-2" size={16} />
                      AI Insights
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{client.leadScore || 0}</div>
                        <div className="text-xs text-muted-foreground">Lead Score</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round((client.conversionProbability || 0) * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Conversion Probability</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {client.engagementLevel || 'Low'}
                        </div>
                        <div className="text-xs text-muted-foreground">Engagement Level</div>
                      </div>
                    </div>
                  </div>

                  {/* Client Details */}
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {client.budget && client.budget > 0 && (
                      <div className="flex items-center space-x-3">
                        <DollarSign size={16} className="text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Budget</div>
                          <div className="font-medium">${client.budget.toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                    {client.timeframe && (
                      <div className="flex items-center space-x-3">
                        <Clock size={16} className="text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Timeframe</div>
                          <div className="font-medium">{client.timeframe.replace('_', ' ')}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {client.interests && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Interests</h4>
                      <p className="text-sm text-muted-foreground">{client.interests}</p>
                    </div>
                  )}

                  {client.notes && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">{client.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Follow-ups Section */}
              <FollowUpsSection clientId={client.id} clientName={client.name} />
            </div>

            {/* Right Column - Quick Actions & Stats */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Phone className="mr-2" size={16} />
                    Call Client
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="mr-2" size={16} />
                    Send WhatsApp
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Mail className="mr-2" size={16} />
                    Send Email
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="mr-2" size={16} />
                    Schedule Meeting
                  </Button>
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Interactions</span>
                    <span className="font-semibold">{client.totalInteractions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Satisfaction Score</span>
                    <span className="font-semibold">
                      {client.sentimentScore ? (client.sentimentScore * 2 + 3).toFixed(1) : '3.0'}/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Contact</span>
                    <span className="font-semibold">
                      {client.lastInteraction 
                        ? `${Math.ceil((Date.now() - new Date(client.lastInteraction).getTime()) / (1000 * 60 * 60 * 24))}d ago`
                        : 'Never'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factors */}
              {client.riskFactors && client.riskFactors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600 flex items-center">
                      <AlertTriangle className="mr-2" size={18} />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {client.riskFactors.slice(0, 5).map((risk: string, index: number) => (
                        <div key={index} className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
                          {risk}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}