import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { CartItem, BoostCartItem, PlanCartItem } from '@/types/cart';

type CartTypes = CartItem | BoostCartItem | PlanCartItem;

interface CartState {
  items: CartTypes[];
  lastUpdated: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartTypes }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

const CART_EXPIRY_TIME = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
const CART_STORAGE_KEY = 'shopping_cart';

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addToCart: (item: CartTypes & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
} | null>(null);

const loadPersistedCart = (): CartState | null => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      const parsedCart: CartState = JSON.parse(savedCart);
      const now = Date.now();
      
      // Check if cart has expired
      if (now - parsedCart.lastUpdated > CART_EXPIRY_TIME) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return null;
      }
      
      return parsedCart;
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return null;
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newState: CartState;

  switch (action.type) {
    case 'LOAD_CART':
      return action.payload;
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        // For regular cart items that have quantity
        if ('quantity' in existingItem && 'quantity' in action.payload) {
          newState = {
            ...state,
            items: state.items.map(item =>
              item.id === action.payload.id
                ? { ...item, quantity: (item as CartItem).quantity + (action.payload as CartItem).quantity }
                : item
            ),
            lastUpdated: Date.now(),
          };
        } else {
          // For items without quantity (like boosts or plans), just replace
          newState = {
            ...state,
            items: state.items.map(item =>
              item.id === action.payload.id ? action.payload : item
            ),
            lastUpdated: Date.now(),
          };
        }
      } else {
        newState = {
          ...state,
          items: [...state.items, action.payload],
          lastUpdated: Date.now(),
        };
      }
      break;
    }
    case 'REMOVE_ITEM':
      newState = {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        lastUpdated: Date.now(),
      };
      break;
    case 'UPDATE_QUANTITY':
      newState = {
        ...state,
        items: state.items.map(item => {
          if (item.id === action.payload.id && 'quantity' in item) {
            return { ...item, quantity: action.payload.quantity } as CartItem;
          }
          return item;
        }),
        lastUpdated: Date.now(),
      };
      break;
    case 'CLEAR_CART':
      newState = {
        items: [],
        lastUpdated: Date.now(),
      };
      break;
    default:
      return state;
  }

  // Persist the new state to localStorage
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newState));
  return newState;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    lastUpdated: Date.now(),
  });

  // Load persisted cart on mount
  useEffect(() => {
    const persistedCart = loadPersistedCart();
    if (persistedCart) {
      dispatch({ type: 'LOAD_CART', payload: persistedCart });
    }
  }, []);

  useEffect(() => {
    // Check cart expiration
    const checkCartExpiration = () => {
      const now = Date.now();
      if (state.items.length > 0 && now - state.lastUpdated > CART_EXPIRY_TIME) {
        dispatch({ type: 'CLEAR_CART' });
        localStorage.removeItem(CART_STORAGE_KEY);
        toast({
          title: "Cart Expired",
          description: "Your cart has been cleared due to inactivity.",
        });
      }
    };

    const interval = setInterval(checkCartExpiration, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.lastUpdated]);

  const addToCart = (item: CartTypes & { quantity?: number }) => {
    // Add default quantity of 1 for regular cart items
    if ('quantity' in item) {
      dispatch({ 
        type: 'ADD_ITEM', 
        payload: { ...item, quantity: item.quantity || 1 } as CartItem 
      });
    } else {
      // For boost and plan items that don't have quantity
      dispatch({ type: 'ADD_ITEM', payload: item });
    }
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
