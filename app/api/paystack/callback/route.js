// app/api/paystack/callback/route.js (Final fix for DB saving)
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'YOUR_ADMIN_EMAIL@example.com'; 

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
        return new NextResponse("Missing transaction reference", { status: 500 }); 
    }

    try {
        // 1. Verify Transaction with Paystack
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
        });
        const verifyData = await verifyRes.json();

        if (verifyData.data && verifyData.data.status === 'success') {
            const { customer, amount, metadata } = verifyData.data;

            // Extract details with safety fallback (metadata can be null or miss fields)
            const { 
                fullName = 'N/A', // 🛑 Added N/A fallback
                phoneNumber = 'N/A', // 🛑 Added N/A fallback
                digitalAddress = 'N/A', // 🛑 Added N/A fallback
                deliveryAddress = 'N/A', // 🛑 Added N/A fallback
                cartItems = [] 
            } = metadata || {}; // 🛑 IMPORTANT: Default metadata to empty object if null

            const totalAmount = (amount/100).toFixed(2);
            
            // --- 2. Save Order to Supabase ---
            // 🛑 CRITICAL: Ensure the fields are mapped correctly to the database columns
            const { error: dbError } = await supabase.from('orders').insert({
                customer_email: customer.email,
                amount: totalAmount,
                reference: reference,
                status: 'paid',
                
                // Mapped Customer/Delivery Details
                full_name: fullName, 
                phone_number: phoneNumber,
                digital_address: digitalAddress,
                delivery_address: deliveryAddress, 

                order_items_json: JSON.stringify(cartItems), 
            });
            
            if (dbError) {
                console.error("Supabase DB Save Error:", dbError);
            }

            // --- 3. Send Email Notifications ---
            const itemsHtml = cartItems.map(item => 
                `<li>${item.name} (x${item.quantity}) - Price: ₵${item.price.toFixed(2)} each</li>`
            ).join('');

            const emailHtml = `
              <h2 style="color: #10b981;">New Order Alert: #${reference}</h2>
              <p>Total Paid: ₵${totalAmount}</p>
              
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
            `;

            // Send emails (Customer and Admin)
            await resend.emails.send({
                from: 'Orders <onboarding@resend.dev>',
                to: [customer.email],
                subject: `Your Order Confirmation #${reference}`,
                html: emailHtml.replace('New Order Alert:', 'Your Order Confirmation:'),
            });
            
            await resend.emails.send({
                from: 'Orders <onboarding@resend.dev>',
                to: [ADMIN_EMAIL], 
                subject: `NEW ORDER RECEIVED: #${reference} - ₵${totalAmount}`,
                html: emailHtml,
            });
            
            // 4. Redirect user to the Thank You Page
            return NextResponse.redirect(new URL(`/thank-you?reference=${reference}`, req.url));
        }

        // If Paystack verification fails
        return NextResponse.redirect(new URL('/?error=payment_failed', req.url));

    } catch (error) {
        console.error("FATAL CALLBACK API ERROR:", error);
        return NextResponse.redirect(new URL('/?error=server_issue', req.url));
    }
}
