// app/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { ShoppingBag, Loader2, Search } from 'lucide-react' // Added Search icon
import Image from 'next/image'
import { useCart } from '@/components/CartContext';
import CartDisplay from '@/components/CartDisplay';

export default function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('') // 🔍 State for search
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  // 🔍 Filter logic
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="font-bold text-xl tracking-tighter text-slate-900">TECH<span className="text-indigo-600">RETAIL</span>.</div>
          
          {/* 🔍 Search Bar - Centered */}
          <div className="relative w-full max-w-md">
            <input 
              type="text" 
              placeholder="Search for gadgets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

          <div className="flex items-center gap-4">
            <CartDisplay />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-white pb-10 pt-16 text-center">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="relative z-10 mx-auto max-w-2xl px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl"
          >
            Find your next <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Tech Obsession.</span>
          </motion.h1>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>
        ) : (
          <>
            {/* Show "No results" if search finds nothing */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <p>No products found matching "{searchQuery}"</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product, i) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-2xl hover:ring-indigo-100"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                    {product.image_url ? (
                      <Image 
                        src={product.image_url} 
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                    <p className="mt-2 flex-1 text-sm text-slate-500">{product.description}</p>
                    
                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-2xl font-bold text-slate-900">₵{product.price}</span>
                      <button 
                        onClick={() => addToCart(product)} 
                        className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
                      >
                        <ShoppingBag size={16} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
