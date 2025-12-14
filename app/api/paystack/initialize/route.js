import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, amount, metadata } = body;

    // --- 1. Validation and Amount Preparation (CRITICAL FIX AREA) ---
    
    // Check Secret Key (Production safety check)
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error("ENVIRONMENT ERROR: PAYSTACK_SECRET_KEY is missing.");
        throw new Error('Server authentication key is missing.');
    }

    // Convert client-side amount (e.g., 12.50) to Pesewas (1250) and ensure it's a safe integer.
    const totalPesewas = Math.round(Number(amount) * 100);
    const MINIMUM_AMOUNT_PESEWAS = 50; // Minimum transaction amount (₵0.50 GHS)

    // Validate the final calculated amount
    if (isNaN(totalPesewas) || totalPesewas < MINIMUM_AMOUNT_PESEWAS) {
        console.error(`Invalid payment amount: ${totalPesewas} pesewas.`);
        // Note: The client-side should prevent this, but this is a server defense.
        throw new Error(`Payment amount must be at least ₵${(MINIMUM_AMOUNT_PESEWAS / 100).toFixed(2)}.`);
    }
    
    const paystackUrl = 'https://api.paystack.co/transaction/initialize';

    // --- 2. Call Paystack API ---
    const res = await fetch(paystackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Using the secure ENV variable
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: totalPesewas, 
        currency: 'GHS', // Required for Ghana transactions
        metadata, 
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://thetechshop.vercel.app'}/api/paystack/callback`, 
      }),
    });

    // --- 3. Handle API Response ---
    const data = await res.json();

    if (!res.ok) {
        // Log the exact status code and Paystack's error message
        console.error(`Paystack API Error Status: ${res.status}`, data); 
        // Return a slightly more helpful error to the client
        throw new Error(data.message || `Payment initialization failed with status ${res.status}.`);
    }

    // Success: Return the authorization URL to the client
    return NextResponse.json(data.data);
    
  } catch (error) {
    console.error('Paystack Init Critical Error:', error.message);
    // Return a generic 500 error to the client for security
    return NextResponse.json({ error: 'Payment initialization failed. Please try again later.' }, { status: 500 });
  }
}
