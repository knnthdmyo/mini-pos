import { createStore } from "zustand/vanilla";

export interface CartLine {
  productId: string;
  variantId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderItem {
  product_id: string;
  variant_id?: string | null;
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

/** Composite key for cart lines: productId or productId::variantId */
function cartKey(productId: string, variantId: string | null): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

function lineKey(line: CartLine): string {
  return cartKey(line.productId, line.variantId);
}

export interface PosState {
  cart: CartLine[];
  addToCart: (product: {
    id: string;
    variantId?: string | null;
    name: string;
    price: number;
  }) => void;
  removeFromCart: (productId: string, variantId?: string | null) => void;
  setCartQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null,
  ) => void;
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
        const vid = product.variantId ?? null;
        const key = cartKey(product.id, vid);
        const existing = state.cart.find((l) => lineKey(l) === key);
        if (existing) {
          return {
            cart: state.cart.map((l) =>
              lineKey(l) === key ? { ...l, quantity: l.quantity + 1 } : l,
            ),
          };
        }
        return {
          cart: [
            ...state.cart,
            {
              productId: product.id,
              variantId: vid,
              name: product.name,
              unitPrice: product.price,
              quantity: 1,
            },
          ],
        };
      }),

    removeFromCart: (productId, variantId) =>
      set((state) => {
        const key = cartKey(productId, variantId ?? null);
        return { cart: state.cart.filter((l) => lineKey(l) !== key) };
      }),

    setCartQuantity: (productId, quantity, variantId) =>
      set((state) => {
        const key = cartKey(productId, variantId ?? null);
        return {
          cart: state.cart.map((l) =>
            lineKey(l) === key ? { ...l, quantity } : l,
          ),
        };
      }),

    clearCart: () => set({ cart: [] }),

    restoreCart: (lines) => set({ cart: lines }),

    orders: [],

    initOrders: (orders) =>
      set((state) => {
        const existingIds = new Set(state.orders.map((o) => o.id));
        const merged = [
          ...state.orders,
          ...orders.filter((o) => !existingIds.has(o.id)),
        ];
        return { orders: merged };
      }),

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
