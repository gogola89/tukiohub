'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Loader2, Tag, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useAttendeeAuthStore } from '@/lib/store/attendeeAuthStore';
import { useValidatePromoCode } from '@/lib/hooks/useBooking';
import { toast } from 'react-hot-toast';

interface PromoCodeInputProps {
  eventId: string;
}

export default function PromoCodeInput({ eventId }: PromoCodeInputProps) {
  const { items, promoCode, discount, applyPromoCode, removePromoCode, getSubtotal } = useCartStore();
  const { attendee, isAuthenticated } = useAttendeeAuthStore();
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const validatePromo = useValidatePromoCode();

  const hasItems = items.length > 0;

  // Auto-remove promo code when cart becomes empty
  useEffect(() => {
    if (!hasItems && promoCode) {
      removePromoCode();
    }
  }, [hasItems, promoCode, removePromoCode]);

  const handleApply = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter a promo code');
      return;
    }

    // Clear previous error
    setErrorMessage('');

    const subtotal = getSubtotal();

    try {
      const result = await validatePromo.mutateAsync({
        eventId,
        promoCode: code.toUpperCase(),
        attendeeEmail: isAuthenticated && attendee ? attendee.email : undefined,
      });

      if (result.valid) {
        // Calculate discount amount
        let discountAmount = 0;
        if (result.discount_type === 'PERCENTAGE') {
          discountAmount = (subtotal * result.discount_value) / 100;
        } else {
          discountAmount = result.discount_value;
        }

        applyPromoCode(code.toUpperCase(), discountAmount);
        toast.success(
          `Promo code applied! You saved KES ${discountAmount.toLocaleString()}`
        );
        setCode('');
        setErrorMessage('');
      } else {
        // Code is invalid - show inline error message
        const message = result.message || 'Invalid promo code';
        setErrorMessage(message);
      }
    } catch (error: any) {
      // Extract error message from response
      const errorData = error?.response?.data;
      const message = errorData?.message || errorData?.error || error?.message || 'Failed to validate promo code';
      setErrorMessage(message);
    }
  };

  const handleRemove = () => {
    removePromoCode();
    setCode('');
    setErrorMessage('');
    toast.success('Promo code removed');
  };

  const handleCodeChange = (value: string) => {
    setCode(value.toUpperCase());
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Promo Code</h3>
          </div>

          {!hasItems && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 border border-muted rounded-md">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Add tickets to use a promo code
              </p>
            </div>
          )}

          {hasItems && (
            <>
              {promoCode ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">{promoCode}</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        You saved KES {discount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemove}
                    className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={code}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !validatePromo.isPending) {
                          handleApply();
                        }
                      }}
                      className={`uppercase ${errorMessage ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      disabled={validatePromo.isPending}
                    />
                    <Button
                      onClick={handleApply}
                      disabled={!code.trim() || validatePromo.isPending}
                    >
                      {validatePromo.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Validating
                        </>
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  {errorMessage && (
                    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>{errorMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
