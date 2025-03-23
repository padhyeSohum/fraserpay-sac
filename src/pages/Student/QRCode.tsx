import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { encodeUserData, generateQRCode } from '@/utils/qrCode';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const QRCode = () => {
  const { user } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      // Generate QR code data
      const userData = encodeUserData(user.id);
      setQrData(userData);
      
      // Generate QR code image
      const qrUrl = generateQRCode(userData);
      setQrCodeUrl(qrUrl);
    }
  }, [user]);

  const regenerateQR = () => {
    if (user) {
      setIsRefreshing(true);
      // Generate a new QR code with the same data
      setTimeout(() => {
        const qrUrl = generateQRCode(qrData);
        setQrCodeUrl(qrUrl);
        setIsRefreshing(false);
      }, 800);
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
                className={`w-64 h-64 bg-white p-4 rounded-lg shadow-sm mb-6 transition-all duration-300 flex items-center justify-center ${isRefreshing ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {qrCodeUrl ? (
                  <div dangerouslySetInnerHTML={{ __html: decodeURIComponent(qrCodeUrl.split(',')[1]) }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Loading QR code...</p>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={regenerateQR}
                disabled={isRefreshing}
                className="mb-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh QR Code
              </Button>
              
              <p className="text-sm text-muted-foreground text-center">
                This is your unique payment QR code. Present it to booth vendors to make purchases.
              </p>
              
              {user && (
                <div className="mt-4 text-center">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">Balance: ${user.balance.toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default QRCode;
