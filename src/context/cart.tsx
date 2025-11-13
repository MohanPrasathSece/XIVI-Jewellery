import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

interface CartItem {
  id: number | string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { id: CartItem["id"] } }
  | { type: "UPDATE_QUANTITY"; payload: { id: CartItem["id"]; quantity: number } }
  | { type: "CLEAR" };

interface CartState {
  items: CartItem[];
}

const STORAGE_KEY = "lumi-cart";

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingIndex = state.items.findIndex((item) => item.id === action.payload.id);

      if (existingIndex !== -1) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + action.payload.quantity,
        };
        return { items: updatedItems };
      }

      return { items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return { items: state.items.filter((item) => item.id !== action.payload.id) };
    case "UPDATE_QUANTITY": {
      const updatedItems = state.items
        .map((item) => (item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item))
        .filter((item) => item.quantity > 0);
      return { items: updatedItems };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: CartItem["id"]) => void;
  updateQuantity: (id: CartItem["id"], quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const initialState: CartState = { items: [] };

function loadInitialState(): CartState {
  if (typeof window === "undefined") return initialState;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;
    const parsed = JSON.parse(stored) as CartState;
    if (!Array.isArray(parsed.items)) return initialState;
    return parsed;
  } catch (error) {
    console.warn("Failed to parse cart storage", error);
    return initialState;
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState, loadInitialState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const subtotal = useMemo(
    () => state.items.reduce((total, item) => total + item.price * item.quantity, 0),
    [state.items],
  );

  const value = useMemo(
    () => ({
      items: state.items,
      subtotal,
      addItem: ({ quantity = 1, ...item }: Omit<CartItem, "quantity"> & { quantity?: number }) => {
        dispatch({ type: "ADD_ITEM", payload: { ...item, quantity } });
      },
      removeItem: (id: CartItem["id"]) => dispatch({ type: "REMOVE_ITEM", payload: { id } }),
      updateQuantity: (id: CartItem["id"], quantity: number) => dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } }),
      clearCart: () => dispatch({ type: "CLEAR" }),
    }),
    [state.items, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
