import { useState } from 'react';

interface CartItem {
  id: string;
  type: 'ticket' | 'seat';
  eventId: string;
  name: string;
  price: number;
  quantity: number;
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        i => i.id === item.id && i.type === item.type
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + item.quantity
        };
        return newItems;
      } else {
        // Add new item
        return [...prevItems, item];
      }
    });
  };

  const removeFromCart = (id: string, type: 'ticket' | 'seat') => {
    setCartItems(prevItems => 
      prevItems.filter(item => !(item.id === id && item.type === type))
    );
  };

  const updateQuantity = (id: string, type: 'ticket' | 'seat', quantity: number) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        (item.id === id && item.type === type) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  };
}; 