// components/CartDisplay.jsx (FIXED: Syntax Error on line 65)
'use client'
import { useCart } from '@/components/CartContext';
// Imported MinusCircle and PlusCircle for quantity controls
import { ShoppingBag, X, MinusCircle, PlusCircle } from 'lucide-react'; 
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CartDisplay() {
  // Destructure all necessary functions
  const { cart, cartTotal, addToCart, removeFromCart } = useCart(); 
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = () => {
    setIsOpen(false);
    router.push('/checkout');
  };

  return (
    <>
      {/* Cart Icon Button (No change needed here) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition"
        aria-label="View shopping cart"
      >
        <ShoppingBag size={24} className="text-slate-700" />
        {cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {cartItemCount}
          </span>
        )}
      </button>

      {/* Cart Sidebar (Drawer) */}
      <div 
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop (No change needed here) */}
        <div 
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/50"
        ></div>

        {/* Sidebar (No change needed here) */}
        <div 
          className={`fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 p-6 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Your Cart</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
              <X size={24} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-grow overflow-y-auto space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-slate-500 mt-10">Your cart is empty.</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-start gap-4 border-b pb-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {/* Product image */}
                    {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />}
                  </div>
                  
                  <div className="flex-grow flex flex-col">
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <span className="text-sm text-slate-500 mb-2">₵{item.price.toFixed(2)} each</span>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                        {/* Remove/Decrease Quantity */}
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="p-1 rounded-full text-red-500 hover:bg-red-50 transition"
                          aria-label="Remove one item or decrease quantity"
                        >
                          <MinusCircle size={20} />
                        </button>
                        <span className="text-md font-medium text-slate-700">{item.quantity}</span>
                        {/* Add/Increase Quantity */}
                        <button 
                          onClick={() => addToCart(item)} 
                          className="p-1 rounded-full text-green-500 hover:bg-green-50 transition"
                          aria-label="Add one item"
                        >
                          <PlusCircle size={20} />
                        </button>
                    </div>
                  </div>
                    
                    {/* Item Subtotal (Moved outside the flex-grow div for separation) */}
                  <span className="font-bold text-slate-900 text-lg flex-shrink-0">₵{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          {/* Footer/Checkout (No change needed here) */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center text-xl font-bold mb-4">
              <span>Subtotal:</span>
              <span>₵{cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout} 
              disabled={cart.length === 0}
              className="btn-gradient w-full py-3 rounded-lg text-white font-bold disabled:opacity-50"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
