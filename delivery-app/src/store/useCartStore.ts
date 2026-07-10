import { create } from 'zustand';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (item) => {
    const { items } = get();
    const existingItem = items.find((i) => i.productId === item.productId);
    
    if (existingItem) {
      set({
        items: items.map((i) => 
          i.productId === item.productId 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      });
    } else {
      set({ items: [...items, item] });
    }
  },
  
  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
  },
  
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set({
      items: get().items.map((i) => i.id === id ? { ...i, quantity } : i)
    });
  },
  
  clearCart: () => set({ items: [] }),
  
  getTotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
