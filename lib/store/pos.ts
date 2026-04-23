import { createStore } from "zustand/vanilla";

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  products: { name: string };
}

export interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  order_items: OrderItem[];
}

export interface PosState {
  cart: CartLine[];
  addToCart: (product: { id: string; name: string; price: number }) => void;
  removeFromCart: (productId: string) => void;
  setCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  restoreCart: (lines: CartLine[]) => void;

  orders: Order[];
  initOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  replaceOrder: (tempId: string, order: Order) => void;
  updateOrders: (updater: (prev: Order[]) => Order[]) => void;
}

export type PosStore = ReturnType<typeof createPosStore>;

export function createPosStore() {
  return createStore<PosState>()((set) => ({
    cart: [],

    addToCart: (product) =>
      set((state) => {
        const existing = state.cart.find((l) => l.productId === product.id);
        if (existing) {
          return {
            cart: state.cart.map((l) =>
              l.productId === product.id
                ? { ...l, quantity: l.quantity + 1 }
                : l,
            ),
          };
        }
        return {
          cart: [
            ...state.cart,
            {
              productId: product.id,
              name: product.name,
              unitPrice: product.price,
              quantity: 1,
            },
          ],
        };
      }),

    removeFromCart: (productId) =>
      set((state) => ({
        cart: state.cart.filter((l) => l.productId !== productId),
      })),

    setCartQuantity: (productId, quantity) =>
      set((state) => ({
        cart: state.cart.map((l) =>
          l.productId === productId ? { ...l, quantity } : l,
        ),
      })),

    clearCart: () => set({ cart: [] }),

    restoreCart: (lines) => set({ cart: lines }),

    orders: [],

    initOrders: (orders) => set({ orders }),

    addOrder: (order) =>
      set((state) => ({
        orders: state.orders.some((o) => o.id === order.id)
          ? state.orders
          : [...state.orders, order],
      })),

    removeOrder: (orderId) =>
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== orderId),
      })),

    replaceOrder: (tempId, order) =>
      set((state) => {
        if (state.orders.some((o) => o.id === order.id)) {
          return { orders: state.orders.filter((o) => o.id !== tempId) };
        }
        return {
          orders: state.orders.map((o) => (o.id === tempId ? order : o)),
        };
      }),

    updateOrders: (updater) =>
      set((state) => ({ orders: updater(state.orders) })),
  }));
}
