// components/CartContext.jsx (FINAL VERIFIED VERSION)
'use client'
import React, { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // 1. Load cart from Local Storage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('tech_retail_cart');
      if (savedCart) {
        // Attempt to parse, reset to empty array if data is corrupt
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Could not load cart from storage:", error);
      setCart([]); // Reset cart if parsing fails
    }
  }, []);

  // 2. Save cart to Local Storage whenever it changes
  useEffect(() => {
    localStorage.setItem('tech_retail_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(item => item.id === product.id);

      if (existingItem) {
        // If product already exists, increase quantity
        return currentCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Otherwise, add new item
        return [...currentCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) => {
      return currentCart
        .map(item => {
          if (item.id === productId) {
            // Decrease the quantity by 1
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        })
        // Filter out the item if its quantity is now 0 or less
        .filter(item => item.quantity > 0);
    });
  };

  const clearCart = () => setCart([]);

  // Use a safety check (|| 0) for cartTotal calculation
  const cartTotal = cart.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
        cart, 
        addToCart, 
        removeFromCart, // 🚨 CRITICAL: Exported
        clearCart, 
        cartTotal 
    }}>
      {children}
    </CartContext.Provider>
  );
};
