// app/admin/page.jsx (Comprehensive CRUD)
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Trash2, Edit2, X, AlertTriangle, PlusCircle } from 'lucide-react'
import Image from 'next/image'

const initialProductState = {
    name: '',
    description: '',
    detailed_description: '', // New field
    price: 0,
    image_url: '',
    specs: {}, // New JSON field for specs
};

export default function AdminDashboard() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(initialProductState);

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

        // Prepare data for Supabase (convert specs object to JSON string if necessary, though Supabase handles JSONB)
        const productToSave = {
            ...currentProduct,
            specs: currentProduct.specs,
            // Ensure price is saved as a number
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
            setError(`Failed to save product: ${result.error.message}`);
        } else {
            await fetchProducts(); // Refresh list
            setCurrentProduct(initialProductState);
            setIsEditing(false);
        }
        setIsSubmitting(false);
    };

    const handleEdit = (product) => {
        // Set product for editing, including merging specs if they are null
        setCurrentProduct({ 
            ...product,
            specs: product.specs || {}
        });
        setIsEditing(true);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete the product: "${name}"?`)) {
            return;
        }
        setLoading(true);
        const { error } = await supabase.from('products').delete().eq('id', id);

        if (error) {
            setError(`Failed to delete product: ${error.message}`);
        } else {
            await fetchProducts(); // Refresh list
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
                            onClick={() => { setIsEditing(false); setCurrentProduct(initialProductState); }}
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

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Image URL</label>
                        <input type="url" name="image_url" value={currentProduct.image_url} onChange={handleChange}
                            className="mt-1 w-full rounded-md border p-3 focus:ring-indigo-500" />
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

                    {/* Specs Section */}
                    <div className="border p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-gray-700 mb-3">Key Specifications</h3>
                        <div className="space-y-3">
                            {Object.entries(currentProduct.specs).map(([key, value]) => (
                                <div key={key} className="flex gap-4 items-center">
                                    <input 
                                        type="text" 
                                        placeholder="Spec Name (e.g., 'RAM')" 
                                        value={key} 
                                        onChange={(e) => {
                                            // Handle key change (must delete old key and add new one)
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
                                    <input 
                                        type="text" 
                                        placeholder="Value (e.g., '16GB')" 
                                        value={value} 
                                        onChange={(e) => handleSpecsChange(key, e.target.value)}
                                        className="w-2/3 rounded-md border p-2 text-sm"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleSpecsDelete(key)}
                                        className="text-red-500 hover:text-red-700 transition"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            {/* Button to add new spec */}
                            <button 
                                type="button" 
                                onClick={() => handleSpecsChange(`New Spec ${Object.keys(currentProduct.specs).length + 1}`, '')}
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
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : null}
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
                                <button 
                                    onClick={() => handleEdit(product)}
                                    className="p-2 text-indigo-600 hover:text-indigo-800 rounded-full hover:bg-indigo-50 transition"
                                    title="Edit Product"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(product.id, product.name)}
                                    className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition"
                                    title="Delete Product"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
