// 📄 /home/hope/Desktop/reactNative/client/Blue_Injera/blue_injera_ordering/store/Cart.store.ts

import { CartCustomization, CartStore } from '@/type';
import { create } from 'zustand';

function areCustomizationsEqual(
  a: CartCustomization[] = [],
  b: CartCustomization[] = []
): boolean {
  if (a.length !== b.length) return false;

  const aSorted = [...a].sort((x, y) => x.id.localeCompare(y.id));
  const bSorted = [...b].sort((x, y) => x.id.localeCompare(y.id));

  return aSorted.every((item, idx) => item.id === bSorted[idx].id);
}

export const useCartStore = create<CartStore>((set, get) => ({
  // 🔹 Core state
  items: [],
  loyaltyDiscount: 0, // 0% by default (0 = 0%, 5 = 5%, etc.)

  // 🔹 Cart actions (existing — preserved)
  addItem: (item) => {
    const customizations = item.customizations ?? [];
    const existing = get().items.find(
      (i) =>
        i.id === item.id &&
        areCustomizationsEqual(i.customizations ?? [], customizations)
    );

    if (existing) {
      set({
        items: get().items.map((i) =>
          i.id === item.id &&
          areCustomizationsEqual(i.customizations ?? [], customizations)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({
        items: [...get().items, { ...item, quantity: 1, customizations }],
      });
    }
  },

  removeItem: (id, customizations = []) => {
    set({
      items: get().items.filter(
        (i) =>
          !(
            i.id === id &&
            areCustomizationsEqual(i.customizations ?? [], customizations)
          )
      ),
    });
  },

  increaseQty: (id, customizations = []) => {
    set({
      items: get().items.map((i) =>
        i.id === id &&
        areCustomizationsEqual(i.customizations ?? [], customizations)
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ),
    });
  },

  decreaseQty: (id, customizations = []) => {
    set({
      items: get()
        .items.map((i) =>
          i.id === id &&
          areCustomizationsEqual(i.customizations ?? [], customizations)
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter((i) => i.quantity > 0),
    });
  },

  clearCart: () => set({ items: [] }),

  // 🔹 Loyalty action (new)
  setLoyaltyDiscount: (discount: number) => set({ loyaltyDiscount: discount }),

  // 🔹 Selectors (updated)
  getTotalItems: () =>
    get().items.reduce((total, item) => total + item.quantity, 0),

  getTotalPrice: () => {
    // 🔹 Subtotal — before discount
    return get().items.reduce((total, item) => {
      const base = item.price;
      const customPrice = item.customizations?.reduce((s, c) => s + c.price, 0) ?? 0;
      return total + item.quantity * (base + customPrice);
    }, 0);
  },

  // 🔹 NEW: Total after discount + delivery (for checkout)
  getDiscountedTotal: (deliveryFee: number = 5) => {
    const subtotal = get().getTotalPrice();
    const discount = (subtotal * get().loyaltyDiscount) / 100;
    return subtotal + deliveryFee - discount;
  },

  // 🔹 Optional: Helper for UI (e.g., "Save $2.50 with loyalty")
  getLoyaltySavings: (deliveryFee: number = 5) => {
    const subtotal = get().getTotalPrice();
    return (subtotal * get().loyaltyDiscount) / 100;
  },
}));