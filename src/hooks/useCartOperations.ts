import { useRecoilState } from 'recoil';
import { cartState, CartItem } from '@/store/cart/atoms';

export const useCartOperations = () => {
  const [cart, setCart] = useRecoilState(cartState);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart((currentCart) => {
      const existingItem = currentCart.items.find((i) => i.id === item.id);
      
      if (existingItem) {
        return {
          ...currentCart,
          items: currentCart.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
          lastUpdated: Date.now(),
        };
      }

      return {
        ...currentCart,
        items: [...currentCart.items, { ...item, quantity: 1 }],
        lastUpdated: Date.now(),
      };
    });
  };

  const removeFromCart = (id: string) => {
    setCart((currentCart) => ({
      ...currentCart,
      items: currentCart.items.filter((item) => item.id !== id),
      lastUpdated: Date.now(),
    }));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }

    setCart((currentCart) => ({
      ...currentCart,
      items: currentCart.items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
      lastUpdated: Date.now(),
    }));
  };

  const clearCart = () => {
    setCart({ items: [], lastUpdated: Date.now() });
    localStorage.removeItem('shopping_cart');
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
};