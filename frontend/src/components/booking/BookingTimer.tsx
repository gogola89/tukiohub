'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';

interface BookingTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export default function BookingTimer({ expiresAt, onExpire }: BookingTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setHasExpired(true);
        setTimeLeft(0);
        if (onExpire) {
          onExpire();
        }
        return 0;
      }

      return difference;
    };

    // Initial calculation
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft > 0 && timeLeft < 2 * 60 * 1000; // Less than 2 minutes

  if (hasExpired) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Your booking has expired. Please start over.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant={isWarning ? 'destructive' : 'default'} className={isWarning ? '' : 'border-blue-200 bg-blue-50 dark:bg-blue-950'}>
      <Clock className="h-4 w-4" />
      <AlertDescription>
        {isWarning ? (
          <span className="font-semibold">
            Hurry! Your reservation expires in {formatTime(timeLeft)}
          </span>
        ) : (
          <span>
            Your reservation expires in <span className="font-semibold">{formatTime(timeLeft)}</span>
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}
