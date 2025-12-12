import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Adjust path if needed
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  // 1. Verify Transaction
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  });
  const verifyData = await verifyRes.json();

  if (verifyData.data.status === 'success') {
    const { customer, amount, metadata } = verifyData.data;
    
    // 2. Save Order to Supabase
    await supabase.from('orders').insert({
      customer_email: customer.email,
      amount: amount / 100,
      reference: reference,
      status: 'paid',
      product_id: metadata.productId
    });

    // 3. Send Email (Admin + Customer)
    await resend.emails.send({
      from: 'Store <onboarding@resend.dev>',
      to: [customer.email],
      subject: 'Order Confirmed',
      html: `<strong>Thanks for your order!</strong> We have received your payment of ${amount/100} GHS.`
    });

    // Redirect user to a success page
    return NextResponse.redirect(new URL('/?success=true', req.url));
  }

  return NextResponse.redirect(new URL('/?error=payment_failed', req.url));
}
