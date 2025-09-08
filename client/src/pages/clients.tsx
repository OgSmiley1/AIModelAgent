import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { EnhancedProfileCard } from "@/components/clients/enhanced-profile-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Search, Filter, UserCheck, Star, AlertCircle, TrendingUp, Target, Brain, Zap, Clock, Edit, Save, X, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { ClientProfileData } from "@/types";

const clientFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  whatsappNumber: z.string().optional(),
  status: z.enum(["prospect", "active", "inactive", "vip"]),
  priority: z.enum(["low", "medium", "high", "critical", "vip"]),
  interests: z.string().optional(),
  notes: z.string().optional(),
  budget: z.number().optional(),
  timeframe: z.enum(["immediate", "short_term", "medium_term", "long_term"]).optional(),
  location: z.string().optional(),
  decisionMaker: z.boolean().default(false),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [leadScoreFilter, setLeadScoreFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdatingAllScores, setIsUpdatingAllScores] = useState(false);
  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery<ClientProfileData[]>({
    queryKey: ['/api/clients'],
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      return apiRequest('POST', '/api/clients', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  // Update all lead scores mutation
  const updateAllScoresMutation = useMutation({
    mutationFn: async () => {
      const promises = clients.map(client => 
        apiRequest('POST', `/api/clients/${client.id}/update-lead-score`)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsUpdatingAllScores(false);
    },
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      whatsappNumber: "",
      status: "prospect",
      priority: "medium",
      interests: "",
      notes: "",
    },
  });

  const onSubmit = (data: ClientFormData) => {
    createClientMutation.mutate(data);
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone?.includes(searchTerm) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || client.priority === priorityFilter;
    
    let matchesLeadScore = true;
    if (leadScoreFilter !== "all") {
      const score = client.leadScore || 0;
      switch (leadScoreFilter) {
        case 'high':
          matchesLeadScore = score >= 70;
          break;
        case 'medium':
          matchesLeadScore = score >= 40 && score < 70;
          break;
        case 'low':
          matchesLeadScore = score < 40;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesLeadScore;
  });

  // Group clients by status
  const clientsByStatus = {
    prospect: filteredClients.filter(c => c.status === "prospect"),
    active: filteredClients.filter(c => c.status === "active"),
    inactive: filteredClients.filter(c => c.status === "inactive"),
    vip: filteredClients.filter(c => c.status === "vip"),
  };

  // Analytics data
  const totalClients = clients.length;
  const avgLeadScore = clients.length > 0 
    ? clients.reduce((sum, client) => sum + (client.leadScore || 0), 0) / clients.length 
    : 0;
  const highScoreClients = clients.filter(c => (c.leadScore || 0) >= 70).length;
  const avgConversionProb = clients.length > 0
    ? clients.reduce((sum, client) => sum + ((client.conversionProbability || 0) * 100), 0) / clients.length
    : 0;

  const handleUpdateAllScores = () => {
    setIsUpdatingAllScores(true);
    updateAllScoresMutation.mutate();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vip': return <Star className="text-purple-500" size={16} />;
      case 'active': return <UserCheck className="text-chart-1" size={16} />;
      case 'inactive': return <AlertCircle className="text-muted-foreground" size={16} />;
      default: return <Users className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="Client Management"
          subtitle="Manage and analyze your client relationships"
        />
        
        <div className="flex-1 overflow-hidden p-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="client-search"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40" data-testid="priority-filter">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={leadScoreFilter} onValueChange={setLeadScoreFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Lead score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="high">High (70+)</SelectItem>
                  <SelectItem value="medium">Medium (40-69)</SelectItem>
                  <SelectItem value="low">Low (&lt;40)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleUpdateAllScores}
                disabled={isUpdatingAllScores || updateAllScoresMutation.isPending}
                data-testid="update-all-scores-button"
              >
                <RefreshCw className={`mr-2 ${isUpdatingAllScores ? 'animate-spin' : ''}`} size={16} />
                Update All Scores
              </Button>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="add-client-btn">
                    <Plus size={16} className="mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter client name" {...field} data-testid="client-name-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter email address" {...field} data-testid="client-email-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" {...field} data-testid="client-phone-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="whatsappNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter WhatsApp number" {...field} data-testid="client-whatsapp-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="client-status-select">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="prospect">Prospect</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="client-priority-select">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="interests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interests</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter client interests" {...field} data-testid="client-interests-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter additional notes" {...field} data-testid="client-notes-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="cancel-client-btn"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createClientMutation.isPending}
                        data-testid="save-client-btn"
                      >
                        {createClientMutation.isPending ? "Saving..." : "Save Client"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Client Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Object.entries(clientsByStatus).map(([status, statusClients]) => (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground capitalize">
                        {status} Clients
                      </p>
                      <p className="text-2xl font-bold">{statusClients.length}</p>
                    </div>
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      {getStatusIcon(status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Client Tabs */}
          <Tabs defaultValue="all" className="flex-1">
            <TabsList>
              <TabsTrigger value="all" data-testid="all-clients-tab">
                All Clients ({filteredClients.length})
              </TabsTrigger>
              <TabsTrigger value="prospect" data-testid="prospect-clients-tab">
                Prospects ({clientsByStatus.prospect.length})
              </TabsTrigger>
              <TabsTrigger value="active" data-testid="active-clients-tab">
                Active ({clientsByStatus.active.length})
              </TabsTrigger>
              <TabsTrigger value="vip" data-testid="vip-clients-tab">
                VIP ({clientsByStatus.vip.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading clients...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground mb-2">No clients found</p>
                    <p className="text-sm text-muted-foreground">
                      {clients.length === 0 
                        ? "Start by adding your first client" 
                        : "Try adjusting your search or filters"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="clients-grid">
                  {filteredClients.map((client) => (
                    <ProfileCard key={client.id} client={client} />
                  ))}
                </div>
              )}
            </TabsContent>

            {(['prospect', 'active', 'vip'] as const).map((status) => (
              <TabsContent key={status} value={status} className="mt-6">
                {clientsByStatus[status].length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
                      <p className="text-muted-foreground mb-2">No {status} clients</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {clientsByStatus[status].map((client) => (
                      <ProfileCard key={client.id} client={client} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
