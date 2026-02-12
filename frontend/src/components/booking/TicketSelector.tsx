'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus } from 'lucide-react';
import { TicketType } from '@/types/event';
import { useCartStore } from '@/lib/store/cartStore';

interface TicketSelectorProps {
  ticketTypes: TicketType[];
  eventId: string;
}

export default function TicketSelector({ ticketTypes, eventId }: TicketSelectorProps) {
  const { items, addItem, updateItemQuantity, setEvent, clearCart, eventId: cartEventId } = useCartStore();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Set event in cart when eventId changes
  useEffect(() => {
    setEvent(eventId);
  }, [eventId, setEvent]);

  // Sync local quantities state with cart items whenever items change
  useEffect(() => {
    if (items.length > 0) {
      const newQuantities: Record<string, number> = {};
      items.forEach((item) => {
        newQuantities[item.ticket_type_id] = item.quantity;
      });
      setQuantities(newQuantities);
    } else {
      // Clear quantities when cart is empty
      setQuantities({});
    }
  }, [items]);

  const handleQuantityChange = (ticketType: TicketType, change: number) => {
    const currentQuantity = quantities[ticketType.id] || 0;
    const minPurchase = ticketType.min_purchase || 1;
    const maxPurchase = ticketType.max_purchase || 10;
    const available = ticketType.quantity_available - ticketType.quantity_sold;

    const newQuantity = Math.max(
      0,
      Math.min(currentQuantity + change, maxPurchase, available)
    );

    if (newQuantity !== currentQuantity) {
      setQuantities((prev) => ({ ...prev, [ticketType.id]: newQuantity }));

      // Update cart
      if (newQuantity === 0) {
        updateItemQuantity(ticketType.id, 0);
      } else {
        const cartItem = items.find((item) => item.ticket_type_id === ticketType.id);
        if (cartItem) {
          updateItemQuantity(ticketType.id, newQuantity);
        } else {
          addItem({
            ticket_type_id: ticketType.id,
            name: ticketType.name,
            price: ticketType.price,
            quantity: newQuantity,
          });
        }
      }
    }
  };

  const getAvailableQuantity = (ticketType: TicketType) => {
    return ticketType.quantity_available - ticketType.quantity_sold;
  };

  const isTicketAvailable = (ticketType: TicketType) => {
    if (!ticketType.is_active) return false;
    const now = new Date();
    const salesStart = new Date(ticketType.sales_start_date);
    const salesEnd = new Date(ticketType.sales_end_date);
    return now >= salesStart && now <= salesEnd && getAvailableQuantity(ticketType) > 0;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Select Tickets</h2>

      {ticketTypes.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No tickets available for this event</p>
          </CardContent>
        </Card>
      )}

      {ticketTypes.map((ticketType) => {
        const available = getAvailableQuantity(ticketType);
        const quantity = quantities[ticketType.id] || 0;
        const isAvailable = isTicketAvailable(ticketType);
        const minPurchase = ticketType.min_purchase || 1;
        const maxPurchase = ticketType.max_purchase || 10;

        return (
          <Card key={ticketType.id} className={!isAvailable ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{ticketType.name}</CardTitle>
                  <CardDescription className="mt-2">{ticketType.description}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">KES {ticketType.price.toLocaleString()}</p>
                  {available <= 10 && available > 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      Only {available} left!
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!isAvailable ? (
                <div className="text-center py-2">
                  <p className="text-muted-foreground">
                    {!ticketType.is_active
                      ? 'This ticket type is not active'
                      : available === 0
                      ? 'Sold out'
                      : 'Sales period has ended'}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(ticketType, -1)}
                      disabled={quantity <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(ticketType, 1)}
                      disabled={quantity >= Math.min(maxPurchase, available)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Min: {minPurchase} | Max: {maxPurchase}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
