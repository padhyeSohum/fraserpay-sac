
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const encodeUserData = (userId: string) => {
  return `user:${userId}`;
}

export const generateQRCode = (data: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}

export const QRCodeComponent = ({ value, size = 200 }: { value: string, size?: number }) => {
  return <QRCodeSVG value={value} size={size} />;
}

export default QRCodeComponent;
