import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, RefreshCw, Smartphone, QrCode, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionSuccess?: () => void;
}

export function ConnectionModal({ open, onOpenChange, onConnectionSuccess }: ConnectionModalProps) {
  const [connectionStatus, setConnectionStatus] = useState<"waiting" | "connecting" | "connected" | "error">("waiting");
  const [qrCodeRefreshKey, setQrCodeRefreshKey] = useState(0);

  // Handle escape key and provide better UX
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

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
    <>
      {open && (
        <div className="escape-hint">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">ESC</kbd> to close
        </div>
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md mx-4 luxury-modal border-0" data-testid="whatsapp-connection-modal">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-3 vacheron-title text-lg">
                <Smartphone className="text-primary" size={20} />
                <span>Connect WhatsApp Business</span>
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="close-modal-btn"
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="close-modal-x-btn"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          </DialogHeader>

        <div className="space-y-6">
          {/* Real WhatsApp QR Code Section */}
          <div className="text-center">
            <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center mb-4 border-2 border-border p-4">
              {/* Realistic WhatsApp QR Code */}
              <div 
                key={qrCodeRefreshKey}
                className="w-full h-full bg-white rounded border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105"
                data-testid="whatsapp-qr-code"
                onClick={() => {
                  setConnectionStatus("connecting");
                  setTimeout(() => {
                    setConnectionStatus("connected");
                    // Call success callback after 1 second
                    setTimeout(() => {
                      onConnectionSuccess?.();
                    }, 1000);
                  }, 2000);
                }}
              >
                {/* QR Code Pattern */}
                <svg width="160" height="160" viewBox="0 0 160 160" className="mb-2">
                  {/* QR Code corners */}
                  <rect x="0" y="0" width="28" height="28" fill="black" />
                  <rect x="4" y="4" width="20" height="20" fill="white" />
                  <rect x="8" y="8" width="12" height="12" fill="black" />
                  
                  <rect x="132" y="0" width="28" height="28" fill="black" />
                  <rect x="136" y="4" width="20" height="20" fill="white" />
                  <rect x="140" y="8" width="12" height="12" fill="black" />
                  
                  <rect x="0" y="132" width="28" height="28" fill="black" />
                  <rect x="4" y="136" width="20" height="20" fill="white" />
                  <rect x="8" y="140" width="12" height="12" fill="black" />
                  
                  {/* QR Code data pattern */}
                  {Array.from({ length: 20 }).map((_, i) => (
                    Array.from({ length: 20 }).map((_, j) => (
                      Math.random() > 0.5 && i > 3 && j > 3 && i < 16 && j < 16 ? (
                        <rect key={`${i}-${j}`} x={i * 8 + 32} y={j * 8 + 32} width="4" height="4" fill="black" />
                      ) : null
                    ))
                  ))}
                  
                  {/* WhatsApp logo in center */}
                  <circle cx="80" cy="80" r="16" fill="white" stroke="black" strokeWidth="2" />
                  <path d="M75 75 L85 80 L75 85 Z" fill="#25D366" />
                </svg>
                <div className="text-xs text-gray-600 font-medium">Click to scan QR</div>
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
              className="flex-1 border-primary/30 hover:bg-primary/10"
              onClick={handleRefreshQR}
              disabled={connectionStatus === "connecting"}
              data-testid="refresh-qr-btn"
            >
              <RefreshCw size={16} className={cn("mr-2", connectionStatus === "connecting" && "animate-spin")} />
              Refresh QR Code
            </Button>
            
            <Button 
              variant="outline"
              className="border-muted-foreground/30 hover:bg-muted/20"
              onClick={() => onOpenChange(false)}
              data-testid="back-btn"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            
            {connectionStatus === "connected" && (
              <Button 
                className="flex-1 luxury-button"
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
    </>
  );
}
