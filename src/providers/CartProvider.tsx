
import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the cart item type
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Define the cart context type
interface CartContextType {
  cart: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

// Create the cart context with a default value
const CartContext = createContext<CartContextType>({
  cart: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0
});

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart hook must be used within a CartProvider");
  }
  return context;
};

// CartProvider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Add an item to the cart
  const addItem = (item: CartItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        // Update quantity if item already exists
        return prevCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      } else {
        // Add new item
        return [...prevCart, item];
      }
    });
  };

  // Remove an item from the cart
  const removeItem = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  // Update an item's quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    setCart(prevCart => prevCart.map(item => 
      item.id === itemId 
        ? { ...item, quantity: Math.max(1, quantity) } // Ensure quantity is at least 1
        : item
    ));
  };

  // Clear the cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate total items
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate total price
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Provide the cart context
  return (
    <CartContext.Provider value={{
      cart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};
