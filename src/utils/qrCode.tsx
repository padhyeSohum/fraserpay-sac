
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';

// Encode user data to QR code format - ensure consistent formatting
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

// Validate QR code data with improved detection and logging
export const validateQRCode = (qrData: string) => {
  console.log('Validating QR code data:', qrData);
  
  if (!qrData || typeof qrData !== 'string') {
    console.error('Invalid QR code: empty or not a string');
    return { isValid: false, userId: null, type: 'unknown' };
  }
  
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
  
  console.error('Invalid QR code format:', qrData);
  // Default case - invalid QR code
  return { isValid: false, userId: null, type: 'unknown' };
};

// Get user data from QR code data with better error handling
export const getUserFromQRData = async (qrData: string) => {
  console.log('Getting user from QR data:', qrData);
  
  if (!qrData) {
    console.error('Empty QR data provided');
    return null;
  }
  
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
        
        // If the error is that no rows were returned, try an alternative lookup
        if (error.code === 'PGRST116') {
          console.log('No user found with ID, trying alternative lookup methods');
          
          // Try looking up by student number if it looks like a student number
          if (/^\d+$/.test(validation.userId)) {
            const { data: studentData, error: studentError } = await supabase
              .from('users')
              .select('*')
              .eq('student_number', validation.userId)
              .single();
              
            if (!studentError && studentData) {
              console.log('Found user by student number:', studentData);
              return studentData;
            }
          }
        }
        
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
  console.log('Looking up user by student number:', studentNumber);
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_number', studentNumber)
      .single();
    
    if (error) {
      console.error('Error finding user by student number:', error);
      throw error;
    }
    
    console.log('User found by student number:', data);
    return data;
  } catch (error) {
    console.error('Error finding user by student number:', error);
    return null;
  }
};

export default QRCodeComponent;
