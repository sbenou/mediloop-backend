
import { CartItem } from '@/types/cart';

export const getCartTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const getCartCount = (items: CartItem[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0);
};
