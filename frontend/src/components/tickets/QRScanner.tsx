'use client';

import { useState } from 'react';
import { Scanner, type IDetectedBarcode, type IScannerError } from '@yudiel/react-qr-scanner';
import { Card } from '@/components/ui/card';
import { CameraOff } from 'lucide-react';

interface QRScannerProps {
  onScan: (ticketCode: string) => void;
  paused?: boolean;
}

const CAMERA_ERROR_MESSAGES: Record<IScannerError['kind'], string> = {
  'permission-denied': 'Camera access was denied. Allow camera permission in your browser to scan tickets.',
  'no-camera': 'No camera was found on this device.',
  'in-use': 'The camera is already in use by another application.',
  overconstrained: 'No camera matches the required settings.',
  'insecure-context': 'Camera scanning requires HTTPS (or localhost).',
  unsupported: 'QR scanning is not supported in this browser.',
  aborted: 'Camera access was interrupted.',
  security: 'Camera access was blocked for security reasons.',
  'type-error': 'Something went wrong starting the camera.',
  unknown: 'Something went wrong starting the camera.',
};

/**
 * Camera-based QR scanner for ticket codes. Falls back to a clear error
 * message (manual code entry remains available alongside this component).
 */
export default function QRScanner({ onScan, paused = false }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    const value = detectedCodes[0]?.rawValue;
    if (value) {
      onScan(value.trim());
    }
  };

  const handleError = (scannerError: IScannerError) => {
    setError(CAMERA_ERROR_MESSAGES[scannerError.kind] ?? CAMERA_ERROR_MESSAGES.unknown);
  };

  if (error) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center text-center gap-2 bg-gray-50">
        <CameraOff className="w-8 h-8 text-gray-400" />
        <p className="text-sm text-gray-600">{error}</p>
        <p className="text-xs text-gray-500">Use the ticket code field below instead.</p>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Scanner
        onScan={handleScan}
        onError={handleError}
        paused={paused}
        formats={['qr_code']}
        constraints={{ facingMode: 'environment' }}
        scanDelay={500}
        styles={{ container: { width: '100%' } }}
      />
    </div>
  );
}
