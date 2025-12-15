import { NextResponse } from 'next/server';
// 🚨 IMPORTANT: Ensure this supabase client uses the Service Role Key 🚨
// This is critical for secure, server-side updates that bypass RLS.
import { supabase } from '@/lib/supabase'; 
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'thetechshopgh@gmail.com'; 

// --- 1. Helper Function: Inventory Update Logic ---
// This runs AFTER payment is confirmed to decrement stock and mark items as sold out.
async function updateInventory(cartItems) {
    if (!cartItems || cartItems.length === 0) return;

    console.log(`Starting inventory update for ${cartItems.length} items.`);

    // map over items to create an array of update promises
    const updates = cartItems.map(item => {
        const productId = item.id;
        const purchasedQuantity = item.quantity;
        
        // We use a raw RPC call or a specific update pattern. 
        // Since Supabase JS client doesn't support "inventory - X" directly in .update() object syntax easily without RPC,
        // we will fetch first, then update. 
        // Note: For high traffic, use a Postgres Database Function (RPC) to prevent race conditions.
        
        return (async () => {
            // A. Get current inventory
            const { data: product, error: fetchError } = await supabase
                .from('products')
                .select('inventory')
                .eq('id', productId)
                .single();
            
            if (fetchError || !product) {
                console.error(`Inventory Fetch Error for Product ${productId}:`, fetchError);
                return;
            }

            // B. Calculate new values
            const newInventory = product.inventory - purchasedQuantity;
            const isSoldOut = newInventory <= 0;

            // C. Update the product
            const { error: updateError } = await supabase
                .from('products')
                .update({ 
                    inventory: newInventory,
                    is_sold_out: isSoldOut
                })
                .eq('id', productId);

            if (updateError) {
                 console.error(`Inventory Update Error for Product ${productId}:`, updateError);
            }
        })();
    });

    try {
        // Execute all updates in parallel
        await Promise.all(updates);
        console.log(`Inventory synchronization complete.`);
    } catch (error) {
        console.error("FATAL BATCH INVENTORY UPDATE ERROR:", error);
    }
}

// --- 2. Core Fulfillment Logic ---
async function handlePaystackFulfillment(reference) {
    let dbSuccess = false; 
    let customerEmail = 'no-email-found@example.com';
    let totalAmount = '0.00';
    let orderUUID = null;
    let customerDetails = { 
        fullName: 'N/A', 
        phoneNumber: 'N/A', 
        digitalAddress: 'N/A', 
        deliveryAddress: 'N/A', 
        cartItems: [] 
    }; 

    // A. Verify Transaction with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.data || verifyData.data.status !== 'success') {
        console.error('Paystack Verification Failed:', verifyData);
        return { success: false, message: "Payment not successful or verification failed." };
    }
    
    const { amount, metadata } = verifyData.data;

    // Extract the UUID passed in the initializer metadata
    orderUUID = metadata?.order_uuid; 
    totalAmount = (amount / 100).toFixed(2);
    
    // B. Update Order and Fetch Details from Supabase
    try {
        if (orderUUID) {
            // Find the PENDING order by its UUID and update its status
            const { data: updatedOrder, error: dbError } = await supabase
                .from('orders')
                .update({ 
                    status: 'paid', 
                    reference: reference 
                })
                .eq('order_uuid', orderUUID) 
                .select() 
                .single();

            if (dbError) {
                console.error("CRITICAL SUPABASE DB UPDATE ERROR:", dbError);
                console.error("Supabase Error Code:", dbError.code);
                dbSuccess = false; 
            } else if (updatedOrder) {
                dbSuccess = true; 

                // Extract details from the successfully UPDATED row
                customerEmail = updatedOrder.customer_email;
                customerDetails = {
                    fullName: updatedOrder.full_name,
                    phoneNumber: updatedOrder.phone_number,
                    digitalAddress: updatedOrder.digital_address,
                    deliveryAddress: updatedOrder.delivery_address,
                    // FIX: jsonb columns return native JS objects, so no JSON.parse() needed
                    cartItems: updatedOrder.order_items_json, 
                };

                // 🚨 C. TRIGGER INVENTORY UPDATE 🚨
                // We await this to ensure it runs, but errors won't stop the email/redirect
                await updateInventory(customerDetails.cartItems);

            } else {
                 console.warn(`Order UUID ${orderUUID} did not result in an update. Row not found or already processed.`);
                 dbSuccess = false; 
            }
        } else {
            console.error("Fulfillment skipped: order_uuid was missing from Paystack metadata.");
        }

    } catch (dbException) {
        console.error("UNEXPECTED DB EXCEPTION during update:", dbException);
        dbSuccess = false;
    }

    // D. Send Email Notifications
    const itemsHtml = customerDetails.cartItems.map(item => 
        `<li>${item.name} (x${item.quantity}) - Price: ₵${(item.price || 0).toFixed(2)} each</li>`
    ).join('');

    const adminSubjectPrefix = dbSuccess ? 'NEW ORDER RECEIVED (DB OK):' : 'URGENT: DB FAILURE - ORDER RECEIVED:';

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
            from: 'The Tech Shop <onboarding@resend.dev>',
            to: [customerEmail],
            subject: `Your Order Confirmation #${reference}`,
            html: emailHtml.replace('New Order Alert:', 'Your Order Confirmation:').replace(
                dbSuccess ? '' : '<li style="color: red;"><strong>DATABASE UPDATE FAILED - MANUAL CHECK REQUIRED</strong></li>', 
                '' 
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
        await handlePaystackFulfillment(reference);
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
            return new NextResponse(JSON.stringify({ message: "Webhook received and processed." }), { status: 200 });
        }
        
        return new NextResponse(JSON.stringify({ message: "Event ignored." }), { status: 200 });
    } catch (error) {
        console.error("FATAL WEBHOOK API ERROR:", error);
        return new NextResponse(JSON.stringify({ message: "Error processing webhook." }), { status: 200 }); 
    }
}
