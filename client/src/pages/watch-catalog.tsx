import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WatchCollection, InsertWatchCollection } from "@shared/schema";
import { getFullVacheronWatchDataset, convertToWatchCollectionInsert } from "@/utils/watch-data-parser";
import { Crown, Search, Upload, Download, DollarSign, Clock, Gem, Filter, Plus, Edit, Trash2, History, Star } from "lucide-react";

export default function WatchCatalogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [newWatchDialog, setNewWatchDialog] = useState(false);
  const [bulkUpdateDialog, setBulkUpdateDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [selectedWatch, setSelectedWatch] = useState<WatchCollection | null>(null);
  
  const { toast } = useToast();

  // Fetch watches
  const { data: watches = [], isLoading, refetch } = useQuery<WatchCollection[]>({
    queryKey: ["/api/watches"],
  });

  // Filter watches based on search criteria
  const filteredWatches = watches.filter(watch => {
    const matchesSearch = watch.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         watch.modelCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         watch.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCollection = selectedCollection === "all" || watch.collection === selectedCollection;
    const matchesCategory = selectedCategory === "all" || watch.category === selectedCategory;
    const matchesAvailability = !availableOnly || watch.available;
    
    return matchesSearch && matchesCollection && matchesCategory && matchesAvailability;
  });

  // Get unique collections and categories for filters
  const collections = Array.from(new Set(watches.map(w => w.collection).filter(Boolean)));
  const categories = Array.from(new Set(watches.map(w => w.category).filter(Boolean)));

  // Import watches mutation
  const importWatchesMutation = useMutation({
    mutationFn: async (watchesData: any[]) => {
      return apiRequest("POST", "/api/watches/import", { watches: watchesData });
    },
    onSuccess: (result) => {
      const data = result.json();
      toast({
        title: "Import Successful",
        description: `Imported ${data.importedCount} watches out of ${data.totalProvided} provided.`,
      });
      queryClient.invalidateQueries(["/api/watches"]);
      setImportDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk price update mutation
  const bulkPriceUpdateMutation = useMutation({
    mutationFn: async (updates: {id: string, priceNumeric: number}[]) => {
      return apiRequest("POST", "/api/watches/bulk-price-update", { updates });
    },
    onSuccess: (result) => {
      const data = result.json();
      toast({
        title: "Bulk Update Successful",
        description: `Updated ${data.updatedCount} watch prices.`,
      });
      queryClient.invalidateQueries(["/api/watches"]);
      setBulkUpdateDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import watches from the provided data
  const importFromVacheronData = () => {
    const vacheronData = getFullVacheronWatchDataset();
    const watchCollectionData = convertToWatchCollectionInsert(vacheronData);
    importWatchesMutation.mutate(watchCollectionData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-yellow-900 via-amber-800 to-yellow-900 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-600/30 rounded-xl border border-yellow-400/30">
                <Crown className="h-8 w-8 text-yellow-200" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-200 to-amber-200 bg-clip-text text-transparent">
                  Vacheron Constantin Collection
                </h1>
                <p className="text-xl text-yellow-100 mt-2">
                  Luxury Watch Catalog & Price Management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-yellow-600/20 border-yellow-400 text-yellow-100 px-4 py-2">
                <Gem className="h-4 w-4 mr-2" />
                {watches.length} Timepieces
              </Badge>
              <Badge variant="outline" className="bg-green-600/20 border-green-400 text-green-100 px-4 py-2">
                <Star className="h-4 w-4 mr-2" />
                {watches.filter(w => w.available).length} Available
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-amber-600" />
              <Input
                placeholder="Search watches by model, reference, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80 border-amber-200 focus:border-amber-400"
                data-testid="input-search-watches"
              />
            </div>
            
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger className="w-48 border-amber-200" data-testid="select-collection">
                <SelectValue placeholder="All Collections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                {collections.map(collection => (
                  <SelectItem key={collection} value={collection}>{collection}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 border-amber-200" data-testid="select-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch
                checked={availableOnly}
                onCheckedChange={setAvailableOnly}
                data-testid="switch-available-only"
              />
              <Label className="text-amber-700">Available Only</Label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={importFromVacheronData}
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
              data-testid="button-import-vacheron"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Vacheron Data
            </Button>

            <Dialog open={bulkUpdateDialog} onOpenChange={setBulkUpdateDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  data-testid="button-bulk-update"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Bulk Price Update
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Price Update</DialogTitle>
                  <DialogDescription>
                    Update prices for multiple watches at once
                  </DialogDescription>
                </DialogHeader>
                <BulkPriceUpdateForm 
                  watches={watches}
                  onSubmit={(updates) => bulkPriceUpdateMutation.mutate(updates)}
                  isLoading={bulkPriceUpdateMutation.isPending}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              data-testid="button-export-excel"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>

            <Dialog open={newWatchDialog} onOpenChange={setNewWatchDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700"
                  data-testid="button-add-watch"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Watch
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Watch</DialogTitle>
                  <DialogDescription>
                    Add a new timepiece to the collection
                  </DialogDescription>
                </DialogHeader>
                <WatchForm 
                  onClose={() => setNewWatchDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Watch Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse border-amber-200">
                <CardHeader>
                  <div className="h-4 bg-amber-100 rounded w-3/4"></div>
                  <div className="h-3 bg-amber-100 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-amber-100 rounded"></div>
                    <div className="h-3 bg-amber-100 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWatches.map(watch => (
              <WatchCard
                key={watch.id}
                watch={watch}
                onClick={() => setSelectedWatch(watch)}
              />
            ))}
          </div>
        )}

        {filteredWatches.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="p-6 max-w-md mx-auto">
              <Clock className="h-16 w-16 text-amber-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-800 mb-2">No Watches Found</h3>
              <p className="text-amber-600">
                {searchTerm || selectedCollection !== "all" || selectedCategory !== "all" ? 
                  "Try adjusting your search criteria." : 
                  "Start by importing the Vacheron Constantin collection."}
              </p>
            </div>
          </div>
        )}

        {/* Watch Detail Dialog */}
        {selectedWatch && (
          <WatchDetailDialog
            watch={selectedWatch}
            open={!!selectedWatch}
            onClose={() => setSelectedWatch(null)}
          />
        )}
      </div>
    </div>
  );
}

// Watch Card Component
function WatchCard({ watch, onClick }: { watch: WatchCollection; onClick: () => void }) {
  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-amber-200/50 border-amber-200 hover:border-amber-400 bg-gradient-to-br from-white to-amber-50/30"
      onClick={onClick}
      data-testid={`card-watch-${watch.modelCode}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge 
            variant={watch.available ? "default" : "secondary"}
            className={watch.available ? "bg-green-600 text-white" : "bg-gray-400 text-white"}
          >
            {watch.available ? "Available" : "Not Available"}
          </Badge>
          {watch.priority === "exclusive" && (
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Exclusive
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg text-amber-900 group-hover:text-amber-700 transition-colors">
          {watch.description}
        </CardTitle>
        <CardDescription className="text-amber-700">
          {watch.modelCode} • {watch.referenceNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-amber-900">
              {watch.price || `${watch.priceNumeric?.toLocaleString()} AED`}
            </span>
            {watch.statusFlag1 && watch.statusFlag2 && (
              <Badge variant="outline" className="border-amber-400 text-amber-700">
                <Star className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          
          {watch.collection && (
            <div className="flex items-center text-sm text-amber-600">
              <Gem className="h-4 w-4 mr-2" />
              {watch.collection}
              {watch.category && ` • ${watch.category}`}
            </div>
          )}
          
          {watch.material && (
            <div className="text-sm text-amber-600">
              Material: {watch.material}
            </div>
          )}
          
          {watch.complications && watch.complications.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {watch.complications.slice(0, 3).map((comp, idx) => (
                <Badge key={idx} variant="outline" className="text-xs border-amber-300 text-amber-700">
                  {comp}
                </Badge>
              ))}
              {watch.complications.length > 3 && (
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                  +{watch.complications.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Watch Detail Dialog Component
function WatchDetailDialog({ watch, open, onClose }: { watch: WatchCollection; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <Crown className="h-6 w-6 text-amber-600" />
            <div>
              <DialogTitle className="text-xl text-amber-900">{watch.description}</DialogTitle>
              <DialogDescription className="text-amber-700">
                {watch.modelCode} • {watch.referenceNumber}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">Watch Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-amber-700">Price</Label>
                  <p className="text-lg font-semibold text-amber-900">
                    {watch.price || `${watch.priceNumeric?.toLocaleString()} AED`}
                  </p>
                </div>
                <div>
                  <Label className="text-amber-700">Availability</Label>
                  <p className={watch.available ? "text-green-600 font-medium" : "text-red-600"}>
                    {watch.available ? "Available" : "Not Available"}
                  </p>
                </div>
                <div>
                  <Label className="text-amber-700">Collection</Label>
                  <p className="text-amber-900">{watch.collection || "—"}</p>
                </div>
                <div>
                  <Label className="text-amber-700">Category</Label>
                  <p className="text-amber-900">{watch.category || "—"}</p>
                </div>
                <div>
                  <Label className="text-amber-700">Material</Label>
                  <p className="text-amber-900">{watch.material || "—"}</p>
                </div>
                <div>
                  <Label className="text-amber-700">Priority</Label>
                  <p className="text-amber-900 capitalize">{watch.priority || "Medium"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {watch.complications && watch.complications.length > 0 && (
                <div>
                  <Label className="text-amber-700">Complications</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {watch.complications.map((comp, idx) => (
                      <Badge key={idx} variant="outline" className="border-amber-300 text-amber-700">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {watch.caseSize && (
                <div>
                  <Label className="text-amber-700">Case Size</Label>
                  <p className="text-amber-900">{watch.caseSize}</p>
                </div>
              )}
              
              {watch.movement && (
                <div>
                  <Label className="text-amber-700">Movement</Label>
                  <p className="text-amber-900">{watch.movement}</p>
                </div>
              )}
              
              {watch.powerReserve && (
                <div>
                  <Label className="text-amber-700">Power Reserve</Label>
                  <p className="text-amber-900">{watch.powerReserve}</p>
                </div>
              )}
              
              {watch.salesNotes && (
                <div>
                  <Label className="text-amber-700">Sales Notes</Label>
                  <p className="text-amber-900 text-sm">{watch.salesNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            Close
          </Button>
          <Button className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Watch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Watch Form Component (for adding new watches)
function WatchForm({ watch, onClose }: { watch?: WatchCollection; onClose: () => void }) {
  // Implementation for watch form would go here
  return (
    <div className="p-4">
      <p className="text-amber-700">Watch form implementation coming soon...</p>
      <Button onClick={onClose} className="mt-4">Close</Button>
    </div>
  );
}

// Bulk Price Update Form Component
function BulkPriceUpdateForm({ watches, onSubmit, isLoading }: { 
  watches: WatchCollection[]; 
  onSubmit: (updates: {id: string, priceNumeric: number}[]) => void;
  isLoading: boolean;
}) {
  // Implementation for bulk price update form would go here
  return (
    <div className="p-4">
      <p className="text-amber-700">Bulk price update form implementation coming soon...</p>
      <Button onClick={() => onSubmit([])} disabled={isLoading} className="mt-4">
        {isLoading ? "Updating..." : "Update Prices"}
      </Button>
    </div>
  );
}