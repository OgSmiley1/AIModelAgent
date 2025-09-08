import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Star, 
  TrendingUp, 
  Target, 
  Brain, 
  Zap, 
  Clock, 
  Edit, 
  Save, 
  X, 
  RefreshCw,
  DollarSign,
  MapPin,
  Crown,
  AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ClientProfileData } from "@/types";

interface EnhancedProfileCardProps {
  client: ClientProfileData;
}

export function EnhancedProfileCard({ client }: EnhancedProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);
  const [editData, setEditData] = useState({
    name: client.name,
    phone: client.phone || "",
    email: client.email || "",
    whatsappNumber: client.whatsappNumber || "",
    status: client.status,
    priority: client.priority,
    interests: client.interests || "",
    notes: client.notes || "",
    budget: client.budget || 0,
    timeframe: client.timeframe || "medium_term",
    location: client.location || "",
    decisionMaker: client.decisionMaker || false,
  });

  const queryClient = useQueryClient();

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/clients/${client.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsEditing(false);
    },
  });

  // Update lead score mutation
  const updateLeadScoreMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/clients/${client.id}/update-lead-score`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsUpdatingScore(false);
    },
  });

  const handleSave = () => {
    updateClientMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditData({
      name: client.name,
      phone: client.phone || "",
      email: client.email || "",
      whatsappNumber: client.whatsappNumber || "",
      status: client.status,
      priority: client.priority,
      interests: client.interests || "",
      notes: client.notes || "",
      budget: client.budget || 0,
      timeframe: client.timeframe || "medium_term",
      location: client.location || "",
      decisionMaker: client.decisionMaker || false,
    });
    setIsEditing(false);
  };

  const handleUpdateLeadScore = () => {
    setIsUpdatingScore(true);
    updateLeadScoreMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'vip': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'very_high': return 'text-green-600';
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-red-500';
    }
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const leadScore = client.leadScore || 0;
  const conversionProbability = (client.conversionProbability || 0) * 100;
  const engagementLevel = client.engagementLevel || 'low';

  return (
    <Card className="hover:shadow-md transition-shadow duration-200" data-testid={`client-card-${client.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              {isEditing ? (
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="font-semibold text-lg"
                />
              ) : (
                <CardTitle className="text-lg">{client.name}</CardTitle>
              )}
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
                <Badge className={getPriorityColor(client.priority)}>
                  {client.priority}
                </Badge>
                {client.decisionMaker && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    <Crown size={12} className="mr-1" />
                    Decision Maker
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                data-testid={`edit-client-${client.id}`}
              >
                <Edit size={14} />
              </Button>
            ) : (
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={updateClientMutation.isPending}
                  data-testid={`save-client-${client.id}`}
                >
                  <Save size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  data-testid={`cancel-edit-${client.id}`}
                >
                  <X size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Insights Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm flex items-center">
              <Brain className="mr-2" size={16} />
              AI Insights
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpdateLeadScore}
              disabled={isUpdatingScore || updateLeadScoreMutation.isPending}
              data-testid={`update-score-${client.id}`}
            >
              <RefreshCw size={14} className={isUpdatingScore ? 'animate-spin' : ''} />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Lead Score</span>
                <span className={`text-sm font-semibold ${getLeadScoreColor(leadScore)}`}>
                  {leadScore}/100
                </span>
              </div>
              <Progress value={leadScore} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Conversion</span>
                <span className="text-sm font-semibold text-green-600">
                  {conversionProbability.toFixed(0)}%
                </span>
              </div>
              <Progress value={conversionProbability} className="h-2" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <Zap size={12} className={`mr-1 ${getEngagementColor(engagementLevel)}`} />
              <span className="text-muted-foreground">Engagement:</span>
              <span className={`ml-1 font-medium ${getEngagementColor(engagementLevel)}`}>
                {engagementLevel.replace('_', ' ')}
              </span>
            </div>
            {client.lastScoreUpdate && (
              <span className="text-muted-foreground">
                Updated {new Date(client.lastScoreUpdate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Next Best Action */}
          {client.nextBestAction && (
            <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-blue-500">
              <div className="flex items-start">
                <Target size={14} className="mr-2 mt-0.5 text-blue-500" />
                <div>
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300">Next Best Action</div>
                  <div className="text-xs text-muted-foreground">{client.nextBestAction}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Contact Information</h4>
          
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-muted-foreground" />
                <Input
                  placeholder="Phone number"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-muted-foreground" />
                <Input
                  placeholder="Email address"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare size={16} className="text-muted-foreground" />
                <Input
                  placeholder="WhatsApp number"
                  value={editData.whatsappNumber}
                  onChange={(e) => setEditData({ ...editData, whatsappNumber: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-muted-foreground" />
                <Input
                  placeholder="Location"
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {client.phone && (
                <div className="flex items-center text-sm">
                  <Phone size={16} className="mr-2 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center text-sm">
                  <Mail size={16} className="mr-2 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.whatsappNumber && (
                <div className="flex items-center text-sm">
                  <MessageSquare size={16} className="mr-2 text-muted-foreground" />
                  <span>{client.whatsappNumber}</span>
                </div>
              )}
              {client.location && (
                <div className="flex items-center text-sm">
                  <MapPin size={16} className="mr-2 text-muted-foreground" />
                  <span>{client.location}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Business Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Business Details</h4>
          
          {isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value as 'prospect' | 'active' | 'inactive' | 'vip' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={editData.priority} onValueChange={(value) => setEditData({ ...editData, priority: value as 'low' | 'medium' | 'high' | 'critical' | 'vip' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <DollarSign size={16} className="text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Budget"
                    value={editData.budget}
                    onChange={(e) => setEditData({ ...editData, budget: Number(e.target.value) })}
                  />
                </div>
                
                <Select value={editData.timeframe} onValueChange={(value) => setEditData({ ...editData, timeframe: value as 'immediate' | 'short_term' | 'medium_term' | 'long_term' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="short_term">Short Term</SelectItem>
                    <SelectItem value="medium_term">Medium Term</SelectItem>
                    <SelectItem value="long_term">Long Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Input
                placeholder="Interests"
                value={editData.interests}
                onChange={(e) => setEditData({ ...editData, interests: e.target.value })}
              />
              
              <Textarea
                placeholder="Notes"
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={3}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {client.budget && client.budget > 0 && (
                <div className="flex items-center text-sm">
                  <DollarSign size={16} className="mr-2 text-muted-foreground" />
                  <span>${client.budget.toLocaleString()}</span>
                </div>
              )}
              {client.timeframe && (
                <div className="flex items-center text-sm">
                  <Clock size={16} className="mr-2 text-muted-foreground" />
                  <span>{client.timeframe.replace('_', ' ')}</span>
                </div>
              )}
              {client.interests && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Interests: </span>
                  <span>{client.interests}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Activity Summary */}
        <Separator />
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-chart-1">{client.totalInteractions || 0}</div>
            <div className="text-xs text-muted-foreground">Interactions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-chart-2">
              {client.sentimentScore ? (client.sentimentScore * 2 + 3).toFixed(1) : '3.0'}
            </div>
            <div className="text-xs text-muted-foreground">Satisfaction</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-chart-3">
              {client.lastInteraction 
                ? Math.ceil((Date.now() - new Date(client.lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
                : 0}d
            </div>
            <div className="text-xs text-muted-foreground">Last Contact</div>
          </div>
        </div>

        {/* Risk Factors */}
        {client.riskFactors && client.riskFactors.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center text-orange-600">
                <AlertTriangle size={16} className="mr-2" />
                Risk Factors
              </h4>
              <div className="space-y-1">
                {client.riskFactors.slice(0, 3).map((risk, index) => (
                  <div key={index} className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    {risk}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Follow-up indicator */}
        {client.followUpRequired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Follow-up Required</span>
            </div>
            {client.followUpDate && (
              <div className="text-xs text-yellow-600 mt-1">
                Due: {new Date(client.followUpDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}