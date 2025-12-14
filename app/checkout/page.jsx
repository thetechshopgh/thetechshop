// app/checkout/page.jsx
'use client'
import { useState } from 'react';
import { useCart } from '../../components/CartContext'; // Adjust path if needed
import { useRouter } from 'next/navigation';

export default function Checkout() {
    const { cart, cartTotal } = useCart();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    
    // State for delivery information
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        digitalAddress: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        if (cart.length === 0) {
            alert("Your cart is empty.");
            setIsProcessing(false);
            return;
        }

        try {
            // 1. Prepare FULL payload for Supabase saving
            const fullOrderPayload = {
                email: formData.email,
                amount: cartTotal,
                metadata: {
                    cartItems: cart,
                    fullName: formData.name,
                    phoneNumber: formData.phone,
                    digitalAddress: formData.digitalAddress,
                    deliveryAddress: formData.address,
                },
            };

            // 🚨 STEP 1: Save PENDING order to Supabase and get the UUID 🚨
            const createRes = await fetch('/api/order/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullOrderPayload),
            });

            if (!createRes.ok) {
                const errorData = await createRes.json();
                console.error("Order Creation Error:", errorData);
                throw new Error(errorData.error || "Failed to create pending order in database.");
            }
            
            const { order_uuid } = await createRes.json();
            
            // 2. Prepare payload for Paystack initialization
            const paystackPayload = {
                email: formData.email,
                amount: cartTotal,
                // 🚨 STEP 2: Send ONLY the UUID, which Paystack accepts cleanly 🚨
                metadata: { 
                    order_uuid: order_uuid,
                    // Optionally send the customer email again for Paystack UI
                    customer_email: formData.email 
                },
            };

            // 3. Send to Paystack initialization API
            const res = await fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paystackPayload),
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error("Paystack Init API Error:", errorText);
                throw new Error("Failed to initialize payment with Paystack.");
            }

            const data = await res.json();
            
            if (data.authorization_url) {
                window.location.href = data.authorization_url; // Redirect to Paystack
            } else {
                alert("Failed to initialize payment. Please try again.");
                setIsProcessing(false);
            }

        } catch (error) {
            console.error("Checkout Fatal Error:", error);
            alert(`An error occurred: ${error.message || 'Please check your internet connection.'}`);
            setIsProcessing(false);
        }
    };
    
    if (cart.length === 0) {
        return <div className="text-center p-20">Your cart is empty. <button onClick={() => router.push('/')} className="text-indigo-600 font-bold">Start Shopping</button></div>;
    }

    return (
        <div className="mx-auto max-w-4xl p-10 bg-gray-50 rounded-3xl shadow-2xl my-10">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 border-b pb-4">Delivery Details & Payment</h1>
            
            {/* Order Summary */}
            <div className="mb-8 p-4 bg-white rounded-lg shadow-inner">
                <h2 className="text-xl font-semibold mb-3 border-b pb-2 text-slate-800">Order Summary</h2>
                <div className="space-y-1">
                    {cart.map(item => (
                        <p key={item.id} className="flex justify-between text-slate-600 text-sm">
                            <span>{item.name} x {item.quantity}</span>
                            <span>₵{(item.price * item.quantity).toFixed(2)}</span>
                        </p>
                    ))}
                </div>
                <p className="flex justify-between text-2xl font-bold mt-4 pt-3 border-t border-slate-200">
                    <span>Total:</span>
                    <span>₵{cartTotal.toFixed(2)}</span>
                </p>
            </div>

            {/* Delivery Form */}
            <form onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow">
                <h2 className="md:col-span-2 text-xl font-semibold border-b pb-2 mb-4 text-slate-800">Customer Information</h2>

                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} required
                        className="mt-1 w-full rounded-md border border-gray-300 p-3 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (for receipt)</label>
                    <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required
                        className="mt-1 w-full rounded-md border border-gray-300 p-3 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                {/* Phone Number */}
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                        className="mt-1 w-full rounded-md border border-gray-300 p-3 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                {/* Digital Address */}
                <div>
                    <label htmlFor="digitalAddress" className="block text-sm font-medium text-gray-700">Digital Address (e.g., GA-123-4567)</label>
                    <input id="digitalAddress" type="text" name="digitalAddress" value={formData.digitalAddress} onChange={handleChange} required
                        className="mt-1 w-full rounded-md border border-gray-300 p-3 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                {/* Physical Address */}
                <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Detailed Delivery Address</label>
                    <textarea id="address" name="address" value={formData.address} onChange={handleChange} required rows="3"
                        className="mt-1 w-full rounded-md border border-gray-300 p-3 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                </div>
                
                {/* Submit Button Area */}
                <div className="md:col-span-2 pt-4">
                    
                    {/* Refund Policy Text Block */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded">
                        <p className="text-sm text-blue-800">
                            <span className="font-bold">Refund Policy:</span> For change-of-mind returns, please note that refunds will only be processed after 7 days from the delivery date. Full details are in our Terms.
                        </p>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={isProcessing}
                        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl transition duration-150 ease-in-out 
                            ${isProcessing 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'}`}
                    >
                        {isProcessing ? 'Processing Payment...' : `Pay ₵${cartTotal.toFixed(2)}`}
                    </button>
                </div>
            </form>
        </div>
    );
}
