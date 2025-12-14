// app/api/paystack/initialize/route.js (MINIMAL REQUEST TEST)

import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount } = body; // Only need amount for this test

    if (!process.env.PAYSTACK_SECRET_KEY) {
        throw new Error('Server authentication key is missing.');
    }

    const totalPesewas = Math.round(Number(amount) * 100);
    const MINIMUM_AMOUNT_PESEWAS = 500; // 🚨 Set a high, safe amount for the test (e.g., ₵5.00 GHS)

    if (isNaN(totalPesewas) || totalPesewas < MINIMUM_AMOUNT_PESEWAS) {
        // Use the high safe amount for the test
        const TEST_AMOUNT = MINIMUM_AMOUNT_PESEWAS; 
        
        const paystackUrl = 'https://api.paystack.co/transaction/initialize';

        const res = await fetch(paystackUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'thetechshopgh@gmail.com', // 🚨 KNOWN GOOD EMAIL
                amount: TEST_AMOUNT,          // 🚨 HIGH TEST AMOUNT
                currency: 'GHS',
                // metadata and callback_url are GONE
            }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            console.error(`Paystack API Error Status: ${res.status}`, data);
            throw new Error(data.message || `Payment initialization failed with status ${res.status}.`);
        }

        return NextResponse.json(data.data);
    }
    
    // If the cart total was above the test minimum, proceed with the original flow (with minimal fields)
    const paystackUrl = 'https://api.paystack.co/transaction/initialize';

    const res = await fetch(paystackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com', // 🚨 KNOWN GOOD EMAIL
        amount: totalPesewas, 
        currency: 'GHS', 
        // metadata and callback_url are GONE
      }),
    });

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
