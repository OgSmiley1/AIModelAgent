import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, MessageSquare, Bell } from "lucide-react";
import type { DashboardStats } from "@/types";

interface TopbarProps {
  stats?: DashboardStats;
  title?: string;
  subtitle?: string;
}

export function Topbar({ 
  stats, 
  title = "Business Intelligence Dashboard",
  subtitle = "Real-time client management and AI automation"
}: TopbarProps) {
  return (
    <header className="luxury-card border-b border-primary/20 p-6" data-testid="topbar">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div>
            <h2 className="text-2xl vacheron-title" data-testid="page-title">{title}</h2>
            <p className="text-sm text-muted-foreground premium-text" data-testid="page-subtitle">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {stats && (
            <>
              <div className="flex items-center space-x-2 text-sm" data-testid="clients-stat">
                <Users className="text-primary" size={16} />
                <span>
                  <span data-testid="total-clients">{stats.totalClients}</span> Clients
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm" data-testid="active-chats-stat">
                <MessageSquare className="text-chart-1" size={16} />
                <span>
                  <span data-testid="active-chats">{stats.activeChats}</span> Active
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm" data-testid="reminders-stat">
                <Bell className="text-chart-2" size={16} />
                <span>
                  <span data-testid="pending-reminders">{stats.pendingReminders}</span> Reminders
                </span>
              </div>
            </>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            className="w-10 h-10 rounded-full p-0 luxury-button"
            data-testid="user-avatar"
          >
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm luxury-button">
                S
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
  );
}
