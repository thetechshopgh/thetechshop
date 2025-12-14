// components/CartContext.jsx (ULTIMATE FIX: Consolidated State Loading)
'use client'
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Initialize cart state as an empty array
  const [cart, setCart] = useState([]);

  // 1. Load cart from Local Storage ONLY on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('tech_retail_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Could not load cart from storage:", error);
      setCart([]); // Ensure it falls back to an empty array on error
    }
  }, []); // Empty dependency array means it runs once on mount

  // 2. Save cart to Local Storage whenever cart state changes
  useEffect(() => {
    localStorage.setItem('tech_retail_cart', JSON.stringify(cart));
  }, [cart]); // Only runs when cart state changes

  // 3. Calculated values using useMemo to optimize performance
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
        cartTotal,         // Export calculated total
        cartItemCount     // Export calculated count
    }}>
      {children}
    </CartContext.Provider>
  );
};
