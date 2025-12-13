// app/admin/page.jsx (Comprehensive CRUD with original Date.now() File Upload)
'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Trash2, Edit2, X, AlertTriangle, PlusCircle, UploadCloud } from 'lucide-react'
import Image from 'next/image'

// IMPORTANT: Ensure this matches your Supabase Storage Bucket Name
const BUCKET_NAME = 'products'; // Using 'products' bucket name from your original snippet (supabase.storage.from('products'))

const initialProductState = {
    name: '',
    description: '',
    detailed_description: '',
    price: 0,
    image_url: '', 
    specs: {},
};

export default function AdminDashboard() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(initialProductState);
    
    // Image Upload States
    const [imageFile, setImageFile] = useState(null); 
    const fileInputRef = useRef(null); 

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
        setProducts(data || [])
        setLoading(false)
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentProduct(prev => ({
            ...prev,
            [name]: name === 'price' ? parseFloat(value) || 0 : value,
        }));
    };
    
    // --- File Upload Handlers (Using Date.now() for file naming) ---
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setError(null);
        }
    };

    const uploadImage = async (file) => {
        if (!file) return currentProduct.image_url; 

        const fileExt = file.name.split('.').pop();
        // 🛑 Using Date.now() as requested
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; 

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return publicUrl;
    };
    // -------------------------------------------------------------

    const handleSpecsChange = (key, value) => {
        setCurrentProduct(prev => ({
            ...prev,
            specs: {
                ...prev.specs,
                [key]: value,
            }
        }));
    };

    const handleSpecsDelete = (key) => {
        const newSpecs = { ...currentProduct.specs };
        delete newSpecs[key];
        setCurrentProduct(prev => ({ ...prev, specs: newSpecs }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        let publicImageUrl = currentProduct.image_url;

        // Validation: require file only for new products, not when editing (unless a new file is chosen)
        if (!isEditing && !imageFile) {
            setError("Please select an image file for the new product.");
            setIsSubmitting(false);
            return;
        }

        try {
            // 1. Upload Image (only if a new file is selected)
            if (imageFile) {
                publicImageUrl = await uploadImage(imageFile);
            }
            
            // 2. Prepare data for Supabase
            const productToSave = {
                ...currentProduct,
                image_url: publicImageUrl, // Save the new/old URL
                specs: currentProduct.specs,
                price: parseFloat(currentProduct.price),
            };

            let result;
            if (isEditing && currentProduct.id) {
                // EDIT/UPDATE LOGIC
                result = await supabase
                    .from('products')
                    .update(productToSave)
                    .eq('id', currentProduct.id);
            } else {
                // CREATE LOGIC
                result = await supabase
                    .from('products')
                    .insert([productToSave]);
            }

            if (result.error) {
                throw new Error(`Database save failed: ${result.error.message}`);
            }

            // 3. Cleanup and Refresh
            await fetchProducts();
            setCurrentProduct(initialProductState);
            setIsEditing(false);
            setImageFile(null);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (product) => {
        setCurrentProduct({ 
            ...product,
            specs: product.specs || {}
        });
        setIsEditing(true);
        setImageFile(null); // Clear image file state on edit start
        if (fileInputRef.current) fileInputRef.current.value = ''; // Clear actual file input
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete the product: "${name}"? This action cannot be undone.`)) {
            return;
        }
        setLoading(true);
        const { error } = await supabase.from('products').delete().eq('id', id);

        if (error) {
            setError(`Failed to delete product: ${error.message}`);
        } else {
            await fetchProducts();
        }
        setLoading(false);
    };

    return (
        <div className="mx-auto max-w-7xl px-6 py-12">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Admin Dashboard</h1>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center mb-6">
                    <AlertTriangle size={20} className="mr-2" /> {error}
                </div>
            )}

            {/* Product Form (Create & Edit) */}
            <div className="bg-white p-8 rounded-2xl shadow-xl mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    {isEditing ? 'Edit Product' : 'Add New Product'}
                    {isEditing && (
                        <button 
                            onClick={() => { setIsEditing(false); setCurrentProduct(initialProductState); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="ml-4 text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                            <X size={16} /> Cancel Edit
                        </button>
                    )}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Product Name</label>
                            <input type="text" name="name" value={currentProduct.name} onChange={handleChange} required
                                className="mt-1 w-full rounded-md border p-3 focus:ring-indigo-500" />
                        </div>
                        {/* Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price (GHS ₵)</label>
                            <input type="number" name="price" value={currentProduct.price} onChange={handleChange} required
                                className="mt-1 w-full rounded-md border p-3 focus:ring-indigo-500" />
                        </div>
                    </div>

                    {/* Short Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Short Description (Used on Storefront)</label>
                        <textarea name="description" value={currentProduct.description} onChange={handleChange} required rows="2"
                            className="mt-1 w-full rounded-md border p-3 focus:ring-indigo-500"></textarea>
                    </div>

                    {/* Detailed Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Detailed Description (For Product Page)</label>
                        <textarea name="detailed_description" value={currentProduct.detailed_description} onChange={handleChange} rows="5"
                            className="mt-1 w-full rounded-md border p-3 focus:ring-indigo-500"></textarea>
                    </div>

                    {/* Image File Upload Area */}
                    <div className="border p-4 rounded-lg bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Image (JPG/PNG)</label>
                        <div className="relative flex min-h-[120px] items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white transition-colors hover:bg-gray-100">
                            
                            {isEditing && currentProduct.image_url && !imageFile ? (
                                // Show current image prompt when editing
                                <div className="p-4 text-center">
                                    <p className="text-sm text-gray-700 font-medium">Current Image in use.</p>
                                    <p className="text-xs text-gray-500">Select a new file to replace it.</p>
                                </div>
                            ) : imageFile ? (
                                // Show preview/name of newly selected file
                                <p className="p-4 text-sm text-green-700 font-medium">New file selected: **{imageFile.name}**</p>
                            ) : (
                                // Default upload prompt for new product or if user cancels file selection
                                <div className="text-center text-gray-400 p-4">
                                    <UploadCloud className="mx-auto mb-2 h-6 w-6" />
                                    <p>Click to select file</p>
                                </div>
                            )}

                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                required={!isEditing} // Require file only for new products
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            {isEditing ? "Leave blank to keep the existing image." : "Select an image to upload."}
                        </p>
                    </div>
                    
                    {/* Specs Section */}
                    <div className="border p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-gray-700 mb-3">Key Specifications</h3>
                        <div className="space-y-3">
                            {Object.entries(currentProduct.specs).map(([key, value]) => (
                                <div key={key} className="flex gap-4 items-center">
                                    <input type="text" placeholder="Spec Name (e.g., 'RAM')" value={key} 
                                        onChange={(e) => {
                                            const newKey = e.target.value;
                                            if (newKey) {
                                                const newSpecs = { ...currentProduct.specs };
                                                delete newSpecs[key];
                                                newSpecs[newKey] = value;
                                                setCurrentProduct(prev => ({ ...prev, specs: newSpecs }));
                                            }
                                        }}
                                        className="w-1/3 rounded-md border p-2 text-sm"
                                    />
                                    <input type="text" placeholder="Value (e.g., '16GB')" value={value} 
                                        onChange={(e) => handleSpecsChange(key, e.target.value)}
                                        className="w-2/3 rounded-md border p-2 text-sm"
                                    />
                                    <button type="button" onClick={() => handleSpecsDelete(key)}
                                        className="text-red-500 hover:text-red-800 transition"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => handleSpecsChange(`New Spec ${Object.keys(currentProduct.specs).length + 1}`, '')}
                                className="flex items-center text-indigo-600 hover:text-indigo-800 transition text-sm font-medium pt-2"
                            >
                                <PlusCircle size={16} className="mr-1" /> Add Specification
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="btn-gradient w-full py-3 rounded-lg text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                        {isEditing ? 'Save Changes' : 'Add Product'}
                    </button>
                </form>
            </div>

            {/* Product List */}
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Current Products ({products.length})</h2>
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" size={30}/></div>
                ) : (
                    products.map(product => (
                        <div key={product.id} className="bg-white p-4 rounded-xl shadow flex items-center justify-between transition-all hover:ring-2 hover:ring-indigo-100">
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                                    {product.image_url && <Image src={product.image_url} alt={product.name} fill className="object-cover" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{product.name}</p>
                                    <p className="text-sm text-slate-500">₵{product.price}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => handleEdit(product)} className="p-2 text-indigo-600 hover:text-indigo-800 rounded-full hover:bg-indigo-50 transition" title="Edit Product"> <Edit2 size={20} /> </button>
                                <button onClick={() => handleDelete(product.id, product.name)} className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition" title="Delete Product"> <Trash2 size={20} /> </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
