import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, amount, metadata } = body;

    // --- 1. Validation and Amount Preparation (Final Logic) ---
    
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error("ENVIRONMENT ERROR: PAYSTACK_SECRET_KEY is missing.");
        throw new Error('Server authentication key is missing.');
    }

    // Convert client-side amount (e.g., 12.50) to Pesewas (1250)
    const totalPesewas = Math.round(Number(amount) * 100);
    const MINIMUM_AMOUNT_PESEWAS = 50; // ₵0.50 GHS

    if (isNaN(totalPesewas) || totalPesewas < MINIMUM_AMOUNT_PESEWAS) {
        throw new Error(`Payment amount must be at least ₵${(MINIMUM_AMOUNT_PESEWAS / 100).toFixed(2)}.`);
    }

    // --- 2. Define Callback URL ---
    // Use the secure base URL for redirecting after payment.
    // The fallback URL is necessary for Vercel builds if the ENV var is missing.
    const CALLBACK_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://thetechshop.vercel.app'}/api/paystack/callback`;
    
    const paystackUrl = 'https://api.paystack.co/transaction/initialize';

    // --- 3. Call Paystack API ---
    const res = await fetch(paystackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: totalPesewas, 
        currency: 'GHS', // Ensures GHS is used
        metadata, 
        callback_url: CALLBACK_URL, // Using the resolved, secure callback URL
      }),
    });

    // --- 4. Handle API Response ---
    const data = await res.json();

    if (!res.ok) {
        console.error(`Paystack API Error Status: ${res.status}`, data); 
        throw new Error(data.message || `Payment initialization failed with status ${res.status}.`);
    }

    return NextResponse.json(data.data);
    
  } catch (error) {
    console.error('Paystack Init Critical Error:', error.message);
    return NextResponse.json({ error: 'Payment initialization failed. Please try again later.' }, { status: 500 });
  }
}
