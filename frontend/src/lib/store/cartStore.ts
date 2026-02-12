import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartTicketItem {
  ticket_type_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartAddonItem {
  addon_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  eventId: string | null;
  items: CartTicketItem[];
  addons: CartAddonItem[];
  promoCode: string | null;
  discount: number;

  setEvent: (eventId: string) => void;
  addItem: (item: CartTicketItem) => void;
  removeItem: (ticketTypeId: string) => void;
  updateItemQuantity: (ticketTypeId: string, quantity: number) => void;
  addAddon: (addon: CartAddonItem) => void;
  removeAddon: (addonId: string) => void;
  updateAddonQuantity: (addonId: string, quantity: number) => void;
  applyPromoCode: (code: string, discount: number) => void;
  removePromoCode: () => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      eventId: null,
      items: [],
      addons: [],
      promoCode: null,
      discount: 0,

      setEvent: (eventId) => set({ eventId }),

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find((i) => i.ticket_type_id === item.ticket_type_id);

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.ticket_type_id === item.ticket_type_id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, item] });
        }
      },

      removeItem: (ticketTypeId) =>
        set((state) => ({
          items: state.items.filter((i) => i.ticket_type_id !== ticketTypeId),
        })),

      updateItemQuantity: (ticketTypeId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(ticketTypeId);
        } else {
          set((state) => ({
            items: state.items.map((i) =>
              i.ticket_type_id === ticketTypeId ? { ...i, quantity } : i
            ),
          }));
        }
      },

      addAddon: (addon) => {
        const { addons } = get();
        const existingAddon = addons.find((a) => a.addon_id === addon.addon_id);

        if (existingAddon) {
          set({
            addons: addons.map((a) =>
              a.addon_id === addon.addon_id
                ? { ...a, quantity: a.quantity + addon.quantity }
                : a
            ),
          });
        } else {
          set({ addons: [...addons, addon] });
        }
      },

      removeAddon: (addonId) =>
        set((state) => ({
          addons: state.addons.filter((a) => a.addon_id !== addonId),
        })),

      updateAddonQuantity: (addonId, quantity) => {
        if (quantity <= 0) {
          get().removeAddon(addonId);
        } else {
          set((state) => ({
            addons: state.addons.map((a) =>
              a.addon_id === addonId ? { ...a, quantity } : a
            ),
          }));
        }
      },

      applyPromoCode: (code, discount) =>
        set({ promoCode: code, discount }),

      removePromoCode: () =>
        set({ promoCode: null, discount: 0 }),

      clearCart: () =>
        set({
          eventId: null,
          items: [],
          addons: [],
          promoCode: null,
          discount: 0,
        }),

      getSubtotal: () => {
        const { items, addons } = get();
        const itemsTotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const addonsTotal = addons.reduce(
          (sum, addon) => sum + addon.price * addon.quantity,
          0
        );
        return itemsTotal + addonsTotal;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const { discount } = get();
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: 'tukiohub-cart-storage',
    }
  )
);
