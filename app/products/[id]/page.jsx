// app/products/[id]/page.jsx
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
    const productId = params.id; // This is the UUID/ID from the URL

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
            .single(); // Get a single record

        if (error || !data) {
            // Use Next.js built-in notFound handler if product doesn't exist
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

    if (!product) return notFound(); // Should be caught by the fetch, but good safeguard

    // --- Product Page Layout (Will be expanded in the next section) ---
    return (
        <div className="mx-auto max-w-7xl px-6 py-12">
            <button 
                onClick={() => router.back()}
                className="text-indigo-600 hover:text-indigo-800 transition mb-6 block"
            >
                &larr; Back to Store
            </button>
            
            <div className="grid md:grid-cols-2 gap-10 bg-white p-8 rounded-3xl shadow-lg">
                {/* Image Section */}
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
                    {product.image_url ? (
                        <Image 
                            src={product.image_url} 
                            alt={product.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400 text-xl">No Image</div>
                    )}
                </div>

                {/* Details Section */}
                <div className="flex flex-col justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{product.name}</h1>
                        <p className="text-xl font-medium text-indigo-600 mb-6">₵{product.price}</p>
                        
                        <h2 className="text-2xl font-semibold text-slate-900 mb-3">About This Product</h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {product.description} {/* Use the existing description as intro text */}
                        </p>
                        {/* More text and specs section will go here in the next step! */}
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <button
                            onClick={() => addToCart(product)}
                            className="btn-gradient w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3"
                        >
                            <ShoppingBag size={20} /> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
