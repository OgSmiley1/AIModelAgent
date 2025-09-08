import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Settings, Send, Edit, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIResponse {
  message: string;
  clientName: string;
  intent: string;
  urgency: string;
}

interface ResponseGeneratorProps {
  suggestedResponse?: AIResponse;
  onSendResponse?: (response: string) => void;
  onGenerateAlternative?: () => void;
  autoResponseEnabled?: boolean;
  sentimentMonitoringEnabled?: boolean;
  followUpRemindersEnabled?: boolean;
  onToggleAutoResponse?: (enabled: boolean) => void;
  onToggleSentimentMonitoring?: (enabled: boolean) => void;
  onToggleFollowUpReminders?: (enabled: boolean) => void;
}

export function ResponseGenerator({
  suggestedResponse,
  onSendResponse,
  onGenerateAlternative,
  autoResponseEnabled = true,
  sentimentMonitoringEnabled = true,
  followUpRemindersEnabled = true,
  onToggleAutoResponse,
  onToggleSentimentMonitoring,
  onToggleFollowUpReminders,
}: ResponseGeneratorProps) {
  const [editedResponse, setEditedResponse] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setEditedResponse(suggestedResponse?.message || "");
    setIsEditing(true);
  };

  const handleSend = () => {
    const messageToSend = isEditing ? editedResponse : suggestedResponse?.message || "";
    onSendResponse?.(messageToSend);
    setIsEditing(false);
    setEditedResponse("");
  };

  return (
    <Card data-testid="response-generator">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">AI Response Generator</CardTitle>
          <Button variant="ghost" size="sm" data-testid="configure-rules-btn">
            <Settings size={14} className="mr-1" />
            Configure Rules
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Suggested Response Section */}
        {suggestedResponse && (
          <div className="bg-accent rounded-lg p-4" data-testid="suggested-response">
            <div className="flex items-center space-x-2 mb-2">
              <Bot className="text-primary" size={16} />
              <span className="font-medium text-sm">
                Suggested Response for {suggestedResponse.clientName}
              </span>
            </div>
            
            {isEditing ? (
              <Textarea
                value={editedResponse}
                onChange={(e) => setEditedResponse(e.target.value)}
                className="min-h-[120px] mb-3"
                placeholder="Edit your response..."
                data-testid="response-editor"
              />
            ) : (
              <div className="bg-background rounded p-3 text-sm border mb-3" data-testid="response-preview">
                <p>{suggestedResponse.message}</p>
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={handleSend}
                data-testid="send-response-btn"
              >
                <Send size={14} className="mr-1" />
                Send Response
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEdit}
                data-testid="edit-response-btn"
              >
                <Edit size={14} className="mr-1" />
                Edit
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onGenerateAlternative}
                data-testid="generate-alternative-btn"
              >
                <RefreshCw size={14} className="mr-1" />
                Generate Alternative
              </Button>
            </div>
          </div>
        )}

        {/* Settings Section */}
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg p-3" data-testid="auto-response-setting">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="auto-response" className="font-medium text-sm">
                Auto-Response Status
              </Label>
              <Switch 
                id="auto-response"
                checked={autoResponseEnabled}
                onCheckedChange={onToggleAutoResponse}
                data-testid="auto-response-switch"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically respond to common inquiries
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-3" data-testid="sentiment-monitoring-setting">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="sentiment-monitoring" className="font-medium text-sm">
                Sentiment Monitoring
              </Label>
              <Switch 
                id="sentiment-monitoring"
                checked={sentimentMonitoringEnabled}
                onCheckedChange={onToggleSentimentMonitoring}
                data-testid="sentiment-monitoring-switch"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Alert on negative sentiment detection
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-3" data-testid="follow-up-reminders-setting">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="follow-up-reminders" className="font-medium text-sm">
                Follow-up Reminders
              </Label>
              <Switch 
                id="follow-up-reminders"
                checked={followUpRemindersEnabled}
                onCheckedChange={onToggleFollowUpReminders}
                data-testid="follow-up-reminders-switch"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Schedule smart follow-ups based on client behavior
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
