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
      {/* 1. Cart Icon Button (Fixed Bottom Right) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 p-4 rounded-full bg-blue-600 hover:bg-blue-700 transition shadow-lg text-white"
        aria-label="View shopping cart"
      >
        <ShoppingBag size={28} className="text-white" />
        
        {isLoaded && cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
            {cartItemCount}
          </span>
        )}
      </button>

      {/* 2. Cart Sidebar (Drawer) */}
      <div 
        className={`fixed inset-0 z-[999] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div 
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/50"
        ></div>

        <div 
          className={`fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-2xl transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-x-hidden`}
        >
          
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-4 border-b">
            <h2 className="text-2xl font-bold text-slate-900">Your Cart</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
              <X size={24} className="text-slate-900" />
            </button>
          </div>

          {/* Cart Items List: Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-0 bg-white">
            
            {!isLoaded ? (
               /* Loading State */
               <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                 <Loader2 className="animate-spin mb-2" size={32} />
                 <p>Loading...</p>
               </div>
            ) : cart.length === 0 ? (
              /* Empty State */
              <p className="text-center text-slate-500 mt-10">Your cart is empty.</p>
            ) : (
              /* THE LOOP - Stable Grid Layout */
              cart.map(item => (
                <div key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)_auto] gap-2 items-center border-b border-slate-200 py-3 px-4">
                  
                  {/* Column 1: Image (Fixed 64px) */}
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                    {item.image_url ? (
                        <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                    )}
                  </div>
                  
                  {/* Column 2: Item Details and Controls (1fr) */}
                  <div className="flex flex-col justify-center overflow-hidden"> 
                    <h3 className="font-semibold text-slate-900 text-sm mb-1 truncate">{item.name}</h3>
                    <p className="text-xs text-slate-500 mb-2">Price: ₵{(item.price || 0).toFixed(2)}</p>
                    <div className="flex items-center gap-3">
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="text-slate-500 hover:text-red-500 transition"
                          aria-label={`Remove one ${item.name}`}
                        >
                          <MinusCircle size={20} />
                        </button>
                        <span className="text-sm font-bold text-slate-900 w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item)} 
                          className="text-slate-500 hover:text-green-500 transition"
                          aria-label={`Add one ${item.name}`}
                        >
                          <PlusCircle size={20} />
                        </button>
                    </div>
                  </div>
                  
                  {/* Column 3: Item Total (Auto-width) */}
                  <div className="text-right"> 
                    <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
                        ₵{((item.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer/Checkout */}
          <div className="px-4 py-4 border-t bg-gray-50">
            <div className="flex justify-between items-center text-xl font-bold mb-4 text-slate-900">
              <span>Subtotal:</span>
              <span>₵{cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout} 
              disabled={!isLoaded || cart.length === 0}
              className="w-full py-4 rounded-xl text-white font-bold text-lg disabled:opacity-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
