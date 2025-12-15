// app/thank-you/page.jsx
'use client'
import { CheckCircle, Info } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { useEffect } from 'react';

export default function ThankYouPage() {
    const searchParams = useSearchParams();
    const reference = searchParams.get('reference');
    const router = useRouter();
    const { clearCart } = useCart();

    useEffect(() => {
        clearCart();
    }, [clearCart]);

    if (!reference) {
        router.replace('/');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-white p-10 rounded-2xl shadow-xl text-center">
                <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />

                <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
                    Order Placed Successfully!
                </h1>

                <p className="text-lg text-slate-600 mb-8">
                    Thank you for shopping with TechyCity. Your order is being processed.
                </p>

                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
                    <h2 className="text-xl font-bold text-indigo-700 mb-3">
                        Order Summary
                    </h2>

                    <p className="font-semibold text-slate-800">
                        Transaction Reference:
                        <span className="block text-xl text-indigo-900 mt-1">
                            {reference}
                        </span>
                    </p>

                    <p className="text-sm text-slate-500 mt-4">
                        A detailed receipt and order details have been sent to your email.
                    </p>

                    {/* 🔔 SPAM NOTICE */}
                    <div className="mt-4 flex items-start gap-2 text-sm text-indigo-700 bg-indigo-100 p-3 rounded-lg">
                        <Info size={18} className="mt-0.5" />
                        <p>
                            If you don’t see the email in your inbox, please check your
                            <span className="font-semibold"> spam or promotions folder</span>.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center rounded-full px-6 py-3 bg-slate-900 text-white font-semibold hover:bg-slate-700 transition"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    );
}
