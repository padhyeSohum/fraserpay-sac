
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { encodeUserData, generateQRCode } from '@/utils/qrCode';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const QRCode = () => {
  const { user, updateUserData } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Separate the user data refresh logic to make it reusable
  const refreshUserData = useCallback(async () => {
    if (!user) return false;
    
    try {
      // Refresh user data to get the latest balance
      const { data: freshUserData, error: userError } = await supabase
        .from('users')
        .select('tickets')
        .eq('id', user.id)
        .single();
        
      if (!userError && freshUserData) {
        console.log("QR Code - refreshed user data:", freshUserData);
        
        // Only update if the balance changed
        if (freshUserData.tickets / 100 !== user.balance) {
          // Update user context with fresh balance
          updateUserData({
            ...user,
            balance: freshUserData.tickets / 100
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return false;
    }
  }, [user, updateUserData]);

  // Generate QR code function
  const generateQRForUser = useCallback(() => {
    if (!user) return;
    
    try {
      // Generate QR code data
      const userData = encodeUserData(user.id);
      setQrData(userData);
      
      // Generate QR code image
      const qrUrl = generateQRCode(userData);
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }, [user]);

  // Initial load effect
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      setIsLoading(true);
      
      if (user) {
        // First refresh user data
        await refreshUserData();
        
        // Only proceed if component is still mounted
        if (!isMounted) return;
        
        // Generate QR code
        generateQRForUser();
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    }
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [user, refreshUserData, generateQRForUser]);

  const regenerateQR = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    
    try {
      // Refresh user data first
      await refreshUserData();
      
      // Add a small delay for UI feedback
      setTimeout(() => {
        generateQRForUser();
        setIsRefreshing(false);
      }, 600);
    } catch (error) {
      console.error("Error refreshing QR code:", error);
      setIsRefreshing(false);
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
                className={`w-64 h-64 bg-white p-4 rounded-lg shadow-sm mb-6 transition-all duration-300 flex items-center justify-center ${isRefreshing || isLoading ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}
              >
                {qrCodeUrl && !isLoading ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Loading QR code...</p>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={regenerateQR}
                disabled={isRefreshing || isLoading}
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
