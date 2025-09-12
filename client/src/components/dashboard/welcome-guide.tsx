import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Users, 
  MessageSquare, 
  FileSpreadsheet,
  Star,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeGuideProps {
  onDismiss: () => void;
  className?: string;
}

export function WelcomeGuide({ onDismiss, className }: WelcomeGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const quickStartSteps = [
    {
      icon: Users,
      title: "Explore Your Client Database",
      description: "Browse 281 client records with lead scoring, priority levels, and registry tracking",
      action: "View Clients",
      path: "/clients",
      color: "blue",
      completed: false
    },
    {
      icon: MessageSquare,
      title: "Connect WhatsApp Business",
      description: "Set up WhatsApp Business API for real-time message monitoring and AI responses",
      action: "Setup WhatsApp",
      path: "/whatsapp",
      color: "green", 
      completed: false
    },
    {
      icon: FileSpreadsheet,
      title: "Download AI Excel Workbook",
      description: "Get your 8-sheet AI-enhanced Excel workbook with complete business intelligence",
      action: "Get Excel Suite",
      path: "/documents",
      color: "purple",
      completed: false,
      highlight: "new"
    },
    {
      icon: Sparkles,
      title: "Access Advanced AI",
      description: "Unlock enhanced AI capabilities with psychological analysis and sentiment intelligence",
      action: "Enter Advanced AI",
      path: "/advanced-ai",
      color: "gold",
      completed: false,
      premium: true
    }
  ];
  
  const handleStepClick = (path: string, index: number) => {
    window.location.href = path;
    // Mark as completed (in real app, would persist this)
    setCurrentStep(index + 1);
  };
  
  return (
    <Card className={cn("luxury-card border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="text-primary" size={20} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>Welcome to CRC Warroom</span>
                <Badge variant="secondary" className="text-xs">
                  Luxury Business Intelligence
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Get started with your AI-powered luxury watch sales system
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground"
            data-testid="dismiss-welcome-guide"
          >
            <X size={16} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {quickStartSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.completed || currentStep > index;
            
            return (
              <div 
                key={index}
                className={cn(
                  "flex items-center space-x-4 p-4 rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-md",
                  isCompleted 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-card hover:bg-accent/50 border-border"
                )}
                onClick={() => handleStepClick(step.path, index)}
                data-testid={`quick-start-${index}`}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  isCompleted 
                    ? "bg-primary text-primary-foreground"
                    : step.color === "blue" ? "bg-blue-500/20 text-blue-400"
                    : step.color === "green" ? "bg-green-500/20 text-green-400" 
                    : step.color === "purple" ? "bg-purple-500/20 text-purple-400"
                    : step.color === "gold" ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    {step.highlight && (
                      <Badge variant="secondary" className="text-xs status-luxury-new">
                        NEW
                      </Badge>
                    )}
                    {step.premium && (
                      <Star size={12} className="text-yellow-400" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant={isCompleted ? "secondary" : "default"}
                    className={cn(
                      "text-xs",
                      !isCompleted && step.color === "blue" && "bg-blue-600 hover:bg-blue-700",
                      !isCompleted && step.color === "green" && "bg-green-600 hover:bg-green-700",
                      !isCompleted && step.color === "purple" && "bg-purple-600 hover:bg-purple-700",
                      !isCompleted && step.color === "gold" && "bg-yellow-600 hover:bg-yellow-700"
                    )}
                    data-testid={`action-${step.action.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {isCompleted ? "Completed" : step.action}
                    {!isCompleted && <ArrowRight size={12} className="ml-1" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-start space-x-3">
            <Sparkles className="text-primary flex-shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-sm font-medium text-primary">Pro Tip</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your system includes 281 real client records and 326 luxury watches worth $14.65M+. 
                All features work with your actual business data for immediate productivity.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}