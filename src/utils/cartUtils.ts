
import { CartItem, BoostCartItem, PlanCartItem } from '@/types/cart';

type AllCartItemTypes = CartItem | BoostCartItem | PlanCartItem;

export const getCartTotal = (items: AllCartItemTypes[]): number => {
  return items.reduce((total, item) => {
    // For regular cart items with quantity
    if ('quantity' in item) {
      return total + (item.price * item.quantity);
    }
    // For boost and plan items without quantity
    return total + item.price;
  }, 0);
};

export const getCartCount = (items: AllCartItemTypes[]): number => {
  return items.reduce((count, item) => {
    if ('quantity' in item) {
      return count + item.quantity;
    }
    return count + 1; // Count boosts and plans as 1 item each
  }, 0);
};
