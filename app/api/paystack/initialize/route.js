// app/api/paystack/initialize/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, amount, metadata } = body; // 🛑 We must accept 'metadata' here

    const paystackUrl = 'https://api.paystack.co/transaction/initialize';

    const res = await fetch(paystackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo/pesewas
        metadata, // 🛑 CRITICAL: Pass the metadata (names, address) to Paystack
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://thetechshop.vercel.app'}/api/paystack/callback`, 
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Paystack initialization failed');
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Paystack Init Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
