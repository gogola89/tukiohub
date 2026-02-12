'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, ArrowDown, CheckCircle } from 'lucide-react';

interface WalletPaymentConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  currentBalance: number;
  onConfirm: () => void;
  isProcessing: boolean;
}

export default function WalletPaymentConfirmation({
  open,
  onOpenChange,
  amount,
  currentBalance,
  onConfirm,
  isProcessing,
}: WalletPaymentConfirmationProps) {
  const newBalance = currentBalance - amount;
  const hasInsufficientBalance = newBalance < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <DialogTitle>Confirm Wallet Payment</DialogTitle>
          </div>
          <DialogDescription>
            Please review the payment details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Amount */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-600">Payment Amount</p>
            <p className="text-3xl font-bold text-primary">
              KES {amount.toLocaleString()}
            </p>
          </div>

          {/* Balance Calculation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">Current Balance</p>
                <p className="text-lg font-semibold">
                  KES {currentBalance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowDown className="h-5 w-5 text-gray-400" />
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${
              hasInsufficientBalance ? 'bg-red-50' : 'bg-green-50'
            }`}>
              <div>
                <p className="text-xs text-gray-600">New Balance</p>
                <p className={`text-lg font-semibold ${
                  hasInsufficientBalance ? 'text-red-600' : 'text-green-600'
                }`}>
                  KES {newBalance.toLocaleString()}
                </p>
              </div>
              {!hasInsufficientBalance && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>

          {/* Warning for insufficient balance */}
          {hasInsufficientBalance && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-medium">
                Insufficient Balance
              </p>
              <p className="text-xs text-red-800 mt-1">
                You need KES {Math.abs(newBalance).toLocaleString()} more to complete this payment.{' '}
                <a href="/profile" className="underline font-medium">
                  Add funds to your wallet
                </a>
              </p>
            </div>
          )}

          {/* Payment Information */}
          {!hasInsufficientBalance && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> The payment will be instant and cannot be reversed.
                Your tickets will be generated automatically after confirmation.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={hasInsufficientBalance || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              <>Confirm Payment</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
