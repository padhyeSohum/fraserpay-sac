
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { supabase } from '@/integrations/supabase/client';

// Generate a real QR code as SVG string and data URL
export const generateQRCode = (text: string): string => {
  try {
    // Use data URL format instead of SVG string for better compatibility
    return `data:image/svg+xml,${encodeURIComponent(
      ReactDOMServer.renderToString(
        React.createElement(QRCodeSVG, {
          value: text,
          size: 250,
          bgColor: "#ffffff",
          fgColor: "#000000",
          level: "H",
          includeMargin: true
        })
      )
    )}`;
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
      console.log('Validated QR code for user:', userId);
      return { isValid: true, userId };
    }
    console.log('Invalid QR format:', qrData);
    return { isValid: false };
  } catch (error) {
    console.error('QR validation error:', error);
    return { isValid: false };
  }
};

// Encode user data into QR format
export const encodeUserData = (userId: string): string => {
  const encoded = `USER:${userId}`;
  console.log('Encoded user data for QR:', encoded);
  return encoded;
};

// Get user from QR data
export const getUserFromQRData = async (qrData: string): Promise<any | null> => {
  try {
    const validation = validateQRCode(qrData);
    if (!validation.isValid || !validation.userId) {
      console.error('Invalid QR data:', qrData);
      return null;
    }
    
    const userId = validation.userId;
    console.log('Getting user from QR data, userId:', userId);
    
    // Query Supabase directly instead of using localStorage
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user from Supabase:', error);
      return null;
    }
    
    if (!userData) {
      console.error('No user found with ID:', userId);
      return null;
    }
    
    console.log('Found user from QR data:', userData);
    return userData;
  } catch (error) {
    console.error('Error getting user from QR data:', error);
    return null;
  }
};

// Find user by student number
export const findUserByStudentNumber = async (studentNumber: string): Promise<any | null> => {
  try {
    if (!studentNumber.trim()) {
      console.error('Empty student number provided');
      return null;
    }
    
    console.log('Searching for user with student number:', studentNumber);
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_number', studentNumber)
      .single();
      
    if (error) {
      console.error('Error fetching user by student number:', error);
      return null;
    }
    
    if (!userData) {
      console.error('No user found with student number:', studentNumber);
      return null;
    }
    
    console.log('Found user by student number:', userData);
    return userData;
  } catch (error) {
    console.error('Error finding user by student number:', error);
    return null;
  }
};
