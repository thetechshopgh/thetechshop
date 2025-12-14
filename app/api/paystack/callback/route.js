import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
// 🛑 REMINDER: Ensure you have replaced this with your actual admin email!
const ADMIN_EMAIL = 'YOUR_ADMIN_EMAIL@example.com'; 

// --- Core Verification and Fulfillment Logic ---
async function handlePaystackFulfillment(reference) {
    // 1. Check if the order has already been processed (Uniqueness Check)
    const { data: existingOrder, error: fetchError } = await supabase
        .from('orders')
        .select('id')
        .eq('reference', reference)
        .single();
        
    // Paystack might call us multiple times (webhook and redirect), this prevents duplicates.
    if (existingOrder) {
        return { success: true, message: "Order already processed." };
    }
    
    // Ignore 'no rows found' error (PGRST116), throw other errors
    if (fetchError && fetchError.code !== 'PGRST116') { 
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

    // 🚨 METADATA FIX: Use object spreading to ensure variables are defined 🚨
    // We assume your metadata keys match the target database columns (e.g., 'full_name' or 'fullName')
    const customerDetails = {
        fullName: metadata?.fullName || metadata?.full_name || 'N/A', 
        phoneNumber: metadata?.phoneNumber || metadata?.phone_number || 'N/A', 
        digitalAddress: metadata?.digitalAddress || metadata?.digital_address || 'N/A', 
        deliveryAddress: metadata?.deliveryAddress || metadata?.delivery_address || 'N/A', 
        cartItems: metadata?.cartItems || [], // Keep cartItems separate
    };

    const totalAmount = (amount/100).toFixed(2);
    
    // --- 3. Save Order to Supabase ---
    const { error: dbError } = await supabase.from('orders').insert({
        customer_email: customer.email,
        amount: totalAmount,
        reference: reference,
        status: 'paid',
        
        // Map the safely extracted details to the database columns:
        full_name: customerDetails.fullName, 
        phone_number: customerDetails.phoneNumber,
        digital_address: customerDetails.digitalAddress,
        delivery_address: customerDetails.deliveryAddress, 

        order_items_json: JSON.stringify(customerDetails.cartItems), 
    });
    
    if (dbError) {
        console.error("Supabase DB Save Error:", dbError);
    }

    // --- 4. Prepare and Send Email Notifications ---
    const itemsHtml = customerDetails.cartItems.map(item => 
        `<li>${item.name} (x${item.quantity}) - Price: ₵${(item.price || 0).toFixed(2)} each</li>`
    ).join('');

    const emailHtml = `
      <h2 style="color: #10b981;">New Order Alert: #${reference}</h2>
      <p>Total Paid: ₵${totalAmount}</p>
      
      <h3>Customer & Delivery Details:</h3>
      <ul style="list-style-type: none; padding: 0;">
          <li><strong>Customer Name:</strong> ${customerDetails.fullName}</li>
          <li><strong>Email:</strong> ${customer.email}</li>
          <li><strong>Phone:</strong> ${customerDetails.phoneNumber}</li>
          <li><strong>Digital Address:</strong> ${customerDetails.digitalAddress}</li>
          <li><strong>Physical Address:</strong> ${customerDetails.deliveryAddress}</li>
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
        const result = await handlePaystackFulfillment(reference);

        if (result.success) {
            return NextResponse.redirect(new URL(`/thank-you?reference=${reference}`, url));
        }

        return NextResponse.redirect(new URL('/order/failure?code=verification_failed', url));

    } catch (error) {
        console.error("FATAL CALLBACK API ERROR:", error);
        return NextResponse.redirect(new URL('/order/failure?code=server_error', url));
    }
}

// ------------------------------------------------------------------
// 🚨 HTTP POST Handler (Paystack Webhook) 🚨
// ------------------------------------------------------------------
export async function POST(req) {
    try {
        const body = await req.json();

        // ⚠️ For production, you MUST verify the webhook signature here 
        
        if (body.event === 'charge.success') {
            const reference = body.data.reference;
            
            await handlePaystackFulfillment(reference);
            
            // Webhook must always return 200 to acknowledge receipt
            return new NextResponse(JSON.stringify({ message: "Webhook received and processed." }), { status: 200 });
        }
        
        return new NextResponse(JSON.stringify({ message: "Event ignored." }), { status: 200 });

    } catch (error) {
        console.error("FATAL WEBHOOK API ERROR:", error);
        return new NextResponse(JSON.stringify({ message: "Error processing webhook." }), { status: 200 }); 
    }
}
