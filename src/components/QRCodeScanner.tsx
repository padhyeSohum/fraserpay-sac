
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef<boolean>(false); // Ref to track scan status
  const scannerDivRef = useRef<HTMLDivElement>(null); // Ref for the scanner div
  const scannerDivId = 'qr-scanner';
  const isMountedRef = useRef<boolean>(true); // Track component mount state

  useEffect(() => {
    // Set mounted ref to true
    isMountedRef.current = true;
    
    // Try to initialize scanner with a slight delay to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      try {
        console.log('Initializing QR code scanner');
        const scannerElement = document.getElementById(scannerDivId);
        
        if (!scannerElement) {
          console.error('Scanner DOM element not found');
          setError('Scanner initialization failed. Please try again.');
          return;
        }
        
        const scanner = new Html5Qrcode(scannerDivId);
        scannerRef.current = scanner;
        startScanning(scanner);
      } catch (err) {
        console.error('Error initializing scanner:', err);
        setError('Failed to initialize camera. Please check camera permissions and try again.');
      }
    }, 500);

    // Clean up function
    return () => {
      clearTimeout(initTimeout);
      
      // Set mounted ref to false to prevent state updates after unmount
      isMountedRef.current = false;
      
      try {
        if (scannerRef.current) {
          console.log('Cleaning up scanner');
          scannerRef.current
            .stop()
            .catch((err) => console.error('Error stopping scanner during cleanup:', err));
        }
      } catch (err) {
        console.error('Error during scanner cleanup:', err);
      }
    };
  }, []);

  const startScanning = async (scanner: Html5Qrcode) => {
    if (!isMountedRef.current) return;
    
    setIsScanning(true);
    setError(null);
    setScanFeedback(null);
    hasScannedRef.current = false; // Reset scan status

    try {
      console.log('Starting QR code scanner');
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Only process the scan if the component is still mounted and we haven't already scanned
          if (isMountedRef.current && !hasScannedRef.current) {
            hasScannedRef.current = true; // Mark as scanned
            console.log('QR code scanned successfully:', decodedText);
            setScanFeedback('QR code detected! Processing...');
            stopScanning();
            
            // Add a slight delay before calling onScan to ensure UI updates first
            setTimeout(() => {
              if (isMountedRef.current) {
                // Ensure we're passing a clean string to the handler
                const cleanText = decodedText.trim();
                console.log('Passing decoded text to handler:', cleanText);
                onScan(cleanText);
              }
            }, 500);
          }
        },
        (errorMessage) => {
          // This is called frequently while scanning for QR codes
          // Don't set error here to avoid excessive error messages
        }
      );
    } catch (err: any) {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        console.error('Error starting scanner:', err);
        setError(err.toString());
        setIsScanning(false);
      }
    }
  };

  const stopScanning = () => {
    if (!scannerRef.current || !isScanning || !isMountedRef.current) return;
    
    try {
      console.log('Stopping QR code scanner');
      scannerRef.current
        .stop()
        .then(() => {
          if (isMountedRef.current) {
            setIsScanning(false);
          }
        })
        .catch((err) => {
          console.error('Error stopping scanner:', err);
        });
    } catch (err) {
      console.error('Error during scanner stop:', err);
    }
  };

  const handleClose = () => {
    try {
      stopScanning();
      onClose();
    } catch (err) {
      console.error('Error handling close:', err);
      // Force close even if error occurs
      onClose();
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10">
        <Button
          size="icon"
          variant="outline"
          className="rounded-full bg-background"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <div 
          id={scannerDivId} 
          ref={scannerDivRef}
          className="w-full h-[300px] bg-black relative rounded-md overflow-hidden"
          style={{ maxWidth: '400px' }}
        />
        
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>
              {error === 'NotAllowedError: Permission denied'
                ? 'Camera access was denied. Please allow camera access to scan QR codes.'
                : error}
            </AlertDescription>
          </Alert>
        )}
        
        {scanFeedback && (
          <Alert className="mt-2 bg-muted">
            <AlertDescription>{scanFeedback}</AlertDescription>
          </Alert>
        )}
        
        <p className="text-sm text-muted-foreground text-center">
          Position the QR code in the frame to scan
        </p>
      </div>
    </div>
  );
};

export default QRCodeScanner;
