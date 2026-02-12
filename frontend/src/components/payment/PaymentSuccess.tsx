'use client';

import { CheckCircle2, Mail, Download, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface PaymentSuccessProps {
  bookingReference: string;
  amount: number;
  mpesaReceiptNumber?: string;
  transactionReference?: string;
}

export default function PaymentSuccess({
  bookingReference,
  amount,
  mpesaReceiptNumber,
  transactionReference,
}: PaymentSuccessProps) {
  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-green-600">Payment Successful!</h1>
          <p className="text-lg text-gray-600">
            Your payment of <span className="font-semibold">KES {amount.toLocaleString()}</span> has been received
          </p>
        </div>

        <div className="w-full bg-gray-50 rounded-lg p-6 space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Booking Reference</span>
            <span className="font-mono font-semibold">{bookingReference}</span>
          </div>

          {mpesaReceiptNumber && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">M-Pesa Receipt</span>
              <span className="font-mono font-semibold text-green-700">{mpesaReceiptNumber}</span>
            </div>
          )}

          {transactionReference && (
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Transaction Reference</span>
              <span className="font-mono text-sm">{transactionReference}</span>
            </div>
          )}
        </div>

        <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Email Confirmation Sent</p>
              <p className="text-sm text-blue-800">
                Your tickets have been sent to your email address. Please check your inbox.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">
          <Link href={`/booking/${bookingReference}`} className="block">
            <Button className="w-full h-12" size="lg">
              <Ticket className="w-5 h-5 mr-2" />
              View My Tickets
            </Button>
          </Link>

          <Link href="/events" className="block">
            <Button variant="outline" className="w-full h-12" size="lg">
              Browse More Events
            </Button>
          </Link>
        </div>

        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>Thank you for your purchase!</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </Card>
  );
}
