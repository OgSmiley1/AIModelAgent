import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Bot, 
  BarChart3, 
  MessageSquare, 
  Users, 
  FileText, 
  Route, 
  TrendingUp, 
  Settings,
  Circle,
  Brain,
  Shield,
  HelpCircle,
  Sparkles,
  Star,
  FileSpreadsheet
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navigation = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: BarChart3,
    description: "Main overview with key metrics and live activity",
    category: "Core",
    priority: 1
  },
  { 
    name: "Client Registry", 
    href: "/clients", 
    icon: Users,
    description: "Manage 281 client records with lead scoring",
    category: "Core", 
    priority: 3,
    badge: "281"
  },
  { 
    name: "Sales Intelligence", 
    href: "/forecasting", 
    icon: Brain,
    description: "Advanced revenue forecasting and performance analytics",
    category: "Analytics",
    priority: 4
  },
  { 
    name: "AI Assistant", 
    href: "/ai-chat", 
    icon: MessageSquare,
    description: "Smart AI assistant for client insights and automation",
    category: "AI Tools",
    priority: 5
  },
  { 
    name: "AI Agent Pro", 
    href: "/ai-agent", 
    icon: Brain,
    description: "Advanced AI agent with autonomous capabilities", 
    category: "AI Tools",
    priority: 6
  },
  { 
    name: "Advanced AI System", 
    href: "/advanced-ai", 
    icon: Shield, 
    status: "restricted",
    description: "🔒 Enhanced AI with psychological analysis (Restricted Access)",
    category: "AI Tools",
    priority: 7,
    premium: true
  },
  { 
    name: "AI Excel Suite", 
    href: "/documents", 
    icon: FileText,
    description: "AI-enhanced Excel workbook with 8 comprehensive sheets",
    category: "Tools",
    priority: 8,
    highlight: "new"
  },
  { 
    name: "Excel Analyzer", 
    href: "/excel-analyzer", 
    icon: FileSpreadsheet,
    description: "Upload client Excel files for AI-powered analysis and follow-up priorities",
    category: "AI Tools",
    priority: 8.5,
    badge: "NEW"
  },
  { 
    name: "Client Status", 
    href: "/client-status", 
    icon: Users,
    description: "View and manage all client statuses and profiles",
    category: "Tools",
    priority: 9
  },
  { 
    name: "Business Reports", 
    href: "/analytics", 
    icon: TrendingUp,
    description: "Comprehensive business intelligence and reporting",
    category: "Analytics", 
    priority: 10
  },
  { 
    name: "System Settings", 
    href: "/settings", 
    icon: Settings,
    description: "Configure system preferences and integrations",
    category: "System",
    priority: 11
  },
];

interface SidebarProps {
  aiOnline?: boolean;
  databaseActive?: boolean;
}

export function Sidebar({ 
  aiOnline = true, 
  databaseActive = true 
}: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className="w-64 luxury-nav flex-shrink-0 overflow-y-auto" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-6 border-b border-primary/20">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 luxury-button rounded-xl flex items-center justify-center">
            <Bot className="text-primary-foreground" size={24} data-testid="logo-icon" />
          </div>
          <div>
            <h1 className="vacheron-title text-xl font-light" data-testid="app-title">CLOSERT AI</h1>
            <p className="text-xs text-muted-foreground premium-text" data-testid="app-subtitle">Luxury Business Intelligence</p>
          </div>
        </div>
      </div>
      
      {/* Quick Access Section */}
      <div className="px-4 pb-2">
        <div className="flex items-center space-x-2 mb-3">
          <Star size={14} className="text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Access</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {navigation.filter(item => item.priority <= 3).map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
            
            return (
              <TooltipProvider key={item.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg text-xs transition-all duration-300",
                        isActive 
                          ? "luxury-button text-primary-foreground shadow-lg" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50 luxury-card"
                      )}
                      data-testid={`quick-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon size={16} className="mb-1" />
                      <span className="text-center font-medium">{item.name.split(' ')[0]}</span>
                      {item.badge && (
                        <span className="text-xs mt-1 bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="px-4 space-y-1" data-testid="navigation">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles size={14} className="text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">All Features</span>
        </div>
        
        {navigation.map((item) => {
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          const Icon = item.icon;
          
          return (
            <TooltipProvider key={item.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 font-medium group",
                      isActive 
                        ? "luxury-button text-primary-foreground shadow-lg" 
                        : item.status === "restricted"
                        ? "text-red-400 hover:text-red-300 hover:bg-red-950/20 restricted-element"
                        : item.status === "live"
                        ? "text-foreground hover:text-primary hover:bg-primary/10 luxury-card"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50 luxury-card"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon size={16} />
                    <span className="premium-text flex-1">{item.name}</span>
                    
                    {/* Status and badges */}
                    <div className="flex items-center space-x-1">
                      {item.highlight === "new" && (
                        <span className="status-luxury-new text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          NEW
                        </span>
                      )}
                      
                      {item.status === "live" && (
                        <span className="status-luxury-online text-white text-xs px-2 py-0.5 rounded-full font-medium animate-pulse">
                          LIVE
                        </span>
                      )}
                      
                      {item.status === "restricted" && (
                        <span className="status-luxury-restricted text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          🔒
                        </span>
                      )}
                      
                      {item.premium && (
                        <Star size={12} className="text-yellow-400" />
                      )}
                    </div>
                    
                    <HelpCircle size={12} className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  {item.category && (
                    <p className="text-xs text-primary mt-1">Category: {item.category}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </nav>
      
      {/* System Status */}
      <div className="p-6 mt-auto border-t border-primary/20" data-testid="system-status">
        <div className="luxury-card rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Circle 
              size={10} 
              className={cn(
                "rounded-full",
                aiOnline ? "status-luxury-online" : "status-offline"
              )} 
            />
            <span className="text-sm font-medium gold-accent">System Status</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Local AI:</span>
              <span className={cn(aiOnline ? "text-chart-1 font-medium" : "text-muted-foreground")} data-testid="ai-status">
                {aiOnline ? "● Online" : "○ Offline"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telegram Bot:</span>
              <span className="text-chart-1 font-medium" data-testid="telegram-status">
                ● Active
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Database:</span>
              <span className={cn(databaseActive ? "text-chart-1 font-medium" : "text-muted-foreground")} data-testid="database-status">
                {databaseActive ? "● Active" : "○ Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
