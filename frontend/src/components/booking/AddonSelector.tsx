'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus } from 'lucide-react';
import { EventAddon } from '@/types/event';
import { useCartStore } from '@/lib/store/cartStore';

interface AddonSelectorProps {
  addons: EventAddon[];
}

export default function AddonSelector({ addons }: AddonSelectorProps) {
  const { addons: cartAddons, addAddon, updateAddonQuantity, removeAddon } = useCartStore();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!addons || addons.length === 0) {
    return null;
  }

  const handleAddonToggle = (addon: EventAddon, checked: boolean) => {
    if (checked) {
      const initialQuantity = 1;
      setQuantities((prev) => ({ ...prev, [addon.id]: initialQuantity }));
      addAddon({
        addon_id: addon.id,
        name: addon.name,
        price: addon.price,
        quantity: initialQuantity,
      });
    } else {
      setQuantities((prev) => {
        const newQuantities = { ...prev };
        delete newQuantities[addon.id];
        return newQuantities;
      });
      removeAddon(addon.id);
    }
  };

  const handleQuantityChange = (addon: EventAddon, change: number) => {
    const currentQuantity = quantities[addon.id] || 0;
    const available = addon.quantity_available - addon.quantity_sold;
    const newQuantity = Math.max(1, Math.min(currentQuantity + change, available));

    if (newQuantity !== currentQuantity) {
      setQuantities((prev) => ({ ...prev, [addon.id]: newQuantity }));
      updateAddonQuantity(addon.id, newQuantity);
    }
  };

  const isAddonSelected = (addonId: string) => {
    return cartAddons.some((a) => a.addon_id === addonId);
  };

  const getAvailableQuantity = (addon: EventAddon) => {
    return addon.quantity_available - addon.quantity_sold;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Add-ons</h2>
        <p className="text-muted-foreground mt-1">Enhance your experience with these optional add-ons</p>
      </div>

      {addons.map((addon) => {
        const available = getAvailableQuantity(addon);
        const quantity = quantities[addon.id] || 0;
        const isSelected = isAddonSelected(addon.id);

        return (
          <Card key={addon.id}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`addon-${addon.id}`}
                  checked={isSelected || addon.is_required}
                  onCheckedChange={(checked) => handleAddonToggle(addon, checked as boolean)}
                  disabled={addon.is_required || available === 0}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <label htmlFor={`addon-${addon.id}`} className="cursor-pointer">
                        <CardTitle className="text-lg">
                          {addon.name}
                          {addon.is_required && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              (Required)
                            </span>
                          )}
                        </CardTitle>
                      </label>
                      <CardDescription className="mt-1">{addon.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        KES {addon.price.toLocaleString()}
                      </p>
                      {available <= 10 && available > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          Only {available} left
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            {isSelected && (
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(addon, -1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-base font-semibold w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(addon, 1)}
                      disabled={quantity >= available}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground ml-auto">
                    Available: {available}
                  </span>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
