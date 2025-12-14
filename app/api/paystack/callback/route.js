// app/api/paystack/callback/route.js (Final code with POST Webhook & Uniqueness Check)
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
// import crypto from 'crypto'; // Needed for webhook verification (not in this version)

const resend = new Resend(process.env.RESEND_API_KEY);
// 🛑 REMINDER: Replace this placeholder with your actual admin email!
const ADMIN_EMAIL = 'YOUR_ADMIN_EMAIL@example.com'; 

// --- Core Verification and Fulfillment Logic ---
async function handlePaystackFulfillment(reference) {
    // 1. Check if the order has already been processed (Uniqueness Check)
    const { data: existingOrder, error: fetchError } = await supabase
        .from('orders')
        .select('id')
        .eq('reference', reference)
        .single();
        
    if (existingOrder) {
        // Order already exists, prevent duplicate processing.
        return { success: true, message: "Order already processed." };
    }
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means 'No rows found'
        console.error("Supabase Order Check Error:", fetchError);
        return { success: false, message: "Database query error." };
    }


    // 2. Verify Transaction with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.data || verifyData.data.status !== 'success') {
        console.error('Paystack Verification Failed:', verifyData);
        return { success: false, message: "Payment not successful." };
    }
    
    const { customer, amount, metadata } = verifyData.data;

    // Extract details from metadata
    const { 
        fullName = 'N/A', 
        phoneNumber = 'N/A', 
        digitalAddress = 'N/A', 
        deliveryAddress = 'N/A', 
        cartItems = [] 
    } = metadata || {}; 

    const totalAmount = (amount/100).toFixed(2);
    
    // --- 3. Save Order to Supabase ---
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
        // Do NOT return false here, as we still want the email to go out
    }

    // --- 4. Prepare and Send Email Notifications ---
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
    try {
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
    } catch (emailError) {
        console.error("Resend Email Error:", emailError);
    }

    return { success: true, message: "Order processed successfully." };
}

// ------------------------------------------------------------------
// 🚨 HTTP GET Handler (Customer Redirect) 🚨
// ------------------------------------------------------------------
export async function GET(req) {
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference');

    if (!reference) {
        return NextResponse.redirect(new URL('/order/failure?code=no_ref', url)); 
    }

    try {
        // Run the main fulfillment logic
        const result = await handlePaystackFulfillment(reference);

        if (result.success) {
            // Success: Redirect user to the Thank You Page
            return NextResponse.redirect(new URL(`/thank-you?reference=${reference}`, url));
        }

        // Failure: Redirect to a payment failure page
        return NextResponse.redirect(new URL('/order/failure?code=verification_failed', url));

    } catch (error) {
        console.error("FATAL CALLBACK API ERROR:", error);
        // Redirect to a general server issue page
        return NextResponse.redirect(new URL('/order/failure?code=server_error', url));
    }
}

// ------------------------------------------------------------------
// 🚨 HTTP POST Handler (Paystack Webhook) 🚨
// ------------------------------------------------------------------
export async function POST(req) {
    try {
        const body = await req.json();
        
        // ⚠️ SECURITY STEP: Paystack recommends verifying the webhook signature here
        // if (!verifySignature(req.headers.get('x-paystack-signature'), req.body)) {
        //     return new NextResponse("Invalid Signature", { status: 400 });
        // }

        if (body.event === 'charge.success') {
            const reference = body.data.reference;
            
            // Run the main fulfillment logic (it handles the verification check internally)
            await handlePaystackFulfillment(reference);
            
            // Webhook must return a 200 status code to acknowledge receipt
            return new NextResponse(JSON.stringify({ message: "Webhook received and processed." }), { status: 200 });
        }
        
        // Acknowledge other events without processing
        return new NextResponse(JSON.stringify({ message: "Event ignored." }), { status: 200 });

    } catch (error) {
        console.error("FATAL WEBHOOK API ERROR:", error);
        // Return 200 so Paystack doesn't keep retrying, but log the error
        return new NextResponse(JSON.stringify({ message: "Error processing webhook." }), { status: 200 }); 
    }
}
