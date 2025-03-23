
import QRCode from "qrcode.react";
import { renderToString } from "react-dom/server";

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

// Generate QR code SVG as string
export const generateQRCode = (data: string): string => {
  try {
    // First try to render the QR code
    const qrCodeString = renderToString(
      <QRCode 
        value={data} 
        size={300}
        level="H"
        includeMargin={true}
        renderAs="svg"
      />
    );
    
    return qrCodeString;
  } catch (e) {
    console.error("Error generating QR code:", e);
    return "";
  }
};
