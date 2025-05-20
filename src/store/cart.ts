
import { atom } from 'jotai';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

// Initialize the cart atom with an empty array
export const cartAtom = atom<CartItem[]>([]);
