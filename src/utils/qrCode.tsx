
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';

// Encode user data to QR code format
export const encodeUserData = (userId: string) => {
  return `USER:${userId}`;
};

// Generate QR code URL for a given data string
export const generateQRCode = (data: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
};

// QR Code component for rendering QR codes
export const QRCodeComponent = ({ value, size = 200 }: { value: string, size?: number }) => {
  return <QRCodeSVG value={value} size={size} />;
};

// Validate QR code data
export const validateQRCode = (qrData: string) => {
  console.log('Validating QR code:', qrData);
  
  // Check if it's a user QR code (case-insensitive)
  if (qrData.toUpperCase().startsWith('USER:')) {
    const userId = qrData.slice(5); // Remove 'USER:' prefix
    console.log('Found USER: format QR code with ID:', userId);
    return { isValid: true, userId, type: 'user' };
  }
  
  // If QR code data is a UUID, treat it as a user ID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(qrData)) {
    console.log('Found UUID format QR code:', qrData);
    return { isValid: true, userId: qrData, type: 'uuid' };
  }
  
  console.log('Invalid QR code format:', qrData);
  // Default case - invalid QR code
  return { isValid: false, userId: null, type: 'unknown' };
};

// Get user data from QR code data
export const getUserFromQRData = async (qrData: string) => {
  console.log('Getting user from QR data:', qrData);
  const validation = validateQRCode(qrData);
  
  if (validation.isValid && validation.userId) {
    try {
      console.log('Querying Supabase for user ID:', validation.userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', validation.userId)
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('User data found:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user from QR data:', error);
      return null;
    }
  }
  
  return null;
};

// Find user by student number
export const findUserByStudentNumber = async (studentNumber: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_number', studentNumber)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error finding user by student number:', error);
    return null;
  }
};

export default QRCodeComponent;
