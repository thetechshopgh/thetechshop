// components/CartDisplay.jsx (DEBUG MODE)
'use client'
import { useCart } from '@/components/CartContext';
import { useState } from 'react';

export default function CartDisplay() {
  const { cart, cartTotal, isLoaded } = useCart(); 
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
      {/* 1. Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'red', color: 'white', padding: '10px', borderRadius: '5px' }}
      >
        {isOpen ? 'CLOSE DEBUG' : 'OPEN DEBUG CART'}
      </button>

      {/* 2. Raw Data Display */}
      {isOpen && (
        <div style={{ 
          background: 'black', 
          color: '#00ff00', 
          padding: '20px', 
          width: '300px', 
          height: '500px', 
          overflow: 'auto',
          marginTop: '10px',
          border: '2px solid red'
        }}>
          <h3>DEBUG PANEL</h3>
          <p><strong>Total:</strong> {cartTotal}</p>
          <p><strong>Loaded:</strong> {isLoaded ? 'YES' : 'NO'}</p>
          <hr style={{ borderColor: 'white' }}/>
          
          <h4>Raw Cart Data:</h4>
          {/* This will dump the exact data structure to the screen */}
          <pre style={{ fontSize: '10px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(cart, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
