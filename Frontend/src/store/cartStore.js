import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';

// Cart item shape: { productId, variantId, name, price, image, color, size, quantity, stock }
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        const key = `${item.productId}-${item.variantId}`;
        const existing = items.find((i) => `${i.productId}-${i.variantId}` === key);

        if (existing) {
          const newQty = existing.quantity + (item.quantity ?? 1);
          if (item.stock != null && newQty > item.stock) {
            toast.error(`Only ${item.stock} in stock`);
            return;
          }
          set({ items: items.map((i) => `${i.productId}-${i.variantId}` === key ? { ...i, quantity: newQty } : i) });
        } else {
          set({ items: [...items, { ...item, quantity: item.quantity ?? 1 }] });
        }
        toast.success('Added to cart');
      },

      removeItem: (productId, variantId) => {
        set({ items: get().items.filter((i) => !(i.productId === productId && i.variantId === variantId)) });
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity < 1) { get().removeItem(productId, variantId); return; }
        const key = `${productId}-${variantId}`;
        set({ items: get().items.map((i) => `${i.productId}-${i.variantId}` === key ? { ...i, quantity } : i) });
      },

      clearCart: () => set({ items: [] }),

      // Computed values
      count:    () => get().items.reduce((s, i) => s + i.quantity, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      total:    (shipping = 0, discount = 0) => Math.max(0, get().subtotal() + shipping - discount),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
