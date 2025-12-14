// app/api/paystack/initialize/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, amount, metadata } = body;

    // --- 1. Validation and Amount Preparation ---
    
    // Safety check: Ensure the secret key is defined before using it
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error("CONFIGURATION ERROR: PAYSTACK_SECRET_KEY is missing or undefined.");
        throw new Error('Server authentication key is missing. Cannot process payment.');
    }

    // Convert client-side amount (e.g., 12.50) to Pesewas (1250) and ensure it's a safe integer.
    const totalPesewas = Math.round(Number(amount) * 100);
    const MINIMUM_AMOUNT_PESEWAS = 50; // Minimum transaction amount (₵0.50 GHS)

    // Validate the final calculated amount
    if (isNaN(totalPesewas) || totalPesewas < MINIMUM_AMOUNT_PESEWAS) {
        console.error(`Invalid payment amount: ${totalPesewas} pesewas.`);
        throw new Error(`Payment amount must be at least ₵${(MINIMUM_AMOUNT_PESEWAS / 100).toFixed(2)}.`);
    }

    // Define the secure Callback URL
    // Use the actual deployed Vercel URL for production (set as NEXT_PUBLIC_BASE_URL)
    const CALLBACK_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://thetechshop.vercel.app'}/api/paystack/callback`;
    
    const paystackUrl = 'https://api.paystack.co/transaction/initialize';

    // --- 2. Call Paystack API ---
    const res = await fetch(paystackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Uses secure ENV variable
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: totalPesewas, 
        currency: 'GHS', // Essential for GHS payments
        metadata, 
        callback_url: CALLBACK_URL, 
      }),
    });

    // --- 3. Handle API Response ---
    const data = await res.json();

    if (!res.ok) {
        // Log the specific status and Paystack's error message for server diagnosis
        console.error(`Paystack API Error Status: ${res.status}`, data); 
        throw new Error(data.message || `Payment initialization failed with status ${res.status}.`);
    }

    // Success: Return the authorization URL to the client
    return NextResponse.json(data.data);
    
  } catch (error) {
    console.error('Paystack Init Critical Error:', error.message);
    // Return a generic 500 error to the client
    return NextResponse.json({ error: 'Payment initialization failed. Please try again later.' }, { status: 500 });
  }
}
