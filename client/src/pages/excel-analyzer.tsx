import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Brain, 
  Users, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

interface AnalysisResult {
  id: string;
  originalFilename: string;
  analyzedFilename: string;
  clientsAnalyzed: number;
  highPriorityClients: number;
  followUpsGenerated: number;
  totalValue: number;
  status: 'processing' | 'completed' | 'error';
  createdAt: string;
  downloadUrl?: string;
  insights?: {
    topClients: Array<{
      name: string;
      value: number;
      priority: string;
      nextAction: string;
    }>;
    valueDistribution: {
      high: number;
      medium: number;
      low: number;
    };
    recommendations: string[];
  };
}

export default function ExcelAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Get recent analysis results
  const { data: analysisHistory, isLoading } = useQuery<AnalysisResult[]>({
    queryKey: ['/api/excel-analysis/history'],
  });

  // Upload and analyze mutation
  const analyzeFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/excel-analysis/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Analysis Started",
        description: `Processing ${result.filename} with AI...`,
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/excel-analysis/history'] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive"
        });
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('excel_file', selectedFile);
    analyzeFileMutation.mutate(formData);
  };

  const downloadAnalysis = async (analysisId: string, filename: string) => {
    try {
      const response = await fetch(`/api/excel-analysis/download/${analysisId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Download Started",
        description: `Downloading ${filename}...`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the analysis file",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Excel Client Analyzer</h1>
            <p className="text-muted-foreground mt-2">
              Upload client lists for AI-powered analysis and follow-up prioritization
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Brain className="w-4 h-4" />
            <span>Powered by AI Analysis</span>
          </div>
        </div>

        <Separator />

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload Client List</span>
            </CardTitle>
            <CardDescription>
              Upload an Excel file with client data. The AI will analyze it and generate follow-up priorities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-file">Select Excel File</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                data-testid="file-input-excel"
              />
              {selectedFile && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{selectedFile.name}</span>
                  <span>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Expected columns: Name, Email, Phone, Value, Last Contact, Status, Notes
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || analyzeFileMutation.isPending}
              className="w-full"
              data-testid="button-analyze"
            >
              {analyzeFileMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5" />
              <span>Analysis History</span>
            </CardTitle>
            <CardDescription>
              Recent Excel analyses and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Clock className="w-6 h-6 animate-spin mr-2" />
                <span>Loading analysis history...</span>
              </div>
            ) : analysisHistory && analysisHistory.length > 0 ? (
              <div className="space-y-4">
                {analysisHistory.map((analysis) => (
                  <div key={analysis.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="font-medium">{analysis.originalFilename}</span>
                        <Badge variant={
                          analysis.status === 'completed' ? 'default' : 
                          analysis.status === 'processing' ? 'secondary' : 
                          'destructive'
                        }>
                          {analysis.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {analysis.status === 'completed' && (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="text-sm font-medium">{analysis.clientsAnalyzed}</div>
                              <div className="text-xs text-muted-foreground">Clients</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <div>
                              <div className="text-sm font-medium">{analysis.highPriorityClients}</div>
                              <div className="text-xs text-muted-foreground">High Priority</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <div>
                              <div className="text-sm font-medium">{analysis.followUpsGenerated}</div>
                              <div className="text-xs text-muted-foreground">Follow-ups</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                            <div>
                              <div className="text-sm font-medium">
                                ${(analysis.totalValue / 1000).toFixed(0)}K
                              </div>
                              <div className="text-xs text-muted-foreground">Total Value</div>
                            </div>
                          </div>
                        </div>

                        {analysis.insights && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Top Recommendations:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {analysis.insights.recommendations.slice(0, 3).map((rec, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                  <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Button
                            onClick={() => downloadAnalysis(analysis.id, analysis.analyzedFilename)}
                            variant="outline"
                            size="sm"
                            data-testid={`button-download-${analysis.id}`}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Analysis
                          </Button>
                        </div>
                      </>
                    )}

                    {analysis.status === 'processing' && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>AI is analyzing your client data...</span>
                      </div>
                    )}

                    {analysis.status === 'error' && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Analysis failed. Please try uploading the file again.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No analysis history yet</p>
                <p className="text-sm">Upload your first Excel file to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
        </main>
      </div>
    </div>
  );
}