import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReminderNotifications } from "@/components/reminders/reminder-notifications";
import Dashboard from "@/pages/dashboard";
import WhatsApp from "@/pages/whatsapp";
import Clients from "@/pages/clients-working";
import Forecasting from "@/pages/forecasting";
import AIAgentChat from "@/pages/ai-agent-chat";
import AdvancedAI from "@/pages/advanced-ai";
import Documents from "@/pages/documents";
import ClientStatus from "@/pages/client-status";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import ExcelAnalyzer from "@/pages/excel-analyzer";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/whatsapp" component={WhatsApp} />
      <Route path="/clients" component={Clients} />
      <Route path="/forecasting" component={Forecasting} />
      <Route path="/ai-chat" component={AIAgentChat} />
      <Route path="/ai-agent" component={AIAgentChat} />
      <Route path="/advanced-ai" component={AdvancedAI} />
      <Route path="/documents" component={Documents} />
      <Route path="/client-status" component={ClientStatus} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/excel-analyzer" component={ExcelAnalyzer} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground font-sans">
          <Toaster />
          <ReminderNotifications />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
