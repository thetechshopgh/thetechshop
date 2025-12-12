'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  
  // Product Form State
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [desc, setDesc] = useState('')
  const [image, setImage] = useState(null)
  const [uploading, setUploading] = useState(false)

  const checkAuth = () => {
    // Ideally use server-side verification, but this works for simple client-side gating
    // Note: You must actually protect the API routes for real security
    fetch('/api/auth/check', { 
        method: 'POST', 
        body: JSON.stringify({ password }) 
    }).then(res => {
        if(res.ok) setIsAuthenticated(true)
        else alert('Wrong Password')
    })
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setUploading(true)

    // 1. Upload Image
    let imageUrl = ''
    if (image) {
      const fileName = `${Date.now()}-${image.name}`
      const { data, error } = await supabase.storage.from('products').upload(fileName, image)
      if (data) {
        // Get Public URL
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }
    }

    // 2. Insert to DB
    const { error } = await supabase.from('products').insert({
      name,
      description: desc,
      price,
      image_url: imageUrl
    })

    setUploading(false)
    if (!error) {
      alert('Product Added!')
      setName(''); setPrice(''); setDesc(''); setImage(null);
    } else {
      alert('Error adding product')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Admin Access</h2>
          <input 
            type="password" 
            placeholder="Enter Admin PIN"
            className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-indigo-500"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={checkAuth} className="btn-gradient mt-4 w-full rounded-lg py-3 font-bold text-white">Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-extrabold text-transparent">
          Add New Product
        </h1>
        <form onSubmit={handleAddProduct} className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block font-semibold text-slate-700">Product Name</label>
            <input 
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-indigo-500" 
              value={name} onChange={e => setName(e.target.value)} required 
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold text-slate-700">Price (GHS)</label>
            <input 
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-indigo-500" 
              value={price} onChange={e => setPrice(e.target.value)} required 
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold text-slate-700">Description</label>
            <textarea 
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-indigo-500" 
              value={desc} onChange={e => setDesc(e.target.value)} rows={3}
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold text-slate-700">Product Image</label>
            <input 
              type="file" 
              accept="image/*"
              className="w-full rounded-xl border border-dashed border-slate-300 p-4 text-slate-500"
              onChange={e => setImage(e.target.files[0])}
            />
          </div>
          <button 
            disabled={uploading}
            className="btn-gradient w-full rounded-xl py-4 text-lg font-bold text-white shadow-lg disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Publish Product'}
          </button>
        </form>
      </div>
    </div>
  )
}
