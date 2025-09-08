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
      
      {/* Navigation */}
      <nav className="p-4 space-y-2" data-testid="navigation">
        {navigation.map((item) => {
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-300 font-medium",
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
              <Icon size={18} />
              <span className="premium-text">{item.name}</span>
              {item.status === "live" && (
                <span className="ml-auto status-luxury-online text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  LIVE
                </span>
              )}
              {item.status === "restricted" && (
                <span className="ml-auto status-luxury-restricted text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  🔒
                </span>
              )}
            </Link>
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
              <span className="text-muted-foreground">WhatsApp:</span>
              <span className={cn(whatsappConnected ? "text-chart-1 font-medium" : "text-chart-2 font-medium")} data-testid="whatsapp-status">
                {whatsappConnected ? "● Connected" : "○ Disconnected"}
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
