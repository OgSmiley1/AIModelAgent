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
import { 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Eye, 
  Trash2, 
  FileImage, 
  FileSpreadsheet,
  FilePen,
  File,
  Filter,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentData, ClientProfileData } from "@/types";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<DocumentData[]>({
    queryKey: ['/api/documents'],
    enabled: false, // Would need proper API endpoint
  });

  // Fetch clients for filter
  const { data: clients = [] } = useQuery<ClientProfileData[]>({
    queryKey: ['/api/clients'],
  });

  // Mock documents for display
  const mockDocuments: DocumentData[] = [
    {
      id: "1",
      clientId: "client-1",
      filename: "contract_2024_001.pdf",
      originalName: "Service Contract - Client ABC.pdf",
      fileType: "application/pdf",
      fileSize: 2048000,
      filePath: "/documents/contract_2024_001.pdf",
      category: "contract",
      tags: ["contract", "2024", "service"],
      analyzed: true,
      analysisResults: { contractValue: 50000, terms: "12 months" },
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      clientId: "client-2",
      filename: "proposal_luxury_travel.pdf",
      originalName: "Luxury Travel Proposal - VIP Client.pdf",
      fileType: "application/pdf",
      fileSize: 1536000,
      filePath: "/documents/proposal_luxury_travel.pdf",
      category: "proposal",
      tags: ["proposal", "luxury", "travel"],
      analyzed: false,
      createdAt: new Date("2024-01-10"),
    },
    {
      id: "3",
      filename: "client_portfolio.xlsx",
      originalName: "Client Portfolio Analysis.xlsx",
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileSize: 800000,
      filePath: "/documents/client_portfolio.xlsx",
      category: "report",
      tags: ["analysis", "portfolio", "clients"],
      analyzed: true,
      analysisResults: { totalClients: 247, topTier: 45 },
      createdAt: new Date("2024-01-08"),
    }
  ];

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FilePen className="text-red-500" size={20} />;
    if (fileType.includes('image')) return <FileImage className="text-blue-500" size={20} />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="text-green-500" size={20} />;
    return <File className="text-muted-foreground" size={20} />;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      contract: "bg-blue-100 text-blue-800",
      proposal: "bg-green-100 text-green-800",
      invoice: "bg-yellow-100 text-yellow-800",
      report: "bg-purple-100 text-purple-800",
      image: "bg-pink-100 text-pink-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    const matchesClient = clientFilter === "all" || doc.clientId === clientFilter;
    
    return matchesSearch && matchesCategory && matchesClient;
  });

  const documentsByCategory = {
    all: filteredDocuments,
    contract: filteredDocuments.filter(d => d.category === "contract"),
    proposal: filteredDocuments.filter(d => d.category === "proposal"),
    invoice: filteredDocuments.filter(d => d.category === "invoice"),
    report: filteredDocuments.filter(d => d.category === "report"),
    image: filteredDocuments.filter(d => d.category === "image"),
  };

  const handleFileUpload = () => {
    if (!selectedFiles) return;
    
    // Would handle file upload here
    console.log("Uploading files:", selectedFiles);
    setIsUploadDialogOpen(false);
    setSelectedFiles(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="Document Management"
          subtitle="Organize, analyze, and manage your business documents"
        />
        
        <div className="flex-1 overflow-hidden p-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="document-search"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40" data-testid="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="contract">Contracts</SelectItem>
                  <SelectItem value="proposal">Proposals</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
                  <SelectItem value="report">Reports</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-40" data-testid="client-filter">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="upload-document-btn">
                  <Upload size={16} className="mr-2" />
                  Upload Documents
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Documents</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground mb-2">
                      Drag and drop files here, or click to select
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      className="hidden"
                      id="file-upload"
                      data-testid="file-input"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" asChild>
                        <span>Select Files</span>
                      </Button>
                    </label>
                  </div>
                  
                  {selectedFiles && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Selected Files:</h4>
                      {Array.from(selectedFiles).map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsUploadDialogOpen(false)}
                      data-testid="cancel-upload-btn"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleFileUpload}
                      disabled={!selectedFiles}
                      data-testid="confirm-upload-btn"
                    >
                      Upload Files
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Document Stats */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {Object.entries(documentsByCategory).map(([category, docs]) => (
              <Card key={category}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground capitalize">
                        {category === 'all' ? 'Total' : category}
                      </p>
                      <p className="text-2xl font-bold">{docs.length}</p>
                    </div>
                    <FileText className="text-muted-foreground" size={16} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Document Tabs */}
          <Tabs defaultValue="all" className="flex-1">
            <TabsList>
              <TabsTrigger value="all" data-testid="all-documents-tab">
                All Documents ({documentsByCategory.all.length})
              </TabsTrigger>
              <TabsTrigger value="contract" data-testid="contracts-tab">
                Contracts ({documentsByCategory.contract.length})
              </TabsTrigger>
              <TabsTrigger value="proposal" data-testid="proposals-tab">
                Proposals ({documentsByCategory.proposal.length})
              </TabsTrigger>
              <TabsTrigger value="report" data-testid="reports-tab">
                Reports ({documentsByCategory.report.length})
              </TabsTrigger>
            </TabsList>

            {(['all', 'contract', 'proposal', 'report'] as const).map((category) => (
              <TabsContent key={category} value={category} className="mt-6">
                {documentsByCategory[category].length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                      <p className="text-muted-foreground mb-2">No documents found</p>
                      <p className="text-sm text-muted-foreground">
                        {mockDocuments.length === 0 
                          ? "Upload your first document to get started" 
                          : "Try adjusting your search or filters"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4" data-testid="documents-list">
                    {documentsByCategory[category].map((document) => (
                      <Card key={document.id} data-testid={`document-${document.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {getFileIcon(document.fileType)}
                              <div className="flex-1">
                                <h4 className="font-medium">{document.originalName}</h4>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                  <span>{formatFileSize(document.fileSize)}</span>
                                  <span className="flex items-center space-x-1">
                                    <Calendar size={12} />
                                    <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                                  </span>
                                  {document.category && (
                                    <Badge className={getCategoryColor(document.category)}>
                                      {document.category}
                                    </Badge>
                                  )}
                                  {document.analyzed && (
                                    <Badge className="bg-chart-1 text-white">
                                      AI Analyzed
                                    </Badge>
                                  )}
                                </div>
                                {document.tags && document.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {document.tags.map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`view-${document.id}`}>
                                <Eye size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`download-${document.id}`}>
                                <Download size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`delete-${document.id}`}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                          
                          {document.analysisResults && (
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <h5 className="font-medium text-sm mb-2">AI Analysis Results</h5>
                              <div className="text-sm text-muted-foreground">
                                {Object.entries(document.analysisResults).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
