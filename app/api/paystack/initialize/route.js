import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, amount, metadata } = body;

    // 🚨 1. TEMPORARY HARDCODED KEY FOR DEBUGGING 🚨
    // Replace 'sk_test_YOUR_ACTUAL_TEST_SECRET_KEY' with the key from your Paystack Dashboard.
    // Ensure you use your ACTUAL TEST Key here, not the production one.
    const DEBUG_SECRET_KEY = 'sk_test_5ffde4e7b9b2f47df003e1c20357d77eea051496'; 
    // If you are testing on your live site, use your LIVE key instead:
    // const DEBUG_SECRET_KEY = 'sk_live_xxxxxxxxxxxxxxxxxxxxxx'; 
    
    // Check if the hardcoded key is defined before proceeding (safety check)
    if (!DEBUG_SECRET_KEY || DEBUG_SECRET_KEY.includes('xxxxxxxx')) {
        console.error("DEBUG ERROR: Debug key is not set. Please replace the placeholder.");
        throw new Error('Debugging key not configured.');
    }

    // Ensure the amount is a valid positive number and convert to pesewas
    const totalPesewas = Math.round(Number(amount) * 100);

    if (isNaN(totalPesewas) || totalPesewas <= 0) {
        throw new Error('Invalid or zero payment amount.');
    }

    const paystackUrl = 'https://api.paystack.co/transaction/initialize';

    // --- 2. Call Paystack API using the hardcoded key ---
    const res = await fetch(paystackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DEBUG_SECRET_KEY}`, // 🚨 USING THE HARDCODED KEY HERE 🚨
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: totalPesewas, 
        currency: 'GHS', 
        metadata, 
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://thetechshop.vercel.app'}/api/paystack/callback`, 
      }),
    });

    // --- 3. Handle API Response ---
    const data = await res.json();

    if (!res.ok) {
        // Log the actual status code from Paystack
        console.error(`Paystack API Error Status: ${res.status}`, data); 
        throw new Error(data.message || `Paystack initialization failed with status ${res.status}`);
    }

    return NextResponse.json(data.data);
    
  } catch (error) {
    console.error('Paystack Init Critical Error:', error.message);
    return NextResponse.json({ error: 'Payment initialization failed. Please try again later.' }, { status: 500 });
  }
}
