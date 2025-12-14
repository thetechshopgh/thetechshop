import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
// 🛑 REMINDER: Ensure this is your actual, secure administrative email!
const ADMIN_EMAIL = 'thetechshopgh@gmail.com'; 

// --- Core Verification and Fulfillment Logic ---
async function handlePaystackFulfillment(reference) {
    let customerDetails = {};
    let order_data_for_db = {};
    let totalAmount = '0.00';
    let customerEmail = 'no-email-found@example.com';
    let dbSuccess = false; // Initialize DB success flag

    // 1. Verify Transaction with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.data || verifyData.data.status !== 'success') {
        console.error('Paystack Verification Failed:', verifyData);
        return { success: false, message: "Payment not successful or verification failed." };
    }
    
    const { customer, amount, metadata } = verifyData.data;

    customerEmail = customer.email;
    totalAmount = (amount/100).toFixed(2);
    
    // 2. Robust Data Extraction from Metadata
    customerDetails = {
        // Fallback checks for common key naming variations
        fullName: metadata?.fullName || metadata?.full_name || 'N/A', 
        phoneNumber: metadata?.phoneNumber || metadata?.phone_number || 'N/A', 
        digitalAddress: metadata?.digitalAddress || metadata?.digital_address || 'N/A', 
        deliveryAddress: metadata?.deliveryAddress || metadata?.delivery_address || 'N/A', 
        cartItems: metadata?.cartItems || [], 
    };

    // Prepare data for database insertion
    order_data_for_db = {
        customer_email: customerEmail,
        amount: totalAmount,
        reference: reference,
        status: 'paid',
        full_name: customerDetails.fullName, 
        phone_number: customerDetails.phoneNumber,
        digital_address: customerDetails.digitalAddress,
        delivery_address: customerDetails.deliveryAddress, 
        order_items_json: JSON.stringify(customerDetails.cartItems), 
    };

    // --- 3. Save Order to Supabase (Unique Transaction Check) ---
    try {
        // Check for existing order BEFORE insertion attempt
        const { data: existingOrder, error: fetchError } = await supabase
            .from('orders')
            .select('id')
            .eq('reference', reference)
            .single();
        
        // PGRST116 means 'No rows found'. We only proceed if no order exists.
        if (fetchError && fetchError.code !== 'PGRST116') { 
            console.error("Supabase Order Check Error (Critical):", fetchError);
            // We still proceed to send email even if this check fails
        }
        
        if (!existingOrder) {
            // Log the data we are attempting to insert for final debugging
            console.log("Attempting to insert this data into Supabase:", order_data_for_db); 

            const { error: dbError } = await supabase.from('orders').insert(order_data_for_db);
            
            if (dbError) {
                console.error("CRITICAL SUPABASE DB SAVE ERROR:", dbError);
                dbSuccess = false; // Insertion failed
            } else {
                dbSuccess = true; // Insertion succeeded
            }
        } else {
            console.log(`Order ${reference} already exists. Skipping insertion.`);
            dbSuccess = true; // Already saved
        }
    } catch (dbException) {
        console.error("UNEXPECTED DB EXCEPTION:", dbException);
        dbSuccess = false;
    }

    // --- 4. Send Email Notifications (Guaranteeing Delivery) ---
    const itemsHtml = customerDetails.cartItems.map(item => 
        `<li>${item.name} (x${item.quantity}) - Price: ₵${(item.price || 0).toFixed(2)} each</li>`
    ).join('');

    // Dynamically adjust email subject based on DB status for admin
    const adminSubjectPrefix = dbSuccess ? 'NEW ORDER RECEIVED:' : 'URGENT: DB FAILURE - ORDER RECEIVED:';

    const emailHtml = `
      <h2 style="color: #10b981;">New Order Alert: #${reference}</h2>
      <p>Total Paid: ₵${totalAmount}</p>
      
      <h3>Customer & Delivery Details:</h3>
      <ul style="list-style-type: none; padding: 0;">
          <li><strong>Customer Name:</strong> ${customerDetails.fullName}</li>
          <li><strong>Email:</strong> ${customerEmail}</li>
          <li><strong>Phone:</strong> ${customerDetails.phoneNumber}</li>
          <li><strong>Digital Address:</strong> ${customerDetails.digitalAddress}</li>
          <li><strong>Physical Address:</strong> ${customerDetails.deliveryAddress}</li>
          <li><strong>Transaction Ref:</strong> ${reference}</li>
          ${dbSuccess ? '' : '<li style="color: red;"><strong>DATABASE SAVE FAILED - MANUAL CHECK REQUIRED</strong></li>'}
      </ul>

      <h3>Items Ordered:</h3>
      <ul style="padding-left: 20px;">
          ${itemsHtml}
      </ul>
    `;

    try {
        await resend.emails.send({
            from: 'Orders <onboarding@resend.dev>',
            to: [customerEmail],
            subject: `Your Order Confirmation #${reference}`,
            html: emailHtml.replace('New Order Alert:', 'Your Order Confirmation:').replace(
                dbSuccess ? '' : '<li style="color: red;"><strong>DATABASE SAVE FAILED - MANUAL CHECK REQUIRED</strong></li>', 
                '' // Remove DB failure flag for customer email
            ),
        });
        
        await resend.emails.send({
            from: 'Orders <onboarding@resend.dev>',
            to: [ADMIN_EMAIL], 
            subject: `${adminSubjectPrefix} #${reference} - ₵${totalAmount}`,
            html: emailHtml,
        });
    } catch (emailError) {
        console.error("Resend Email Error: Failed to send notifications.", emailError);
    }

    // Return success to redirect the user to the thank you page, as payment was successful.
    return { success: true, message: "Fulfillment completed." };
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
        // NOTE: In production, ALWAYS verify the 'x-paystack-signature' header here
        const body = await req.json();
        
        if (body.event === 'charge.success') {
            const reference = body.data.reference;
            
            await handlePaystackFulfillment(reference);
            
            // Webhook must always return 200 to acknowledge receipt and stop retries
            return new NextResponse(JSON.stringify({ message: "Webhook received and processed." }), { status: 200 });
        }
        
        return new NextResponse(JSON.stringify({ message: "Event ignored." }), { status: 200 });

    } catch (error) {
        console.error("FATAL WEBHOOK API ERROR:", error);
        return new NextResponse(JSON.stringify({ message: "Error processing webhook." }), { status: 200 }); 
    }
}
