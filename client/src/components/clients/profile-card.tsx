import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  TrendingUp,
  Heart,
  DollarSign,
  Clock,
  Eye,
  Edit,
  MoreHorizontal,
  Star,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ClientProfileData } from "@/types";

interface ProfileCardProps {
  client: ClientProfileData;
  onEdit?: (client: ClientProfileData) => void;
  onMessage?: (client: ClientProfileData) => void;
  onViewDetails?: (client: ClientProfileData) => void;
}

export function ProfileCard({ client, onEdit, onMessage, onViewDetails }: ProfileCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'active':
        return 'bg-chart-1/10 text-chart-1';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      case 'prospect':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'vip':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'critical':
        return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
      case 'low':
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return <Heart className="text-chart-1" size={16} />;
    if (score < -0.3) return <AlertCircle className="text-chart-3" size={16} />;
    return <CheckCircle className="text-chart-2" size={16} />;
  };

  const getSentimentText = (score: number) => {
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow" data-testid={`client-card-${client.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-semibold text-lg truncate" data-testid="client-name">
                  {client.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(client.priority)}>
                    {client.priority}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              data-testid={`client-menu-${client.id}`}
            >
              <MoreHorizontal size={16} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-2">
            {client.phone && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone size={14} />
                <span data-testid="client-phone">{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail size={14} />
                <span data-testid="client-email" className="truncate">{client.email}</span>
              </div>
            )}
            {client.whatsappNumber && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <SiWhatsapp size={14} />
                <span data-testid="client-whatsapp">{client.whatsappNumber}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <TrendingUp size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Interactions</span>
              </div>
              <span className="text-sm font-semibold" data-testid="client-interactions">
                {client.totalInteractions}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <DollarSign size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">LTV</span>
              </div>
              <span className="text-sm font-semibold" data-testid="client-ltv">
                {formatCurrency(client.lifetimeValue)}
              </span>
            </div>
          </div>

          {/* Sentiment & Last Interaction */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getSentimentIcon(client.sentimentScore)}
                <span className="text-sm">
                  {getSentimentText(client.sentimentScore)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Score: {client.sentimentScore.toFixed(1)}
              </span>
            </div>
            
            {client.lastInteraction && (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Clock size={12} />
                <span data-testid="last-interaction">
                  Last contact: {format(new Date(client.lastInteraction), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Follow-up Indicator */}
          {client.followUpRequired && (
            <div className="p-2 bg-chart-2/10 border border-chart-2/20 rounded-md">
              <div className="flex items-center space-x-2">
                <Calendar size={14} className="text-chart-2" />
                <span className="text-sm font-medium text-chart-2">Follow-up Required</span>
              </div>
              {client.followUpDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {format(new Date(client.followUpDate), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          )}

          {/* Interests */}
          {client.interests && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Interests:</p>
              <p className="text-sm truncate" data-testid="client-interests">
                {client.interests}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setIsDetailsOpen(true)}
              data-testid={`view-client-${client.id}`}
            >
              <Eye size={14} className="mr-1" />
              View
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMessage?.(client)}
              disabled={!client.whatsappNumber}
              data-testid={`message-client-${client.id}`}
            >
              <MessageSquare size={14} className="mr-1" />
              Message
            </Button>
            
            <Button
              size="sm"
              onClick={() => onEdit?.(client)}
              data-testid={`edit-client-${client.id}`}
            >
              <Edit size={14} className="mr-1" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>{client.name}</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(client.priority)}>
                    {client.priority}
                  </Badge>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {client.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone size={16} className="text-muted-foreground" />
                        <span className="text-sm">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center space-x-2">
                        <Mail size={16} className="text-muted-foreground" />
                        <span className="text-sm">{client.email}</span>
                      </div>
                    )}
                    {client.whatsappNumber && (
                      <div className="flex items-center space-x-2">
                        <SiWhatsapp size={16} className="text-muted-foreground" />
                        <span className="text-sm">{client.whatsappNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Key Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Interactions:</span>
                      <span className="text-sm font-medium">{client.totalInteractions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Lifetime Value:</span>
                      <span className="text-sm font-medium">{formatCurrency(client.lifetimeValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sentiment:</span>
                      <div className="flex items-center space-x-1">
                        {getSentimentIcon(client.sentimentScore)}
                        <span className="text-sm font-medium">
                          {getSentimentText(client.sentimentScore)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Conversion Stage:</span>
                      <span className="text-sm font-medium capitalize">{client.conversionStage}</span>
                    </div>
                  </div>
                </div>
              </div>

              {client.interests && (
                <div>
                  <h4 className="font-medium mb-2">Interests</h4>
                  <p className="text-sm text-muted-foreground">{client.interests}</p>
                </div>
              )}

              {client.tags && client.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="interactions">
              <div className="text-center py-8">
                <MessageSquare className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-muted-foreground">Interaction history would appear here</p>
                <p className="text-sm text-muted-foreground mt-2">
                  View all conversations, calls, and meetings with this client
                </p>
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="text-chart-1" size={16} />
                        <span className="font-medium text-sm">Engagement Trend</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Client engagement has increased by 25% over the last month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="text-chart-2" size={16} />
                        <span className="font-medium text-sm">Response Time</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Typically responds within 2-4 hours during business days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">AI Recommendations</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Schedule follow-up within 3 days to maintain engagement</li>
                      <li>• Focus on premium service offerings based on interaction history</li>
                      <li>• Consider VIP status upgrade due to high engagement</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div>
                {client.notes ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{client.notes}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">No notes yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add notes to keep track of important client information
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
