// app/api/paystack/callback/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Define your Admin Email here:
const ADMIN_EMAIL = 'thetechshopgh@gmail.com'; 

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  if (!reference) {
     return NextResponse.redirect(new URL(`/thank-you?reference=${reference}`, req.url));
  }

  // 1. Verify Transaction with Paystack
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  });
  const verifyData = await verifyRes.json();

  if (verifyData.data && verifyData.data.status === 'success') {
    const { customer, amount, metadata } = verifyData.data;

    // Extract details
    const { 
        fullName, 
        phoneNumber, 
        digitalAddress, 
        deliveryAddress,
        cartItems 
    } = metadata;
    const totalAmount = (amount/100).toFixed(2);

    // 2. Save Order to Supabase
    const { error: dbError } = await supabase.from('orders').insert({
      customer_email: customer.email,
      amount: totalAmount,
      reference: reference,
      status: 'paid',
      full_name: fullName,
      phone_number: phoneNumber,
      digital_address: digitalAddress,
      delivery_address: deliveryAddress, 
      order_items_json: JSON.stringify(cartItems), 
    });
    
    if (dbError) {
        console.error("Supabase DB Save Error:", dbError);
    }

    // --- 3. Construct Email Content ---
    
    // Items List for Email HTML
    const itemsHtml = cartItems.map(item => 
      `<li>${item.name} (x${item.quantity}) - Price: ₵${item.price.toFixed(2)}</li>`
    ).join('');

    const emailHtml = `
      <h2 style="color: #10b981;">New Order Alert: #${reference}</h2>
      <p>A new payment of ₵${totalAmount} has been successfully received.</p>
      
      <h3>Customer & Delivery Details:</h3>
      <ul style="list-style-type: none; padding: 0;">
          <li><strong>Customer Name:</strong> ${fullName}</li>
          <li><strong>Email:</strong> ${customer.email}</li>
          <li><strong>Phone:</strong> ${phoneNumber}</li>
          <li><strong>Digital Address:</strong> ${digitalAddress}</li>
          <li><strong>Physical Address:</strong> ${deliveryAddress}</li>
          <li><strong>Transaction Ref:</strong> ${reference}</li>
      </ul>

      <h3>Items Ordered:</h3>
      <ul style="padding-left: 20px;">
          ${itemsHtml}
      </ul>
      <h3 style="color: #0f172a;">Total Paid: ₵${totalAmount}</h3>
    `;

    // 4. Send Email Notifications
    // Send to Customer (Receipt)
    await resend.emails.send({
      from: 'Store <onboarding@resend.dev>',
      to: [customer.email],
      subject: `Your Order Confirmation #${reference}`,
      html: emailHtml.replace('New Order Alert:', 'Your Order Confirmation:'), // Customize subject/heading for customer
    });
    
    // Send to Admin (Notification)
    await resend.emails.send({
      from: 'Store <onboarding@resend.dev>',
      to: [ADMIN_EMAIL], // 🛑 YOUR ADMIN EMAIL HERE
      subject: `NEW ORDER RECEIVED: #${reference} - ₵${totalAmount}`,
      html: emailHtml,
    });
    
    // 5. Redirect user to the new Thank You Page
    return NextResponse.redirect(new URL(`/thank-you?reference=${reference}`, req.url));
  }

  // Payment Failed
  return NextResponse.redirect(new URL('/?error=payment_failed', req.url));
}
