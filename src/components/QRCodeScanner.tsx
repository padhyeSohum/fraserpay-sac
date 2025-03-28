
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const [isStarted, setIsStarted] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerRef.current && containerRef.current) {
      try {
        scannerRef.current = new Html5Qrcode('qrcode-reader');
        startScanner();
      } catch (error) {
        console.error('Error initializing QR scanner:', error);
        toast.error('Failed to initialize QR scanner');
        onClose();
      }
    }

    return () => {
      if (scannerRef.current && isStarted) {
        try {
          scannerRef.current.stop()
            .then(() => {
              console.log('Scanner stopped successfully');
              setIsStarted(false);
            })
            .catch(err => {
              console.log('Error stopping scanner:', err);
              // Don't throw errors on component unmount
            });
        } catch (error) {
          console.log('Caught exception when stopping scanner:', error);
          // Don't throw errors on component unmount
        }
      }
    };
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current) return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    };

    try {
      setIsStarted(true);

      await scannerRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          console.log('QR Code scanned:', decodedText);
          onScan(decodedText);
        },
        () => {}
      );
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      toast.error('Failed to start camera. Please check your permissions.');
      setIsStarted(false);
      onClose();
    }
  };

  const handleClose = () => {
    if (scannerRef.current && isStarted) {
      try {
        scannerRef.current.stop()
          .then(() => {
            console.log('Scanner stopped successfully');
            setIsStarted(false);
            onClose();
          })
          .catch(err => {
            console.log('Error stopping scanner:', err);
            // Just close it anyway
            setIsStarted(false);
            onClose();
          });
      } catch (error) {
        console.log('Caught exception when stopping scanner:', error);
        // Just close it anyway
        setIsStarted(false);
        onClose();
      }
    } else {
      // If scanner wasn't started, just close
      onClose();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="absolute top-0 right-0 z-10 p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="bg-white/80 hover:bg-white text-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="bg-black rounded-lg overflow-hidden">
        <div
          id="qrcode-reader"
          className="w-full max-w-md h-[300px] mx-auto"
        ></div>
      </div>
      
      <p className="text-center text-sm text-muted-foreground mt-2">
        Position the QR code within the frame to scan
      </p>
    </div>
  );
};

export default QRCodeScanner;
