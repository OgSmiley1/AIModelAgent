import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, RefreshCw, Smartphone, QrCode, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectionModal({ open, onOpenChange }: ConnectionModalProps) {
  const [connectionStatus, setConnectionStatus] = useState<"waiting" | "connecting" | "connected" | "error">("waiting");
  const [qrCodeRefreshKey, setQrCodeRefreshKey] = useState(0);

  // Simulate QR code refresh every 30 seconds
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setQrCodeRefreshKey(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [open]);

  // Simulate connection status changes
  useEffect(() => {
    if (!open) {
      setConnectionStatus("waiting");
      return;
    }

    // Reset to waiting when modal opens
    setConnectionStatus("waiting");
  }, [open]);

  const handleRefreshQR = () => {
    setQrCodeRefreshKey(prev => prev + 1);
    setConnectionStatus("waiting");
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "waiting":
        return <Clock className="text-chart-2" size={16} />;
      case "connecting":
        return <RefreshCw className="text-primary animate-spin" size={16} />;
      case "connected":
        return <CheckCircle className="text-chart-1" size={16} />;
      case "error":
        return <X className="text-chart-3" size={16} />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "waiting":
        return "Waiting for connection...";
      case "connecting":
        return "Connecting to WhatsApp...";
      case "connected":
        return "Successfully connected!";
      case "error":
        return "Connection failed. Please try again.";
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "waiting":
        return "text-chart-2";
      case "connecting":
        return "text-primary";
      case "connected":
        return "text-chart-1";
      case "error":
        return "text-chart-3";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4" data-testid="whatsapp-connection-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Smartphone className="text-primary" size={20} />
              <span>Connect WhatsApp</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
              data-testid="close-modal-btn"
            >
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Section */}
          <div className="text-center">
            <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center mb-4 border-2 border-border">
              {/* QR Code Placeholder */}
              <div 
                key={qrCodeRefreshKey}
                className="w-40 h-40 bg-background rounded border-2 border-dashed border-border flex flex-col items-center justify-center"
                data-testid="qr-code-placeholder"
              >
                <QrCode className="text-muted-foreground mb-2" size={32} />
                <span className="text-muted-foreground text-sm font-medium">QR Code</span>
                <span className="text-xs text-muted-foreground mt-1">
                  #{qrCodeRefreshKey.toString().padStart(3, '0')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your WhatsApp mobile app
              </p>
              <p className="text-xs text-muted-foreground">
                Open WhatsApp → Menu → Linked Devices → Link a Device
              </p>
            </div>
          </div>

          <Separator />

          {/* Status Section */}
          <div className="space-y-4">
            <div className={cn(
              "flex items-center space-x-2 p-3 rounded-lg transition-colors",
              connectionStatus === "waiting" && "bg-chart-2/10 border border-chart-2/20",
              connectionStatus === "connecting" && "bg-primary/10 border border-primary/20", 
              connectionStatus === "connected" && "bg-chart-1/10 border border-chart-1/20",
              connectionStatus === "error" && "bg-chart-3/10 border border-chart-3/20"
            )} data-testid="connection-status">
              {getStatusIcon()}
              <span className={cn("text-sm font-medium", getStatusColor())}>
                {getStatusText()}
              </span>
            </div>

            {connectionStatus === "connected" && (
              <div className="p-3 bg-chart-1/5 border border-chart-1/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="text-chart-1" size={16} />
                  <span className="text-sm font-medium text-chart-1">Connection Successful</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your WhatsApp Business account is now connected. You can close this dialog and start receiving messages.
                </p>
              </div>
            )}

            {connectionStatus === "error" && (
              <div className="p-3 bg-chart-3/5 border border-chart-3/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <X className="text-chart-3" size={16} />
                  <span className="text-sm font-medium text-chart-3">Connection Failed</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Please check your internet connection and try refreshing the QR code.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">How to connect:</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">1</span>
                <span>Open WhatsApp on your phone</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">2</span>
                <span>Tap Menu (⋮) → Linked devices</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">3</span>
                <span>Tap "Link a device"</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">4</span>
                <span>Point your phone at this QR code</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleRefreshQR}
              disabled={connectionStatus === "connecting"}
              data-testid="refresh-qr-btn"
            >
              <RefreshCw size={16} className={cn("mr-2", connectionStatus === "connecting" && "animate-spin")} />
              Refresh QR Code
            </Button>
            
            {connectionStatus === "connected" && (
              <Button 
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="done-btn"
              >
                <CheckCircle size={16} className="mr-2" />
                Done
              </Button>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Security & Privacy</p>
                <p className="text-xs text-muted-foreground">
                  This connection is end-to-end encrypted. CLOSERT AI will only analyze message content for business insights and never store personal information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
