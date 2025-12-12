'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion' // smooth animations
import { ShoppingBag, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const handleBuy = async (product) => {
    const email = prompt("Please enter your email for the receipt:")
    if (!email) return

    // Show loading state here if needed
    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      body: JSON.stringify({ email, amount: product.price, productId: product.id }),
    })
    const data = await res.json()
    if (data.authorization_url) {
      window.location.href = data.authorization_url
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex justify-between items-center">
          <div className="font-bold text-xl tracking-tighter text-slate-900">TECH<span className="text-indigo-600">RETAIL</span>.</div>
          <button className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition">Contact Support</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-white pb-16 pt-24 text-center">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="relative z-10 mx-auto max-w-2xl px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black tracking-tight text-slate-900 sm:text-7xl"
          >
            The Future of <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Tech is Here.</span>
          </motion.h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Curated gadgets for the modern professional. High performance, higher style.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 py-20">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>
        ) : (
          <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-2xl hover:ring-indigo-100"
              >
                {/* Image Container */}
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
                  {/* Glossy Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-slate-500">{product.description}</p>
                  
                  <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-2xl font-bold text-slate-900">₵{product.price}</span>
                    <button 
                      onClick={() => handleBuy(product)}
                      className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
