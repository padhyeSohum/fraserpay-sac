
import { supabase } from '@/integrations/supabase/client';

// Generate a QR code synchronously to avoid Promise issues
export const generateQRCode = (text: string): string => {
  try {
    // We're using a third-party API to generate QR codes
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    return apiUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

// Validate a QR code
export const validateQRCode = (qrData: string): { isValid: boolean; userId?: string } => {
  try {
    // Decode the data
    if (qrData.startsWith('USER:')) {
      const userId = qrData.replace('USER:', '');
      return { isValid: true, userId };
    }
    return { isValid: false };
  } catch (error) {
    console.error('QR validation error:', error);
    return { isValid: false };
  }
};

// Encode user data into QR format
export const encodeUserData = (userId: string): string => {
  return `USER:${userId}`;
};

// Get user from QR data
export const getUserFromQRData = async (qrData: string): Promise<any | null> => {
  try {
    const validation = validateQRCode(qrData);
    if (!validation.isValid || !validation.userId) {
      return null;
    }
    
    const userId = validation.userId;
    
    // Get user data from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting user from QR data:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user from QR data:', error);
    return null;
  }
};
