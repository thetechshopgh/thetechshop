// components/CartContext.jsx (ULTIMATE, FINAL FIX: Synchronous Initialization)
'use client'
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Function to safely load cart synchronously on initialization
const getInitialCart = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedCart = localStorage.getItem('tech_retail_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error parsing saved cart:", error);
      return [];
    }
  }
  return [];
};


export const CartProvider = ({ children }) => {
  // 🚨 CRITICAL CHANGE: Initialize state directly using the synchronous function
  const [cart, setCart] = useState(getInitialCart);

  // 1. Save cart to Local Storage whenever cart state changes
  // This ensures the cart is saved after addToCart/removeFromCart
  useEffect(() => {
    localStorage.setItem('tech_retail_cart', JSON.stringify(cart));
  }, [cart]); 

  // 2. Calculated values using useMemo
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
        cartItemCount     
    }}>
      {children}
    </CartContext.Provider>
  );
};
