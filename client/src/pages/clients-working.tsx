import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EnhancedProfileCard } from "@/components/clients/enhanced-profile-card";
import { 
  Users, 
  Search, 
  Filter,
  Brain,
  Target,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Star
} from "lucide-react";
import { ClientProfileData } from "@/types";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch clients data
  const { data: clients = [], isLoading } = useQuery<ClientProfileData[]>({
    queryKey: ['/api/clients'],
  });

  // Filter clients based on search and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group clients by status
  const clientsByStatus = {
    prospect: filteredClients.filter(c => c.status === 'prospect'),
    active: filteredClients.filter(c => c.status === 'active'),
    vip: filteredClients.filter(c => c.status === 'vip'),
    inactive: filteredClients.filter(c => c.status === 'inactive')
  };

  // Calculate analytics
  const totalClients = clients.length;
  const avgLeadScore = clients.length > 0 
    ? clients.reduce((sum, client) => sum + (client.leadScore || 0), 0) / clients.length 
    : 0;
  const highScoreClients = clients.filter(c => (c.leadScore || 0) > 80).length;
  const avgConversionProb = clients.length > 0 
    ? clients.reduce((sum, client) => sum + (client.conversionProbability || 0), 0) / clients.length * 100
    : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'prospect': return <Users size={16} className="text-blue-500" />;
      case 'active': return <CheckCircle size={16} className="text-green-500" />;
      case 'vip': return <Star size={16} className="text-yellow-500" />;
      case 'inactive': return <AlertTriangle size={16} className="text-gray-500" />;
      default: return <Users size={16} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="Client Management"
          subtitle="Enhanced AI-powered client profiles with lead scoring"
        />
        
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="client-search-input"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="status-filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Clients</p>
                    <p className="text-2xl font-bold">{totalClients}</p>
                  </div>
                  <Users className="text-blue-500" size={24} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Lead Score</p>
                    <p className="text-2xl font-bold">{avgLeadScore.toFixed(0)}</p>
                  </div>
                  <Brain className="text-purple-500" size={24} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">High-Score Clients</p>
                    <p className="text-2xl font-bold">{highScoreClients}</p>
                  </div>
                  <Target className="text-green-500" size={24} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Conversion</p>
                    <p className="text-2xl font-bold">{avgConversionProb.toFixed(0)}%</p>
                  </div>
                  <BarChart3 className="text-orange-500" size={24} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Stats */}
          <div className="grid grid-cols-4 gap-4">
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
                    <EnhancedProfileCard key={client.id} client={client} />
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
                      <EnhancedProfileCard key={client.id} client={client} />
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