import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  Bot, 
  MessageSquare, 
  Bell, 
  Database,
  Key,
  Shield,
  Smartphone,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SystemSettingData, WhatsAppStatus } from "@/types";

interface SettingsFormData {
  whatsapp_access_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_webhook_token?: string;
  ai_auto_response?: boolean;
  sentiment_monitoring?: boolean;
  follow_up_reminders?: boolean;
  notification_email?: string;
  business_hours_start?: string;
  business_hours_end?: string;
  timezone?: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("whatsapp");
  const [formData, setFormData] = useState<SettingsFormData>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch system settings
  const { data: settings = [], isLoading } = useQuery<SystemSettingData[]>({
    queryKey: ['/api/settings'],
  });

  // Fetch WhatsApp status
  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ['/api/whatsapp/status'],
    refetchInterval: 10000,
  });

  // Update settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: any; category: string; description?: string }) => {
      return apiRequest('POST', '/api/settings', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/status'] });
      toast({
        title: "Setting Updated",
        description: `${variables.key} has been updated successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Convert settings array to object for easier access
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, any>);

  const handleSettingUpdate = (key: string, value: any, category: string, description?: string) => {
    updateSettingMutation.mutate({ key, value, category, description });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle bulk form submission if needed
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined) {
        const category = key.startsWith('whatsapp_') ? 'whatsapp' : 
                        key.startsWith('ai_') ? 'ai' : 'general';
        handleSettingUpdate(key, value, category);
      }
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="Settings"
          subtitle="Configure your CLOSERT AI system preferences"
        />
        
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="whatsapp" data-testid="whatsapp-settings-tab">
                <Smartphone size={16} className="mr-2" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="ai" data-testid="ai-settings-tab">
                <Bot size={16} className="mr-2" />
                AI Settings
              </TabsTrigger>
              <TabsTrigger value="notifications" data-testid="notifications-settings-tab">
                <Bell size={16} className="mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" data-testid="security-settings-tab">
                <Shield size={16} className="mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="general" data-testid="general-settings-tab">
                <SettingsIcon size={16} className="mr-2" />
                General
              </TabsTrigger>
            </TabsList>

            {/* WhatsApp Settings */}
            <TabsContent value="whatsapp" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Smartphone className="text-primary" size={20} />
                    <span>WhatsApp Business Configuration</span>
                    <Badge className={whatsappStatus?.connected ? "bg-chart-1 text-white" : "bg-chart-3 text-white"}>
                      {whatsappStatus?.connected ? "Connected" : "Disconnected"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {whatsappStatus && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg mb-4">
                      <div className="text-center">
                        <div className={`inline-flex items-center space-x-1 ${whatsappStatus.accessToken ? 'text-chart-1' : 'text-chart-3'}`}>
                          {whatsappStatus.accessToken ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                          <span className="text-sm font-medium">Access Token</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {whatsappStatus.accessToken ? "Valid" : "Missing"}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className={`inline-flex items-center space-x-1 ${whatsappStatus.phoneNumberId ? 'text-chart-1' : 'text-chart-3'}`}>
                          {whatsappStatus.phoneNumberId ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                          <span className="text-sm font-medium">Phone Number</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {whatsappStatus.phoneNumberId ? "Configured" : "Not Set"}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className={`inline-flex items-center space-x-1 ${whatsappStatus.connected ? 'text-chart-1' : 'text-chart-3'}`}>
                          {whatsappStatus.connected ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                          <span className="text-sm font-medium">Connection</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {whatsappStatus.connected ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="access-token">Meta Access Token</Label>
                      <Input
                        id="access-token"
                        type="password"
                        placeholder="Enter your Meta access token"
                        value={formData.whatsapp_access_token || settingsMap.whatsapp_access_token || ""}
                        onChange={(e) => setFormData({...formData, whatsapp_access_token: e.target.value})}
                        data-testid="whatsapp-access-token-input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Get this from Meta Developer Console → Your App → WhatsApp → API Setup
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="phone-number-id">Phone Number ID</Label>
                      <Input
                        id="phone-number-id"
                        placeholder="Enter phone number ID"
                        value={formData.whatsapp_phone_number_id || settingsMap.whatsapp_phone_number_id || ""}
                        onChange={(e) => setFormData({...formData, whatsapp_phone_number_id: e.target.value})}
                        data-testid="whatsapp-phone-id-input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Found in WhatsApp → API Setup → From phone number
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="webhook-token">Webhook Verify Token</Label>
                      <Input
                        id="webhook-token"
                        placeholder="Enter webhook verify token"
                        value={formData.whatsapp_webhook_token || settingsMap.whatsapp_webhook_token || "CRC_WARROOM_WEBHOOK_2025_SECURE_TOKEN"}
                        onChange={(e) => setFormData({...formData, whatsapp_webhook_token: e.target.value})}
                        data-testid="whatsapp-webhook-token-input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use this token in your Meta webhook configuration
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Webhook Configuration</h4>
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div>
                          <Label className="text-xs">Callback URL:</Label>
                          <code className="block text-xs bg-background p-2 rounded mt-1">
                            {window.location.origin}/webhook/whatsapp
                          </code>
                        </div>
                        <div>
                          <Label className="text-xs">Verify Token:</Label>
                          <code className="block text-xs bg-background p-2 rounded mt-1">
                            {formData.whatsapp_webhook_token || settingsMap.whatsapp_webhook_token || "CRC_WARROOM_WEBHOOK_2025_SECURE_TOKEN"}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateSettingMutation.isPending} data-testid="save-whatsapp-settings">
                        <Save size={16} className="mr-2" />
                        {updateSettingMutation.isPending ? "Saving..." : "Save WhatsApp Settings"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Settings */}
            <TabsContent value="ai" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="text-primary" size={20} />
                    <span>AI Assistant Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-response" className="font-medium">Auto-Response System</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically respond to common client inquiries
                      </p>
                    </div>
                    <Switch 
                      id="auto-response"
                      checked={settingsMap.ai_auto_response ?? true}
                      onCheckedChange={(checked) => handleSettingUpdate('ai_auto_response', checked, 'ai', 'Enable AI auto-responses')}
                      data-testid="auto-response-switch"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sentiment-monitoring" className="font-medium">Sentiment Monitoring</Label>
                      <p className="text-sm text-muted-foreground">
                        Monitor client sentiment and alert on negative feedback
                      </p>
                    </div>
                    <Switch 
                      id="sentiment-monitoring"
                      checked={settingsMap.sentiment_monitoring ?? true}
                      onCheckedChange={(checked) => handleSettingUpdate('sentiment_monitoring', checked, 'ai', 'Enable sentiment monitoring')}
                      data-testid="sentiment-monitoring-switch"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="follow-up-reminders" className="font-medium">Smart Follow-up Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically schedule follow-ups based on client behavior
                      </p>
                    </div>
                    <Switch 
                      id="follow-up-reminders"
                      checked={settingsMap.follow_up_reminders ?? true}
                      onCheckedChange={(checked) => handleSettingUpdate('follow_up_reminders', checked, 'automation', 'Enable follow-up reminders')}
                      data-testid="follow-up-reminders-switch"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="font-medium">AI Model Configuration</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="response-temperature">Response Creativity</Label>
                        <Select defaultValue="balanced">
                          <SelectTrigger data-testid="ai-temperature-select">
                            <SelectValue placeholder="Select creativity level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conservative">Conservative</SelectItem>
                            <SelectItem value="balanced">Balanced</SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="response-length">Response Length</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger data-testid="ai-length-select">
                            <SelectValue placeholder="Select response length" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">Short & Concise</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-chart-1">94.2%</div>
                      <p className="text-sm text-muted-foreground">Response Accuracy</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-chart-2">2.3s</div>
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-chart-3">76.8%</div>
                      <p className="text-sm text-muted-foreground">Auto-Resolution Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="text-primary" size={20} />
                    <span>Notification Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="notification-email">Notification Email</Label>
                    <Input
                      id="notification-email"
                      type="email"
                      placeholder="Enter email for notifications"
                      value={settingsMap.notification_email || ""}
                      onChange={(e) => handleSettingUpdate('notification_email', e.target.value, 'notifications')}
                      data-testid="notification-email-input"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Alert Types</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Negative Sentiment Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when client sentiment turns negative
                        </p>
                      </div>
                      <Switch defaultChecked data-testid="negative-sentiment-alerts" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>High Priority Client Messages</Label>
                        <p className="text-sm text-muted-foreground">
                          Immediate notifications for VIP clients
                        </p>
                      </div>
                      <Switch defaultChecked data-testid="vip-client-alerts" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>System Health Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Notifications about system issues and downtime
                        </p>
                      </div>
                      <Switch defaultChecked data-testid="system-health-alerts" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Daily Summary Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Daily email digest of key metrics and activities
                        </p>
                      </div>
                      <Switch data-testid="daily-summary-reports" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="text-primary" size={20} />
                    <span>Security & Privacy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Data Encryption</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Encrypt Client Data</Label>
                        <p className="text-sm text-muted-foreground">
                          All client data is encrypted at rest and in transit
                        </p>
                      </div>
                      <Badge className="bg-chart-1 text-white">Enabled</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Access Control</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Session Timeout</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically log out inactive users
                        </p>
                      </div>
                      <Select defaultValue="30min">
                        <SelectTrigger className="w-32" data-testid="session-timeout-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15min">15 minutes</SelectItem>
                          <SelectItem value="30min">30 minutes</SelectItem>
                          <SelectItem value="1hour">1 hour</SelectItem>
                          <SelectItem value="4hours">4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">API Security</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Rate Limiting</span>
                        <Badge className="bg-chart-1 text-white">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Request Validation</span>
                        <Badge className="bg-chart-1 text-white">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">SSL/TLS Encryption</span>
                        <Badge className="bg-chart-1 text-white">TLS 1.3</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="text-primary" size={20} />
                    <span>General Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="UTC">
                        <SelectTrigger data-testid="timezone-select">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="date-format">Date Format</Label>
                      <Select defaultValue="MM/dd/yyyy">
                        <SelectTrigger data-testid="date-format-select">
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                          <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                          <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Business Hours</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="business-start">Start Time</Label>
                        <Input
                          id="business-start"
                          type="time"
                          value={settingsMap.business_hours_start || "09:00"}
                          onChange={(e) => handleSettingUpdate('business_hours_start', e.target.value, 'general')}
                          data-testid="business-hours-start"
                        />
                      </div>
                      <div>
                        <Label htmlFor="business-end">End Time</Label>
                        <Input
                          id="business-end"
                          type="time"
                          value={settingsMap.business_hours_end || "17:00"}
                          onChange={(e) => handleSettingUpdate('business_hours_end', e.target.value, 'general')}
                          data-testid="business-hours-end"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      AI responses will be adjusted based on business hours
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">System Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Version:</span>
                          <span>v2.1.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Update:</span>
                          <span>Jan 15, 2024</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Uptime:</span>
                          <span className="text-chart-1">99.9%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Database:</span>
                          <Badge className="bg-chart-1 text-white">Connected</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">AI Model:</span>
                          <Badge className="bg-chart-2 text-white">Active</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Storage:</span>
                          <span>2.4 GB used</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <Button variant="outline" data-testid="refresh-cache-btn">
                      <RefreshCw size={16} className="mr-2" />
                      Refresh Cache
                    </Button>
                    <Button variant="outline" data-testid="backup-data-btn">
                      <Database size={16} className="mr-2" />
                      Backup Data
                    </Button>
                    <Button variant="outline" data-testid="export-settings-btn">
                      <Save size={16} className="mr-2" />
                      Export Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
