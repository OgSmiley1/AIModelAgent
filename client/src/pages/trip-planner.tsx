import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  MapPin, 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Plane, 
  Clock,
  DollarSign,
  Map,
  Users,
  Star
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { TripPlanData, ClientProfileData } from "@/types";

const tripFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientId: z.string().min(1, "Client is required"),
  destination: z.string().min(1, "Destination is required"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.number().optional(),
  notes: z.string().optional(),
});

type TripFormData = z.infer<typeof tripFormSchema>;

export default function TripPlanner() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch trip plans
  const { data: tripPlans = [], isLoading } = useQuery<TripPlanData[]>({
    queryKey: ['/api/trip-plans'],
    enabled: false, // Would need proper API endpoint
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<ClientProfileData[]>({
    queryKey: ['/api/clients'],
  });

  // Mock trip plans for display
  const mockTripPlans: TripPlanData[] = [
    {
      id: "1",
      clientId: "client-1",
      title: "Luxury Dubai Experience",
      destination: "Dubai, UAE",
      startDate: new Date("2024-03-15"),
      endDate: new Date("2024-03-22"),
      status: "confirmed",
      budget: 25000,
      itinerary: {
        day1: "Arrival & Burj Al Arab check-in",
        day2: "Desert Safari & Traditional Dinner",
        day3: "Dubai Mall & Burj Khalifa",
        day4: "Yacht Charter & Marina District",
        day5: "Helicopter Tour & Spa Day",
        day6: "Cultural Tour & Gold Souk",
        day7: "Departure"
      },
      preferences: {
        accommodation: "5-star luxury",
        transportation: "private_driver",
        dining: "fine_dining",
        activities: ["cultural", "adventure", "luxury"]
      },
      notes: "VIP client - ensure premium experiences throughout",
    },
    {
      id: "2",
      clientId: "client-2",
      title: "Tokyo Business & Cultural Tour",
      destination: "Tokyo, Japan",
      startDate: new Date("2024-04-10"),
      endDate: new Date("2024-04-17"),
      status: "planning",
      budget: 18000,
      itinerary: {
        day1: "Arrival & Hotel Check-in",
        day2: "Business meetings in Marunouchi",
        day3: "Cultural tour - Senso-ji Temple",
        day4: "Mount Fuji day trip",
        day5: "Tsukiji Market & Sushi experience",
        day6: "Technology district tour",
        day7: "Departure"
      },
      preferences: {
        accommodation: "business_hotel",
        transportation: "mix",
        dining: "local_cuisine",
        activities: ["business", "cultural", "culinary"]
      },
      notes: "Combine business meetings with cultural experiences",
    },
    {
      id: "3",
      clientId: "client-3",
      title: "Swiss Alps Adventure",
      destination: "Interlaken, Switzerland",
      startDate: new Date("2024-05-20"),
      endDate: new Date("2024-05-27"),
      status: "completed",
      budget: 15000,
      itinerary: {
        day1: "Arrival & Mountain Resort check-in",
        day2: "Jungfraujoch - Top of Europe",
        day3: "Paragliding & Adventure sports",
        day4: "Scenic train rides",
        day5: "Lake Brienz boat tour",
        day6: "Swiss cheese & chocolate tour",
        day7: "Departure"
      },
      preferences: {
        accommodation: "mountain_resort",
        transportation: "scenic_routes",
        dining: "local_specialties",
        activities: ["adventure", "scenic", "culinary"]
      },
      notes: "Adventure-focused trip with scenic experiences",
    }
  ];

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      title: "",
      clientId: "",
      destination: "",
      notes: "",
    },
  });

  const onSubmit = (data: TripFormData) => {
    console.log("Creating trip:", data);
    setIsCreateDialogOpen(false);
    form.reset();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-chart-1 text-white';
      case 'planning':
        return 'bg-chart-2 text-white';
      case 'completed':
        return 'bg-chart-3 text-white';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Star className="text-chart-1" size={16} />;
      case 'planning': return <Clock className="text-chart-2" size={16} />;
      case 'completed': return <MapPin className="text-chart-3" size={16} />;
      default: return <Map className="text-muted-foreground" size={16} />;
    }
  };

  const filteredTripPlans = mockTripPlans.filter(trip => {
    const matchesSearch = trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const tripsByStatus = {
    all: filteredTripPlans,
    planning: filteredTripPlans.filter(t => t.status === "planning"),
    confirmed: filteredTripPlans.filter(t => t.status === "confirmed"),
    completed: filteredTripPlans.filter(t => t.status === "completed"),
    cancelled: filteredTripPlans.filter(t => t.status === "cancelled"),
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="Trip Planner"
          subtitle="Plan and manage luxury travel experiences for your clients"
        />
        
        <div className="flex-1 overflow-hidden p-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="trip-search"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="create-trip-btn">
                  <Plus size={16} className="mr-2" />
                  Plan New Trip
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Plan New Trip</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trip Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter trip title" {...field} data-testid="trip-title-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="trip-client-select">
                                  <SelectValue placeholder="Select client" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clients.map(client => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter destination" {...field} data-testid="trip-destination-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    data-testid="trip-start-date"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    data-testid="trip-end-date"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter budget" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                data-testid="trip-budget-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter trip notes and preferences" {...field} data-testid="trip-notes-input" />
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
                        data-testid="cancel-trip-btn"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="save-trip-btn">
                        Create Trip Plan
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Trip Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Object.entries(tripsByStatus).slice(1).map(([status, statusTrips]) => (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground capitalize">
                        {status} Trips
                      </p>
                      <p className="text-2xl font-bold">{statusTrips.length}</p>
                    </div>
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      {getStatusIcon(status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trip Tabs */}
          <Tabs defaultValue="all" className="flex-1">
            <TabsList>
              <TabsTrigger value="all" data-testid="all-trips-tab">
                All Trips ({tripsByStatus.all.length})
              </TabsTrigger>
              <TabsTrigger value="planning" data-testid="planning-trips-tab">
                Planning ({tripsByStatus.planning.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed" data-testid="confirmed-trips-tab">
                Confirmed ({tripsByStatus.confirmed.length})
              </TabsTrigger>
              <TabsTrigger value="completed" data-testid="completed-trips-tab">
                Completed ({tripsByStatus.completed.length})
              </TabsTrigger>
            </TabsList>

            {(['all', 'planning', 'confirmed', 'completed'] as const).map((status) => (
              <TabsContent key={status} value={status} className="mt-6">
                {tripsByStatus[status].length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Plane className="mx-auto mb-4 text-muted-foreground" size={48} />
                      <p className="text-muted-foreground mb-2">No {status} trips</p>
                      <p className="text-sm text-muted-foreground">
                        {status === 'all' ? "Start planning your first trip" : `No trips in ${status} status`}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="trips-grid">
                    {tripsByStatus[status].map((trip) => (
                      <Card key={trip.id} data-testid={`trip-${trip.id}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{trip.title}</CardTitle>
                            <Badge className={getStatusColor(trip.status)}>
                              {trip.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <MapPin size={16} />
                            <span>{trip.destination}</span>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-3">
                            {trip.startDate && trip.endDate && (
                              <div className="flex items-center space-x-2 text-sm">
                                <CalendarIcon size={16} className="text-muted-foreground" />
                                <span>
                                  {format(trip.startDate, "MMM d")} - {format(trip.endDate, "MMM d, yyyy")}
                                </span>
                              </div>
                            )}
                            
                            {trip.budget && (
                              <div className="flex items-center space-x-2 text-sm">
                                <DollarSign size={16} className="text-muted-foreground" />
                                <span>${trip.budget.toLocaleString()}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2 text-sm">
                              <Users size={16} className="text-muted-foreground" />
                              <span>{clients.find(c => c.id === trip.clientId)?.name || "Unknown Client"}</span>
                            </div>
                            
                            {trip.notes && (
                              <p className="text-sm text-muted-foreground">{trip.notes}</p>
                            )}
                            
                            <div className="flex justify-end space-x-2 pt-2">
                              <Button variant="outline" size="sm" data-testid={`view-trip-${trip.id}`}>
                                View Details
                              </Button>
                              <Button size="sm" data-testid={`edit-trip-${trip.id}`}>
                                Edit Trip
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
