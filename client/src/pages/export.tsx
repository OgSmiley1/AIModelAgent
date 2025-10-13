import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Database, FileJson, Code, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ExportPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: fullExport, isLoading: fullLoading } = useQuery({
    queryKey: ['/api/export/full'],
  });

  const { data: schemasExport, isLoading: schemasLoading } = useQuery({
    queryKey: ['/api/export/schemas'],
  });

  const { data: architectureExport, isLoading: architectureLoading } = useQuery({
    queryKey: ['/api/export/architecture'],
  });

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      title: "Copied to clipboard!",
      description: `${label} data copied successfully`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (fullLoading || schemasLoading || architectureLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Database className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading export data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Data Export</h1>
        <p className="text-muted-foreground">
          Export full system data for ChatGPT, Manus, or other AI tools. Copy and paste these sections for development continuity.
        </p>
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Privacy Warning:</strong> This export contains sensitive PII data (client names, contacts, preferences).
            Handle with care and avoid sharing publicly.
          </div>
        </div>
      </div>

      <Tabs defaultValue="full" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="full" data-testid="tab-full">Full Export</TabsTrigger>
          <TabsTrigger value="schema" data-testid="tab-schema">Database Schema</TabsTrigger>
          <TabsTrigger value="architecture" data-testid="tab-architecture">Architecture & Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="full" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                Complete System Snapshot
              </CardTitle>
              <CardDescription>
                All clients, watches, FAQs, appointments, and database schema in one JSON export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-semibold">Clients</div>
                    <div className="text-2xl">{fullExport?.counts?.clients || 0}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Watches</div>
                    <div className="text-2xl">{fullExport?.counts?.watches || 0}</div>
                  </div>
                  <div>
                    <div className="font-semibold">FAQs</div>
                    <div className="text-2xl">{fullExport?.counts?.faqs || 0}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Appointments</div>
                    <div className="text-2xl">{fullExport?.counts?.appointments || 0}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(JSON.stringify(fullExport, null, 2), "Full Export")}
                  className="flex-1"
                  data-testid="button-copy-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied === "Full Export" ? "Copied!" : "Copy Full Export"}
                </Button>
                <Button
                  onClick={() => downloadJSON(fullExport, `vc-crm-full-export-${new Date().toISOString()}.json`)}
                  variant="outline"
                  data-testid="button-download-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Generated: {fullExport?.metadata?.generatedAt}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Data Only</CardTitle>
                <CardDescription>{fullExport?.counts?.clients || 0} clients</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => copyToClipboard(JSON.stringify(fullExport?.data?.clients, null, 2), "Clients")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-copy-clients"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied === "Clients" ? "Copied!" : "Copy Clients"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Watch Catalog</CardTitle>
                <CardDescription>{fullExport?.counts?.watches || 0} watches</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => copyToClipboard(JSON.stringify(fullExport?.data?.watches, null, 2), "Watches")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-copy-watches"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied === "Watches" ? "Copied!" : "Copy Watches"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Database Schema (Drizzle ORM)
              </CardTitle>
              <CardDescription>
                TypeScript schema definitions for all database tables and relations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto max-h-96 text-xs">
                <code>{schemasExport?.schema?.substring(0, 1000)}...</code>
              </pre>

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(schemasExport?.schema || "", "Schema")}
                  className="flex-1"
                  data-testid="button-copy-schema"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied === "Schema" ? "Copied!" : "Copy Full Schema"}
                </Button>
                <Button
                  onClick={() => {
                    const blob = new Blob([schemasExport?.schema || ""], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'schema.ts';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  variant="outline"
                  data-testid="button-download-schema"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download schema.ts
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Architecture & Documentation</CardTitle>
              <CardDescription>
                Complete system overview, architecture notes, and Telegram bot commands
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Telegram Bot Commands</h3>
                <pre className="bg-muted p-4 rounded-lg text-xs">
                  {architectureExport?.telegram?.commands?.join('\n')}
                </pre>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(
                    `# Vacheron Constantin CRM System\n\n` +
                    `## Architecture Overview\n${architectureExport?.architecture?.overview}\n\n` +
                    `## Handover Documentation\n${architectureExport?.architecture?.handover}\n\n` +
                    `## Telegram Bot\n${architectureExport?.telegram?.naturalLanguage}\n\n` +
                    `### Commands\n${architectureExport?.telegram?.commands?.join('\n')}`,
                    "Architecture"
                  )}
                  className="flex-1"
                  data-testid="button-copy-architecture"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied === "Architecture" ? "Copied!" : "Copy Documentation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">How to Use with ChatGPT/Manus</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>Copy the relevant export section (Full Export, Schema, or Architecture)</li>
          <li>Paste into ChatGPT or Manus with your development question/request</li>
          <li>The AI will have complete context of your system state and can provide accurate guidance</li>
          <li>Re-export whenever you make significant changes to keep external AI tools in sync</li>
        </ol>
      </div>
    </div>
  );
}
