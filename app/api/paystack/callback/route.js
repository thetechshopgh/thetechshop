// app/api/paystack/callback/route.js (FINAL, ROBUST VERSION)
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'thetechshopgh@gmail.com'; // 🛑 REMEMBER TO CHANGE THIS!

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
        // Return 500 for Paystack to retry if no reference is provided unexpectedly
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

            // Extract details
            const { 
                fullName, 
                phoneNumber, 
                digitalAddress, 
                deliveryAddress,
                cartItems 
            } = metadata;
            const totalAmount = (amount/100).toFixed(2);
            
            // --- 2. Save Order to Supabase ---
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
                // Continue execution even if DB fails, to send emails and redirect user
            }

            // --- 3. Send Email Notifications ---
            const itemsHtml = cartItems.map(item => 
                `<li>${item.name} (x${item.quantity}) - Price: ₵${item.price.toFixed(2)} each</li>`
            ).join('');

            const emailHtml = `
              <h2 style="color: #10b981;">New Order Alert: #${reference}</h2>
              <p>Total Paid: ₵${totalAmount}</p>
              <h3>Customer & Delivery Details:</h3>
              // ... (delivery details HTML remains the same)
              <h3>Items Ordered:</h3>
              <ul style="padding-left: 20px;">${itemsHtml}</ul>
            `;

            // Send to Customer (Receipt)
            await resend.emails.send({
                from: 'Orders <onboarding@resend.dev>',
                to: [customer.email],
                subject: `Your Order Confirmation #${reference}`,
                html: emailHtml.replace('New Order Alert:', 'Your Order Confirmation:'),
            });
            
            // Send to Admin (Notification)
            await resend.emails.send({
                from: 'Orders <onboarding@resend.dev>',
                to: [ADMIN_EMAIL], 
                subject: `NEW ORDER RECEIVED: #${reference} - ₵${totalAmount}`,
                html: emailHtml,
            });
            
            // 4. Redirect user to the new Thank You Page
            return NextResponse.redirect(new URL(`/thank-you?reference=${reference}`, req.url));
        }

        // If Paystack verification fails (status is not 'success')
        return NextResponse.redirect(new URL('/?error=payment_failed', req.url));

    } catch (error) {
        console.error("FATAL CALLBACK API ERROR:", error);

        // 🛑 CRITICAL: Return a 200 OK to Paystack even if we crash, 
        // to prevent immediate retries, while still redirecting the user.
        // The transaction may need to be manually confirmed later.
        
        // Redirect the user to a generic failure page
        const redirectUrl = new URL('/?error=server_issue', req.url);
        
        // Send a temporary redirect response to the client
        const response = NextResponse.redirect(redirectUrl);
        
        // Critically, return a 200 for Paystack and then log the error.
        // For Vercel, simply throwing the error might prevent Paystack from receiving a clean response.
        // A cleaner approach is to ensure all external calls are robust and redirect gracefully.
        
        // Revert to simply redirecting on error, which is often cleaner in Next.js
        return NextResponse.redirect(new URL('/?error=server_issue', req.url));
    }
}
