import { atom } from 'recoil';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface CartState {
  items: CartItem[];
  lastUpdated: number;
}

const CART_STORAGE_KEY = 'shopping_cart';

// Load initial state from localStorage
const loadPersistedCart = (): CartState => {
  if (typeof window === 'undefined') return { items: [], lastUpdated: Date.now() };
  
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return { items: [], lastUpdated: Date.now() };
};

export const cartState = atom<CartState>({
  key: 'cartState',
  default: loadPersistedCart(),
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newValue));
        }
      });
    },
  ],
});