'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/lib/store/cartStore';
import { Receipt } from 'lucide-react';

interface OrderSummaryProps {
  showTitle?: boolean;
}

export default function OrderSummary({ showTitle = true }: OrderSummaryProps) {
  const { items, addons, promoCode, discount, getSubtotal, getTotal } = useCartStore();

  const subtotal = getSubtotal();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No items in cart. Please select tickets to continue.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        {showTitle && (
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <CardTitle>Order Summary</CardTitle>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ticket Items */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground">Tickets</h4>
          {items.map((item) => (
            <div key={item.ticket_type_id} className="flex justify-between text-sm">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">
                  KES {item.price.toLocaleString()} x {item.quantity}
                </p>
              </div>
              <p className="font-semibold">
                KES {(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Add-on Items */}
        {addons.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">Add-ons</h4>
              {addons.map((addon) => (
                <div key={addon.addon_id} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{addon.name}</p>
                    <p className="text-muted-foreground">
                      KES {addon.price.toLocaleString()} x {addon.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    KES {(addon.price * addon.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        <Separator />

        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <p className="text-muted-foreground">Subtotal</p>
          <p className="font-semibold">KES {subtotal.toLocaleString()}</p>
        </div>

        {/* Promo Code Discount */}
        {promoCode && discount > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
            <p>
              Discount <span className="font-mono text-xs">({promoCode})</span>
            </p>
            <p className="font-semibold">- KES {discount.toLocaleString()}</p>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold">Total</p>
          <p className="text-2xl font-bold">KES {total.toLocaleString()}</p>
        </div>

        {/* Items count */}
        <p className="text-xs text-muted-foreground text-center">
          {items.reduce((sum, item) => sum + item.quantity, 0)} ticket(s)
          {addons.length > 0 && ` + ${addons.reduce((sum, addon) => sum + addon.quantity, 0)} add-on(s)`}
        </p>
      </CardContent>
    </Card>
  );
}
