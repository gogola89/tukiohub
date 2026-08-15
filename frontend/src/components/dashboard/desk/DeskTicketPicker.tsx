'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus } from 'lucide-react';
import { TicketType } from '@/types/event';

interface DeskTicketPickerProps {
  ticketTypes: TicketType[];
  quantities: Record<string, number>;
  onChange: (ticketTypeId: string, quantity: number) => void;
}

function isOnSale(ticketType: TicketType): boolean {
  if (!ticketType.is_active) return false;
  const now = new Date();
  return now >= new Date(ticketType.sales_start_date) && now <= new Date(ticketType.sales_end_date);
}

export default function DeskTicketPicker({ ticketTypes, quantities, onChange }: DeskTicketPickerProps) {
  return (
    <div className="space-y-3">
      {ticketTypes.length === 0 && (
        <p className="text-center text-muted-foreground py-6">
          This event has no ticket types set up yet.
        </p>
      )}

      {ticketTypes.map((ticketType) => {
        const available = ticketType.quantity_available - ticketType.quantity_sold;
        const quantity = quantities[ticketType.id] || 0;
        const maxPurchase = ticketType.max_purchase || 10;
        const onSale = isOnSale(ticketType);
        const disabled = !onSale || available <= 0;

        return (
          <Card key={ticketType.id} className={disabled ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{ticketType.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {disabled ? 'Not available' : `${available} left`}
                  </p>
                </div>
                <p className="text-lg font-bold">KES {ticketType.price.toLocaleString()}</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onChange(ticketType.id, Math.max(0, quantity - 1))}
                  disabled={disabled || quantity <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold w-10 text-center">{quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onChange(ticketType.id, Math.min(maxPurchase, available, quantity + 1))}
                  disabled={disabled || quantity >= Math.min(maxPurchase, available)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
