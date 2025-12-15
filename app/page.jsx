// app/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
// Include XCircle for Sold Out icon, and Zap for Low Stock
import { ShoppingBag, Loader2, Search, XCircle, Zap } from 'lucide-react' 
import Image from 'next/image'
import Link from 'next/link' 
import { useCart } from '@/components/CartContext';
// Assuming CartDisplay is rendered elsewhere or omitted for brevity

export default function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('') 
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    // 🚨 IMPORTANT: Select the inventory fields
    const { data } = await supabase
        .from('products')
        // Select all fields plus the inventory tracking fields
        .select('*, inventory, is_sold_out') 
        .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="font-bold text-2xl tracking-tighter text-slate-900">THE<span className="text-indigo-600"> TECH SHOP</span></div>
          
          {/* Search Bar */}
          <div className="relative w-full max-w-lg">
            <input 
              type="text" 
              placeholder="Search by product name or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 bg-white shadow-inner focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white to-indigo-50 pb-16 pt-24 text-center border-b border-gray-200">
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black tracking-tighter text-slate-900 sm:text-7xl"
          >
            Powering the Future <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">One Gadget at a Time.</span>
          </motion.h1>
          <p className="mt-6 text-xl leading-8 text-slate-600">
            Hand-picked devices engineered for performance and reliability.
          </p>
        </div>
        {/* Note: CartDisplay likely belongs here or outside the main content flow, but is omitted */}
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 py-20">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>
        ) : (
          <>
            {filteredProducts.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <p className="text-xl">No products found matching "{searchQuery}"</p>
                <p className="text-sm mt-2">Try searching for a different term.</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product, i) => {
                  const isSoldOut = product.is_sold_out; 
                  const isLowStock = !isSoldOut && product.inventory < 5 && product.inventory > 0;
                  
                  return (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                    // Apply visual dimming if sold out
                  className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-200 transition-all hover:shadow-2xl hover:ring-indigo-200 ${isSoldOut ? 'opacity-60 grayscale' : ''}`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-100 p-4">
                        {/* SOLD OUT BADGE */}
                        {isSoldOut && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 text-white text-3xl font-black tracking-widest pointer-events-none">
                                SOLD OUT
                            </div>
                        )}
                        {isLowStock && (
                            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-slate-900 shadow-md">
                                <Zap size={14} /> Low Stock!
                            </div>
                        )}
                        
                    {product.image_url ? (
                      <Image 
                        src={product.image_url} 
                        alt={product.name}
                        fill
                        className="object-contain transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    {/* Link to Product Page */}
                        <Link 
                            href={isSoldOut ? '#' : `/products/${product.id}`}
                            className={`${isSoldOut ? 'cursor-default' : 'hover:text-indigo-600'} transition duration-300`}
                        >
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600">{product.name}</h3>
                    </Link>
                    
                    <p className="mt-2 flex-1 text-sm text-slate-500">{product.description}</p>
                    
                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-2xl font-bold text-slate-900">₵{product.price.toFixed(2)}</span>
                      
                        {/* ACTION BUTTON (FIXED STYLING) */}
                      <button 
                        onClick={() => !isSoldOut && addToCart(product)} 
                        disabled={isSoldOut}
                        // FIX: Added h-[42px] and justify-center for consistent vertical alignment and size
                        className={`flex items-center justify-center gap-2 rounded-full px-6 py-2 text-sm font-semibold text-white transition-colors h-[42px] w-auto 
                            ${isSoldOut 
                                ? 'bg-red-500 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-indigo-600'
                            }`}
                      >
                        {isSoldOut ? (
                            <>
                                <XCircle size={16} /> Sold Out
                            </>
                        ) : (
                            <>
                                <ShoppingBag size={16} /> Add to Cart
                            </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
