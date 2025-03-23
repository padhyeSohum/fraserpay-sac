
import QRCode from "qrcode.react";
import { renderToString } from "react-dom/server";
import { supabase } from "@/integrations/supabase/client";

export interface UserData {
  id: string;
  name?: string;
  studentNumber?: string;
  balance?: number;
}

// Simple base64 encoding to obscure the data but not fully encrypt it
export const encodeUserData = (userId: string): string => {
  try {
    return btoa(userId);
  } catch (e) {
    console.error("Error encoding user data:", e);
    return userId;
  }
};

// Decode the encoded user data
export const decodeUserData = (encodedData: string): string => {
  try {
    return atob(encodedData);
  } catch (e) {
    console.error("Error decoding user data:", e);
    return encodedData;
  }
};

// Validate a QR code string
export const validateQRCode = (qrData: string): { isValid: boolean; userId?: string } => {
  try {
    // Try to decode the data
    const decodedData = decodeUserData(qrData);
    return { isValid: true, userId: decodedData };
  } catch (e) {
    console.error("Error validating QR code:", e);
    return { isValid: false };
  }
};

// Generate QR code SVG as string
export const generateQRCode = (data: string): string => {
  try {
    // First try to render the QR code
    const qrCodeString = renderToString(
      QRCode({
        value: data,
        size: 300,
        level: "H",
        includeMargin: true,
        renderAs: "svg"
      })
    );
    
    return qrCodeString;
  } catch (e) {
    console.error("Error generating QR code:", e);
    return "";
  }
};

// Find a user by their QR code data
export const getUserFromQRData = async (qrData: string): Promise<any | null> => {
  try {
    const validation = validateQRCode(qrData);
    if (!validation.isValid || !validation.userId) {
      return null;
    }
    
    const userId = validation.userId;
    
    // Get user by ID
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !userData) {
      console.error('Error getting user from QR data:', error);
      return null;
    }
    
    return userData;
  } catch (error) {
    console.error('Error in getUserFromQRData:', error);
    return null;
  }
};

// Find a user by their student number
export const findUserByStudentNumber = async (studentNumber: string): Promise<any | null> => {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_number', studentNumber)
      .single();
    
    if (error || !userData) {
      console.error('Error finding user by student number:', error);
      return null;
    }
    
    return userData;
  } catch (error) {
    console.error('Error in findUserByStudentNumber:', error);
    return null;
  }
};
