
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Generate a real QR code as base64 data URL
export const generateQRCode = (text: string): string => {
  const qrCode = ReactDOMServer.renderToString(
    React.createElement(QRCodeSVG, {
      value: text,
      size: 250,
      bgColor: "#ffffff",
      fgColor: "#000000",
      level: "H",
      includeMargin: true
    })
  );
  
  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrCode)}`;
  return dataUrl;
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
export const getUserFromQRData = (qrData: string): any | null => {
  try {
    const validation = validateQRCode(qrData);
    if (!validation.isValid || !validation.userId) {
      return null;
    }
    
    const userId = validation.userId;
    const usersStr = localStorage.getItem('users');
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    return users.find((u: any) => u.id === userId) || null;
  } catch (error) {
    console.error('Error getting user from QR data:', error);
    return null;
  }
};
