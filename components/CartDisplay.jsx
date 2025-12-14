'use client'
import { useCart } from '@/components/CartContext';
import { ShoppingBag, X, MinusCircle, PlusCircle, Loader2 } from 'lucide-react'; 
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CartDisplay() {
  const { cart, cartTotal, addToCart, removeFromCart, cartItemCount, isLoaded } = useCart(); 
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckout = () => {
    setIsOpen(false);
    router.push('/checkout');
  };

  return (
    <>
      {/* Cart Icon Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition"
        aria-label="View shopping cart"
      >
        <ShoppingBag size={24} className="text-slate-700" />
        {/* Only show badge if loaded and has items, or just use count if you prefer layout stability */}
        {isLoaded && cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {cartItemCount}
          </span>
        )}
      </button>

      {/* Cart Sidebar (Drawer) */}
      <div 
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div 
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/50"
        ></div>

        {/* Sidebar */}
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
            
            {/* 1. Show Loading State first */}
            {!isLoaded ? (
               <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                 <Loader2 className="animate-spin mb-2" size={32} />
                 <p>Loading cart...</p>
               </div>
            ) : cart.length === 0 ? (
              /* 2. Show Empty State */
              <p className="text-center text-slate-500 mt-10">Your cart is empty.</p>
            ) : (
              /* 3. Show Items (Map) */
              cart.map(item => (
                <div key={item.id} className="flex items-start gap-4 border-b pb-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />}
                  </div>
                  
                  <div className="flex-grow flex flex-col">
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <span className="text-sm text-slate-500 mb-2">₵{(item.price || 0).toFixed(2)} each</span>
                    
                    <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="p-1 rounded-full text-red-500 hover:bg-red-50 transition"
                        >
                          <MinusCircle size={20} />
                        </button>
                        <span className="text-md font-medium text-slate-700">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item)} 
                          className="p-1 rounded-full text-green-500 hover:bg-green-50 transition"
                        >
                          <PlusCircle size={20} />
                        </button>
                    </div>
                  </div>
                  
                  <span className="font-bold text-slate-900 text-lg flex-shrink-0">₵{((item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          {/* Footer/Checkout */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center text-xl font-bold mb-4">
              <span>Subtotal:</span>
              <span>₵{cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout} 
              disabled={!isLoaded || cart.length === 0}
              className="w-full py-3 rounded-lg text-white font-bold disabled:opacity-50 bg-slate-900 hover:bg-indigo-600 transition"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
