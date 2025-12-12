import { NextResponse } from 'next/server';

export async function POST(req) {
  const { email, amount, productId } = await req.json();
  
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      email, 
      amount: amount * 100, // Convert to kobo
      callback_url: `${process.env.NEXT_PUBLIC_URL || 'https://your-vercel-app.vercel.app'}/api/paystack/callback`,
      metadata: { productId }
    }),
  });

  const data = await res.json();
  return NextResponse.json(data.data);
}
