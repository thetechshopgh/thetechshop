import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // 🚨 Ensure this uses the SUPABASE_SERVICE_KEY 🚨
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'thetechshopgh@gmail.com'; 

// --- Core Verification and Fulfillment Logic ---
async function handlePaystackFulfillment(reference) {
    let dbSuccess = false; 
    let customerEmail = 'no-email-found@example.com';
    let totalAmount = '0.00';
    let orderUUID = null;
    let customerDetails = { cartItems: [] }; // Initialize to prevent crashes

    // 1. Verify Transaction with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.data || verifyData.data.status !== 'success') {
        console.error('Paystack Verification Failed:', verifyData);
        return { success: false, message: "Payment not successful or verification failed." };
    }
    
    const { amount, metadata } = verifyData.data;

    // 🚨 NEW: Retrieve the UUID saved from the client's initial save 🚨
    orderUUID = metadata?.order_uuid; 
    totalAmount = (amount / 100).toFixed(2);
    
    if (!orderUUID) {
        console.error("CRITICAL: Missing order_uuid in verified Paystack metadata.");
        return { success: false, message: "Order ID missing for fulfillment." };
    }

    // --- 2. Update and Retrieve Full Order Details from Supabase ---
    try {
        // Find the PENDING order by its UUID and update its status and reference
        const { data: updatedOrder, error: dbError } = await supabase
            .from('orders')
            .update({ 
                status: 'paid', 
                reference: reference // Save the Paystack reference
            })
            .eq('order_uuid', orderUUID) // Find the row created earlier
            .select() 
            .single();

        if (dbError) {
            console.error("CRITICAL SUPABASE DB UPDATE ERROR:", dbError);
            dbSuccess = false; 
        } else if (updatedOrder) {
            dbSuccess = true; 

            // Extract ALL details from the successfully UPDATED row for email
            customerEmail = updatedOrder.customer_email;
            customerDetails = {
                fullName: updatedOrder.full_name,
                phoneNumber: updatedOrder.phone_number,
                digitalAddress: updatedOrder.digital_address,
                deliveryAddress: updatedOrder.delivery_address,
                // Parse the JSON string back into a JavaScript object for the email map
                cartItems: JSON.parse(updatedOrder.order_items_json), 
            };
        } else {
             // Handle case where order_uuid was valid but no row was updated (e.g., already paid)
             console.log(`Order ${orderUUID} not found or already processed. Skipping update.`);
             dbSuccess = false; 
        }

    } catch (dbException) {
        console.error("UNEXPECTED DB EXCEPTION during update:", dbException);
        dbSuccess = false;
    }

    // --- 3. Send Email Notifications (Guaranteeing Delivery) ---
    // Note: Email logic runs regardless of DB update success to notify admin/customer
    
    const itemsHtml = customerDetails.cartItems.map(item => 
        `<li>${item.name} (x${item.quantity}) - Price: ₵${(item.price || 0).toFixed(2)} each</li>`
    ).join('');

    const adminSubjectPrefix = dbSuccess ? 'NEW ORDER RECEIVED:' : 'URGENT: DB FAILURE - ORDER RECEIVED:';

    const emailHtml = `
      <h2 style="color: #10b981;">New Order Alert: #${reference}</h2>
      <p>Total Paid: ₵${totalAmount}</p>
      
      <h3>Customer & Delivery Details:</h3>
      <ul style="list-style-type: none; padding: 0;">
          <li><strong>Customer Name:</strong> ${customerDetails.fullName || 'N/A'}</li>
          <li><strong>Email:</strong> ${customerEmail}</li>
          <li><strong>Phone:</strong> ${customerDetails.phoneNumber || 'N/A'}</li>
          <li><strong>Digital Address:</strong> ${customerDetails.digitalAddress || 'N/A'}</li>
          <li><strong>Physical Address:</strong> ${customerDetails.deliveryAddress || 'N/A'}</li>
          <li><strong>Transaction Ref:</strong> ${reference}</li>
          ${dbSuccess ? '' : '<li style="color: red;"><strong>DATABASE UPDATE FAILED - MANUAL CHECK REQUIRED</strong></li>'}
      </ul>

      <h3>Items Ordered:</h3>
      <ul style="padding-left: 20px;">
          ${itemsHtml}
      </ul>
    `;

    try {
        // Send customer email
        await resend.emails.send({
            from: 'Orders <onboarding@resend.dev>',
            to: [customerEmail],
            subject: `Your Order Confirmation #${reference}`,
            html: emailHtml.replace('New Order Alert:', 'Your Order Confirmation:').replace(
                dbSuccess ? '' : '<li style="color: red;"><strong>DATABASE UPDATE FAILED - MANUAL CHECK REQUIRED</strong></li>', 
                '' // Remove DB failure flag for customer email
            ),
        });
        
        // Send admin email
        await resend.emails.send({
            from: 'Orders <onboarding@resend.dev>',
            to: [ADMIN_EMAIL], 
            subject: `${adminSubjectPrefix} #${reference} - ₵${totalAmount}`,
            html: emailHtml,
        });
    } catch (emailError) {
        console.error("Resend Email Error: Failed to send notifications.", emailError);
    }

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
        // Note: The result.success here just means the verification worked.
        // DB success is handled internally, but we still redirect to thank you.
        await handlePaystackFulfillment(reference);

        // Always redirect to success page if Paystack verification succeeded
        return NextResponse.redirect(new URL(`/thank-you?reference=${reference}`, url));

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
        
        if (body.event === 'charge.success') {
            const reference = body.data.reference;
            
            await handlePaystackFulfillment(reference);
            
            // Webhook must always return 200
            return new NextResponse(JSON.stringify({ message: "Webhook received and processed." }), { status: 200 });
        }
        
        return new NextResponse(JSON.stringify({ message: "Event ignored." }), { status: 200 });

    } catch (error) {
        console.error("FATAL WEBHOOK API ERROR:", error);
        return new NextResponse(JSON.stringify({ message: "Error processing webhook." }), { status: 200 }); 
    }
}
