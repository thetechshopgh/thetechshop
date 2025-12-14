import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, amount, metadata } = body;

    // --- 1. Validation and Data Sanitization (CRITICAL) ---
    
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error("CONFIGURATION ERROR: PAYSTACK_SECRET_KEY is missing.");
        throw new Error('Server authentication key is missing.');
    }

    // 🚨 Sanitizing Email: Use a fallback if the client sends a blank or invalid email
    const safeEmail = email && String(email).trim().includes('@') 
        ? String(email).trim() 
        : 'customer@example.com'; // Use a generic, valid fallback email
        
    // Sanitizing Metadata: Only include safe string properties or keep it minimal
    const safeMetadata = metadata ? { 
        custom_fields: metadata.custom_fields,
        order_reference: metadata.order_reference,
        // Avoid sending the full 'cartItems' object if it's large or complex
    } : {};

    // Amount Processing
    const totalPesewas = Math.round(Number(amount) * 100);
    const MINIMUM_AMOUNT_PESEWAS = 50; 

    if (isNaN(totalPesewas) || totalPesewas < MINIMUM_AMOUNT_PESEWAS) {
        throw new Error(`Payment amount must be at least ₵${(MINIMUM_AMOUNT_PESEWAS / 100).toFixed(2)}.`);
    }

    // Define the secure Callback URL
    const CALLBACK_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://thetechshop.vercel.app'}/api/paystack/callback`;
    
    const paystackUrl = 'https://api.paystack.co/transaction/initialize';

    // --- 2. Call Paystack API ---
    const res = await fetch(paystackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: safeEmail, // Using the sanitized email
        amount: totalPesewas, 
        currency: 'GHS', 
        metadata: safeMetadata, // Using the sanitized metadata
        callback_url: CALLBACK_URL, 
      }),
    });

    // --- 3. Handle API Response ---
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
