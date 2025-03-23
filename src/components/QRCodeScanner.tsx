
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef<boolean>(false); // Ref to track scan status
  const scannerDivId = 'qr-scanner';

  useEffect(() => {
    const scanner = new Html5Qrcode(scannerDivId);
    scannerRef.current = scanner;

    startScanning(scanner);

    return () => {
      if (isScanning && scanner) {
        scanner
          .stop()
          .catch((err) => console.error('Error stopping scanner:', err));
      }
    };
  }, []);

  const startScanning = async (scanner: Html5Qrcode) => {
    setIsScanning(true);
    setError(null);
    hasScannedRef.current = false; // Reset scan status

    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Only process the scan if we haven't already scanned
          if (!hasScannedRef.current) {
            hasScannedRef.current = true; // Mark as scanned
            console.log('QR code scanned successfully, stopping scanner');
            stopScanning();
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          console.log('QR scanning in progress:', errorMessage);
          // Don't set error here to avoid excessive error messages
        }
      );
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError(err.toString());
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current && isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          setIsScanning(false);
        })
        .catch((err) => {
          console.error('Error stopping scanner:', err);
        });
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10">
        <Button
          size="icon"
          variant="outline"
          className="rounded-full bg-background"
          onClick={() => {
            stopScanning();
            onClose();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <div 
          id={scannerDivId} 
          className="w-full h-[300px] bg-black relative rounded-md overflow-hidden"
          style={{ maxWidth: '400px' }}
        />
        
        {error && (
          <div className="text-sm text-red-500 mt-2">
            {error === 'NotAllowedError: Permission denied'
              ? 'Camera access was denied. Please allow camera access to scan QR codes.'
              : error}
          </div>
        )}
        
        <p className="text-sm text-muted-foreground text-center">
          Position the QR code in the frame to scan
        </p>
      </div>
    </div>
  );
};

export default QRCodeScanner;
