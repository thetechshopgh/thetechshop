// app/page.jsx (Final Code)
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { ShoppingBag, Loader2, Search, XCircle, Zap, Mail, Phone } from 'lucide-react' 
import Image from 'next/image'
import Link from 'next/link' 
import { useCart } from '@/components/CartContext';
import CartDisplay from '@/components/CartDisplay';

export default function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('') 
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase
        .from('products')
        // Ensure necessary fields for sold out/low stock status are selected
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
          
          {/* Search Bar - Enhanced */}
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

      {/* Hero - Styled and cleaner */}
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
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 py-20">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>
        ) : (
          <>
            {/* No results message */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <p className="text-xl">No products found matching "{searchQuery}"</p>
                <p className="text-sm mt-2">Try searching for a different term.</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product, i) => {
                    const isSoldOut = product.is_sold_out; 
                    const isLowStock = !isSoldOut && product.inventory !== null && product.inventory < 5 && product.inventory > 0;
                    
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
                        {/* 🚨 SOLD OUT BADGE */}
                        {isSoldOut && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 text-white text-3xl font-black tracking-widest pointer-events-none">
                                SOLD OUT
                            </div>
                        )}
                        {/* 🚨 LOW STOCK BADGE */}
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
                        {/* Disable link if sold out */}
                        <Link 
                            href={isSoldOut ? '#' : `/products/${product.id}`} 
                            className={`${isSoldOut ? 'cursor-default' : 'hover:text-indigo-600'} transition duration-300`}
                        >
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600">{product.name}</h3>
                    </Link>
                    
                    {/* 🛑 FIX: Fixed height h-16 (64px) for perfect vertical alignment */}
                    <p className="mt-2 text-sm text-slate-500 h-16 overflow-hidden">{product.description}</p>
                    
                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-2xl font-bold text-slate-900">₵{product.price}</span>
                      
                        {/* ACTION BUTTON - Fixed width and height maintained */}
                      <button 
                        onClick={() => !isSoldOut && addToCart(product)} 
                        disabled={isSoldOut}
                        className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors h-[42px] w-36 
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
              )})}
            </div>
          </>
        )}
      </div>
      
    {/* FOOTER / SUPPORT SECTION */}
    <footer className="bg-slate-900 text-white mt-12 py-16">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Column 1: Branding */}
            <div>
                <div className="font-bold text-xl tracking-tighter text-white">
                    THE<span className="text-indigo-400"> TECH SHOP</span>
                </div>
                <p className="mt-4 text-sm text-slate-400">
                    Your reliable source for performance-driven electronics.
                </p>
                <p className="mt-2 text-sm text-slate-400">
                    &copy; {new Date().getFullYear()} The Tech Shop. All rights reserved.
                </p>
            </div>

            {/* Column 2: Quick Links (Placeholder for other pages) */}
            <div>
                <h4 className="font-semibold text-lg mb-4 text-indigo-400">Quick Links</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                    <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                    <li><Link href="/policy" className="hover:text-white transition">Shipping Policy</Link></li>
                    <li><Link href="/returns" className="hover:text-white transition">Returns & Exchanges</Link></li>
                </ul>
            </div>

            {/* Column 3: Contact & Support */}
            <div>
                <h4 className="font-semibold text-lg mb-4 text-indigo-400">Support & Contact</h4>
                <div className="space-y-3 text-sm">
                    {/* Support Email */}
                    <div className="flex items-center gap-3">
                        <Mail size={20} className="text-indigo-400"/>
                        <a 
                            href="mailto:thetechshopgh@gmail.com" 
                            className="text-slate-300 hover:text-white transition font-medium"
                        >
                            thetechshopgh@gmail.com
                        </a>
                    </div>
                    
                    {/* Placeholder Phone Number */}
                    <div className="flex items-center gap-3">
                        <Phone size={20} className="text-indigo-400"/>
                        <p className="text-slate-300">+233 55 555 5555</p>
                    </div>
                    
                    <p className="text-slate-400 pt-2">
                        Reach out to us for technical support or order inquiries.
                    </p>
                </div>
            </div>
        </div>
    </footer>
    </div>
  )
}
