// app/products/[id]/page.jsx (Final version with Specs and correct logic)
'use client'
import { supabase } from '@/lib/supabase';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/components/CartContext';

export default function ProductPage({ params }) {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { addToCart } = useCart();
    const productId = params.id; 

    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    async function fetchProduct() {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error || !data) {
            return notFound(); 
        }

        setProduct(data);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex justify-center py-40">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    if (!product) return notFound(); 

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <button 
                    onClick={() => router.back()}
                    className="text-indigo-600 hover:text-indigo-800 transition mb-6 block font-semibold flex items-center gap-1"
                >
                    &larr; Back to Store
                </button>
                
                <div className="grid md:grid-cols-2 gap-10 bg-white p-8 rounded-3xl shadow-2xl">
                    {/* Image Section */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100 p-6 shadow-inner">
                        {product.image_url ? (
                            <Image 
                                src={product.image_url} 
                                alt={product.name}
                                fill
                                className="object-contain"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400 text-xl">No Image</div>
                        )}
                    </div>

                    {/* Details & Buy Section */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{product.name}</h1>
                            <p className="text-xl font-medium text-indigo-600 mb-6">₵{product.price.toFixed(2)}</p>
                            
                            <h2 className="text-2xl font-semibold text-slate-900 mb-3">Quick Overview</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                {product.description}
                            </p>
                            
                            {/* Specs Section */}
                            {product.specs && Object.keys(product.specs).length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-xl font-bold text-slate-900 mb-3 border-t pt-3">Key Specifications</h3>
                                    <ul className="space-y-2 text-slate-700">
                                        {Object.entries(product.specs).map(([key, value]) => (
                                            <li key={key} className="flex justify-between border-b border-dashed pb-1">
                                                <span className="font-medium text-sm text-slate-500">{key}:</span>
                                                <span className="font-semibold text-right">{value}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 border-t pt-6">
                            <button
                                onClick={() => addToCart(product)}
                                className="btn-gradient w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl hover:shadow-indigo-400/50 flex items-center justify-center gap-3"
                            >
                                <ShoppingBag size={20} /> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>

                {/* Detailed Description Section */}
                {product.detailed_description && (
                    <div className="bg-white p-8 rounded-3xl shadow-2xl mt-8 border-t-4 border-indigo-500">
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">In-Depth Details</h2>
                        <p className="text-lg text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {product.detailed_description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
