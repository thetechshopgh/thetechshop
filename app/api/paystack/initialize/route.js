// app/api/paystack/initialize/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    // 🚨 We now expect order_uuid in the metadata 🚨
    const { email, amount, metadata } = body; 

    // --- Validation ---
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error("CONFIGURATION ERROR: PAYSTACK_SECRET_KEY is missing.");
        throw new Error('Server authentication key is missing.');
    }
    const order_uuid = metadata?.order_uuid;
    if (!order_uuid) {
        throw new Error('Missing order ID for payment initialization.');
    }
    
    const safeEmail = email && String(email).trim().includes('@') ? String(email).trim() : 'customer@example.com';
    const totalPesewas = Math.round(Number(amount) * 100);
    const MINIMUM_AMOUNT_PESEWAS = 50; 

    if (isNaN(totalPesewas) || totalPesewas < MINIMUM_AMOUNT_PESEWAS) {
        throw new Error(`Payment amount must be at least ₵${(MINIMUM_AMOUNT_PESEWAS / 100).toFixed(2)}.`);
    }

    const CALLBACK_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://thetechshop.vercel.app'}/api/paystack/callback`;
    const paystackUrl = 'https://api.paystack.co/transaction/initialize';

    // --- Call Paystack API ---
    const res = await fetch(paystackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: safeEmail, 
        amount: totalPesewas, 
        currency: 'GHS', 
        // 🚨 CRITICAL: Send only the UUID in metadata 🚨
        metadata: { order_uuid: order_uuid }, 
        callback_url: CALLBACK_URL, 
      }),
    });

    // --- Handle API Response ---
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
