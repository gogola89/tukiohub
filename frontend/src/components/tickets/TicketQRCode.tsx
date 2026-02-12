'use client';

import { QRCodeSVG } from 'qrcode.react';

interface TicketQRCodeProps {
  ticketCode: string;
  size?: number;
}

/**
 * TicketQRCode component
 * Displays a QR code for a ticket using the ticket code
 */
export default function TicketQRCode({ ticketCode, size = 200 }: TicketQRCodeProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
      <QRCodeSVG
        value={ticketCode}
        size={size}
        level="H"
        includeMargin={true}
        className="border-4 border-gray-200 rounded-lg"
      />
      <p className="mt-3 text-sm font-mono font-semibold text-gray-700">
        {ticketCode}
      </p>
    </div>
  );
}
