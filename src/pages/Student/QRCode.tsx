
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { encodeUserData, generateQRCode } from '@/utils/qrCode';

const QRCode = () => {
  const { user } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');

  useEffect(() => {
    if (user) {
      // Generate QR code data
      const userData = encodeUserData(user.id);
      setQrData(userData);
      
      // Generate QR code image URL (not a Promise anymore)
      const qrUrl = generateQRCode(userData);
      setQrCodeUrl(qrUrl);
    }
  }, [user]);

  const regenerateQR = () => {
    if (user) {
      // In a real app, this would generate a new temporary QR code
      // For demo, we'll use the same QR code but animate a refresh
      const qrElement = document.getElementById('qr-code');
      if (qrElement) {
        qrElement.classList.add('opacity-0');
        setTimeout(() => {
          const qrUrl = generateQRCode(qrData);
          setQrCodeUrl(qrUrl);
          qrElement.classList.remove('opacity-0');
        }, 300);
      }
    }
  };

  return (
    <Layout title="Your QR Code" showBack>
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
        <div className="w-full max-w-md">
          <Card className="border-none shadow-lg glass-card">
            <CardContent className="p-6 flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4">Show this QR code to make purchases</h2>
              
              <div 
                id="qr-code"
                className="w-64 h-64 bg-white p-4 rounded-lg shadow-sm mb-6 transition-opacity duration-300"
              >
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="Your payment QR code" 
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Loading QR code...</p>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                This is your unique payment QR code. Present it to booth vendors to make purchases.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default QRCode;
