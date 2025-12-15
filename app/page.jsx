// app/page.jsx (FINAL – CLEAN, COMPACT, FIXED)
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { ShoppingBag, Loader2, Search, XCircle, Zap, Mail, Phone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/CartContext'

export default function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { addToCart } = useCart()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
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

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="font-bold text-2xl tracking-tighter text-slate-900">
            THE<span className="text-indigo-600"> TECH SHOP</span>
          </div>

          <div className="relative w-full max-w-lg">
            <input
              type="text"
              placeholder="Search by product name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 bg-white shadow-inner focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white to-indigo-50
                      pt-10 pb-12 sm:pt-14 sm:pb-16 text-center border-b border-gray-200">
        <div className="mx-auto max-w-3xl px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black tracking-tighter text-slate-900 sm:text-4xl lg:text-5xl"
          >
            Powering the Future <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              One Gadget at a Time.
            </span>
          </motion.h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600">
            Hand-picked devices engineered for performance and reliability.
          </p>
        </div>
      </div>

      {/* PRODUCT GRID */}
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-16 sm:pt-14">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <p className="text-xl">No products found matching "{searchQuery}"</p>
                <p className="text-sm mt-2">Try searching for a different term.</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product, i) => {
                const isSoldOut = product.is_sold_out
                const isLowStock =
                  !isSoldOut &&
                  product.inventory !== null &&
                  product.inventory < 5 &&
                  product.inventory > 0

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-gray-200
                      hover:shadow-xl hover:ring-indigo-200 transition
                      ${isSoldOut ? 'opacity-60 grayscale' : ''}`}
                  >

                    {/* IMAGE */}
                    <div className="relative aspect-square w-full overflow-hidden bg-gray-100 p-3">
                      {isSoldOut && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 text-white text-2xl font-black tracking-widest">
                          SOLD OUT
                        </div>
                      )}

                      {isLowStock && (
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-slate-900 shadow">
                          <Zap size={14} /> Low Stock
                        </div>
                      )}

                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="flex flex-1 flex-col p-4">
                      <Link
                        href={isSoldOut ? '#' : `/products/${product.id}`}
                        className={`${isSoldOut ? 'cursor-default' : 'hover:text-indigo-600'} transition`}
                      >
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="mt-2 text-sm text-slate-500 line-clamp-3">
                        {product.description}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                        <span className="text-xl font-bold text-slate-900">
                          ₵{product.price}
                        </span>

                        <button
                          onClick={() => !isSoldOut && addToCart(product)}
                          disabled={isSoldOut}
                          className={`flex items-center justify-center gap-2 rounded-full px-4 py-2
                            text-sm font-semibold text-white h-10 min-w-[120px] transition
                            ${isSoldOut
                              ? 'bg-red-500 cursor-not-allowed'
                              : 'bg-slate-900 hover:bg-indigo-600'}`}
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
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white mt-12 py-16">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-3 gap-10">

          <div>
            <div className="font-bold text-xl tracking-tighter">
              THE<span className="text-indigo-400"> TECH SHOP</span>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Your reliable source for performance-driven electronics.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              &copy; {new Date().getFullYear()} The Tech Shop. All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 text-indigo-400">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/policy" className="hover:text-white">Shipping Policy</Link></li>
              <li><Link href="/returns" className="hover:text-white">Returns & Exchanges</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 text-indigo-400">Support & Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-indigo-400" />
                <a href="mailto:thetechshopgh@gmail.com" className="hover:text-white">
                  thetechshopgh@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={20} className="text-indigo-400" />
                <p>+233 55 555 5555</p>
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
