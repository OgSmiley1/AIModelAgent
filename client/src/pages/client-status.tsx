import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Search, 
  TrendingUp,
  Phone,
  MessageSquare,
  Calendar,
  Star,
  Target,
  AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import type { ClientProfileData } from "@/types";

export default function ClientStatus() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: clients = [], isLoading } = useQuery<ClientProfileData[]>({
    queryKey: ['/api/clients'],
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchTerm || 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    requested_callback: clients.filter(c => c.status === 'requested_callback').length,
    confirmed: clients.filter(c => c.status === 'confirmed').length,
    sold: clients.filter(c => c.status === 'sold').length,
    hesitant: clients.filter(c => c.status === 'hesitant').length,
    shared_with_boutique: clients.filter(c => c.status === 'shared_with_boutique').length,
    changed_mind: clients.filter(c => c.status === 'changed_mind').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested_callback': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sold': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'hesitant': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shared_with_boutique': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'changed_mind': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'vip': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="text-red-500" size={16} />;
      case 'vip': return <Star className="text-purple-500" size={16} />;
      case 'high': return <TrendingUp className="text-orange-500" size={16} />;
      default: return <Target className="text-gray-500" size={16} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="Client Status Management"
          subtitle="View and manage all client statuses and profiles"
        />
        
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Requested Callback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.requested_callback}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{statusCounts.confirmed}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{statusCounts.sold}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Hesitant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.hesitant}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Shared with Boutique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">{statusCounts.shared_with_boutique}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Changed Mind</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">{statusCounts.changed_mind}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Client Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="requested_callback">Requested Callback</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="hesitant">Hesitant</SelectItem>
                    <SelectItem value="shared_with_boutique">Shared with Boutique</SelectItem>
                    <SelectItem value="changed_mind">Changed Mind</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No clients found</div>
                ) : (
                  filteredClients.map(client => (
                    <Link key={client.id} href={`/clients/${client.id}`}>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-lg">{client.name}</h3>
                                  {getPriorityIcon(client.priority)}
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  {client.phone && (
                                    <div className="flex items-center space-x-1">
                                      <Phone size={14} />
                                      <span>{client.phone}</span>
                                    </div>
                                  )}
                                  {client.whatsappNumber && (
                                    <div className="flex items-center space-x-1">
                                      <MessageSquare size={14} />
                                      <span>WhatsApp</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              {client.leadScore && (
                                <div className="text-right">
                                  <div className="text-xs text-muted-foreground">Lead Score</div>
                                  <div className="text-lg font-bold">{client.leadScore}</div>
                                </div>
                              )}
                              
                              <Badge className={getStatusColor(client.status)}>
                                {client.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
