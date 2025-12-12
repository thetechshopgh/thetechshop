'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'

export default function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*')
    setProducts(data || [])
    setLoading(false)
  }

  const handleBuy = async (product) => {
    const email = prompt("Enter your email to receive the receipt:")
    if (!email) return

    // Call our backend API to initialize Paystack
    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      body: JSON.stringify({ email, amount: product.price, productId: product.id }),
    })
    const data = await res.json()
    if (data.authorization_url) {
      window.location.href = data.authorization_url // Redirect to Paystack
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-white pb-10 pt-20 text-center shadow-sm">
        <h1 className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-6xl font-extrabold text-transparent">
          Future Tech Retail
        </h1>
        <p className="mt-4 text-slate-500">Premium gadgets for the modern creator.</p>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        {loading ? (
          <p className="text-center text-slate-400">Loading premium gear...</p>
        ) : (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-900/5 transition-all hover:shadow-2xl"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{product.description}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-900">₵{product.price}</span>
                    <button 
                      onClick={() => handleBuy(product)}
                      className="btn-gradient flex items-center gap-2 rounded-full px-6 py-2.5 font-semibold text-white"
                    >
                      <ShoppingBag size={18} /> Buy Now
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
