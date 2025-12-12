// app/api/paystack/callback/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  if (!reference) {
     return NextResponse.redirect(new URL('/?error=no_reference', req.url));
  }

  // 1. Verify Transaction with Paystack
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  });
  const verifyData = await verifyRes.json();

  if (verifyData.data && verifyData.data.status === 'success') {
    const { customer, amount, metadata } = verifyData.data;

    // 🛑 Extract delivery and order details from metadata
    const { 
        fullName, 
        phoneNumber, 
        digitalAddress, 
        deliveryAddress,
        cartItems // Array of purchased items
    } = metadata;

    // 2. Save Order to Supabase
    // NOTE: This inserts ONE order record with delivery details.
    // If you need per-item tracking, you would iterate over cartItems and insert into a separate 'order_items' table.
    
    // For this implementation, we save the full cart array as JSON/TEXT for the admin to view.
    const { error: dbError } = await supabase.from('orders').insert({
      customer_email: customer.email,
      amount: amount / 100,
      reference: reference,
      status: 'paid',
      full_name: fullName,
      phone_number: phoneNumber,
      digital_address: digitalAddress,
      // Store the entire cart JSON for order processing
      delivery_address: deliveryAddress, 
      order_items_json: JSON.stringify(cartItems), 
    });
    
    if (dbError) {
        console.error("Supabase Error:", dbError);
        // Still redirect to success, but log the DB issue
    }

    // 3. Send Email Notifications
    await resend.emails.send({
      from: 'Orders <onboarding@resend.dev>',
      to: [customer.email, 'your-admin-email@gmail.com'], // Send to Admin too!
      subject: `NEW ORDER #${reference} - PAID`,
      html: `
        <h2 style="color: #6366f1;">Thank you for your order!</h2>
        <p>Your payment of ₵${(amount/100).toFixed(2)} has been successfully processed.</p>
        
        <h3>Items Ordered:</h3>
        <ul>
            ${cartItems.map(item => `<li>${item.name} (x${item.quantity}) @ ₵${item.price} each</li>`).join('')}
        </ul>

        <h3>Delivery Details:</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Phone:</strong> ${phoneNumber}</p>
        <p><strong>Digital Address:</strong> ${digitalAddress}</p>
        <p><strong>Physical Address:</strong> ${deliveryAddress}</p>
        <p>Reference: ${reference}</p>
      `
    });
    
    // 4. Redirect user and clear cart (implicitly handled by app state on success page if you clear it there)
    return NextResponse.redirect(new URL('/?success=true', req.url));
  }

  // Payment Failed
  return NextResponse.redirect(new URL('/?error=payment_failed', req.url));
}
