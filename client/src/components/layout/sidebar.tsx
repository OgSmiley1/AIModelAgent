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
  Shield
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "WhatsApp", href: "/whatsapp", icon: SiWhatsapp, status: "live" },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Sales Forecasting", href: "/forecasting", icon: Brain },
  { name: "AI Chat", href: "/ai-chat", icon: MessageSquare },
  { name: "AI Agent", href: "/ai-agent", icon: Brain },
  { name: "Advanced AI", href: "/advanced-ai", icon: Shield, status: "restricted" },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Trip Planner", href: "/trip-planner", icon: Route },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  whatsappConnected?: boolean;
  aiOnline?: boolean;
  databaseActive?: boolean;
}

export function Sidebar({ 
  whatsappConnected = false, 
  aiOnline = true, 
  databaseActive = true 
}: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-card border-r border-border flex-shrink-0 overflow-y-auto" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="text-primary-foreground" size={20} data-testid="logo-icon" />
          </div>
          <div>
            <h1 className="font-semibold text-lg" data-testid="app-title">CLOSERT AI</h1>
            <p className="text-xs text-muted-foreground" data-testid="app-subtitle">Local Business Agent</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4 space-y-2" data-testid="navigation">
        {navigation.map((item) => {
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon size={16} />
                <span>{item.name}</span>
                {item.status === "live" && (
                  <span className="ml-auto bg-chart-1 text-white text-xs px-2 py-0.5 rounded-full">
                    Live
                  </span>
                )}
              </a>
            </Link>
          );
        })}
      </nav>
      
      {/* System Status */}
      <div className="p-4 mt-auto border-t border-border" data-testid="system-status">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Circle 
              size={8} 
              className={cn(
                "rounded-full animate-pulse-slow",
                aiOnline ? "status-online" : "status-offline"
              )} 
            />
            <span className="text-sm font-medium">System Status</span>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Local AI:</span>
              <span className={cn(aiOnline ? "text-chart-1" : "text-muted-foreground")} data-testid="ai-status">
                {aiOnline ? "Online" : "Offline"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>WhatsApp:</span>
              <span className={cn(whatsappConnected ? "text-chart-1" : "text-chart-2")} data-testid="whatsapp-status">
                {whatsappConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className={cn(databaseActive ? "text-chart-1" : "text-muted-foreground")} data-testid="database-status">
                {databaseActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
