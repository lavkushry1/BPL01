import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the CartItem interface
export interface CartItem {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventImage?: string;
  tickets: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
}

// Create the CartContext
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (eventId: string) => void;
  updateQuantity: (eventId: string, ticketId: string, newQuantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// CartProvider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    const storedCart = localStorage.getItem('eventia_cart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('eventia_cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  // Calculate totals
  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.tickets.reduce((s, t) => s + t.quantity, 0), 
    0
  );
  
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.totalAmount, 
    0
  );
  
  // Add an item to cart
  const addToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      // Check if this event is already in the cart
      const existingItemIndex = prev.findIndex(item => item.eventId === newItem.eventId);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...prev];
        const existingItem = updatedItems[existingItemIndex];
        
        // Merge tickets
        const mergedTickets = [...existingItem.tickets];
        
        newItem.tickets.forEach(newTicket => {
          const existingTicketIndex = mergedTickets.findIndex(t => t.id === newTicket.id);
          
          if (existingTicketIndex >= 0) {
            // Update existing ticket quantity
            mergedTickets[existingTicketIndex].quantity += newTicket.quantity;
          } else {
            // Add new ticket
            mergedTickets.push(newTicket);
          }
        });
        
        // Update the item
        updatedItems[existingItemIndex] = {
          ...existingItem,
          tickets: mergedTickets,
          totalAmount: mergedTickets.reduce((sum, ticket) => sum + (ticket.price * ticket.quantity), 0)
        };
        
        return updatedItems;
      } else {
        // Add new item
        return [...prev, newItem];
      }
    });
  };
  
  // Remove an item from cart
  const removeFromCart = (eventId: string) => {
    setCartItems(prev => prev.filter(item => item.eventId !== eventId));
  };
  
  // Update ticket quantity
  const updateQuantity = (eventId: string, ticketId: string, newQuantity: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.eventId !== eventId) return item;
        
        // Update the specific ticket
        const updatedTickets = item.tickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, quantity: Math.max(0, newQuantity) } 
            : ticket
        );
        
        // Remove tickets with quantity 0
        const filteredTickets = updatedTickets.filter(ticket => ticket.quantity > 0);
        
        // Calculate new total amount
        const newTotalAmount = filteredTickets.reduce(
          (sum, ticket) => sum + (ticket.price * ticket.quantity), 
          0
        );
        
        // If all tickets are removed, remove the item completely
        if (filteredTickets.length === 0) {
          return null;
        }
        
        return {
          ...item,
          tickets: filteredTickets,
          totalAmount: newTotalAmount
        };
      }).filter(Boolean) as CartItem[]; // Filter out null items
    });
  };
  
  // Clear the entire cart
  const clearCart = () => {
    setCartItems([]);
  };
  
  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalAmount
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart
export const useCart = () => {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
};

export default useCart; 