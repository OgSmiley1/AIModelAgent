import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import WhatsApp from "@/pages/whatsapp";
import Clients from "@/pages/clients-working";
import Forecasting from "@/pages/forecasting";
import AIChat from "@/pages/ai-chat";
import Documents from "@/pages/documents";
import TripPlanner from "@/pages/trip-planner";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/whatsapp" component={WhatsApp} />
      <Route path="/clients" component={Clients} />
      <Route path="/forecasting" component={Forecasting} />
      <Route path="/ai-chat" component={AIChat} />
      <Route path="/documents" component={Documents} />
      <Route path="/trip-planner" component={TripPlanner} />
      <Route path="/analytics" component={Analytics} />
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
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
