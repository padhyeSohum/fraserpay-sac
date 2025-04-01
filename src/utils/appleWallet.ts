
import { firestore } from '@/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

// Helper function to check if the device is iOS
export const isIOSDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor;
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
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
    // For client-side demo purposes, create a formatted data object
    const passData = {
      userId,
      userName,
      balance: balance.toFixed(2),
      qrCodeData
    };
    
    console.log("Generating Apple Wallet pass with data:", passData);
    
    // Create a download blob with the pass data
    // In a real implementation, this would call a secure backend endpoint
    // that would generate the properly signed .pkpass file
    
    // For demonstration purposes - create a simple text representation
    // that mimics what the pass would contain
    const passContent = `
FraserPay Digital Pass
----------------------
Name: ${userName}
Balance: $${balance.toFixed(2)}
User ID: ${userId}
QR Code Data: ${qrCodeData}

This is a demonstration pass for FraserPay. 
In a production environment, this would be a properly signed .pkpass file.
    `.trim();
    
    // Create a blob that can be downloaded
    const blob = new Blob([passContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraserpay-${userId}.pkpass`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log("Pass generation completed successfully");
  } catch (error) {
    console.error('Error generating Apple Wallet pass:', error);
    throw error;
  }
};
