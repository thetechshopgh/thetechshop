'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, UploadCloud } from 'lucide-react'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  
  // Form State
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [desc, setDesc] = useState('')
  const [image, setImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null) // To show image before upload
  const [uploading, setUploading] = useState(false)

  // Simple Password Check
  const checkAuth = async () => {
    const res = await fetch('/api/auth/check', { 
        method: 'POST', 
        body: JSON.stringify({ password }) 
    })
    if(res.ok) setIsAuthenticated(true)
    else alert('Invalid Admin Password')
  }

  // Handle File Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreviewUrl(URL.createObjectURL(file)) // Create local preview
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      let finalImageUrl = ''
      
      // 1. Upload to Supabase Storage
      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, image)

        if (uploadError) throw uploadError

        // 2. Get the Public URL
        const { data } = supabase.storage
          .from('products')
          .getPublicUrl(fileName)
          
        finalImageUrl = data.publicUrl
      }

      // 3. Save to Database
      const { error: dbError } = await supabase.from('products').insert({
        name,
        description: desc,
        price,
        image_url: finalImageUrl
      })

      if (dbError) throw dbError

      alert('Product added successfully!')
      // Reset Form
      setName(''); setPrice(''); setDesc(''); setImage(null); setPreviewUrl(null);
    } catch (error) {
      console.error(error)
      alert('Error: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-center">Admin Login</h2>
          <input 
            type="password" 
            placeholder="Admin Password"
            className="w-full rounded-lg border p-3 mb-4"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={checkAuth} className="w-full rounded-lg bg-black py-3 text-white font-bold hover:bg-gray-800">Enter Dashboard</button>
        </div>
      </div>
    )
  }

  // Dashboard Screen
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl md:p-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Add New Product</h1>
          <p className="text-slate-500">Upload details for the storefront</p>
        </div>

        <form onSubmit={handleAddProduct} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Product Name</label>
              <input className="w-full rounded-xl border bg-gray-50 p-4 focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. MacBook Pro" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Price (GHS)</label>
              <input type="number" className="w-full rounded-xl border bg-gray-50 p-4 focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
            <textarea className="w-full rounded-xl border bg-gray-50 p-4 focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Product details..." />
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Product Image</label>
            <div className="relative flex min-h-[150px] items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-h-[150px] rounded-lg object-contain" />
              ) : (
                <div className="text-center text-gray-400">
                  <UploadCloud className="mx-auto mb-2 h-8 w-8" />
                  <p>Click to upload image</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={handleImageChange}
                required
              />
            </div>
          </div>

          <button 
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-70"
          >
            {uploading ? <Loader2 className="animate-spin" /> : 'Publish Product'}
          </button>
        </form>
      </div>
    </div>
  )
}
