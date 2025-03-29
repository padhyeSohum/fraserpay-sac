
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { isPWA, setupInstallPrompt, showInstallPrompt } from "@/utils/pwa";

interface PWAInstallPromptProps {
  onClose: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Only show on mobile and when not already installed as PWA
    if (!isMobile || isPWA()) {
      onClose();
      return;
    }

    console.log("PWA install prompt component mounted");
    
    // Setup the install prompt handler
    setupInstallPrompt(setCanInstall, setDeferredPrompt);
    
    return () => {
      console.log("PWA install prompt component unmounted");
    };
  }, [isMobile, onClose]);

  // If no install is possible or not on mobile, don't render anything
  if (!canInstall) {
    return null;
  }

  const handleInstall = async () => {
    console.log("Install button clicked, deferredPrompt:", deferredPrompt);
    if (deferredPrompt) {
      const installed = await showInstallPrompt(deferredPrompt);
      if (installed) {
        setCanInstall(false);
        setDeferredPrompt(null);
      }
      onClose();
    } else {
      console.warn("No deferred prompt available when install button clicked");
    }
  };

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50 p-4 animate-fade-in">
      <Card className="w-full max-w-sm border shadow-lg">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png" 
                alt="Fraser Pay" 
                className="w-8 h-8 mr-2" 
              />
              <h3 className="font-semibold">Add to Home Screen</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Add Fraser Pay to your home screen for a better experience and quick access.
          </p>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Not Now
            </Button>
            <Button onClick={handleInstall} className="flex-1 bg-brand-600 hover:bg-brand-700">
              Install
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
