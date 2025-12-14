'use client'
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Initialize with empty array to match Server-Side Rendering
  const [cart, setCart] = useState([]);
  
  // New flag to track when the client has actually loaded the data
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load cart from Local Storage on mount (Client-side only)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('tech_retail_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Could not load cart from storage:", error);
    } finally {
      // Mark as loaded regardless of success/failure to unblock the UI
      setIsLoaded(true);
    }
  }, []);

  // 2. Save cart to Local Storage whenever cart state changes
  useEffect(() => {
    // CRITICAL: Only save if we have finished loading. 
    // This prevents overwriting existing data with an empty array on startup.
    if (isLoaded) {
      localStorage.setItem('tech_retail_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  // 3. Calculated values
  const { cartTotal, cartItemCount } = useMemo(() => {
    const total = cart.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    return { cartTotal: total, cartItemCount: count };
  }, [cart]);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...currentCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) => {
      return currentCart
        .map(item => {
          if (item.id === productId) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
    });
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ 
        cart, 
        addToCart, 
        removeFromCart,
        clearCart, 
        cartTotal, 
        cartItemCount,
        isLoaded // Exporting this so CartDisplay knows when to render
    }}>
      {children}
    </CartContext.Provider>
  );
};
