
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { encodeUserData } from '@/utils/qrCode';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const QRCode = () => {
  const { user, updateUserData } = useAuth();
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced refreshUserData function with better error handling
  const refreshUserData = useCallback(async () => {
    if (!user) return null;
    
    try {
      console.log("QR Code - refreshing user data for user:", user.id);
      
      // Refresh user data to get the latest balance and QR code
      const { data: freshUserData, error: userError } = await supabase
        .from('users')
        .select('tickets, qr_code')
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.error("Error fetching user data:", userError);
        return null;
      }
      
      if (freshUserData) {
        console.log("QR Code - refreshed user data:", freshUserData);
        
        // Check if the balance changed
        const newBalance = freshUserData.tickets / 100;
        if (newBalance !== user.balance) {
          // Update user context with fresh balance
          updateUserData({
            ...user,
            balance: newBalance
          });
        }
        
        // Use the stored QR code or generate a new one
        let qrCode = freshUserData.qr_code;
        
        // If no QR code exists, generate a new one using the standardized format
        if (!qrCode) {
          qrCode = encodeUserData(user.id);
          
          // Store the new QR code in the database
          console.log("Storing new QR code in database:", qrCode);
          const { error: updateError } = await supabase
            .from('users')
            .update({ qr_code: qrCode })
            .eq('id', user.id);
            
          if (updateError) {
            console.error("Error updating QR code:", updateError);
          }
        }
        
        return qrCode;
      }
      
      // Default fallback - use the user ID to create QR data
      return encodeUserData(user.id);
    } catch (error) {
      console.error("Error refreshing user data:", error);
      // Fallback in case of error
      return user ? encodeUserData(user.id) : null;
    }
  }, [user, updateUserData]);

  // Initial load effect with improved error handling
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      setIsLoading(true);
      
      if (user) {
        console.log("QR Code - loading initial data for user:", user.name);
        // First refresh user data and get QR code data
        const qrData = await refreshUserData();
        
        // Only proceed if component is still mounted
        if (!isMounted) return;
        
        if (qrData) {
          console.log("QR Code - setting QR code data");
          setQrCodeData(qrData);
        } else {
          // Fallback if no QR data could be retrieved
          console.log("QR Code - using fallback QR code data");
          setQrCodeData(encodeUserData(user.id));
        }
      } else {
        console.log("QR Code - no user data available");
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    }
    
    loadData();
    
    // Set up automatic refresh interval
    const intervalId = setInterval(() => {
      if (user) refreshUserData();
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user, refreshUserData]);

  const regenerateQR = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    
    try {
      // Generate a new QR code
      const newQrCode = encodeUserData(user.id);
      console.log("QR Code - regenerating QR code");
      
      // Update the QR code in the database
      const { error } = await supabase
        .from('users')
        .update({ qr_code: newQrCode })
        .eq('id', user.id);
        
      if (error) {
        console.error("Error updating QR code:", error);
        toast.error("Failed to regenerate QR code");
      } else {
        // Add a small delay for UI feedback
        setTimeout(() => {
          setQrCodeData(newQrCode);
          setIsRefreshing(false);
          toast.success("QR code regenerated successfully");
        }, 600);
      }
    } catch (error) {
      console.error("Error refreshing QR code:", error);
      toast.error("Failed to regenerate QR code");
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
                {qrCodeData && !isLoading ? (
                  <QRCodeSVG 
                    value={qrCodeData}
                    size={224}
                    level="M"
                    className="w-full h-full"
                  />
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
