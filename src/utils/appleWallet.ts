
import { Template, Pass } from 'passkit-generator';
import { firestore } from '@/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

// Helper function to check if the device is iOS
export const isIOSDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor;
  return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
};

// Helper function to check if browser is Safari
export const isSafari = (): boolean => {
  const userAgent = navigator.userAgent;
  return userAgent.includes('Safari') && !userAgent.includes('Chrome');
};

// Check if the device supports Apple Wallet
export const supportsAppleWallet = (): boolean => {
  return isIOSDevice() && isSafari();
};

// Generate and download Apple Wallet pass
export const generateAppleWalletPass = async (
  userId: string,
  userName: string,
  balance: number,
  qrCodeData: string
): Promise<void> => {
  try {
    // The pass is actually created on the server side since we need private keys
    // For client-side demo purposes, we'll create a pre-formatted URL with all the data
    const passData = {
      userId,
      userName,
      balance: balance.toFixed(2),
      qrCodeData
    };
    
    // In a real implementation, this would call a secure backend endpoint
    // that would generate the .pkpass file with proper signatures
    
    // Create a download blob with a placeholder message
    const apiUrl = `https://api.passkit-generator.example.com/generate-pass`;
    
    // This is a placeholder - in a real app, you would call your secure backend
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate Apple Wallet pass');
    }
    
    // For demonstration purposes only - this simulates downloading a .pkpass file
    // In a real application, you would return the actual .pkpass file from your server
    const blob = new Blob([
      `This is a placeholder for the Apple Wallet pass for ${userName}. 
      In a real implementation, this would be a properly signed .pkpass file.`
    ], { type: 'application/vnd.apple.pkpass' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraserpay-${userId}.pkpass`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error generating Apple Wallet pass:', error);
    throw error;
  }
};
