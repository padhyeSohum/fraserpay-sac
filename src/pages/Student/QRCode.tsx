
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { encodeUserData } from '@/utils/qrCode';
import { QRCodeSVG } from 'qrcode.react';
import { firestore } from '@/integrations/firebase/client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import AppleWalletButton from '@/components/AppleWalletButton';
import { generateAppleWalletPass } from '@/utils/appleWallet';

const QRCode = () => {
  const { user, updateUserData } = useAuth();
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPass, setIsGeneratingPass] = useState(false);

  // Separate the user data refresh logic to make it reusable
  const refreshUserData = useCallback(async () => {
    if (!user) return false;
    
    try {
      // Refresh user data to get the latest balance from Firebase
      const userRef = doc(firestore, 'users', user.id);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.error('User document not found:', user.id);
        toast.error("User data could not be found");
        return encodeUserData(user.id);
      }
      
      const userData = userSnap.data();
      console.log("QR Code - refreshed user data:", userData);
      
      // Check if the balance changed
      const newBalance = (userData.tickets || 0) / 100;
      if (newBalance !== user.balance) {
        // Update user context with fresh balance
        updateUserData({
          ...user,
          balance: newBalance
        });
      }
      
      // Use the stored QR code or generate a new one
      let qrCode = userData.qr_code;
      
      // If no QR code exists, generate a new one using the standardized format
      if (!qrCode) {
        qrCode = encodeUserData(user.id);
        
        // Store the new QR code in the database
        console.log("Storing new QR code in database:", qrCode);
        await updateDoc(userRef, { 
          qr_code: qrCode 
        });
      }
      
      return qrCode;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      toast.error("Failed to refresh user data");
      // Fallback in case of error
      return encodeUserData(user.id);
    }
  }, [user, updateUserData]);

  // Initial load effect
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      setIsLoading(true);
      
      if (user) {
        // First refresh user data and get QR code data
        const qrData = await refreshUserData();
        
        // Only proceed if component is still mounted
        if (!isMounted) return;
        
        if (qrData) {
          setQrCodeData(qrData);
        }
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    }
    
    loadData();
    
    // Set up automatic refresh interval
    const intervalId = setInterval(() => {
      if (user) refreshUserData().then(qrData => {
        if (qrData && isMounted) {
          setQrCodeData(qrData);
        }
      });
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user, refreshUserData]);

  const handleAddToAppleWallet = async () => {
    if (!user || !qrCodeData) {
      toast.error("User data not available");
      return;
    }
    
    setIsGeneratingPass(true);
    
    try {
      await generateAppleWalletPass(
        user.id,
        user.name,
        user.balance,
        qrCodeData
      );
      
      toast.success("Apple Wallet pass created");
    } catch (error) {
      console.error("Error generating Apple Wallet pass:", error);
      toast.error("Failed to generate Apple Wallet pass");
    } finally {
      setIsGeneratingPass(false);
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
                className={`w-64 h-64 bg-white p-4 rounded-lg shadow-sm mb-6 transition-all duration-300 flex items-center justify-center ${isLoading ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}
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
              
              <AppleWalletButton
                onAddToWallet={handleAddToAppleWallet}
                isDisabled={isGeneratingPass || isLoading}
              />
              
              <p className="text-sm text-muted-foreground text-center mt-4">
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
