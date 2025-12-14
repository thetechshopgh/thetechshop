// app/api/paystack/initialize/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, amount, metadata } = body; 

    // 🚨 DIAGNOSTIC STEP (Optional, but highly recommended before deploying) 🚨
    console.log("PAYSTACK KEY STATUS:", 
        process.env.PAYSTACK_SECRET_KEY ? "Loaded (sk_...)" : "MISSING/UNDEFINED"
    );
    // Remove the above line once the issue is fixed.

    const paystackUrl = 'https://api.paystack.co/transaction/initialize';

    const res = await fetch(paystackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to pesewas
        currency: 'GHS',       // 🥇 CRITICAL FIX: Explicitly set the currency to GHS
        metadata, 
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://thetechshop.vercel.app'}/api/paystack/callback`, 
      }),
    });

    const data = await res.json();

    if (!res.ok) {
        // Log the actual error response from Paystack's API
        console.error('Paystack API Response Error:', data); 
        throw new Error(data.message || 'Paystack initialization failed');
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Paystack Init Error:', error);
    // If the error happens before the API call, it's still the ENV var issue.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
