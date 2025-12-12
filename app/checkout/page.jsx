// app/checkout/page.jsx
'use client'
import { useState } from 'react';
import { useCart } from '../../components/CartContext'; // Adjust path
import { useRouter } from 'next/navigation';

export default function Checkout() {
  const { cart, cartTotal } = useCart();
  const router = useRouter();
  
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

    if (cart.length === 0) return alert("Your cart is empty.");

    // 1. Prepare data for Paystack initialization
    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.email,
        amount: cartTotal,
        // Pass all delivery details in metadata
        metadata: {
          cartItems: cart,
          fullName: formData.name,
          phoneNumber: formData.phone,
          digitalAddress: formData.digitalAddress,
          deliveryAddress: formData.address,
        },
      }),
    });
    
    const data = await res.json();
    
    if (data.authorization_url) {
      window.location.href = data.authorization_url; // Redirect to Paystack
    } else {
      alert("Failed to initialize payment. Please try again.");
    }
  };
  
  if (cart.length === 0) {
      return <div className="text-center p-20">Your cart is empty. <button onClick={() => router.push('/')} className="text-indigo-600 font-bold">Start Shopping</button></div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-10 bg-white rounded-3xl shadow-xl my-10">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Delivery Details & Payment</h1>
      
      {/* Order Summary */}
      <div className="mb-8 border-b pb-4">
          <h2 className="text-xl font-semibold mb-3">Order Summary</h2>
          {cart.map(item => (
              <p key={item.id} className="flex justify-between text-slate-600">
                  <span>{item.name} x {item.quantity}</span>
                  <span>₵{(item.price * item.quantity).toFixed(2)}</span>
              </p>
          ))}
          <p className="flex justify-between text-2xl font-bold mt-4">
              <span>Total:</span>
              <span>₵{cartTotal.toFixed(2)}</span>
          </p>
      </div>

      {/* Delivery Form */}
      <form onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required
            className="mt-1 w-full rounded-md border p-3" />
        </div>
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email (for receipt)</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required
            className="mt-1 w-full rounded-md border p-3" />
        </div>
        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
            className="mt-1 w-full rounded-md border p-3" />
        </div>
        {/* Digital Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Digital Address (e.g., GA-123-4567)</label>
          <input type="text" name="digitalAddress" value={formData.digitalAddress} onChange={handleChange} required
            className="mt-1 w-full rounded-md border p-3" />
        </div>
        {/* Physical Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Detailed Delivery Address</label>
          <textarea name="address" value={formData.address} onChange={handleChange} required rows="3"
            className="mt-1 w-full rounded-md border p-3"></textarea>
        </div>
        
        {/* Submit Button */}
        <div className="md:col-span-2 pt-4">
          <button type="submit" className="btn-gradient w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg">
            Pay ₵{cartTotal.toFixed(2)}
          </button>
        </div>
      </form>
    </div>
  );
}
